import React from 'react';
import { User, RefreshCw } from 'lucide-react';

export default function BorrowerSelector({ borrowers, selectedBorrower, onSelectBorrower, onReset }) {
  return (
    <div className="dark-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center space-x-3">
        <User className="w-5 h-5 text-cyan-400" />
        <span className="text-xs font-medium text-gray-400">Select Borrower Profile:</span>

        <select
          value={selectedBorrower.id}
          onChange={(e) => {
            const found = borrowers.find(b => b.id === e.target.value);
            if (found) onSelectBorrower(found);
          }}
          className="bg-[#0F172A] text-white text-xs rounded-lg px-3 py-1.5 border border-gray-700 cursor-pointer focus:outline-none"
        >
          {borrowers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} — {b.riskTier}
            </option>
          ))}
        </select>

        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-cyan-400 rounded-lg border border-gray-700"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-3 text-xs text-gray-300">
        <span className="bg-[#0F172A] px-2.5 py-1 rounded border border-gray-800">
          Amount: <strong className="text-emerald-400">${selectedBorrower.requestedAmount.toLocaleString()}</strong>
        </span>
        <span className="bg-[#0F172A] px-2.5 py-1 rounded border border-gray-800">
          Tenor: {selectedBorrower.tenorMonths} Mos
        </span>
      </div>
    </div>
  );
}
