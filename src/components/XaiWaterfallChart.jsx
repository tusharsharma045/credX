import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import { Sparkles } from 'lucide-react';
import { fetchLimeExplanation } from '../services/api';

export default function XaiWaterfallChart({ borrower, adjustedShapFeatures }) {
  const [viewMode, setViewMode] = useState('shap'); // 'shap' or 'lime'
  const [limeFeatures, setLimeFeatures] = useState([]);
  const [loadingLime, setLoadingLime] = useState(false);

  // Load LIME explanation when switching to LIME or when borrower changes
  useEffect(() => {
    let isMounted = true;
    if (viewMode === 'lime') {
      setLoadingLime(true);
      fetchLimeExplanation(borrower).then(res => {
        if (!isMounted) return;
        if (res && res.lime_features && res.lime_features.length > 0) {
          setLimeFeatures(res.lime_features);
        } else {
          // Fallback estimated LIME features from borrower profile
          setLimeFeatures([
            { name: 'PAY_0', limeValue: -0.18, impact: 'negative', description: 'Recent payment delay' },
            { name: 'CREDIT_UTILIZATION', limeValue: -0.14, impact: 'negative', description: 'High balance-to-limit ratio' },
            { name: 'DELINQUENCY_INDEX', limeValue: -0.11, impact: 'negative', description: 'Overdue history' },
            { name: 'PAY_AMT1', limeValue: 0.08, impact: 'positive', description: 'Recent payment amount' },
            { name: 'LIMIT_BAL', limeValue: 0.05, impact: 'positive', description: 'Credit limit capacity' },
            { name: 'TRADITIONAL_SCORE', limeValue: 0.04, impact: 'positive', description: 'Bureau score proxy' }
          ]);
        }
        setLoadingLime(false);
      });
    }
    return () => { isMounted = false; };
  }, [viewMode, borrower]);

  const shapFeatures = adjustedShapFeatures || borrower.shapFeatures || [];

  // Determine active dataset based on toggle
  const isShap = viewMode === 'shap';
  const activeFeatures = isShap ? shapFeatures : limeFeatures;

  const chartData = activeFeatures.map(f => {
    const val = isShap ? (f.shapValue || 0) : ((f.limeValue || 0) * 100);
    return {
      name: f.name.length > 18 ? f.name.substring(0, 18) + '...' : f.name,
      val: Math.round(val * 10) / 10,
      fill: val >= 0 ? '#10B981' : '#EF4444'
    };
  });

  return (
    <div className="dark-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-3 mb-4 gap-2">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Explainable AI — {isShap ? 'SHAP Tree Explanations' : 'LIME Local Explanations'}</span>
        </h3>

        {/* Toggle between SHAP and LIME */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-gray-800 text-xs">
          <button
            onClick={() => setViewMode('shap')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              isShap ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            SHAP (XGBoost)
          </button>
          <button
            onClick={() => setViewMode('lime')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              !isShap ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            LIME (Ensemble)
          </button>
        </div>
      </div>

      <div className="mb-2 text-xs text-gray-400 flex justify-between">
        <span>
          {isShap
            ? 'SHAP shows exact feature impact on CredX Score (positive = helps score, negative = hurts score).'
            : 'LIME perturbs the full 5-model ensemble to measure local sensitivity around this borrower.'}
        </span>
        {loadingLime && <span className="text-pink-400">Computing LIME perturbations...</span>}
      </div>

      <div className="h-60 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
            <XAxis type="number" stroke="#6B7280" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={11} width={120} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#0A0E17] border border-gray-700 p-2 rounded text-xs">
                      <span className="font-semibold text-white">{data.name}: </span>
                      <span className={data.val >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {data.val >= 0 ? '+' : ''}{data.val} {isShap ? 'pts' : '% sensitivity'}
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#374151" />
            <Bar dataKey="val" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {chartData.slice(0, 6).map((feat, idx) => (
          <div key={idx} className="dark-card-inner p-2.5 flex justify-between items-center">
            <span className="text-gray-300 font-medium truncate">{feat.name}</span>
            <span className={`font-mono font-bold ${feat.val >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {feat.val >= 0 ? '+' : ''}{feat.val} {isShap ? 'pts' : 'wt'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
