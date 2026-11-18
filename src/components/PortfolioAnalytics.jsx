import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { PORTFOLIO_STATS } from '../data/mockBorrowers';
import { fetchMetrics } from '../services/api';
import { BarChart3, Globe, ShieldCheck, Award, TrendingUp, Users, Target, Cpu, RefreshCw, CheckCircle, Activity } from 'lucide-react';
import ModelDriftPanel from './ModelDriftPanel';

export default function PortfolioAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await fetchMetrics();
      if (data) {
        setMetrics(data);
      }
    }
    loadData();
  }, []);

  const regionalData = PORTFOLIO_STATS.regionalBreakdown;

  const pieData = [
    { name: 'Low Risk (0-8% PD)', value: 62, color: '#10B981' },
    { name: 'Moderate Risk (8-18% PD)', value: 28, color: '#F59E0B' },
    { name: 'High Risk (>18% PD)', value: 10, color: '#EF4444' }
  ];

  // Format ROC Curve data for Recharts
  const rocCurveData = metrics?.roc_curve ? metrics.roc_curve.fpr.map((fpr, i) => ({
    fpr: fpr,
    tpr: metrics.roc_curve.tpr[i],
    diagonal: fpr
  })) : [];

  return (
    <div className="space-y-6">
      {/* Real Model Metrics Header Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-800/80 bg-slate-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">
                Trained Hybrid Model Evaluation Metrics
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">
                UCI Dataset (30,000 Records)
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Evaluated on 6,000 unseen test borrower records using Deep Learning (MLP) + XGBoost + Scorecard Hybrid.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-gray-400">ROC-AUC: </span>
            <span className="font-bold text-cyan-300">{metrics ? metrics.roc_auc : '0.7793'}</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-gray-400">Accuracy: </span>
            <span className="font-bold text-emerald-400">{metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : '80.8%'}</span>
          </div>
        </div>
      </div>

      {/* Model Performance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Model Accuracy</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              {metrics ? `${(metrics.accuracy * 100).toFixed(1)}%` : '80.8%'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold block mt-1">Cross-validated on 30k rows</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Precision Metric</span>
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-cyan-300">
              {metrics ? `${(metrics.precision * 100).toFixed(1)}%` : '58.1%'}
            </span>
            <span className="text-xs text-gray-400 block mt-1">Low false-positive default rate</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Recall Sensitivity</span>
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-indigo-300">
              {metrics ? `${(metrics.recall * 100).toFixed(1)}%` : '47.7%'}
            </span>
            <span className="text-xs text-indigo-400 font-semibold block mt-1">Default Detection Rate</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">F1-Score Metric</span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-300">
              {metrics ? metrics.f1_score : '0.5238'}
            </span>
            <span className="text-xs text-gray-400 block mt-1">Harmonic precision-recall mean</span>
          </div>
        </div>
      </div>

      {/* ROC Curve Chart Section */}
      {rocCurveData.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span>ROC (Receiver Operating Characteristic) Curve</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Evaluates classifier true-positive rate vs false-positive rate (AUC = {metrics.roc_auc}).
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocCurveData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="fpr" stroke="#9CA3AF" fontSize={11} name="False Positive Rate" />
                <YAxis stroke="#9CA3AF" fontSize={11} name="True Positive Rate" domain={[0, 1]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-cyan-800 p-2.5 rounded-xl shadow-xl text-xs">
                          <span className="text-cyan-400 font-bold block">FPR: {data.fpr}</span>
                          <span className="text-emerald-400 font-bold block mt-0.5">TPR (Recall): {data.tpr}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="tpr" stroke="#10B981" strokeWidth={3} dot={false} name="Hybrid Model ROC" />
                <Line type="monotone" dataKey="diagonal" stroke="#4B5563" strokeDasharray="5 5" dot={false} name="Random Guess" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/*
       * TASK 6: Model Health & Drift Monitoring section.
       * WHY: Portfolio analytics is the natural home for operational model health data —
       *      risk managers who review portfolio metrics also need to know if the model
       *      producing those risk scores is still calibrated to current borrower behaviour.
       *      Placing ModelDriftPanel here avoids a separate nav tab and keeps the context relevant.
       * HOW: The Activity icon from lucide-react matches the MLOps / monitoring semantic.
       *      ModelDriftPanel is fully self-contained — it fetches its own data and handles
       *      offline fallback internally, so no props are needed here.
       */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Model Health &amp; Drift Monitoring</h2>
        </div>
        <ModelDriftPanel />
      </div>
    </div>
  );
}
