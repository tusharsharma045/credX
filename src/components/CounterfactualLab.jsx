import React from 'react';
import { Sliders, RefreshCw } from 'lucide-react';

export default function CounterfactualLab({
  borrower,
  sliderValues,
  onSliderChange,
  adjustedRisk,
  onReset
}) {
  return (
    <div className="dark-card p-5">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Interactive What-If Simulation</span>
        </h3>

        <button
          onClick={onReset}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded border border-gray-700"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Sliders</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 text-xs">
          <div className="dark-card-inner p-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Monthly Inflow / Revenue</span>
              <span className="font-bold text-cyan-400">${sliderValues.monthlyMobileInflow.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={30000}
              step={500}
              value={sliderValues.monthlyMobileInflow}
              onChange={(e) => onSliderChange('monthlyMobileInflow', Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="dark-card-inner p-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Supplier On-Time Payment Rate</span>
              <span className="font-bold text-emerald-400">{sliderValues.supplierPunctuality}%</span>
            </div>
            <input
              type="range"
              min={70}
              max={100}
              step={0.5}
              value={sliderValues.supplierPunctuality}
              onChange={(e) => onSliderChange('supplierPunctuality', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="dark-card-inner p-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-300">Macro Inflation Shock Exposure</span>
              <span className="font-bold text-rose-400">{sliderValues.macroInflationShock} pts</span>
            </div>
            <input
              type="range"
              min={2}
              max={40}
              step={1}
              value={sliderValues.macroInflationShock}
              onChange={(e) => onSliderChange('macroInflationShock', Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="dark-card-inner p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs text-gray-400 block mb-2 font-semibold">Simulated Outcome</span>

            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div className="bg-[#0A0E17] p-3 rounded border border-gray-800">
                <span className="text-gray-400 block">Adjusted Score</span>
                <span className="text-xl font-bold text-cyan-300">{adjustedRisk.adjustedCredxScore}</span>
              </div>
              <div className="bg-[#0A0E17] p-3 rounded border border-gray-800">
                <span className="text-gray-400 block">Adjusted PD</span>
                <span className="text-xl font-bold text-emerald-400">{adjustedRisk.adjustedDefaultProb}%</span>
              </div>
            </div>

            <div className="bg-[#0A0E17] p-3 rounded border border-gray-800 text-xs flex justify-between items-center">
              <span className="text-gray-400">Simulated Action:</span>
              <span className="font-bold text-emerald-400 uppercase">{adjustedRisk.action}</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 italic mt-3">
            Adjusting parameters updates risk probability and score in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
