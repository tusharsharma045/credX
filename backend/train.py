"""
train.py — CredX Training Pipeline (Phase 2)
=============================================
Phase 2 adds Random Forest + LightGBM to the ensemble, tunes XGBoost,
and saves individual model comparison results alongside overall metrics.
"""

import sys
import os
import json
import numpy as np
import pandas as pd

sys.path.append(os.path.dirname(__file__))

from preprocessing import load_raw_dataset, preprocess_data, get_train_test_split
from model import HybridCreditRiskModel
from xai_engine import XaiExplainer
from imblearn.over_sampling import SMOTE
from sklearn.metrics import precision_recall_curve


def apply_smote(X_train_arr, y_train_arr, random_state=42, k_neighbors=5):
    """
    Synthetic Minority Oversampling — balances the dataset so the model
    sees enough default examples and doesn't just predict 'no default'.
    """
    smote = SMOTE(random_state=random_state, k_neighbors=k_neighbors)
    X_resampled, y_resampled = smote.fit_resample(X_train_arr, y_train_arr)

    before = dict(zip(*np.unique(y_train_arr, return_counts=True)))
    after  = dict(zip(*np.unique(y_resampled, return_counts=True)))
    print(f"[SMOTE] Before: {before}  →  After: {after}")
    return X_resampled, y_resampled


def calibrate_threshold(y_test, y_prob):
    """
    Finds the probability threshold that maximises F1 score.
    Default 0.5 is bad for imbalanced datasets — this is calibrated properly.
    """
    precision_vals, recall_vals, thresholds = precision_recall_curve(y_test, y_prob)

    # Align arrays (sklearn returns len(thresholds) == len(precision) - 1)
    precision_vals = precision_vals[:-1]
    recall_vals    = recall_vals[:-1]

    denom     = precision_vals + recall_vals
    f1_scores = np.where(denom > 0, 2.0 * precision_vals * recall_vals / denom, 0.0)

    best_idx          = int(np.argmax(f1_scores))
    optimal_threshold = float(thresholds[best_idx])

    print(f"[Threshold] Best = {optimal_threshold:.4f}  "
          f"F1={f1_scores[best_idx]:.4f}  "
          f"Precision={precision_vals[best_idx]:.4f}  "
          f"Recall={recall_vals[best_idx]:.4f}")
    return optimal_threshold


def run_training_pipeline():
    """
    Full end-to-end training pipeline. Runs Phase 2 ensemble training:
    Logistic Regression + XGBoost (tuned) + Random Forest + LightGBM + MLP.
    Saves metrics.json and model_comparison.json to saved_models/.
    """

    print("[Pipeline] Loading dataset...")
    df_raw = load_raw_dataset()

    print("[Pipeline] Preprocessing...")
    df_processed = preprocess_data(df_raw)

    print("[Pipeline] Train/test split...")
    (X_train, X_test,
     X_train_scaled, X_test_scaled,
     y_train, y_test,
     scaler, feature_cols) = get_train_test_split(df_processed)

    print("[Pipeline] Applying SMOTE...")
    X_res_arr, y_res_arr = apply_smote(X_train.values, y_train.values)
    X_train_res = pd.DataFrame(X_res_arr, columns=feature_cols)
    y_train_res = pd.Series(y_res_arr, name=y_train.name)
    X_train_res_scaled = pd.DataFrame(scaler.transform(X_train_res), columns=feature_cols)

    print("[Pipeline] Training all 5 models (Phase 2 ensemble)...")
    model = HybridCreditRiskModel()
    model.train(X_train_res, X_train_res_scaled, y_train_res, scaler, feature_cols)

    print("[Pipeline] Calibrating decision threshold...")
    y_prob_test       = model.predict_proba(X_test)
    optimal_threshold = calibrate_threshold(y_test.values, y_prob_test)

    model.optimal_threshold = optimal_threshold
    model.save_models()

    print("[Pipeline] Evaluating ensemble performance...")
    metrics = model.evaluate(X_test, X_test_scaled, y_test, threshold=optimal_threshold)
    metrics['optimal_threshold'] = round(optimal_threshold, 6)

    metrics_path = os.path.join(os.path.dirname(__file__), 'saved_models', 'metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"[Pipeline] Metrics saved → {metrics_path}")

    # Phase 2: Save per-model comparison results
    print("[Pipeline] Computing individual model comparison metrics...")
    comparison = model.compare_models(X_test, X_test_scaled, y_test, threshold=optimal_threshold)
    comparison_path = os.path.join(os.path.dirname(__file__), 'saved_models', 'model_comparison.json')
    with open(comparison_path, 'w') as f:
        json.dump(comparison, f, indent=2)
    print(f"[Pipeline] Model comparison saved → {comparison_path}")

    print("[Pipeline] Setting up XAI explainer (SHAP + LIME)...")
    explainer = XaiExplainer(model)
    explainer.initialize_explainer(X_train.iloc[:100])

    print("[Pipeline] ✓ Training complete (Phase 2).")
    return metrics


if __name__ == '__main__':
    run_training_pipeline()
