import React, { useState } from 'react';
import { Bot, Sparkles, Send, MapPin, DollarSign, Bed, Sliders, CheckCircle2, AlertCircle, ArrowRight, ShieldAlert, GitCompare, Bookmark, Calendar, MessageSquare, RefreshCw } from 'lucide-react';
import { Property, SearchCriteria } from '../types.ts';

interface AgentWorkspaceProps {
  currentCriteria: SearchCriteria;
  properties: Property[];
  isLoading: boolean;
  onExecuteQuery: (queryText: string) => Promise<void>;
  onApplyCriteria: (criteria: SearchCriteria) => void;
  onOpenCompare: () => void;
  onViewDetails: (property: Property) => void;
  onContactSeller: (property: Property) => void;
  onSaveProperty: (property: Property) => void;
}

export const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  currentCriteria,
  properties,
  isLoading,
  onExecuteQuery,
  onApplyCriteria,
  onOpenCompare,
  onViewDetails,
  onContactSeller,
  onSaveProperty,
}) => {
  const [inputText, setInputText] = useState('');
  const [isManualBuilderOpen, setIsManualBuilderOpen] = useState(false);

  // Manual criteria form state
  const [manualLocation, setManualLocation] = useState(currentCriteria.location || 'Austin, TX');
  const [manualBudget, setManualBudget] = useState(currentCriteria.maxBudget || 750000);
  const [manualBeds, setManualBeds] = useState(currentCriteria.minBedrooms || 3);
  const [manualType, setManualType] = useState(currentCriteria.propertyType || 'any');

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const q = inputText;
    setInputText('');
    await onExecuteQuery(q);
  };

  const handleQuickPrompt = async (prompt: string) => {
    setInputText(prompt);
    await onExecuteQuery(prompt);
  };

  const handleApplyManual = () => {
    onApplyCriteria({
      ...currentCriteria,
      location: manualLocation,
      maxBudget: Number(manualBudget),
      minBedrooms: Number(manualBeds),
      propertyType: manualType === 'any' ? undefined : manualType,
    });
    setIsManualBuilderOpen(false);
  };

  const quickPrompts = [
    'Modern 3-bed house in Austin under $700k with parking and good schools',
    'Compare the top three properties',
    'Save property #1 to my favorites',
    'Contact the seller for the best match',
  ];

  return (
    <div className="space-y-6">
      {/* Hero Agent Input Canvas */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-8 shadow-xs border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold mb-3 sm:mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Autonomous WebMCP Discovery Workspace</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
            Tell us where, what you can afford, and how you want to live.
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            Your agent reasons across budget constraints, structural preferences, and real OpenStreetMap amenities, executing tools via WebMCP with human-in-the-loop safety.
          </p>

          {/* Natural Language Prompt Input */}
          <form onSubmit={handleSend} className="mt-4 sm:mt-6">
            <div className="relative flex items-center">
              <input
                id="agent-chat-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., Modern 3-bed house in Austin under $700,000..."
                disabled={isLoading}
                className="w-full py-3 sm:py-3.5 pl-3.5 sm:pl-4 pr-14 sm:pr-32 text-xs sm:text-sm text-white bg-slate-800/90 rounded-lg border border-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-hidden transition-all placeholder:text-slate-500 shadow-inner"
              />
              <button
                id="agent-chat-submit-btn"
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="absolute right-1.5 px-3 sm:px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-md text-xs sm:text-sm font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[36px]"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                ) : (
                  <>
                    <span className="hidden sm:inline">Ask Agent</span>
                    <span className="sm:hidden">Ask</span>
                    <Send className="w-3 h-3 text-slate-900" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Prompts */}
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:flex-wrap sm:overflow-visible">
              <span className="text-slate-400 text-[11px] sm:text-xs font-medium shrink-0">Try asking:</span>
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(qp)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] sm:text-xs transition-colors border border-slate-700 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  "{qp}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Structured Criteria Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active Filter Parameters
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-md text-xs font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentCriteria.location || 'Any Location'}</span>
            </span>

            {currentCriteria.maxBudget && (
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-semibold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Max ${currentCriteria.maxBudget.toLocaleString()}</span>
              </span>
            )}

            {currentCriteria.minBedrooms && (
              <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-xs font-medium flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentCriteria.minBedrooms}+ Beds</span>
              </span>
            )}

            {currentCriteria.propertyType && (
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-md text-xs font-medium capitalize">
                {currentCriteria.propertyType.replace('_', ' ')}
              </span>
            )}

            {(currentCriteria.features || []).map((f, i) => (
              <span key={i} className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs">
                +{f.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0">
          <button
            onClick={() => setIsManualBuilderOpen(!isManualBuilderOpen)}
            className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg sm:rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] sm:min-h-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Refine Criteria</span>
          </button>

          {properties.length >= 2 && (
            <button
              onClick={onOpenCompare}
              className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg sm:rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] sm:min-h-0"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Top ({Math.min(properties.length, 3)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Manual Builder Drawer / Expandable */}
      {isManualBuilderOpen && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Search Parameter Controls</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-600 block mb-1 font-medium">Target Location</label>
              <input
                type="text"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                placeholder="City, state or address"
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:border-slate-500 outline-hidden"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-medium">Max Budget ($)</label>
              <input
                type="number"
                value={manualBudget}
                onChange={(e) => setManualBudget(Number(e.target.value))}
                step={25000}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs font-mono focus:border-slate-500 outline-hidden"
              />
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-medium">Minimum Bedrooms</label>
              <select
                value={manualBeds}
                onChange={(e) => setManualBeds(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:border-slate-500 outline-hidden"
              >
                <option value={1}>1+ Bedroom</option>
                <option value={2}>2+ Bedrooms</option>
                <option value={3}>3+ Bedrooms</option>
                <option value={4}>4+ Bedrooms</option>
                <option value={5}>5+ Bedrooms</option>
              </select>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 font-medium">Property Type</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs focus:border-slate-500 outline-hidden"
              >
                <option value="any">Any Property Type</option>
                <option value="single_family">Single Family Home</option>
                <option value="condo">Condominium</option>
                <option value="townhouse">Townhouse</option>
                <option value="apartment">Apartment</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              onClick={() => setIsManualBuilderOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyManual}
              className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors shadow-xs"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}

      {/* Quick Status / Found Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <span className="font-bold text-slate-900">{properties.length}</span> properties ranked by <span className="font-semibold text-slate-800">DreamHome Match Score</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Real Coordinates & OpenStreetMap Amenities Verified</span>
        </div>
      </div>
    </div>
  );
};
