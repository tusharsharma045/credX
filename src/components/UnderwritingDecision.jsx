import React from 'react';
import { ShieldCheck, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export default function UnderwritingDecision({ borrower, adjustedRisk, onOpenAudit }) {
  const rec = borrower.recommendation;
  const action = adjustedRisk ? adjustedRisk.action : rec.action;
  const interestRate = adjustedRisk ? adjustedRisk.adjustedInterestRate : rec.interestRatePct;

  return (
    <div className="dark-card p-5">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Underwriting Recommendation</span>
        </h3>

        <button
          onClick={onOpenAudit}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>View Audit Log</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="dark-card-inner p-4 flex flex-col justify-between">
          <div>
            <span className="text-gray-400 block mb-1">Decision Recommendation</span>
            <div className="text-xl font-bold text-emerald-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{action}</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Model evaluation status for selected borrower profile.
          </p>
        </div>

        <div className="dark-card-inner p-4 space-y-2">
          <span className="text-gray-400 block font-semibold">Recommended Loan Terms</span>
          <div className="flex justify-between">
            <span className="text-gray-400">Max Credit Limit:</span>
            <span className="font-bold text-emerald-400">${rec.maxCreditLimit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Recommended APR:</span>
            <span className="font-bold text-cyan-300">{interestRate}%</span>
          </div>
        </div>

        <div className="dark-card-inner p-4 space-y-2">
          <span className="text-gray-400 block font-semibold">Required Covenants</span>
          <ul className="space-y-1 text-gray-300">
            {rec.covenants.map((cov, idx) => (
              <li key={idx} className="flex items-center space-x-1">
                <span className="text-cyan-400">•</span>
                <span>{cov}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
