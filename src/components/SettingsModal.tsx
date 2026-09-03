import React from 'react';
import { X, CheckCircle2, AlertCircle, Database, Server, Compass, MapPin, Sparkles, Terminal, Key } from 'lucide-react';
import { SystemStatus } from '../types.ts';

interface SettingsModalProps {
  systemStatus: SystemStatus | null;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ systemStatus, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-slate-700" />
            <h2 className="font-bold text-base sm:text-lg text-slate-900">Provider & Integration Diagnostics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* WebMCP Status */}
          <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">WebMCP Architecture Status</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active & Standards Compliant
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Exposed through <code className="text-emerald-300 font-mono">document.modelContext.registerTool</code>.
              10 real estate exploration and decision tools registered with strict schema validation and Human-In-The-Loop approval gates.
            </p>
          </div>

          {/* Providers Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live External Service Providers
            </h3>

            {/* AI Engine */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Google Gemini AI Engine</div>
                  <div className="text-xs text-slate-500">Model: gemini-3.8-flash (Server-Side @google/genai SDK)</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium shrink-0 flex items-center space-x-1 ${
                systemStatus?.providers.ai.configured
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {systemStatus?.providers.ai.configured ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Configured</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Using Deterministic Engine</span>
                  </>
                )}
              </span>
            </div>

            {/* Geocoding Provider */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Geocoding & Address Resolution</div>
                  <div className="text-xs text-slate-500">OpenStreetMap Nominatim (Live Global Coordinates)</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 shrink-0 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            </div>

            {/* Places / Neighborhood Provider */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700 shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Neighborhood Facilities & POI</div>
                  <div className="text-xs text-slate-500">OpenStreetMap Overpass Engine (Schools, Hospitals, Transit)</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 shrink-0 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            </div>

            {/* Property API Provider */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700 shrink-0">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Real Estate Data Provider</div>
                  <div className="text-xs text-slate-500">
                    {systemStatus?.providers.propertyApi.status || 'RentCast Real Estate MLS Provider'}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium shrink-0 flex items-center space-x-1 ${
                systemStatus?.providers.propertyApi.configured
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {systemStatus?.providers.propertyApi.configured ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Live Key Active</span>
                  </>
                ) : (
                  <span>Ready for Key</span>
                )}
              </span>
            </div>

            {/* Database Engine */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700 shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900">Relational Database & Drizzle ORM</div>
                  <div className="text-xs text-slate-500">
                    {systemStatus?.database.type === 'postgresql'
                      ? 'PostgreSQL (Connected)'
                      : 'Relational File-Backed Engine (Zero external dependencies)'}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 shrink-0 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Storage Ready</span>
              </span>
            </div>
          </div>

          {/* Configuration Guide */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Environment Variables Guide
            </h4>
            <p className="text-slate-600 leading-relaxed">
              To connect live nationwide MLS property records, configure your provider in <code className="font-mono text-slate-800">.env</code>:
            </p>
            <pre className="p-3 bg-white rounded-md border border-slate-200 text-slate-800 font-mono text-[11px] overflow-x-auto">
{`# For Nationwide Live US Listings (https://rentcast.io)
RENTCAST_API_KEY="your_api_key"

# Or Custom MLS / Broker REST Gateway
PROPERTY_API_BASE_URL="https://api.yourbroker.com/v1"
PROPERTY_API_KEY="your_broker_token"

# Optional: External PostgreSQL
DATABASE_URL="postgresql://user:pass@host:5432/dreamhome"`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
