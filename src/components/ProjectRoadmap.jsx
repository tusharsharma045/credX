import React from 'react';
import { Target, Layers, Cpu, Database, CheckCircle2, Clock, ArrowRight, BrainCircuit, Activity, ShieldAlert } from 'lucide-react';

export default function ProjectRoadmap({ onSwitchToAssessor }) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-800/60 bg-slate-900/90">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center shrink-0 text-cyan-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                Project Overview & Objectives
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All Core Modules Implemented</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Credit Risk Assessment System using Explainable AI (XAI)
            </h2>
            <p className="text-xs text-gray-300 mt-2 leading-relaxed max-w-4xl">
              This system assesses credit risk for emerging market borrowers where traditional credit history is limited or volatile. It combines a 300–850 traditional credit scorecard with a 5-model machine learning ensemble (Logistic Regression, Tuned XGBoost, Random Forest, LightGBM, and Deep MLP). Explainability is provided through dual SHAP and LIME feature attributions, counterfactual coaching, and macroeconomic volatility stress tests.
            </p>

            <button
              onClick={onSwitchToAssessor}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all shadow-md"
            >
              <span>Open Risk Assessor Prototype</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Modules */}
      <div className="glass-panel rounded-2xl p-6 border border-gray-800">
        <h3 className="text-base font-bold text-white flex items-center space-x-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>System Architecture & Modules</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 p-4 rounded-xl border border-gray-800">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Module 1</span>
            <h4 className="font-bold text-gray-200 text-sm mb-1 flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Data & Features</span>
            </h4>
            <p className="text-xs text-gray-400">
              Handles UCI 30k borrower data, SMOTE minority class oversampling, delinquency index, and credit utilization ratios.
            </p>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-gray-800">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Module 2</span>
            <h4 className="font-bold text-gray-200 text-sm mb-1 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>5-Model Ensemble</span>
            </h4>
            <p className="text-xs text-gray-400">
              Combines Logistic Regression, Tuned XGBoost, Random Forest, LightGBM, and Deep Learning MLP with calibrated threshold.
            </p>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-gray-800">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">Module 3</span>
            <h4 className="font-bold text-gray-200 text-sm mb-1 flex items-center space-x-1.5">
              <BrainCircuit className="w-4 h-4 text-amber-400" />
              <span>Dual XAI Engine</span>
            </h4>
            <p className="text-xs text-gray-400">
              Tree SHAP exact attributions alongside LIME model-agnostic local perturbations, plus counterfactual coaching advice.
            </p>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-gray-800">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">Module 4</span>
            <h4 className="font-bold text-gray-200 text-sm mb-1 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Stress & Drift</span>
            </h4>
            <p className="text-xs text-gray-400">
              Emerging market shocks (currency devaluation, inflation) and Population Stability Index (PSI) drift monitoring.
            </p>
          </div>
        </div>
      </div>

      {/* Project Milestones */}
      <div className="glass-panel rounded-2xl p-6 border border-gray-800">
        <h3 className="text-base font-bold text-white flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-cyan-400" />
          <span>Project Phases & Milestones</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-900/90 border border-emerald-800/80">
            <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">
              ✓
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">
                  Phase 1: Baseline Architecture & Traditional Credit Scorecard
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                  Completed
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Data pipeline, feature engineering (Delinquency Index, Utilization), and interactive dark UI dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-900/90 border border-emerald-800/80">
            <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">
              ✓
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">
                  Phase 2: Multi-Model Ensemble, Hyperparameter Tuning & Dual XAI (SHAP + LIME)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                  Completed
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Integrated Random Forest & LightGBM, tuned XGBoost hyperparameters to raise Recall from 47.7% to 56.9%+, and added LIME local perturbation explainer.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-900/90 border border-emerald-800/80">
            <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">
              ✓
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">
                  Phase 3: Emerging Market Volatility Stress Testing
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                  Completed
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Simulates currency devaluation (+20% FX shock), fuel and agricultural price spikes (+35%), and combined macroeconomic shocks on individual default probabilities.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-900/90 border border-emerald-800/80">
            <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">
              ✓
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">
                  Phase 4: MLOps Observability & Counterfactual Remediation
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                  Completed
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Population Stability Index (PSI) drift monitoring for production model reliability and actionable counterfactual coaching for declined borrowers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
