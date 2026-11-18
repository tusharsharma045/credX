import React, { useState, useEffect } from 'react';
import { fetchModelComparison } from '../services/api';

// What each model is — in simple English for the UI
const MODEL_DESCRIPTIONS = {
  'Logistic Regression': 'Simple maths-based model. Quick but only good for straight-line patterns.',
  'XGBoost (Tuned)': 'Decision tree model that learns from its mistakes in rounds. Very powerful.',
  'Random Forest': 'Runs many decision trees and takes a vote. Good at handling noisy data.',
  'LightGBM': 'Faster version of XGBoost. Great at finding defaulters (high Recall).',
  'MLP Neural Net': 'Small neural network — finds hidden patterns the other models miss.',
  'CredX Ensemble': 'The final model — combines all 5 above with tuned weights.',
};

const METRIC_COLORS = {
  accuracy:  '#38bdf8',  // sky
  recall:    '#f472b6',  // pink — most important for catching defaulters
  precision: '#a78bfa',  // violet
  f1:        '#34d399',  // emerald
  roc_auc:   '#fb923c',  // orange
};

const METRICS_SHOWN = ['accuracy', 'recall', 'f1', 'roc_auc'];
const METRIC_LABELS = {
  accuracy: 'Accuracy',
  recall:   'Recall',
  f1:       'F1 Score',
  roc_auc:  'ROC-AUC',
};

export default function ModelComparison() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('recall');

  useEffect(() => {
    fetchModelComparison().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);

  // Fallback static data so the UI always shows something even if backend is offline
  const displayData = data || {
    'Logistic Regression': { accuracy: 0.7823, recall: 0.3214, f1: 0.4102, roc_auc: 0.7012 },
    'XGBoost (Tuned)':     { accuracy: 0.8231, recall: 0.5920, f1: 0.5812, roc_auc: 0.7944 },
    'Random Forest':       { accuracy: 0.8102, recall: 0.5341, f1: 0.5590, roc_auc: 0.7801 },
    'LightGBM':            { accuracy: 0.8319, recall: 0.6102, f1: 0.5944, roc_auc: 0.8012 },
    'MLP Neural Net':      { accuracy: 0.7991, recall: 0.4891, f1: 0.5201, roc_auc: 0.7623 },
    'CredX Ensemble':      { accuracy: 0.8341, recall: 0.6243, f1: 0.6011, roc_auc: 0.8102 },
  };

  const modelNames = Object.keys(displayData);
  const maxVal = Math.max(...modelNames.map(m => displayData[m][activeMetric] || 0));

  return (
    <div className="dark-card space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Phase 2 — Model Comparison</h2>
        <p className="text-xs text-gray-400 mt-1">
          Comparing all 5 models individually. <span className="text-pink-400 font-semibold">Recall</span> is
          the key metric — it tells us how many real defaulters we correctly caught.
          {!data && <span className="ml-2 text-yellow-400">(showing estimates — backend offline)</span>}
          {loading && <span className="ml-2 text-cyan-400">Loading live data…</span>}
        </p>
      </div>

      {/* Metric selector tabs */}
      <div className="flex flex-wrap gap-2">
        {METRICS_SHOWN.map(metric => (
          <button
            key={metric}
            onClick={() => setActiveMetric(metric)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              activeMetric === metric
                ? 'border-cyan-600 bg-cyan-950 text-cyan-300'
                : 'border-gray-700 bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            {METRIC_LABELS[metric]}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="space-y-3">
        {modelNames.map(modelName => {
          const val    = displayData[modelName][activeMetric] || 0;
          const pct    = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const isEnsemble = modelName === 'CredX Ensemble';

          return (
            <div key={modelName}>
              <div className="flex justify-between items-center mb-1">
                <div>
                  <span className={`text-xs font-semibold ${isEnsemble ? 'text-cyan-300' : 'text-gray-200'}`}>
                    {modelName}
                  </span>
                  {isEnsemble && (
                    <span className="ml-2 text-[9px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700">
                      FINAL
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-gray-300">{(val * 100).toFixed(1)}%</span>
              </div>

              <div className="h-5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: isEnsemble
                      ? '#22d3ee'
                      : METRIC_COLORS[activeMetric],
                    opacity: isEnsemble ? 1 : 0.7,
                  }}
                />
              </div>

              {/* Simple description shown below each bar */}
              <p className="text-[10px] text-gray-500 mt-0.5">
                {MODEL_DESCRIPTIONS[modelName]}
              </p>
            </div>
          );
        })}
      </div>

      {/* What is Recall note */}
      <div className="dark-card-inner border border-pink-900/40 bg-pink-950/20 rounded-lg p-3 text-xs text-pink-200 space-y-1">
        <p className="font-semibold text-pink-300">📌 Why Recall matters most here</p>
        <p>
          Recall = out of all actual defaulters, how many did we catch?
          A <strong>missed defaulter</strong> costs the bank real money.
          A <strong>false alarm</strong> (flagging a good borrower) is bad but less costly.
          That's why Phase 2 focuses on improving Recall — we want to catch more defaulters even if
          it means a few more false alarms.
        </p>
        <p className="text-pink-400 font-semibold">
          Phase 1 Recall: 47.7% → Phase 2 Target: 60%+
        </p>
      </div>
    </div>
  );
}
