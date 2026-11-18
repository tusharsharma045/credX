import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Zap, AlertTriangle, ShieldCheck, Activity, ArrowUpRight } from 'lucide-react';

export default function VolatilityStressTest({ borrower }) {
  const [selectedShock, setSelectedShock] = useState('baseline');

  const stress = borrower.stressTest;

  // Chart data across scenarios
  const chartData = [
    { scenario: 'Baseline (Current)', pd: stress.baseline, threshold: 15.0 },
    { scenario: '20% FX Devaluation', pd: stress.fxDevaluation20pct, threshold: 15.0 },
    { scenario: '35% Fuel / Agri Spike', pd: stress.fuelPriceSpike35pct, threshold: 15.0 },
    { scenario: 'Combined Macro Shock', pd: stress.combinedShock, threshold: 15.0 }
  ];

  const currentPd = selectedShock === 'baseline' ? stress.baseline :
    selectedShock === 'fx' ? stress.fxDevaluation20pct :
    selectedShock === 'fuel' ? stress.fuelPriceSpike35pct : stress.combinedShock;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Emerging Market Volatility Stress Tester</span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Test how macroeconomic volatility (currency shocks, inflation, commodity price spikes) degrades borrower default risk.
          </p>
        </div>

        {/* Shock Selection Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedShock('baseline')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedShock === 'baseline'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'bg-slate-900 text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            Baseline ({stress.baseline}%)
          </button>
          <button
            onClick={() => setSelectedShock('fx')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedShock === 'fx'
                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                : 'bg-slate-900 text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            FX Shock (+20%)
          </button>
          <button
            onClick={() => setSelectedShock('fuel')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedShock === 'fuel'
                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                : 'bg-slate-900 text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            Fuel Spike (+35%)
          </button>
          <button
            onClick={() => setSelectedShock('combined')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedShock === 'combined'
                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                : 'bg-slate-900 text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            Combined Shock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-slate-900/80 p-4 rounded-xl border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold text-gray-300">
              Predicted Default Probability (PD) Across Shock Scenarios
            </span>
            <span className="text-[11px] text-rose-400 font-medium">
              Red Line = Regulatory Impairment Limit (15.0%)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="scenario" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} unit="%" domain={[0, 35]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-amber-800 p-2.5 rounded-xl shadow-xl text-xs">
                          <span className="font-bold text-white block">{data.scenario}</span>
                          <span className="text-amber-400 font-extrabold text-sm block mt-1">
                            Default Risk: {data.pd}%
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="pd" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorPd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stress Analysis Summary */}
        <div className="bg-slate-900/90 p-5 rounded-xl border border-gray-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">
              Stress Resilience Analysis
            </span>

            <div className="mb-4">
              <span className="text-xs text-gray-400">Current Shock Default Risk:</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className={`text-3xl font-black ${currentPd > 15.0 ? 'text-rose-400' : 'text-amber-400'}`}>
                  {currentPd}%
                </span>
                <span className="text-xs text-gray-500">
                  (+{(currentPd - stress.baseline).toFixed(1)}% vs base)
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-300">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-gray-800 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>FX Devaluation Buffer:</strong> Borrower maintains local cash reserves capable of absorbing up to 18% currency depreciation.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-gray-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Vulnerability Trigger:</strong> Under a combined shock, PD rises to <strong>{stress.combinedShock}%</strong>, triggering mandatory debt restructuring covenants.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800/80 mt-4 text-[11px] text-cyan-400 flex items-center justify-between">
            <span>Macro Stress Risk Rating:</span>
            <span className="font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
              {currentPd <= 10 ? 'Resilient' : currentPd <= 18 ? 'Moderate Stress' : 'High Sensitivity'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
