import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BorrowerSelector from './components/BorrowerSelector';
import DualScoringGauge from './components/DualScoringGauge';
import XaiWaterfallChart from './components/XaiWaterfallChart';
import CounterfactualLab from './components/CounterfactualLab';
import UnderwritingDecision from './components/UnderwritingDecision';
import PortfolioAnalytics from './components/PortfolioAnalytics';
import ProjectRoadmap from './components/ProjectRoadmap';
import XaiAuditModal from './components/XaiAuditModal';
import BorrowerModal from './components/BorrowerModal';
import CounterfactualAdvice from './components/CounterfactualAdvice';
import ModelComparison from './components/ModelComparison';
import VolatilityStressTest from './components/VolatilityStressTest';

import { MOCK_BORROWERS } from './data/mockBorrowers';
import { calculateCounterfactualRisk } from './utils/xaiEngine';
import { fetchHealth, fetchSampleBorrowers, predictBorrowerRisk } from './services/api';
import { Cpu } from 'lucide-react';

export default function App() {
  const [borrowers, setBorrowers] = useState(MOCK_BORROWERS);
  const [selectedBorrower, setSelectedBorrower] = useState(MOCK_BORROWERS[0]);
  const [activeTab, setActiveTab] = useState('assessor');

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  /**
   * WHAT: Tracks whether the backend API is reachable.
   * WHY:  The UI must visibly signal to the user (and underwriters) whether predictions shown are
   *       powered by live ML inference or static mock data. This is a transparency requirement —
   *       a lending decision made on stale/demo data could have serious financial and regulatory
   *       consequences. The apiStatus drives both the Navbar indicator and fallback logic throughout.
   * HOW:  Initialises to 'loading', resolves to 'online' if fetchHealth() succeeds, 'offline' if not.
   */
  const [apiStatus, setApiStatus] = useState('loading');

  const [sliderValues, setSliderValues] = useState(selectedBorrower.counterfactuals);
  const [adjustedRisk, setAdjustedRisk] = useState(null);

  /**
   * WHAT: Bootstraps the application by checking backend health and loading real borrower data.
   * WHY:  We use useEffect (with an empty dependency array []) so this runs exactly once after the
   *       initial render — the correct React pattern for side-effects like API calls on mount.
   *       Running it here (in App, the root) means the result (apiStatus + borrowers list) is
   *       available to all child components via props, avoiding prop-drilling or context boilerplate.
   * HOW:  Step 1 — Call fetchHealth(). If null (network error / backend down), mark apiStatus
   *                 'offline' and keep MOCK_BORROWERS. No further calls needed.
   *       Step 2 — If backend is online, call fetchSampleBorrowers(). On success, prepend the
   *                 API borrowers to MOCK_BORROWERS so the UI always has at least the mock fallback
   *                 data even if the API returns a partial dataset.
   *       Step 3 — Mark apiStatus 'online' so the Navbar shows the green indicator and components
   *                 know they can trust live API results.
   *       All failures are caught inside the individual service functions (api.js), which return
   *       null — so this effect never crashes the app; it always resolves gracefully.
   */
  useEffect(() => {
    async function initApiData() {
      const health = await fetchHealth();

      if (!health) {
        // Backend is offline — stay on mock data, show offline indicator
        setApiStatus('offline');
        return;
      }

      // Backend is reachable — try to fetch real sample borrowers
      const apiBorrowers = await fetchSampleBorrowers();
      if (apiBorrowers && Array.isArray(apiBorrowers) && apiBorrowers.length > 0) {
        // Merge: API borrowers first (newest / most realistic), then mock fallbacks
        setBorrowers([...apiBorrowers, ...MOCK_BORROWERS]);
      }

      setApiStatus('online');
    }

    initApiData();
  }, []);

  const handleSelectBorrower = (borrower) => {
    setSelectedBorrower(borrower);
    setSliderValues(borrower.counterfactuals);
    setAdjustedRisk(null);
  };

  const handleSliderChange = (key, val) => {
    const updatedSliders = { ...sliderValues, [key]: val };
    setSliderValues(updatedSliders);

    const calculated = calculateCounterfactualRisk(selectedBorrower, updatedSliders);
    setAdjustedRisk(calculated);
  };

  const handleResetSliders = () => {
    setSliderValues(selectedBorrower.counterfactuals);
    setAdjustedRisk(null);
  };

  /**
   * WHAT: Adds a custom borrower to state, augmented with live SHAP/risk data from the API when available.
   * WHY:  The BorrowerModal computes synthetic scores client-side (a good offline fallback), but when
   *       the backend IS online we should fetch real model predictions so the custom borrower's SHAP
   *       waterfall and default probability reflect actual ML output rather than heuristic formulas.
   *       This keeps the demo accurate and trustworthy when presented to stakeholders.
   * HOW:  If apiStatus is 'online', call predictBorrowerRisk() with the new borrower's data.
   *       The API returns { credxScore, defaultProbability, shapFeatures, recommendation } which we
   *       merge (spread) onto the locally-constructed borrower object — API values win on collision.
   *       If the API call fails or is offline, the locally-constructed borrower is used as-is.
   *
   * @param {Object} newBorrower - Borrower object constructed by BorrowerModal
   */
  const handleAddBorrower = async (newBorrower) => {
    let enrichedBorrower = newBorrower;

    if (apiStatus === 'online') {
      const apiResult = await predictBorrowerRisk(newBorrower);
      if (apiResult) {
        // Merge API predictions on top of the locally-constructed borrower
        enrichedBorrower = { ...newBorrower, ...apiResult };
      }
    }

    setBorrowers([enrichedBorrower, ...borrowers]);
    handleSelectBorrower(enrichedBorrower);
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-gray-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddBorrower={() => setIsAddModalOpen(true)}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        apiStatus={apiStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-slate-900/90 border border-gray-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 uppercase text-[10px]">
              Work in Progress
            </span>
            <span className="text-gray-300">
              <strong>CredX Project Prototype:</strong> Active development phase of XAI Credit Risk Assessment system.
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setActiveTab('assessor')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                activeTab === 'assessor'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                  : 'bg-slate-800 text-gray-400 border-gray-700 hover:text-white'
              }`}
            >
              Risk Assessor Demo
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                activeTab === 'roadmap'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                  : 'bg-slate-800 text-gray-400 border-gray-700 hover:text-white'
              }`}
            >
              Project Overview & Roadmap
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                activeTab === 'models'
                  ? 'bg-pink-950 text-pink-300 border-pink-700'
                  : 'bg-slate-800 text-gray-400 border-gray-700 hover:text-white'
              }`}
            >
              Phase 2 — Models
            </button>
          </div>
        </div>

        {activeTab === 'models' && (
          <div className="animate-fadeIn">
            <ModelComparison />
          </div>
        )}

        {activeTab === 'assessor' && (
          <div className="space-y-8 animate-fadeIn">
            <BorrowerSelector
              borrowers={borrowers}
              selectedBorrower={selectedBorrower}
              onSelectBorrower={handleSelectBorrower}
              onReset={adjustedRisk ? handleResetSliders : null}
            />

            <DualScoringGauge
              borrower={selectedBorrower}
              adjustedRisk={adjustedRisk}
            />

            <XaiWaterfallChart
              borrower={selectedBorrower}
              adjustedShapFeatures={adjustedRisk ? adjustedRisk.adjustedShapFeatures : null}
            />

            <CounterfactualLab
              borrower={selectedBorrower}
              sliderValues={sliderValues}
              onSliderChange={handleSliderChange}
              adjustedRisk={adjustedRisk || {
                adjustedCredxScore: selectedBorrower.credxScore,
                adjustedDefaultProb: selectedBorrower.defaultProbability,
                action: selectedBorrower.recommendation.action,
                adjustedInterestRate: selectedBorrower.recommendation.interestRatePct
              }}
              onReset={handleResetSliders}
            />

            <UnderwritingDecision
              borrower={selectedBorrower}
              adjustedRisk={adjustedRisk}
              onOpenAudit={() => setIsAuditModalOpen(true)}
            />

            {/*
             * TASK 7: CounterfactualAdvice — rendered immediately below the underwriting decision.
             * Only shown when the borrower action is not a clean APPROVE, because declined or
             * conditionally-approved borrowers are the ones who need actionable coaching feedback.
             */}
            <CounterfactualAdvice
              borrower={selectedBorrower}
              isVisible={
                (adjustedRisk ? adjustedRisk.action : selectedBorrower.recommendation.action) !== 'APPROVE'
              }
            />

            <VolatilityStressTest borrower={selectedBorrower} />
          </div>
        )}

        {activeTab === 'roadmap' && (
          <ProjectRoadmap onSwitchToAssessor={() => setActiveTab('assessor')} />
        )}

        {activeTab === 'portfolio' && (
          <div className="animate-fadeIn">
            <PortfolioAnalytics />
          </div>
        )}
      </main>

      <footer className="bg-slate-950 border-t border-gray-800 py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-gray-400">
              CredX Project — Phase 2 in Progress
            </span>
          </div>
          <p>
            Explainable AI Credit Risk Assessment System for Emerging Market Borrowers.
          </p>
        </div>
      </footer>

      <XaiAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        borrower={selectedBorrower}
        adjustedRisk={adjustedRisk}
      />

      <BorrowerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBorrower={handleAddBorrower}
      />
    </div>
  );
}
