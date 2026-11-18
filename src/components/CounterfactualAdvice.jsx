import React, { useState, useEffect } from 'react';
import { Lightbulb, ArrowRight, TrendingDown, Loader2 } from 'lucide-react';
import { fetchCounterfactualAdvice } from '../services/api';

/**
 * WHAT: Displays AI-generated, actionable "What Would It Take?" advice for declined or
 *       conditionally-approved borrowers.
 *
 * WHY:  Regulatory explainability requirements (GDPR "right to explanation", fair-lending laws,
 *       emerging-market microfinance standards) demand that borrowers be told not just *that* they
 *       were declined, but *why*, and *what specific changes* would improve their outcome.
 *       This component turns a rejection into a structured financial coaching opportunity — it
 *       reduces borrower frustration, improves portfolio quality by guiding borrowers toward
 *       healthier financial behaviours, and provides the lender with a documented audit trail of
 *       explainability output (important for regulatory inspections).
 *
 * HOW:  On mount (or whenever `borrower` changes), if `isVisible` is true it fires
 *       fetchCounterfactualAdvice() with the borrower's data. If the backend is online, the real
 *       API returns a ranked list of feature perturbations computed by the backend's counterfactual
 *       engine (e.g. DiCE / SHAP-greedy). If the backend is offline, the function returns null
 *       and this component falls back to a curated set of static mock advice items that still
 *       illustrate the concept meaningfully during demos.
 *
 *       Each advice item shows:
 *         • The risky feature name
 *         • Current value → Suggested target value
 *         • Expected reduction in default probability (PD)
 *         • Human-readable advice text
 *
 * @param {Object}  props.borrower   - Full borrower object (from mockBorrowers or API)
 * @param {boolean} props.isVisible  - Should be true only when action !== 'APPROVE'
 */
export default function CounterfactualAdvice({ borrower, isVisible }) {
  /**
   * WHAT: Local state for the list of counterfactual advice items and the loading flag.
   * WHY:  We keep these separate so the UI can show a skeleton/spinner while the API is in-flight
   *       without blocking the rest of the assessor panel below.
   */
  const [adviceItems, setAdviceItems] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * WHAT: Static fallback advice displayed when the backend is offline.
   * WHY:  The component must remain useful during demo presentations without a live backend.
   *       These items are chosen to represent the three most commonly-actionable features in the
   *       UCI credit default dataset that the CredX model is trained on, so they remain realistic
   *       even as placeholder content.
   */
  const MOCK_ADVICE = [
    {
      feature: 'DELINQUENCY_INDEX',
      current_value: 8,
      suggested_value: 2,
      advice_text: 'Reduce payment delays: Make all payments on time for 3 consecutive months to significantly lower your delinquency score.',
      expected_prob_reduction: 8.5
    },
    {
      feature: 'CREDIT_UTILIZATION',
      current_value: 0.85,
      suggested_value: 0.30,
      advice_text: 'Lower credit utilization: Pay down existing balances to bring credit utilization below 30% of your credit limit.',
      expected_prob_reduction: 6.2
    },
    {
      feature: 'PAY_AMT1',
      current_value: 500,
      suggested_value: 2000,
      advice_text: 'Increase recent payment amount: Make larger payments on your most recent bills to demonstrate improved repayment capacity.',
      expected_prob_reduction: 4.1
    }
  ];

  /**
   * WHAT: Fetches counterfactual advice whenever the selected borrower changes (and isVisible is true).
   * WHY:  useEffect with [borrower?.id, isVisible] ensures we only re-fetch when the actual borrower
   *       changes or the panel becomes visible — not on every parent re-render. This prevents
   *       unnecessary API calls (e.g. when the user adjusts counterfactual sliders without switching
   *       borrowers) and keeps API costs / latency manageable.
   * HOW:  Sets loading=true → calls fetchCounterfactualAdvice() → on null response (offline),
   *       falls back to MOCK_ADVICE. On success, stores the API response. Always clears loading flag.
   */
  useEffect(() => {
    if (!isVisible || !borrower) {
      setAdviceItems([]);
      return;
    }

    async function loadAdvice() {
      setLoading(true);
      const result = await fetchCounterfactualAdvice(borrower);
      if (result && Array.isArray(result) && result.length > 0) {
        setAdviceItems(result);
      } else {
        // Backend offline or returned empty — use curated static fallback
        setAdviceItems(MOCK_ADVICE);
      }
      setLoading(false);
    }

    loadAdvice();
  }, [borrower?.id, isVisible]);

  // Don't mount anything at all when the borrower is approved
  if (!isVisible) return null;

  /**
   * WHAT: Formats a raw feature value for human-readable display.
   * WHY:  Raw API values (e.g. 0.85 for utilization, 500 for payment amount) are hard to read
   *       without context. We apply simple heuristics: ratios ≤ 1 → percentage, larger numbers
   *       → dollar amount or integer depending on magnitude.
   * HOW:  Simple numeric thresholds — not intended as a production formatter, just good enough
   *       for a demo prototype. A future iteration would carry unit metadata from the API.
   *
   * @param {string} feature - Feature key name (used to detect utilization ratios)
   * @param {number} value   - Raw numeric value
   * @returns {string} Formatted display string
   */
  function formatValue(feature, value) {
    const featureLower = feature.toLowerCase();
    if (featureLower.includes('utilization') || featureLower.includes('ratio')) {
      return `${(value * 100).toFixed(0)}%`;
    }
    if (value >= 100) {
      return `$${value.toLocaleString()}`;
    }
    return String(value);
  }

  return (
    <div className="dark-card p-5">
      {/* ── Panel Header ── */}
      <div className="flex items-center space-x-2 border-b border-gray-800 pb-3 mb-5">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white">What Would It Take to Qualify?</h3>
        <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold uppercase">
          AI Coaching
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        The CredX model has identified the following high-impact changes that would most improve
        this borrower's default probability and move them toward approval.
      </p>

      {/* ── Loading State ── */}
      {loading && (
        <div className="flex items-center space-x-3 py-8 justify-center text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <span className="text-xs">Generating AI counterfactual recommendations...</span>
        </div>
      )}

      {/* ── Advice Cards ── */}
      {!loading && adviceItems.length > 0 && (
        <div className="space-y-3">
          {adviceItems.map((item, idx) => {
            /**
             * WHAT: Colour-codes each advice card by expected probability reduction magnitude.
             * WHY:  Highlighting the highest-impact change in amber (urgent) and lower-impact
             *       changes in emerald (positive/incremental) helps borrowers prioritise where
             *       to focus their effort first — a core UX principle for actionability.
             */
            const isHighImpact = item.expected_prob_reduction >= 7;

            return (
              <div
                key={idx}
                className={`dark-card-inner p-4 rounded-xl border ${
                  isHighImpact
                    ? 'border-amber-800/60 bg-amber-950/10'
                    : 'border-emerald-800/40 bg-emerald-950/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Feature name + current → suggested value arrow */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isHighImpact
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        #{idx + 1} Priority
                      </span>
                      <span className="text-xs font-semibold text-gray-200 font-mono">
                        {item.feature}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">{item.advice_text}</p>
                  </div>

                  {/* Current → Suggested + PD reduction badge */}
                  <div className="flex items-center space-x-3 shrink-0">
                    {/* Current value */}
                    <div className="text-center">
                      <span className="block text-[10px] text-gray-500 mb-0.5">Current</span>
                      <span className="text-sm font-bold text-rose-400">
                        {formatValue(item.feature, item.current_value)}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-600 shrink-0" />

                    {/* Suggested value */}
                    <div className="text-center">
                      <span className="block text-[10px] text-gray-500 mb-0.5">Target</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {formatValue(item.feature, item.suggested_value)}
                      </span>
                    </div>

                    {/* Expected PD reduction */}
                    <div className="text-center bg-emerald-950/60 border border-emerald-800/50 rounded-lg px-3 py-2 min-w-[80px]">
                      <span className="block text-[10px] text-gray-400 mb-0.5 whitespace-nowrap">PD Reduction</span>
                      <div className="flex items-center justify-center space-x-0.5">
                        <TrendingDown className="w-3 h-3 text-emerald-400" />
                        <span className="text-sm font-extrabold text-emerald-400">
                          -{item.expected_prob_reduction.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer disclaimer ── */}
      {!loading && (
        <p className="text-[10px] text-gray-600 mt-4 border-t border-gray-800 pt-3">
          Counterfactual recommendations are generated by the CredX ML model and represent
          indicative guidance only. Actual credit outcomes depend on full underwriting review.
        </p>
      )}
    </div>
  );
}
