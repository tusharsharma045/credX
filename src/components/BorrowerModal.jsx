import React, { useState } from 'react';
import { X, Plus, Building2, MapPin, DollarSign, Award } from 'lucide-react';

export default function BorrowerModal({ isOpen, onClose, onAddBorrower }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    location: 'Nairobi, Kenya',
    sector: 'Agri-Distributor & Retail',
    requestedAmount: 15000,
    tenorMonths: 12,
    traditionalScore: 610,
    mobileMoneyInflow: 4500,
    supplierPunctuality: 96.0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.owner) return;

    // Calculate dynamic synthetic SHAP & score
    const credxScore = Math.min(950, Math.round(formData.traditionalScore + (formData.mobileMoneyInflow / 100) + (formData.supplierPunctuality * 1.5)));
    const defaultProbability = Number(Math.max(1.5, Math.min(30.0, 25.0 - (credxScore / 40))).toFixed(1));

    const newBorrower = {
      id: `bor-custom-${Date.now()}`,
      name: formData.name,
      owner: formData.owner,
      location: formData.location,
      region: 'Emerging Market',
      sector: formData.sector,
      requestedAmount: Number(formData.requestedAmount),
      tenorMonths: Number(formData.tenorMonths),
      purpose: 'Working capital & equipment inventory expansion',
      traditionalScore: Number(formData.traditionalScore),
      credxScore,
      defaultProbability,
      riskTier: defaultProbability <= 8.5 ? 'Low Risk' : defaultProbability <= 18.0 ? 'Moderate Risk' : 'High Risk',
      dtiRatio: 35.0,
      creditBureauHistoryYears: 2.0,
      collateralValueUSD: 3000,
      existingDebtUSD: 2000,
      mobileMoneyMonthlyInflowUSD: Number(formData.mobileMoneyInflow),
      mpesaTillActiveMonths: 18,
      supplierPaymentOnTimePct: Number(formData.supplierPunctuality),
      posTransactionVelocityPerDay: 45,
      appCustomerRating: 4.8,

      shapFeatures: [
        { name: 'Mobile Money Deposit Velocity', category: 'Alternative Data', shapValue: +16.2, impact: 'positive', description: `Verified $${formData.mobileMoneyInflow} monthly inflow telemetry` },
        { name: 'Supplier Settlement Track Record', category: 'Alternative Data', shapValue: +12.5, impact: 'positive', description: `${formData.supplierPunctuality}% on-time supplier settlement` },
        { name: 'POS Micro-transaction Velocity', category: 'Alternative Data', shapValue: +8.4, impact: 'positive', description: 'Strong daily digital receipts' },
        { name: 'Traditional Bureau History Gap', category: 'Traditional Bureau', shapValue: -8.1, impact: 'negative', description: 'Limited formal commercial credit bureau records' },
        { name: 'Local Currency FX Volatility', category: 'Macro Volatility', shapValue: -10.4, impact: 'negative', description: 'Sensitivity to local FX inflation' }
      ],

      xaiNarrative: `Custom borrower ${formData.name} demonstrates strong digital transaction cashflow ($${formData.mobileMoneyInflow}/mo) and high supplier settlement reliability (${formData.supplierPunctuality}%), driving an XAI CredX score of ${credxScore} despite limited traditional bureau records.`,

      counterfactuals: {
        monthlyMobileInflow: Number(formData.mobileMoneyInflow),
        supplierPunctuality: Number(formData.supplierPunctuality),
        macroInflationShock: 10.4,
        cashReserveMonths: 2.0
      },

      stressTest: {
        baseline: defaultProbability,
        fxDevaluation20pct: Number((defaultProbability * 1.5).toFixed(1)),
        fuelPriceSpike35pct: Number((defaultProbability * 1.8).toFixed(1)),
        combinedShock: Number((defaultProbability * 2.3).toFixed(1))
      },

      recommendation: {
        action: defaultProbability <= 8.5 ? 'APPROVE' : defaultProbability <= 18.0 ? 'CONDITIONAL APPROVAL' : 'DECLINE',
        maxCreditLimit: Number(formData.requestedAmount) * 1.1,
        interestRatePct: Number((11.5 + (defaultProbability * 0.4)).toFixed(1)),
        standardBankRatePct: 21.0,
        recommendedCollateral: 'Digital Till Sweeps & Trade Receivables Lien',
        covenants: ['Maintain min monthly digital inflows', 'Quarterly supplier invoice review']
      }
    };

    onAddBorrower(newBorrower);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-cyan-800/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-gray-200">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Plus className="w-5 h-5 text-cyan-400" />
            <span>Add Custom Emerging Market Borrower</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Business Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Kisumu Retail Hub"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Owner Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Joseph Omondi"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full bg-slate-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Requested Loan ($ USD)</label>
              <input
                type="number"
                required
                value={formData.requestedAmount}
                onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                className="w-full bg-slate-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Traditional Bureau Score</label>
              <input
                type="number"
                required
                min={300}
                max={850}
                value={formData.traditionalScore}
                onChange={(e) => setFormData({ ...formData, traditionalScore: e.target.value })}
                className="w-full bg-slate-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Monthly Mobile Money Inflow ($)</label>
              <input
                type="number"
                required
                value={formData.mobileMoneyInflow}
                onChange={(e) => setFormData({ ...formData, mobileMoneyInflow: e.target.value })}
                className="w-full bg-slate-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Supplier On-time Rate (%)</label>
              <input
                type="number"
                required
                min={50}
                max={100}
                value={formData.supplierPunctuality}
                onChange={(e) => setFormData({ ...formData, supplierPunctuality: e.target.value })}
                className="w-full bg-slate-950 border border-gray-800 rounded-lg p-2.5 text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-gray-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-cyan-900/30"
            >
              Evaluate Borrower in CredX
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
