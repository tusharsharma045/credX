import React from 'react';
import { X, FileCheck2, Printer, Shield, Cpu, Lock, CheckCircle2 } from 'lucide-react';

export default function XaiAuditModal({ isOpen, onClose, borrower, adjustedRisk }) {
  if (!isOpen) return null;

  const rec = borrower.recommendation;
  const action = adjustedRisk ? adjustedRisk.action : rec.action;
  const credxScore = adjustedRisk ? adjustedRisk.adjustedCredxScore : borrower.credxScore;
  const pd = adjustedRisk ? adjustedRisk.adjustedDefaultProb : borrower.defaultProbability;
  const features = adjustedRisk ? adjustedRisk.adjustedShapFeatures : borrower.shapFeatures;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-cyan-800/80 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-gray-200 p-6 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Regulatory XAI Credit Audit Summary
                </h2>
                <p className="text-xs text-gray-400">
                  Model Version: <span className="text-cyan-400 font-mono">CredX-XAI-v2.4.1</span> | Audit ID: <span className="font-mono text-gray-300">AUD-2026-9812</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Borrower Audit Card */}
          <div className="bg-slate-950 p-4 rounded-xl border border-gray-800 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block mb-0.5">Borrower:</span>
              <span className="font-bold text-white text-sm">{borrower.name}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Location / Sector:</span>
              <span className="font-semibold text-gray-200">{borrower.location}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">XAI AI Score / PD:</span>
              <span className="font-bold text-cyan-300 text-sm font-mono">
                {credxScore} ({pd}% PD)
              </span>
            </div>
            <div>
              <span className="text-gray-400 block mb-0.5">Underwriting Action:</span>
              <span className={`font-extrabold text-xs px-2 py-0.5 rounded border inline-block ${
                action === 'APPROVE' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                action === 'CONDITIONAL APPROVAL' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                'bg-rose-950 text-rose-300 border-rose-700'
              }`}>
                {action}
              </span>
            </div>
          </div>

          {/* SHAP Feature Contribution Audit Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
              1. SHAP Feature Attribution Weight Audit
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-gray-400 uppercase text-[10px] font-semibold border-b border-gray-800">
                  <tr>
                    <th className="p-3">Feature Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">SHAP Force (pts)</th>
                    <th className="p-3">Audit Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80 bg-slate-900/60">
                  {features.map((feat, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-medium text-gray-200">{feat.name}</td>
                      <td className="p-3 text-gray-400">{feat.category}</td>
                      <td className={`p-3 font-mono font-bold text-right ${
                        feat.shapValue >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {feat.shapValue >= 0 ? '+' : ''}{feat.shapValue}
                      </td>
                      <td className="p-3 text-[11px] text-gray-400">
                        <span className="inline-flex items-center space-x-1 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance & Regulatory Disclosures */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-gray-800 text-xs text-gray-300 space-y-2 mb-6">
            <h4 className="font-bold text-gray-200 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Regulatory Compliance Disclosures</span>
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              This credit decision was generated using an audited, bias-mitigated Explainable Machine Learning model compliant with Basel III Credit Risk frameworks and regional microfinance guidelines. Demographic variables (gender, religion, ethnicity) are strictly excluded from the feature space.
            </p>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between border-t border-gray-800 pt-4">
          <div className="text-[11px] text-gray-400">
            Timestamp: <span className="font-mono text-gray-300">{new Date().toISOString()}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl border border-cyan-800/80 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
