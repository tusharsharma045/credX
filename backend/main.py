import os
import sys
import json
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

sys.path.append(os.path.dirname(__file__))

from preprocessing import load_raw_dataset, preprocess_data, get_train_test_split
from model import HybridCreditRiskModel
from xai_engine import XaiExplainer

model = HybridCreditRiskModel()
explainer = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, explainer
    model_dir = os.path.join(os.path.dirname(__file__), 'saved_models')
    if os.path.exists(os.path.join(model_dir, 'xgb.joblib')):
        try:
            model.load_models()
            explainer = XaiExplainer(model)
            explainer.load_explainer_data()
        except Exception as e:
            print(f"[Startup] Load failed ({e}), retraining...")
            from train import run_training_pipeline
            run_training_pipeline()
            model.load_models()
            explainer = XaiExplainer(model)
            explainer.load_explainer_data()
    yield


app = FastAPI(
    title="CredX Credit Risk API (Phase 2 — in development)",
    description="Prototype backend for CredX explainable credit risk system.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BorrowerPredictRequest(BaseModel):
    LIMIT_BAL: Optional[float] = 50000
    SEX: Optional[int] = 2
    EDUCATION: Optional[int] = 2
    MARRIAGE: Optional[int] = 1
    AGE: Optional[int] = 30
    PAY_0: Optional[int] = 0
    PAY_2: Optional[int] = 0
    PAY_3: Optional[int] = 0
    PAY_4: Optional[int] = 0
    PAY_5: Optional[int] = 0
    PAY_6: Optional[int] = 0
    BILL_AMT1: Optional[float] = 15000
    BILL_AMT2: Optional[float] = 14000
    BILL_AMT3: Optional[float] = 13000
    BILL_AMT4: Optional[float] = 12000
    BILL_AMT5: Optional[float] = 11000
    BILL_AMT6: Optional[float] = 10000
    PAY_AMT1: Optional[float] = 2000
    PAY_AMT2: Optional[float] = 2000
    PAY_AMT3: Optional[float] = 1500
    PAY_AMT4: Optional[float] = 1500
    PAY_AMT5: Optional[float] = 1000
    PAY_AMT6: Optional[float] = 1000
    TRADITIONAL_SCORE: Optional[int] = 640


def _build_data_dict(borrower):
    """Compute derived features that the model expects but API doesn't require."""
    data = borrower.dict()
    if 'CREDIT_UTILIZATION' not in data:
        data['CREDIT_UTILIZATION'] = data['BILL_AMT1'] / max(1.0, data['LIMIT_BAL'])
    if 'DELINQUENCY_INDEX' not in data:
        pay_cols = [data['PAY_0'], data['PAY_2'], data['PAY_3'],
                    data['PAY_4'], data['PAY_5'], data['PAY_6']]
        data['DELINQUENCY_INDEX'] = sum(max(0, p) for p in pay_cols)
    if 'AVG_PAYMENT_RATIO' not in data:
        total_bill = sum([data.get(f'BILL_AMT{i}', 0) for i in range(1, 7)])
        total_pay  = sum([data.get(f'PAY_AMT{i}',  0) for i in range(1, 7)])
        data['AVG_PAYMENT_RATIO'] = total_pay / max(1.0, total_bill)
    return data


@app.get("/api/health")
def health_check():
    return {
        "status": "in_development",
        "phase": "Phase 2 — Multi-model ensemble",
        "model_trained": model.is_trained,
        "dataset": "UCI Credit Card Dataset (30k rows)"
    }


@app.get("/api/metrics")
def get_metrics():
    metrics_path = os.path.join(os.path.dirname(__file__), 'saved_models', 'metrics.json')
    if os.path.exists(metrics_path):
        with open(metrics_path, 'r') as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Run /api/train first.")


@app.get("/api/model-comparison")
def get_model_comparison():
    """Returns individual metrics for each of the 5 models + ensemble (Phase 2)."""
    path = os.path.join(os.path.dirname(__file__), 'saved_models', 'model_comparison.json')
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Run /api/train first.")


@app.post("/api/predict")
def predict_risk(borrower: BorrowerPredictRequest):
    if not model.is_trained:
        raise HTTPException(status_code=400, detail="Model is not trained yet.")

    data   = _build_data_dict(borrower)
    result = model.predict_single(data)

    shap_features = []
    if explainer is not None:
        try:
            shap_features = explainer.explain_instance(data)
        except Exception:
            pass

    result['shap_features'] = shap_features
    return result


@app.post("/api/explain-lime")
def explain_lime(borrower: BorrowerPredictRequest):
    """Returns LIME explanation for a borrower (Phase 2 — alongside SHAP)."""
    if not model.is_trained:
        raise HTTPException(status_code=400, detail="Model not trained.")
    if explainer is None:
        raise HTTPException(status_code=503, detail="Explainer not ready.")

    data = _build_data_dict(borrower)
    try:
        lime_features = explainer.explain_instance_lime(data)
        return {"lime_features": lime_features}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LIME error: {str(e)}")


@app.post("/api/explain-shap")
def explain_shap(borrower: BorrowerPredictRequest):
    """Returns SHAP explanation for a borrower (separate endpoint for SHAP-only calls)."""
    if not model.is_trained:
        raise HTTPException(status_code=400, detail="Model not trained.")
    if explainer is None:
        raise HTTPException(status_code=503, detail="Explainer not ready.")

    data = _build_data_dict(borrower)
    try:
        shap_features = explainer.explain_instance(data)
        return {"shap_features": shap_features}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SHAP error: {str(e)}")


@app.get("/api/sample-borrowers")
def get_sample_borrowers():
    df_raw  = load_raw_dataset()
    df_proc = preprocess_data(df_raw)
    samples = df_proc.sample(n=5, random_state=42).to_dict(orient='records')
    names   = ["Borrower A", "Borrower B", "Borrower C", "Borrower D", "Borrower E"]

    borrower_list = []
    for idx, row in enumerate(samples):
        prediction  = model.predict_single(row)
        shap_feats  = explainer.explain_instance(row) if explainer else []

        borrower_list.append({
            "id":               f"bor-uci-{row['ID']}",
            "name":             names[idx % len(names)],
            "owner":            f"ID #{row['ID']}",
            "location":         "Emerging Market Region",
            "sector":           "SME Business",
            "requestedAmount":  int(row['LIMIT_BAL']),
            "tenorMonths":      12,
            "traditionalScore": prediction['traditional_score'],
            "credxScore":       prediction['credx_score'],
            "defaultProbability": prediction['default_probability'],
            "riskTier":         prediction['risk_tier'],
            "shapFeatures":     shap_feats,
            "recommendation": {
                "action":                 prediction['action'],
                "maxCreditLimit":         int(row['LIMIT_BAL'] * 1.1),
                "interestRatePct":        prediction['recommended_interest_rate'],
                "standardBankRatePct":    19.5,
                "recommendedCollateral":  "Mobile Money Auto Sweep",
                "covenants":              ["Maintain positive cashflow"]
            },
            "counterfactuals": {
                "monthlyMobileInflow": int(row['PAY_AMT1']),
                "supplierPunctuality": 95.0,
                "macroInflationShock": 10.0,
                "cashReserveMonths":   2.5
            },
            "stressTest": {
                "baseline":          prediction['default_probability'],
                "fxDevaluation20pct": round(prediction['default_probability'] * 1.4, 1),
                "fuelPriceSpike35pct": round(prediction['default_probability'] * 1.7, 1),
                "combinedShock":      round(prediction['default_probability'] * 2.2, 1)
            }
        })

    return borrower_list


@app.post("/api/train")
def train_pipeline():
    """Triggers a full retrain — runs Phase 2 pipeline with all 5 models."""
    from train import run_training_pipeline
    metrics = run_training_pipeline()
    global model, explainer
    model.load_models()
    explainer = XaiExplainer(model)
    explainer.load_explainer_data()
    return {"status": "success", "message": "Phase 2 training complete", "metrics": metrics}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
