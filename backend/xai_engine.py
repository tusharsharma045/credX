"""
xai_engine.py — CredX Explainability Engine (SHAP + LIME + Counterfactual Advice)
====================================================================================
WHAT: Provides three complementary explainability mechanisms for the
      HybridCreditRiskModel:

      1. SHAP (SHapley Additive exPlanations) — model-specific, exact attributions
         from the XGBoost sub-model via TreeExplainer.
      2. LIME (Local Interpretable Model-agnostic Explanations) — model-agnostic,
         locally-linear approximations of the ensemble's decision boundary.
      3. Counterfactual Advice — actionable, human-readable guidance showing
         which specific feature changes would reduce the borrower's default
         probability the most.

WHY:  Financial regulators (e.g. ECOA in the US, GDPR Art. 22 in the EU) require
      that automated credit decisions be explainable to borrowers. Dual SHAP+LIME
      explanations cross-validate each other: if they broadly agree, the
      explanation is more trustworthy; if they diverge, it signals that the XGBoost
      sub-model and the full ensemble disagree on that feature's importance.

HOW:  SHAP uses exact Shapley values from the XGBoost tree structure — fast and
      theoretically grounded but XGB-specific. LIME perturbs the input, runs the
      perturbations through the FULL ensemble's predict_proba, and fits a sparse
      linear model locally — slower but model-agnostic and captures ensemble
      behaviour. Counterfactuals use finite-difference gradients of the ensemble's
      predict_proba with respect to each mutable feature.
"""

import os
import joblib
import shap
import numpy as np
import pandas as pd

# LIME imports
# WHY lime.lime_tabular: This is the standard LIME interface for tabular data.
# It handles mixed numerical/categorical features and produces feature weights
# for a locally-fitted linear model around a specific instance.
from lime import lime_tabular

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')

# ---------------------------------------------------------------------------
# Human-readable descriptions for every model feature
# WHY: Raw column names (e.g. PAY_0, DELINQUENCY_INDEX) are opaque to loan
# officers and borrowers. Mapping them to English phrases improves UX and is
# a best-practice for regulatory-facing AI explanations.
# ---------------------------------------------------------------------------
FEATURE_DESCRIPTIONS = {
    'LIMIT_BAL':           'Credit Limit',
    'AGE':                 'Borrower Age',
    'SEX':                 'Gender',
    'EDUCATION':           'Education Level',
    'MARRIAGE':            'Marital Status',
    'CREDIT_UTILIZATION':  'Credit Utilization Ratio',
    'AVG_PAYMENT_RATIO':   'Average Payment-to-Bill Ratio',
    'DELINQUENCY_INDEX':   'Cumulative Delinquency Score',
    'PAY_0':               'Most Recent Payment Delay (months)',
    'PAY_2':               'Payment Delay 2 Months Ago',
    'PAY_3':               'Payment Delay 3 Months Ago',
    'PAY_4':               'Payment Delay 4 Months Ago',
    'PAY_5':               'Payment Delay 5 Months Ago',
    'PAY_6':               'Payment Delay 6 Months Ago',
    'PAY_AMT1':            'Most Recent Payment Amount',
    'PAY_AMT2':            'Payment Amount 2 Months Ago',
    'PAY_AMT3':            'Payment Amount 3 Months Ago',
    'PAY_AMT4':            'Payment Amount 4 Months Ago',
    'PAY_AMT5':            'Payment Amount 5 Months Ago',
    'PAY_AMT6':            'Payment Amount 6 Months Ago',
    'BILL_AMT1':           'Most Recent Bill Amount',
    'BILL_AMT2':           'Bill Amount 2 Months Ago',
    'BILL_AMT3':           'Bill Amount 3 Months Ago',
    'BILL_AMT4':           'Bill Amount 4 Months Ago',
    'BILL_AMT5':           'Bill Amount 5 Months Ago',
    'BILL_AMT6':           'Bill Amount 6 Months Ago',
    'TRADITIONAL_SCORE':   'Traditional Credit Score',
}

# ---------------------------------------------------------------------------
# Mutable features for counterfactual advice
# WHY these features: Only features that a borrower can realistically change
# in the short-to-medium term should be included in counterfactual advice.
# Static demographics (AGE, SEX, EDUCATION, MARRIAGE) and derived aggregates
# (DELINQUENCY_INDEX) that summarise historical behaviour are included only
# if the borrower can meaningfully act on them.
# ---------------------------------------------------------------------------
MUTABLE_FEATURES = ['PAY_0', 'CREDIT_UTILIZATION', 'DELINQUENCY_INDEX', 'PAY_AMT1']

# Finite-difference step size for gradient estimation
# WHY 1% of typical feature range: Small enough to approximate a local
# derivative, large enough to avoid floating-point noise.
FD_STEP = {
    'PAY_0':              0.5,    # ordinal scale -2 to 8
    'CREDIT_UTILIZATION': 0.05,   # 0.0–3.0 range
    'DELINQUENCY_INDEX':  1.0,    # integer sum of delays
    'PAY_AMT1':           500.0,  # currency units
}

# Advice template strings — filled at runtime with actual values
ADVICE_TEMPLATES = {
    'PAY_0': (
        "Reduce your most recent payment delay from {current:.0f} to {suggested:.0f} months. "
        "Making on-time payments immediately and consistently is the single highest-impact "
        "action you can take. Expected reduction in default probability: {reduction:.1f}%."
    ),
    'CREDIT_UTILIZATION': (
        "Lower your credit utilization from {current:.0%} to {suggested:.0%} of your credit limit. "
        "Pay down outstanding balances or request a credit limit increase. "
        "Expected reduction in default probability: {reduction:.1f}%."
    ),
    'DELINQUENCY_INDEX': (
        "Reduce your cumulative delinquency score from {current:.0f} to {suggested:.0f} by clearing "
        "overdue balances across all payment months. Each month you bring accounts current "
        "reduces this score. Expected reduction in default probability: {reduction:.1f}%."
    ),
    'PAY_AMT1': (
        "Increase your most recent monthly payment from {current:,.0f} to {suggested:,.0f}. "
        "Paying more than the minimum demonstrates repayment capacity and directly lowers "
        "your utilization. Expected reduction in default probability: {reduction:.1f}%."
    ),
}


class XaiExplainer:
    """
    WHAT: Wraps the HybridCreditRiskModel to provide SHAP, LIME, and
          counterfactual explanations for individual borrower predictions.

    WHY:  Centralising explainability logic here keeps the model class (model.py)
          focused on inference and the API layer (main.py) focused on routing.
          All XAI concerns live in one place, making it easy to add new
          explanation methods in the future.

    HOW:  Holds references to:
          - self.model          : The HybridCreditRiskModel (for predict_proba).
          - self.xgb_explainer  : shap.TreeExplainer built on model.xgb_model.
          - self.lime_explainer : lime.LimeTabularExplainer built on reference data.
          - self.reference_data : 100-row numpy array representing the training
                                  distribution (required by LIME).
    """

    def __init__(self, model):
        """
        WHAT: Initialises the explainer with a reference to the trained model.
              The SHAP and LIME explainers are NOT built here — they require
              reference data and are built in initialize_explainer().

        WHY:  Deferring explainer construction until initialize_explainer() is
              called allows load_models() to attach the reference data before
              the explainers are built, without requiring a re-training run.

        Args:
            model (HybridCreditRiskModel): The trained ensemble model.
        """
        self.model          = model
        self.xgb_explainer  = None
        self.lime_explainer = None
        self.reference_data = None   # numpy array: 100-row training sample

    def initialize_explainer(self, X_sample: pd.DataFrame):
        """
        WHAT: Builds the SHAP TreeExplainer and the LIME LimeTabularExplainer,
              and saves the reference data sample to disk.

        WHY:  Both SHAP and LIME need one-time setup:
              - SHAP's TreeExplainer pre-computes internal tree structure data
                from XGBoost to enable fast exact Shapley value computation.
              - LIME needs a background dataset to understand the marginal
                feature distributions used for perturbation. Without it, LIME
                cannot generate realistic synthetic neighbours around a query.

        HOW:
          SHAP: shap.TreeExplainer(model.xgb_model) builds the explainer in-
                memory using XGBoost's internal booster data. Subsequent calls
                to xgb_explainer.shap_values() are O(depth × n_trees).

          LIME: LimeTabularExplainer is initialised with:
                - training_data: the 100-row reference sample as a numpy array
                  (used to estimate feature perturbation ranges and distributions).
                - feature_names: the ordered list of column names.
                - mode='classification': tells LIME to explain class probabilities.
                - discretize_continuous=False: keeps numerical features continuous
                  rather than discretising them into bins (better for regression-
                  like credit features such as BILL_AMT and PAY_AMT).

          Reference data is saved to reference_data.joblib so the LIME explainer
          can be reconstructed after a server restart without retraining.

        Args:
            X_sample (pd.DataFrame): ≤100 rows of training data (unscaled,
                                     with correct feature columns).
        """
        feature_cols = self.model.feature_cols

        # Ensure the sample is aligned to the model's feature order
        X_sample_aligned = X_sample[feature_cols] if isinstance(X_sample, pd.DataFrame) \
                           else pd.DataFrame(X_sample, columns=feature_cols)

        self.reference_data = X_sample_aligned.values.astype(float)

        # ------------------------------------------------------------------
        # Build SHAP TreeExplainer for XGBoost sub-model
        # WHY TreeExplainer: It computes exact Shapley values for tree-based
        # models in polynomial time using the tree structure — much faster and
        # more accurate than the model-agnostic KernelExplainer.
        # ------------------------------------------------------------------
        if self.model.xgb_model is not None:
            self.xgb_explainer = shap.TreeExplainer(self.model.xgb_model)

        # ------------------------------------------------------------------
        # Build LIME LimeTabularExplainer
        # WHY mode='classification': We want class probabilities, not logits.
        # WHY discretize_continuous=False: Credit features (bill amounts, pay
        # amounts, utilization) are continuous and carry ordinal meaning —
        # discretising them into quartile bins would lose information and
        # produce misleading LIME explanations.
        # ------------------------------------------------------------------
        self.lime_explainer = lime_tabular.LimeTabularExplainer(
            training_data=self.reference_data,
            feature_names=feature_cols,
            mode='classification',
            discretize_continuous=False,
            random_state=42
        )

        # Persist reference data alongside the model artefacts so it can be
        # reloaded without retraining (see load_explainer_data()).
        ref_path = os.path.join(MODEL_DIR, 'reference_data.joblib')
        joblib.dump(self.reference_data, ref_path)
        print(f"[XAI] Reference data saved → {ref_path}  (shape: {self.reference_data.shape})")

    def load_explainer_data(self):
        """
        WHAT: Loads the reference data from disk and reconstructs both the
              SHAP TreeExplainer and the LIME LimeTabularExplainer.

        WHY:  At API startup (lifespan in main.py) the explainer is created
              after model.load_models(). The reference data was saved during
              training. This method restores the full explainer state from disk
              so explanations are available without re-running the training
              pipeline.

        HOW:  Loads reference_data.joblib, then calls initialize_explainer()
              with the restored data (as a DataFrame with correct column names).
        """
        ref_path = os.path.join(MODEL_DIR, 'reference_data.joblib')
        if not os.path.exists(ref_path):
            print("[XAI] Warning: reference_data.joblib not found. "
                  "LIME explanations will be unavailable until next training run.")
            return

        self.reference_data = joblib.load(ref_path)
        feature_cols        = self.model.feature_cols

        X_ref_df = pd.DataFrame(self.reference_data, columns=feature_cols)
        self.initialize_explainer(X_ref_df)
        print("[XAI] Explainer data loaded from disk.")

    # ------------------------------------------------------------------
    # SHAP Explanations
    # ------------------------------------------------------------------

    def explain_instance(self, borrower_dict: dict) -> list:
        """
        WHAT: Computes SHAP feature attributions for a single borrower using
              the XGBoost sub-model's TreeExplainer.

        WHY:  SHAP values provide theoretically-grounded attributions based on
              cooperative game theory (Shapley values). For tree models they are
              exact (not approximations) and measure each feature's marginal
              contribution to the prediction, averaged over all possible feature
              orderings. This gives loan officers a fair, consistent explanation
              of WHY the model assigned a particular risk score.

        HOW:  1. Build a single-row DataFrame from borrower_dict.
              2. Call xgb_explainer.shap_values() → raw Shapley values (one per
                 feature, in log-odds space for XGBoost classifiers).
              3. Convert to a score-impact scale by multiplying by -25 (a scaling
                 factor that maps log-odds SHAP to a ±point impact on the CredX
                 score; negative SHAP → higher default risk → lower score).
              4. Filter features with |impact| < 0.5 (negligible contributors).
              5. Return top 8 sorted by |impact|.

        Args:
            borrower_dict (dict): Feature key-value pairs for a single borrower.

        Returns:
            list[dict]: Up to 8 feature dicts with keys:
                        name, category, shapValue, rawShapValue, impact, description.
        """
        feature_cols = self.model.feature_cols
        df_single    = pd.DataFrame([borrower_dict])

        # Pad missing features with 0.0
        for col in feature_cols:
            if col not in df_single.columns:
                df_single[col] = 0.0

        df_single = df_single[feature_cols]

        # Build the SHAP explainer lazily if not already done
        if self.xgb_explainer is None:
            self.initialize_explainer(df_single)

        shap_values = self.xgb_explainer.shap_values(df_single)[0]

        results = []
        for feat_name, shap_val in zip(feature_cols, shap_values):
            # Convert raw SHAP (log-odds) to CredX score impact
            # WHY -25 multiplier: SHAP > 0 means increased default probability
            # (bad) → lower CredX score → negative impact on the score scale.
            score_impact = round(float(-shap_val * 25.0), 1)

            if abs(score_impact) >= 0.5:
                desc = FEATURE_DESCRIPTIONS.get(feat_name, feat_name)
                results.append({
                    'name':         feat_name,
                    'category':     'Model Feature',
                    'shapValue':    score_impact,
                    'rawShapValue': round(float(shap_val), 4),
                    'impact':       'positive' if score_impact >= 0 else 'negative',
                    'description':  f"{desc}: impact {score_impact:+0.1f} pts"
                })

        results.sort(key=lambda x: abs(x['shapValue']), reverse=True)
        return results[:8]

    # ------------------------------------------------------------------
    # LIME Explanations
    # ------------------------------------------------------------------

    def explain_instance_lime(self, borrower_dict: dict) -> list:
        """
        WHAT: Computes LIME feature attributions for a single borrower using
              the FULL ensemble's predict_proba function.

        WHY:  SHAP (above) explains only the XGBoost sub-model because
              TreeExplainer is specific to tree architectures. LIME is
              model-agnostic: it wraps the ENTIRE ensemble's predict_proba
              (which includes Logistic Regression + XGBoost + MLP) and fits
              a local linear approximation. This means LIME:
              a) Cross-validates the SHAP explanation — if they broadly agree,
                 confidence in the explanation increases.
              b) Catches disagreements between the XGBoost sub-model's tree
                 SHAP and the full ensemble's decision boundary, which can
                 happen when LR or MLP dominate for a specific borrower profile.
              c) Satisfies model-agnostic explainability requirements that do
                 not accept sub-model-only explanations.

        HOW:  1. Build the query instance as a numpy array aligned to feature_cols.
              2. Define a predict_fn wrapper that calls model.predict_proba on
                 batches of perturbed samples and returns a 2-column array
                 [[P_no_default, P_default]] as LIME expects.
              3. Call lime_explainer.explain_instance() with num_features=6,
                 num_samples=200 (number of perturbed neighbours — 200 is a
                 fast but statistically reasonable number for tabular LIME).
              4. Extract the top-6 feature weights from the LIME explanation
                 object and format them into the standard response shape.

        Args:
            borrower_dict (dict): Feature key-value pairs for a single borrower.

        Returns:
            list[dict]: Up to 6 feature dicts with keys:
                        name, limeValue, impact, description.
                        Returns [] if the LIME explainer is not initialised.
        """
        if self.lime_explainer is None:
            print("[XAI] LIME explainer not initialised. Call initialize_explainer() first.")
            return []

        feature_cols = self.model.feature_cols

        # Build aligned query vector (1D numpy array)
        query_row = []
        for col in feature_cols:
            query_row.append(float(borrower_dict.get(col, 0.0)))
        query_arr = np.array(query_row)

        # -----------------------------------------------------------------
        # Wrapper: LIME expects a function that maps (n_samples × n_features)
        # numpy array → (n_samples × n_classes) probability array.
        # We produce [[P(no default), P(default)]] for each perturbed sample.
        # WHY two columns: LIME's LimeTabularExplainer in classification mode
        # requires probabilities for ALL classes, not just the positive class.
        # -----------------------------------------------------------------
        def predict_fn(X_arr):
            """
            WHAT: Wraps model.predict_proba for LIME's perturbation loop.
            WHY:  LIME generates ~num_samples perturbed instances and needs
                  fast batch prediction. We pass the batch as a DataFrame
                  to preserve column names for the ensemble's internal routing.
            HOW:  Convert numpy → DataFrame → call ensemble predict_proba →
                  stack into 2-column array of [P_0, P_1].
            """
            X_df    = pd.DataFrame(X_arr, columns=feature_cols)
            p_pos   = self.model.predict_proba(X_df)   # shape (n_samples,)
            p_neg   = 1.0 - p_pos
            return np.column_stack([p_neg, p_pos])      # shape (n_samples, 2)

        # -----------------------------------------------------------------
        # Run LIME explanation
        # num_features=6: Top 6 is a good UX compromise (readable but comprehensive).
        # num_samples=200: More samples → more stable but slower. 200 is fast
        # enough for interactive API calls (< 1 second per request).
        # -----------------------------------------------------------------
        lime_exp = self.lime_explainer.explain_instance(
            data_row    = query_arr,
            predict_fn  = predict_fn,
            num_features= 6,
            num_samples = 200
        )

        # Extract feature-weight pairs from the LIME explanation
        # lime_exp.as_list() returns [(feature_condition_string, weight), ...]
        # Positive weight → feature pushes toward default (class 1).
        raw_explanations = lime_exp.as_list(label=1)

        results = []
        for feat_condition, lime_weight in raw_explanations:
            # LIME returns condition strings like "PAY_0 > 1.00".
            # Extract the bare feature name by splitting on comparison operators.
            feat_name = feat_condition
            for op in [' > ', ' <= ', ' < ', ' >= ', ' = ']:
                if op in feat_condition:
                    feat_name = feat_condition.split(op)[0].strip()
                    break

            desc         = FEATURE_DESCRIPTIONS.get(feat_name, feat_name)
            lime_rounded = round(float(lime_weight), 4)

            results.append({
                'name':        feat_name,
                'limeValue':   lime_rounded,
                'impact':      'negative' if lime_weight > 0 else 'positive',
                'description': (
                    f"{desc}: LIME weight {lime_rounded:+.4f} "
                    f"({'increases' if lime_weight > 0 else 'decreases'} default risk)"
                )
            })

        # Sort by absolute LIME weight (most impactful first)
        results.sort(key=lambda x: abs(x['limeValue']), reverse=True)
        return results

    # ------------------------------------------------------------------
    # Counterfactual Advice
    # ------------------------------------------------------------------

    def generate_counterfactual_advice(
        self,
        borrower_dict: dict,
        target_prob: float = 0.10
    ) -> list:
        """
        WHAT: Generates ranked, actionable advice telling a declined/conditional
              borrower which specific changes to their financial behaviour would
              reduce their default probability toward a target level.

        WHY:  When a credit application is DECLINED or CONDITIONAL, borrowers
              have a legal and ethical right to understand what they could change
              to improve their creditworthiness (right of explanation under ECOA,
              GDPR Art. 22). Generic advice ("improve your credit score") is
              insufficient. Counterfactual explanations answer the more useful
              question: "What specific, measurable changes to MY financial profile
              would flip this decision?"

              This is also operationally valuable for loan officers who can share
              targeted remediation plans with applicants.

        HOW:  Uses a greedy finite-difference gradient approach:
              1. Compute baseline default probability P_0 using the ensemble.
              2. For each mutable feature f in MUTABLE_FEATURES:
                 a. Perturb f by ±FD_STEP[f] (both directions for asymmetric
                    features like payment delay — we only want improvement).
                 b. Compute the new probability P_new.
                 c. Estimate the gradient: dP/df ≈ (P_new - P_0) / step.
                 d. The "improvement" direction is the one that DECREASES P.
                 e. Suggest a target value = current - (target_reduction / |dP/df|)
                    clipped to a reasonable domain range.
              3. Rank features by absolute gradient magnitude (most impactful first).
              4. Return top 3 features with advice text, current value, suggested
                 value, and expected probability reduction.

              NOTE: This is a first-order linear approximation. For features with
              highly non-linear relationships, the actual reduction may differ.
              A fuller implementation would use Wachter et al.'s counterfactual
              search algorithm or DiCE (Diverse Counterfactual Explanations).

        Args:
            borrower_dict (dict): Feature key-value pairs for a single borrower.
            target_prob   (float): Target default probability. Advice aims to
                                   reach this level (default 10% = APPROVE tier).

        Returns:
            list[dict]: Up to 3 advice dicts with keys:
                        feature, current_value, suggested_value,
                        expected_prob_reduction, advice_text.
        """
        feature_cols = self.model.feature_cols

        # ------------------------------------------------------------------
        # Build baseline input DataFrame
        # ------------------------------------------------------------------
        baseline = {}
        for col in feature_cols:
            baseline[col] = float(borrower_dict.get(col, 0.0))

        baseline_df  = pd.DataFrame([baseline])[feature_cols]
        baseline_prob = float(self.model.predict_proba(baseline_df)[0])

        # If already below target, nothing to advise
        if baseline_prob <= target_prob:
            return []

        gradient_results = []

        for feat in MUTABLE_FEATURES:
            if feat not in feature_cols:
                continue

            step          = FD_STEP.get(feat, 1.0)
            current_val   = baseline[feat]

            # -----------------------------------------------------------------
            # Finite-difference: evaluate DECREASING the feature value
            # (lower payment delay, lower utilisation, lower delinquency)
            # and INCREASING payment amount.
            # WHY one-sided: For credit features, "improvement" is directional:
            # - PAY_0, CREDIT_UTILIZATION, DELINQUENCY_INDEX → lower is better.
            # - PAY_AMT1 → higher is better.
            # We only estimate in the beneficial direction.
            # -----------------------------------------------------------------
            if feat == 'PAY_AMT1':
                # Increasing payment amount → improvement
                perturbed_val = current_val + step
            else:
                # Decreasing delay/utilisation/delinquency → improvement
                perturbed_val = current_val - step

            perturbed_dict       = baseline.copy()
            perturbed_dict[feat] = perturbed_val
            perturbed_df         = pd.DataFrame([perturbed_dict])[feature_cols]
            perturbed_prob       = float(self.model.predict_proba(perturbed_df)[0])

            # Gradient: how much does P change per unit change in this feature?
            prob_change  = perturbed_prob - baseline_prob   # negative = improvement
            if prob_change >= 0:
                # This perturbation INCREASED probability — not helpful; skip
                continue

            # Sensitivity = |prob change| per unit step (always positive here)
            sensitivity  = abs(prob_change) / step

            # Estimate how much we need to change this feature to reach target_prob
            prob_gap     = baseline_prob - target_prob          # positive: how far to go
            required_change = prob_gap / sensitivity if sensitivity > 0 else float('inf')

            # Compute the suggested value (clipped to domain bounds)
            if feat == 'PAY_AMT1':
                suggested_val = current_val + required_change
                suggested_val = min(suggested_val, current_val * 5)  # cap at 5× current
            elif feat == 'CREDIT_UTILIZATION':
                suggested_val = max(0.0, current_val - required_change)
            elif feat == 'PAY_0':
                suggested_val = max(-2, current_val - round(required_change))
            elif feat == 'DELINQUENCY_INDEX':
                suggested_val = max(0, current_val - required_change)
            else:
                suggested_val = current_val - required_change

            # Expected probability reduction if borrower achieves the suggested value
            # (linear extrapolation from the finite-difference gradient)
            expected_reduction_raw = min(
                sensitivity * abs(suggested_val - current_val),
                baseline_prob - target_prob
            )
            expected_reduction_pct = round(expected_reduction_raw * 100, 1)

            gradient_results.append({
                'feature':      feat,
                'current_val':  current_val,
                'suggested_val': suggested_val,
                'sensitivity':  sensitivity,
                'expected_reduction_pct': expected_reduction_pct
            })

        # Sort by sensitivity (most impactful first)
        gradient_results.sort(key=lambda x: x['sensitivity'], reverse=True)

        # Build the final advice list (top 3)
        advice_list = []
        for item in gradient_results[:3]:
            feat         = item['feature']
            current_val  = item['current_val']
            suggested_val = item['suggested_val']
            reduction_pct = item['expected_reduction_pct']

            template = ADVICE_TEMPLATES.get(feat, (
                "Adjust {feat} from {current:.2f} to {suggested:.2f}. "
                "Expected reduction in default probability: {reduction:.1f}%."
            ))
            advice_text = template.format(
                current   = current_val,
                suggested = suggested_val,
                reduction = reduction_pct
            )

            advice_list.append({
                'feature':                feat,
                'current_value':          round(current_val, 4),
                'suggested_value':        round(suggested_val, 4),
                'expected_prob_reduction': reduction_pct,
                'advice_text':            advice_text
            })

        return advice_list
