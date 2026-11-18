import React from 'react';
import { ShieldCheck, BarChart3, Info, Plus } from 'lucide-react';

/**
 * WHAT: Top navigation bar for CredX, now with a live API status indicator.
 * WHY:  Underwriters and demo stakeholders must always know whether the risk scores and SHAP
 *       values they are viewing come from live ML inference (backend online) or from pre-baked
 *       mock data (backend offline / demo mode). Showing a real-time indicator next to the logo
 *       creates transparency at a glance — a key principle in explainable AI systems and a
 *       regulatory best-practice for any tool used in credit decisioning.
 * HOW:  Accepts an `apiStatus` prop ('loading' | 'online' | 'offline') from App.jsx.
 *       Renders a small coloured dot (CSS inline via Tailwind) + short label next to the logo:
 *         • 'online'  → green dot + "API Live"
 *         • 'offline' → red dot   + "Demo Mode"
 *         • 'loading' → amber dot + "Connecting..."
 *       The rest of the Navbar (logo, nav tabs, Add Sample button) is unchanged.
 *
 * @param {string}   activeTab         - Currently active tab identifier
 * @param {Function} setActiveTab      - Setter to change the active tab
 * @param {Function} onOpenAddBorrower - Opens the Add Borrower modal
 * @param {Function} onOpenAudit       - Opens the XAI Audit modal (unused here, kept for compat)
 * @param {'loading'|'online'|'offline'} apiStatus - Live backend connectivity status
 */
export default function Navbar({ activeTab, setActiveTab, onOpenAddBorrower, apiStatus = 'loading' }) {
  /**
   * WHAT: Derives the display config for the API status pill from the apiStatus prop value.
   * WHY:  Centralising the mapping here keeps the JSX clean and ensures consistent colour usage
   *       across all three states without repeating ternary chains in the template.
   * HOW:  Simple object lookup keyed by apiStatus string; falls back to 'loading' config.
   */
  const statusConfig = {
    online:  { dotColor: 'bg-emerald-400', label: 'API Live',       textColor: 'text-emerald-400' },
    offline: { dotColor: 'bg-rose-500',    label: 'Demo Mode',      textColor: 'text-rose-400'    },
    loading: { dotColor: 'bg-amber-400',   label: 'Connecting...',  textColor: 'text-amber-400'   },
  }[apiStatus] ?? { dotColor: 'bg-amber-400', label: 'Connecting...', textColor: 'text-amber-400' };

  return (
    <header className="bg-[#0B0F19] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('assessor')}>
          <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center font-bold text-white text-sm">
            CX
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white">CredX</span>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">
                WIP Demo
              </span>

              {/* API Status Indicator — shows live vs demo-mode badge next to logo */}
              <span className="flex items-center space-x-1.5 text-[10px] font-semibold">
                <span className={`inline-block w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`} />
                <span className={statusConfig.textColor}>{statusConfig.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Explainable AI Credit Risk System</p>
          </div>
        </div>

        <nav className="flex items-center space-x-2 bg-[#111827] p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveTab('assessor')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'assessor' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Risk Assessor</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'roadmap' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'portfolio' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Metrics</span>
          </button>
        </nav>

        <button
          onClick={onOpenAddBorrower}
          className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Sample</span>
        </button>
      </div>
    </header>
  );
}
