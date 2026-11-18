"""
model.py — HybridCreditRiskModel (Phase 2)
===========================================
Phase 1 had 3 models: Logistic Regression + XGBoost + MLP
Phase 2 adds: Random Forest + LightGBM and tunes XGBoost hyperparameters
to improve Recall (catching more defaulters).
"""

import os
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, roc_curve
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')
os.makedirs(MODEL_DIR, exist_ok=True)


class HybridCreditRiskModel:
    """
    Weighted ensemble of 5 models: LogReg, XGBoost (tuned), Random Forest,
    LightGBM, and MLP. Each model votes on default probability; we combine
    their votes using learned weights.

    Phase 2 changes vs Phase 1:
    - Added Random Forest and LightGBM
    - XGBoost is tuned with more trees and class imbalance correction
    - Ensemble threshold lowered to catch more defaulters (higher Recall)
    - New compare_models() method returns individual model metrics
    """

    def __init__(self):
        # Model 1: Logistic Regression — fast, linear baseline (weight=10%)
        self.traditional_model = LogisticRegression(
            max_iter=1000,
            random_state=42
        )

        # Model 2: XGBoost — tuned in Phase 2 (weight=30%)
        # scale_pos_weight tells XGBoost to pay more attention to defaulters
        self.xgb_model = XGBClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=4,   # roughly (non-defaults / defaults) in UCI dataset
            random_state=42,
            eval_metric='logloss'
        )

        # Model 3: Random Forest — good with noisy features (weight=20%)
        self.rf_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )

        # Model 4: LightGBM — fast gradient boosting, handles imbalance (weight=25%)
        self.lgbm_model = LGBMClassifier(
            n_estimators=300,
            learning_rate=0.03,
            is_unbalance=True,
            random_state=42,
            verbose=-1
        )

        # Model 5: MLP (Neural Network) — catches non-linear patterns (weight=15%)
        self.deep_learning_model = MLPClassifier(
            hidden_layer_sizes=(64, 32),
            activation='relu',
            max_iter=100,
            random_state=42
        )

        self.scaler = None
        self.feature_cols = []
        self.is_trained = False

        # Decision threshold — tuned per training run to maximize F1
        # Lower threshold = higher Recall (we flag more potential defaulters)
        self.optimal_threshold = 0.30

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------

    def train(self, X_train, X_train_scaled, y_train, scaler, feature_cols):
        """Fits all 5 models on training data and saves to disk."""
        self.scaler = scaler
        self.feature_cols = feature_cols

        print("[Model] Fitting Logistic Regression...")
        self.traditional_model.fit(X_train_scaled, y_train)

        print("[Model] Fitting XGBoost (tuned)...")
        self.xgb_model.fit(X_train, y_train)

        print("[Model] Fitting Random Forest...")
        self.rf_model.fit(X_train, y_train)

        print("[Model] Fitting LightGBM...")
        self.lgbm_model.fit(X_train, y_train)

        print("[Model] Fitting MLP...")
        self.deep_learning_model.fit(X_train_scaled, y_train)

        self.is_trained = True
        self.save_models()

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def predict_proba(self, X):
        """
        Weighted average of all 5 model probabilities.
        Weights: LR=10%, XGB=30%, RF=20%, LGBM=25%, MLP=15%
        """
        if not self.is_trained:
            self.load_models()

        if isinstance(X, pd.DataFrame):
            X_df = X[self.feature_cols]
        else:
            X_df = pd.DataFrame(X, columns=self.feature_cols)

        X_scaled_arr = self.scaler.transform(X_df)
        X_scaled = pd.DataFrame(X_scaled_arr, columns=self.feature_cols)

        prob_lr   = self.traditional_model.predict_proba(X_scaled)[:, 1]
        prob_xgb  = self.xgb_model.predict_proba(X_df)[:, 1]
        prob_rf   = self.rf_model.predict_proba(X_df)[:, 1]
        prob_lgbm = self.lgbm_model.predict_proba(X_df)[:, 1]
        prob_mlp  = self.deep_learning_model.predict_proba(X_scaled)[:, 1]

        return (
            0.10 * prob_lr   +
            0.30 * prob_xgb  +
            0.20 * prob_rf   +
            0.25 * prob_lgbm +
            0.15 * prob_mlp
        )

    def predict_single(self, borrower_dict):
        """Full credit risk assessment for one borrower — returns score, tier, action."""
        df_single = pd.DataFrame([borrower_dict])

        for col in self.feature_cols:
            if col not in df_single.columns:
                df_single[col] = 0.0

        df_single = df_single[self.feature_cols]

        prob = float(self.predict_proba(df_single)[0])
        default_prob_pct = round(prob * 100, 1)

        # CredX Score: P=0 → 980, P=1 → 360 (similar to FICO 300-850 range)
        credx_score = int(round(980 - (prob * 620)))
        credx_score = max(300, min(1000, credx_score))

        trad_score = int(borrower_dict.get('TRADITIONAL_SCORE', 620))

        # Business decision tiers
        if default_prob_pct <= 10.0:
            action = 'APPROVE'
            risk_tier = 'Low Risk'
            interest_rate = 11.5
        elif default_prob_pct <= 20.0:
            action = 'CONDITIONAL APPROVAL'
            risk_tier = 'Moderate Risk'
            interest_rate = 16.0
        else:
            action = 'DECLINE'
            risk_tier = 'High Risk'
            interest_rate = 22.0

        return {
            'default_probability':       default_prob_pct,
            'credx_score':               credx_score,
            'traditional_score':         trad_score,
            'risk_tier':                 risk_tier,
            'action':                    action,
            'recommended_interest_rate': interest_rate
        }

    # ------------------------------------------------------------------
    # Evaluation
    # ------------------------------------------------------------------

    def evaluate(self, X_test, X_test_scaled, y_test, threshold: float = None):
        """Computes Accuracy, Precision, Recall, F1, ROC-AUC on test set."""
        thresh = threshold if threshold is not None else self.optimal_threshold

        y_prob = self.predict_proba(X_test)
        y_pred = (y_prob >= thresh).astype(int)

        accuracy  = float(accuracy_score(y_test, y_pred))
        precision = float(precision_score(y_test, y_pred, zero_division=0))
        recall    = float(recall_score(y_test, y_pred, zero_division=0))
        f1        = float(f1_score(y_test, y_pred, zero_division=0))
        auc       = float(roc_auc_score(y_test, y_prob))

        fpr, tpr, _ = roc_curve(y_test, y_prob)
        step = max(1, len(fpr) // 50)

        return {
            'accuracy':  round(accuracy,  4),
            'precision': round(precision, 4),
            'recall':    round(recall,    4),
            'f1_score':  round(f1,        4),
            'roc_auc':   round(auc,       4),
            'roc_curve': {
                'fpr': [round(x, 4) for x in fpr[::step]],
                'tpr': [round(x, 4) for x in tpr[::step]]
            }
        }

    def compare_models(self, X_test, X_test_scaled, y_test, threshold: float = None):
        """
        Returns individual performance metrics for each of the 5 models.
        Used by the /api/model-comparison endpoint in Phase 2.
        """
        thresh = threshold if threshold is not None else self.optimal_threshold

        X_scaled_arr = self.scaler.transform(X_test)
        X_scaled = pd.DataFrame(X_scaled_arr, columns=self.feature_cols)

        def _metrics(y_prob_arr, model_thresh=0.5):
            y_pred = (y_prob_arr >= model_thresh).astype(int)
            return {
                'accuracy':  round(float(accuracy_score(y_test, y_pred)), 4),
                'precision': round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
                'recall':    round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
                'f1':        round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
                'roc_auc':   round(float(roc_auc_score(y_test, y_prob_arr)), 4),
            }

        return {
            'Logistic Regression': _metrics(
                self.traditional_model.predict_proba(X_scaled)[:, 1]
            ),
            'XGBoost (Tuned)': _metrics(
                self.xgb_model.predict_proba(X_test)[:, 1]
            ),
            'Random Forest': _metrics(
                self.rf_model.predict_proba(X_test)[:, 1]
            ),
            'LightGBM': _metrics(
                self.lgbm_model.predict_proba(X_test)[:, 1]
            ),
            'MLP Neural Net': _metrics(
                self.deep_learning_model.predict_proba(X_scaled)[:, 1]
            ),
            'CredX Ensemble': _metrics(
                self.predict_proba(X_test), thresh
            ),
        }

    # ------------------------------------------------------------------
    # Save / Load
    # ------------------------------------------------------------------

    def save_models(self):
        """Saves all 5 model files + scaler + feature list to disk."""
        joblib.dump(self.traditional_model,  os.path.join(MODEL_DIR, 'traditional.joblib'))
        joblib.dump(self.xgb_model,          os.path.join(MODEL_DIR, 'xgb.joblib'))
        joblib.dump(self.rf_model,           os.path.join(MODEL_DIR, 'rf.joblib'))
        joblib.dump(self.lgbm_model,         os.path.join(MODEL_DIR, 'lgbm.joblib'))
        joblib.dump(self.deep_learning_model, os.path.join(MODEL_DIR, 'dl_mlp.joblib'))
        joblib.dump(self.scaler,             os.path.join(MODEL_DIR, 'scaler.joblib'))
        joblib.dump(self.feature_cols,       os.path.join(MODEL_DIR, 'feature_cols.joblib'))
        joblib.dump(self.optimal_threshold,  os.path.join(MODEL_DIR, 'threshold.joblib'))

    def load_models(self):
        """Loads all model files from disk."""
        self.traditional_model   = joblib.load(os.path.join(MODEL_DIR, 'traditional.joblib'))
        self.xgb_model           = joblib.load(os.path.join(MODEL_DIR, 'xgb.joblib'))
        self.deep_learning_model = joblib.load(os.path.join(MODEL_DIR, 'dl_mlp.joblib'))
        self.scaler              = joblib.load(os.path.join(MODEL_DIR, 'scaler.joblib'))
        self.feature_cols        = joblib.load(os.path.join(MODEL_DIR, 'feature_cols.joblib'))

        # Load Phase 2 models if they exist (graceful fallback for Phase 1 saves)
        rf_path = os.path.join(MODEL_DIR, 'rf.joblib')
        lgbm_path = os.path.join(MODEL_DIR, 'lgbm.joblib')
        if os.path.exists(rf_path):
            self.rf_model = joblib.load(rf_path)
        if os.path.exists(lgbm_path):
            self.lgbm_model = joblib.load(lgbm_path)

        threshold_path = os.path.join(MODEL_DIR, 'threshold.joblib')
        if os.path.exists(threshold_path):
            self.optimal_threshold = joblib.load(threshold_path)

        self.is_trained = True
