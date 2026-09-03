import React from 'react';
import { Home, Sparkles, GitCompare, Bookmark, Settings, Layers } from 'lucide-react';
import { SystemStatus } from '../types.ts';

interface HeaderProps {
  activeTab: 'workspace' | 'properties' | 'compare' | 'saved' | 'settings';
  setActiveTab: (tab: 'workspace' | 'properties' | 'compare' | 'saved' | 'settings') => void;
  systemStatus: SystemStatus | null;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  systemStatus,
  savedCount,
}) => {
  return (
    <>
      {/* Top Header Bar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xs sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand & Tagline with Clean Minimalism icon badge */}
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
              onClick={() => setActiveTab('workspace')}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white transition-colors group-hover:bg-slate-800 shrink-0 shadow-xs">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a11 11 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  DreamHome <span className="text-slate-500 font-medium">Agent</span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
                  Autonomous real estate discovery powered by WebMCP
                </p>
              </div>
            </div>

            {/* Desktop / Tablet Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
              <button
                id="nav-tab-workspace"
                onClick={() => setActiveTab('workspace')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'workspace'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Workspace</span>
              </button>

              <button
                id="nav-tab-properties"
                onClick={() => setActiveTab('properties')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'properties'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Properties</span>
              </button>

              <button
                id="nav-tab-compare"
                onClick={() => setActiveTab('compare')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'compare'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>

              <button
                id="nav-tab-saved"
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'saved'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Pipeline</span>
                {savedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-slate-900 text-white rounded-full font-bold">
                    {savedCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-settings"
                onClick={() => setActiveTab('settings')}
                className={`p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer ${
                  activeTab === 'settings' ? 'bg-slate-200 text-slate-900' : ''
                }`}
                title="Providers & API Status"
              >
                <Settings className="w-4 h-4" />
              </button>
            </nav>

            {/* Right Controls: Agent Status & Mobile Settings Action */}
            <div className="flex items-center gap-2">
              {/* Agent Status Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[11px] sm:text-xs font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="hidden xs:inline">AI Agent Online</span>
                <span className="xs:hidden">Live</span>
              </div>

              {/* Mobile Settings Icon Button */}
              <button
                id="mobile-nav-settings"
                onClick={() => setActiveTab('settings')}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Settings & Diagnostics"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Floating / Bottom Navigation Bar (md:hidden) */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'workspace'
              ? 'text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-md mb-0.5 ${activeTab === 'workspace' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Workspace</span>
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'properties'
              ? 'text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-md mb-0.5 ${activeTab === 'properties' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
            <Home className="w-4 h-4" />
          </div>
          <span>Homes</span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            activeTab === 'compare'
              ? 'text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-md mb-0.5 ${activeTab === 'compare' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
            <GitCompare className="w-4 h-4" />
          </div>
          <span>Compare</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex flex-col items-center justify-center min-w-[60px] py-1 px-2 rounded-lg text-[10px] font-medium transition-colors relative cursor-pointer ${
            activeTab === 'saved'
              ? 'text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`p-1 rounded-md mb-0.5 relative ${activeTab === 'saved' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
            <Bookmark className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </div>
          <span>Pipeline</span>
        </button>
      </nav>
    </>
  );
};

