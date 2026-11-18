import React from 'react';
import { Cpu, ShieldAlert, TrendingUp } from 'lucide-react';

export default function DualScoringGauge({ borrower, adjustedRisk }) {
  const credxScore = adjustedRisk ? adjustedRisk.adjustedCredxScore : borrower.credxScore;
  const defaultProb = adjustedRisk ? adjustedRisk.adjustedDefaultProb : borrower.defaultProbability;

  const isLow = defaultProb <= 10.0;
  const isMed = defaultProb > 10.0 && defaultProb <= 20.0;

  const riskLabel = isLow ? 'Low Risk' : isMed ? 'Moderate Risk' : 'High Risk';
  const badgeColor = isLow ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800' : isMed ? 'text-amber-400 bg-amber-950/80 border-amber-800' : 'text-rose-400 bg-rose-950/80 border-rose-800';

  return (
    <div className="dark-card p-5">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Credit Score Comparison</span>
        </h2>

        <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${badgeColor}`}>
          {riskLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dark-card-inner p-4">
          <span className="text-xs text-gray-400 block mb-1">Traditional Score</span>
          <div className="text-2xl font-bold text-gray-200">
            {borrower.traditionalScore} <span className="text-xs text-gray-500 font-normal">/ 850</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Rule-based credit scorecard baseline</p>
        </div>

        <div className="dark-card-inner p-4 border-cyan-800/60 bg-cyan-950/20">
          <span className="text-xs text-cyan-300 block mb-1">CredX ML Score</span>
          <div className="text-3xl font-extrabold text-cyan-400">
            {credxScore} <span className="text-xs text-cyan-500 font-normal">/ 1000</span>
          </div>
          <p className="text-[11px] text-cyan-200/70 mt-1">ML model default prediction score</p>
        </div>

        <div className="dark-card-inner p-4">
          <span className="text-xs text-gray-400 block mb-1">Predicted Default Risk (PD)</span>
          <div className={`text-2xl font-bold ${isLow ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-rose-400'}`}>
            {defaultProb}%
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full ${isLow ? 'bg-emerald-500' : isMed ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, Math.max(5, defaultProb * 2.5))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
