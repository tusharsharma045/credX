const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Backend offline');
    return await res.json();
  } catch (err) {
    console.warn("Backend API offline, falling back to local dataset:", err);
    return null;
  }
}

export async function fetchMetrics() {
  try {
    const res = await fetch(`${API_BASE_URL}/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return await res.json();
  } catch (err) {
    console.warn("Using baseline metrics:", err);
    return null;
  }
}

export async function fetchSampleBorrowers() {
  try {
    const res = await fetch(`${API_BASE_URL}/sample-borrowers`);
    if (!res.ok) throw new Error('Failed to fetch borrowers');
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch backend borrowers:", err);
    return null;
  }
}

export async function predictBorrowerRisk(borrowerData) {
  try {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(borrowerData)
    });
    if (!res.ok) throw new Error('Prediction API failed');
    return await res.json();
  } catch (err) {
    console.warn("Prediction API error:", err);
    return null;
  }
}

export async function triggerModelTraining() {
  try {
    const res = await fetch(`${API_BASE_URL}/train`, { method: 'POST' });
    if (!res.ok) throw new Error('Training API failed');
    return await res.json();
  } catch (err) {
    console.error("Training error:", err);
    return null;
  }
}

/**
 * WHAT: Fetches AI-generated counterfactual advice for a declined or conditionally-approved borrower.
 * WHY:  When a borrower is declined, they need to know exactly what financial behaviors to change in
 *       order to qualify. This makes the AI decision explainable and actionable — a key regulatory
 *       explainability requirement (akin to GDPR "right to explanation" and fair-lending standards).
 *       Turning a rejection into a coaching opportunity also reduces churn and improves portfolio quality.
 * HOW:  POSTs the borrower's raw feature data to /api/counterfactual-advice on the backend, which
 *       runs a counterfactual perturbation algorithm (e.g. DiCE or SHAP-guided greedy search) and
 *       returns the top actionable changes ranked by expected reduction in default probability.
 *       Each item in the response contains:
 *         { feature, current_value, suggested_value, advice_text, expected_prob_reduction }
 *       Returns null on network error so callers can fall back to static mock advice.
 *
 * @param {Object} borrowerData - Raw borrower feature object (from mockBorrowers or API)
 * @returns {Promise<Array|null>} Array of advice objects or null if the backend is offline
 */
export async function fetchCounterfactualAdvice(borrowerData) {
  try {
    const res = await fetch(`${API_BASE_URL}/counterfactual-advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(borrowerData)
    });
    if (!res.ok) throw new Error('Counterfactual advice API failed');
    return await res.json();
  } catch (err) {
    console.warn("Counterfactual advice API unavailable, using static fallback:", err);
    return null;
  }
}

/**
 * WHAT: Fetches the model drift monitoring report from the backend.
 * WHY:  ML models trained on historical data can become stale (concept drift) as real-world borrower
 *       behavior evolves — driven by economic shifts, new credit products, policy changes, or
 *       demographic trends. If the model's input distribution diverges too far from its training
 *       distribution, its predictions become unreliable and potentially unfair.
 *       PSI (Population Stability Index) is the industry-standard metric for this: PSI < 0.1 means
 *       the model is stable, 0.1–0.2 indicates moderate drift (monitor closely), and > 0.2 signals
 *       that retraining is required before continuing to use the model in production.
 * HOW:  GETs /api/drift-report, which the backend computes by comparing the current inference
 *       feature distribution against the stored training-time baseline distribution per feature.
 *       Returns: { psi_score, drift_status, last_trained, feature_drift[], recommendation }
 *       Returns null on network error so callers can render simulated drift data instead.
 *
 * @returns {Promise<Object|null>} Drift report object or null if the backend is offline
 */
export async function fetchDriftReport() {
  try {
    const res = await fetch(`${API_BASE_URL}/drift-report`);
    if (!res.ok) throw new Error('Drift report API failed');
    return await res.json();
  } catch (err) {
    console.warn("Drift report API unavailable, using simulated data:", err);
    return null;
  }
}

// Phase 2: fetch per-model comparison metrics (RF, LightGBM, XGBoost, etc.)
export async function fetchModelComparison() {
  try {
    const res = await fetch(`${API_BASE_URL}/model-comparison`);
    if (!res.ok) throw new Error('Model comparison API failed');
    return await res.json();
  } catch (err) {
    console.warn("Model comparison API unavailable:", err);
    return null;
  }
}

// Phase 2: get LIME explanation for a borrower
export async function fetchLimeExplanation(borrowerData) {
  try {
    const res = await fetch(`${API_BASE_URL}/explain-lime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(borrowerData)
    });
    if (!res.ok) throw new Error('LIME API failed');
    return await res.json();
  } catch (err) {
    console.warn("LIME explanation API unavailable:", err);
    return null;
  }
}
