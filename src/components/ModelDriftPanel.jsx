import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { fetchDriftReport } from '../services/api';

/**
 * WHAT: Displays the ML model's health and feature-level drift monitoring status.
 *
 * WHY:  ML models are trained on historical data and their predictive accuracy degrades over time
 *       as real-world borrower behaviour evolves — driven by economic cycles, new credit products,
 *       regulatory changes, or demographic shifts. This phenomenon is called "concept drift" or
 *       "data drift", and it is a critical operational risk for any production ML lending system.
 *
 *       PSI (Population Stability Index) is the industry-standard metric for detecting input
 *       distribution drift between a model's training data and its current inference data:
 *         • PSI < 0.10  → STABLE    — model predictions remain reliable
 *         • PSI 0.10–0.20 → MODERATE  — monitor closely, investigate root cause
 *         • PSI > 0.20  → RETRAIN REQUIRED — model is stale, stop using in production
 *
 *       Displaying this panel in the portfolio/metrics view gives ML engineers, risk managers,
 *       and compliance officers a continuous health dashboard without needing to run separate
 *       monitoring scripts. It also demonstrates that the CredX system has production-grade MLOps
 *       observability — a key differentiator for institutional lenders.
 *
 * HOW:  On mount, calls fetchDriftReport() from api.js. If the backend is online, renders the
 *       real computed PSI scores per feature plus the overall drift verdict. If offline, renders
 *       a realistic set of simulated drift data so the panel remains functional in demo mode.
 *       Progress bars for each feature are coloured by PSI severity and scaled to a 0–0.3 range
 *       (values above 0.3 are capped visually since they indicate severe instability).
 *
 *       No props required — this is a self-contained monitoring widget that always fetches its
 *       own data. It is designed to be embedded anywhere in the PortfolioAnalytics tab.
 */
export default function ModelDriftPanel() {
  /**
   * WHAT: Local state for the drift report object and UI flags.
   * WHY:  Keeping loading and error state separate from the data allows fine-grained rendering
   *       of spinner, error, and populated states without a large conditional tree.
   */
  const [driftData, setDriftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  /**
   * WHAT: Simulated drift report used as fallback when the backend is offline.
   * WHY:  The panel must display meaningful, realistic data during stakeholder demos even without
   *       a live backend. The values here reflect a healthy but not perfect model — PAY_0 shows
   *       moderate drift (PSI 0.11) which gives evaluators something concrete to discuss.
   * HOW:  Structurally identical to the live API response shape so the rendering logic is shared.
   */
  const MOCK_DRIFT_DATA = {
    psi_score: 0.08,
    drift_status: 'STABLE',
    last_trained: '2026-10-28',
    feature_drift: [
      { feature: 'CREDIT_UTILIZATION', psi: 0.04, status: 'STABLE'   },
      { feature: 'DELINQUENCY_INDEX',  psi: 0.07, status: 'STABLE'   },
      { feature: 'PAY_0',              psi: 0.11, status: 'MODERATE' },
      { feature: 'AVG_PAYMENT_RATIO',  psi: 0.03, status: 'STABLE'   }
    ],
    recommendation: 'Model is stable. Schedule retraining if PSI exceeds 0.20.'
  };

  /**
   * WHAT: Loads drift data from the API (or falls back to mock) on component mount.
   * WHY:  useEffect with [] means this runs once after mount — the correct React pattern for
   *       one-time data loading. We expose a loadDrift function separately so the refresh button
   *       can re-invoke it without re-mounting the component (imperative re-fetch pattern).
   * HOW:  Sets loading=true → fetches → falls back to MOCK_DRIFT_DATA if null → updates state.
   */
  useEffect(() => {
    loadDrift();
  }, []);

  /**
   * WHAT: Fetches the drift report and updates state accordingly.
   * WHY:  Extracted as a named function so both the mount useEffect and the manual "Refresh"
   *       button can call the same logic without code duplication.
   * HOW:  Calls fetchDriftReport(); on null (offline) uses MOCK_DRIFT_DATA. Records refresh time.
   */
  async function loadDrift() {
    setLoading(true);
    const result = await fetchDriftReport();
    setDriftData(result ?? MOCK_DRIFT_DATA);
    setLastRefreshed(new Date());
    setLoading(false);
  }

  /**
   * WHAT: Returns Tailwind colour classes for a given drift status string.
   * WHY:  Centralising colour logic avoids scattered ternary chains in JSX and makes it easy to
   *       update the colour scheme in one place if the design system changes.
   *
   * @param {'STABLE'|'MODERATE'|'RETRAIN REQUIRED'} status
   * @returns {{ badge: string, bar: string, text: string }} Tailwind class sets
   */
  function getStatusColors(status) {
    switch (status) {
      case 'STABLE':
        return {
          badge: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          bar:   'bg-emerald-500',
          text:  'text-emerald-400'
        };
      case 'MODERATE':
        return {
          badge: 'bg-amber-950 text-amber-300 border-amber-800',
          bar:   'bg-amber-500',
          text:  'text-amber-400'
        };
      case 'RETRAIN REQUIRED':
      default:
        return {
          badge: 'bg-rose-950 text-rose-300 border-rose-800',
          bar:   'bg-rose-500',
          text:  'text-rose-400'
        };
    }
  }

  /**
   * WHAT: Converts a raw PSI score to a percentage width for the progress bar.
   * WHY:  PSI scores range from 0–∞ but meaningful values sit between 0 and 0.30.
   *       We cap at 0.30 so the bar doesn't overflow for severely drifted features,
   *       and multiply by 100/0.30 (≈ 333) to fill the bar at the danger threshold.
   *       This gives a clear visual signal: a half-full bar = moderate, full bar = RETRAIN.
   *
   * @param {number} psi - Raw PSI score (0–0.30+)
   * @returns {number} Bar width as a percentage (0–100)
   */
  function psiToBarWidth(psi) {
    return Math.min(100, (psi / 0.30) * 100);
  }

  const overallColors = driftData ? getStatusColors(driftData.drift_status) : getStatusColors('STABLE');

  return (
    <div className="dark-card p-5">
      {/* ── Panel Header ── */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-5">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Model Health & Drift Monitoring</h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase">
            PSI Monitor
          </span>
        </div>

        {/* Manual refresh button */}
        <button
          onClick={loadDrift}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-lg border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div className="flex items-center space-x-3 py-8 justify-center text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <span className="text-xs">Fetching model drift report...</span>
        </div>
      )}

      {/* ── Populated State ── */}
      {!loading && driftData && (
        <div className="space-y-5">
          {/* Overall PSI Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Overall PSI Score */}
            <div className="dark-card-inner p-4">
              <span className="text-xs text-gray-400 block mb-1">Overall PSI Score</span>
              <div className={`text-2xl font-extrabold ${overallColors.text}`}>
                {driftData.psi_score.toFixed(3)}
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${overallColors.bar}`}
                  style={{ width: `${psiToBarWidth(driftData.psi_score)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">0 — 0.10 — 0.20 — 0.30+</span>
            </div>

            {/* Drift Status Badge */}
            <div className="dark-card-inner p-4 flex flex-col justify-between">
              <span className="text-xs text-gray-400 block mb-2">Drift Status</span>
              <div className="flex items-center space-x-2">
                {driftData.drift_status === 'STABLE'
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  : <AlertTriangle className="w-5 h-5 text-amber-400" />
                }
                <span className={`text-lg font-extrabold ${overallColors.text}`}>
                  {driftData.drift_status}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border mt-2 inline-block ${overallColors.badge}`}
              >
                {driftData.drift_status === 'STABLE'
                  ? 'Model predictions reliable'
                  : driftData.drift_status === 'MODERATE'
                    ? 'Monitor — investigate root cause'
                    : 'Stop using — retrain immediately'
                }
              </span>
            </div>

            {/* Last Trained + Recommendation */}
            <div className="dark-card-inner p-4">
              <span className="text-xs text-gray-400 block mb-1">Last Trained</span>
              <span className="text-sm font-bold text-white">{driftData.last_trained}</span>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                {driftData.recommendation}
              </p>
            </div>
          </div>

          {/* Per-Feature Drift Table */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Feature-Level PSI Breakdown
            </h4>
            <div className="space-y-2">
              {driftData.feature_drift.map((feat) => {
                const colors = getStatusColors(feat.status);
                return (
                  <div key={feat.feature} className="dark-card-inner p-3 flex items-center gap-4">
                    {/* Feature name */}
                    <span className="text-xs font-mono text-gray-300 w-44 shrink-0 truncate">
                      {feat.feature}
                    </span>

                    {/* PSI progress bar */}
                    <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                        style={{ width: `${psiToBarWidth(feat.psi)}%` }}
                      />
                    </div>

                    {/* PSI value */}
                    <span className={`text-xs font-bold w-12 text-right ${colors.text}`}>
                      {feat.psi.toFixed(3)}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${colors.badge}`}
                    >
                      {feat.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PSI Threshold Legend */}
          <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 pt-1 border-t border-gray-800">
            <span><span className="text-emerald-400 font-bold">STABLE</span>: PSI &lt; 0.10</span>
            <span><span className="text-amber-400 font-bold">MODERATE</span>: PSI 0.10–0.20</span>
            <span><span className="text-rose-400 font-bold">RETRAIN REQUIRED</span>: PSI &gt; 0.20</span>
            {lastRefreshed && (
              <span className="ml-auto">
                Last refreshed: {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
