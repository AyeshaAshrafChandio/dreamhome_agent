import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { AgentWorkspace } from './components/AgentWorkspace.tsx';
import { PropertyCard } from './components/PropertyCard.tsx';
import { PropertyDetailModal } from './components/PropertyDetailModal.tsx';
import { PropertyComparisonModal } from './components/PropertyComparisonModal.tsx';
import { ApprovalGateModal } from './components/ApprovalGateModal.tsx';
import { SavedAndTourModal } from './components/SavedAndTourModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { MapView } from './components/MapView.tsx';

import { registerAllWebMcpTools, setApprovalHandler, ApprovalPromptRequest } from './webmcp/registerTools.ts';
import { ensureWebMcpBridge } from './webmcp/bridge.ts';
import { Property, SearchCriteria, SystemStatus, AgentActionLog } from './types.ts';
import { Map, Grid, AlertCircle, Info, Sparkles, CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'properties' | 'compare' | 'saved' | 'settings'>('workspace');
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [comparedPropertyIds, setComparedPropertyIds] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalPromptRequest | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [actionLogs, setActionLogs] = useState<AgentActionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'info' | 'success' | 'warning'; message: string } | null>(null);
  const [showMap, setShowMap] = useState(true);

  const [criteria, setCriteria] = useState<SearchCriteria>({
    location: 'Austin, TX',
    maxBudget: 750000,
    minBedrooms: 3,
    features: ['parking'],
  });

  // Initialize WebMCP tools and configure Human Approval handler
  useEffect(() => {
    // 1. Ensure bridge and register 10 WebMCP tools
    registerAllWebMcpTools({
      onToolStart: (name) => {
        console.log(`[WebMCP Executing] ${name}`);
      },
      onToolSuccess: (name) => {
        console.log(`[WebMCP Success] ${name}`);
        loadActionLogs();
      },
      onToolError: (name, err) => {
        console.warn(`[WebMCP Error] ${name}:`, err);
        loadActionLogs();
      },
    });

    // 2. Set approval gate handler
    setApprovalHandler((req: ApprovalPromptRequest) => {
      setApprovalRequest(req);
    });

    // 3. Load initial system config & logs
    loadSystemStatus();
    loadActionLogs();
    loadSavedProperties();

    // 4. Run initial property search
    performSearch(criteria);
  }, []);

  const loadSystemStatus = async () => {
    try {
      const res = await fetch('/api/config/status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (err) {
      console.warn('Could not fetch config status:', err);
    }
  };

  const loadActionLogs = async () => {
    try {
      const res = await fetch('/api/agent/action-logs');
      if (res.ok) {
        const data = await res.json();
        setActionLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Could not fetch action logs:', err);
    }
  };

  const loadSavedProperties = async () => {
    try {
      const res = await fetch('/api/saved');
      if (res.ok) {
        const data = await res.json();
        setSavedProperties(data.properties || []);
      }
    } catch (err) {
      console.warn('Could not fetch saved properties:', err);
    }
  };

  const performSearch = async (searchCriteria: SearchCriteria) => {
    setIsLoading(true);
    setStatusNotification(null);
    try {
      const bridge = ensureWebMcpBridge();
      // Invoke through WebMCP tool directly
      const result = await bridge.executeTool('search_homes', searchCriteria);
      setProperties(result.properties || []);
      setCriteria(searchCriteria);

      if (result.error) {
        setStatusNotification({
          type: 'warning',
          message: result.error,
        });
      } else if (result.properties && result.properties.length > 0) {
        setStatusNotification({
          type: 'success',
          message: `Agent found ${result.properties.length} verified properties in ${searchCriteria.location} matching your requirements.`,
        });
      } else {
        setStatusNotification({
          type: 'info',
          message: `No listings found matching current filters in ${searchCriteria.location}. Try expanding your budget or removing bedroom requirements.`,
        });
      }
    } catch (err: any) {
      console.error('Search failure:', err);
      setStatusNotification({
        type: 'warning',
        message: `Search error: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
      loadActionLogs();
    }
  };

  // High-Level Human + AI Collaboration Handler
  const handleExecuteAgentQuery = async (queryText: string) => {
    setIsLoading(true);
    setStatusNotification(null);

    try {
      // Step 1: Send message to agent to evaluate intent
      const intentRes = await fetch('/api/agent/process-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          previousCriteria: criteria,
          currentProperties: properties,
        }),
      });

      if (!intentRes.ok) {
        throw new Error('Failed to process agent intent');
      }

      const intent = await intentRes.json();
      console.log('[Agent Intent Result]', intent);

      // Step 2: Execute tool according to intent
      const bridge = ensureWebMcpBridge();

      if (intent.toolToExecute === 'search_homes') {
        const newCriteria: SearchCriteria = intent.structuredCriteria || intent.toolInput || criteria;
        await performSearch(newCriteria);
      } else if (intent.toolToExecute === 'compare_properties') {
        const ids = intent.toolInput?.propertyIds || properties.slice(0, 3).map((p) => p.id);
        setComparedPropertyIds(ids);
        setIsCompareModalOpen(true);
        setStatusNotification({
          type: 'info',
          message: `Agent opened comparison for ${ids.length} properties via WebMCP compare_properties.`,
        });
      } else if (intent.toolToExecute === 'save_property') {
        const propId = intent.targetPropertyId || properties[0]?.id;
        if (propId) {
          await bridge.executeTool('save_property', { propertyId: propId });
          await loadSavedProperties();
          setStatusNotification({
            type: 'success',
            message: `Property ${propId} saved to your persistent favorites collection.`,
          });
        }
      } else if (intent.toolToExecute === 'contact_seller') {
        // Consequential action: Calling contact_seller triggers the approval gate
        const propId = intent.targetPropertyId || properties[0]?.id;
        if (propId) {
          setStatusNotification({
            type: 'warning',
            message: 'Consequential action paused: Human approval required before contacting seller.',
          });
          // This invokes the tool, which stops and opens the ApprovalGateModal via globalApprovalHandler!
          bridge.executeTool('contact_seller', {
            propertyId: propId,
            message: intent.approvalPayload?.draftMessage,
          }).catch((err) => {
            console.log('Approval gate outcome:', err.message);
          });
        }
      } else if (intent.toolToExecute === 'create_viewing_request') {
        const propId = intent.targetPropertyId || properties[0]?.id;
        if (propId) {
          await bridge.executeTool('create_viewing_request', intent.toolInput);
          setStatusNotification({
            type: 'success',
            message: 'Tour scheduled successfully (Status: Pending seller confirmation).',
          });
        }
      } else {
        // General query or explanation
        setStatusNotification({
          type: 'info',
          message: intent.explanation || intent.summary || 'Agent analyzed your query.',
        });
      }
    } catch (err: any) {
      console.error('Agent query error:', err);
      setStatusNotification({
        type: 'warning',
        message: `Agent processing error: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
      loadActionLogs();
    }
  };

  const handleSaveToggle = async (property: Property) => {
    const isAlreadySaved = savedProperties.some((p) => p.id === property.id);
    if (isAlreadySaved) {
      await fetch(`/api/saved/${property.id}`, { method: 'DELETE' });
      setSavedProperties((prev) => prev.filter((p) => p.id !== property.id));
      setStatusNotification({ type: 'info', message: 'Removed property from saved collection.' });
    } else {
      const bridge = ensureWebMcpBridge();
      await bridge.executeTool('save_property', { propertyId: property.id });
      await loadSavedProperties();
      setStatusNotification({ type: 'success', message: 'Saved property to your collection.' });
    }
    loadActionLogs();
  };

  const handleToggleCompare = (property: Property) => {
    if (comparedPropertyIds.includes(property.id)) {
      setComparedPropertyIds((prev) => prev.filter((id) => id !== property.id));
    } else {
      if (comparedPropertyIds.length >= 4) {
        setStatusNotification({
          type: 'warning',
          message: 'You can compare up to 4 properties simultaneously.',
        });
        return;
      }
      setComparedPropertyIds((prev) => [...prev, property.id]);
    }
  };

  const handleDirectContactSeller = (property: Property) => {
    const bridge = ensureWebMcpBridge();
    bridge.executeTool('contact_seller', {
      propertyId: property.id,
      message: `Hello, I am interested in ${property.title}. Could you please share more information regarding availability and utility costs?`,
    }).catch((e) => console.log('Contact seller outcome:', e.message));
  };

  const handleDirectScheduleViewing = (property: Property) => {
    const date = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    const bridge = ensureWebMcpBridge();
    bridge.executeTool('create_viewing_request', {
      propertyId: property.id,
      preferredDate: date,
      preferredTime: '14:00',
    }).then(() => {
      setStatusNotification({
        type: 'success',
        message: `Viewing requested for ${property.title} on ${date} at 14:00.`,
      });
    });
  };

  const comparedProperties = properties.filter((p) => comparedPropertyIds.includes(p.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'settings') {
            setIsSettingsOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        systemStatus={systemStatus}
        savedCount={savedProperties.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Notification Banner */}
        {statusNotification && (
          <div className={`mb-6 p-3.5 rounded-lg border text-xs sm:text-sm flex items-start justify-between gap-3 animate-in fade-in duration-200 ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusNotification.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-start gap-2.5">
              {statusNotification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusNotification.type === 'warning' ? (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{statusNotification.message}</div>
            </div>
            <button
              onClick={() => setStatusNotification(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* View 1: Agent Workspace & Discovery Flow */}
        {activeTab === 'workspace' && (
          <div className="space-y-6">
            <AgentWorkspace
              currentCriteria={criteria}
              properties={properties}
              isLoading={isLoading}
              onExecuteQuery={handleExecuteAgentQuery}
              onApplyCriteria={(c) => performSearch(c)}
              onOpenCompare={() => {
                if (comparedPropertyIds.length === 0 && properties.length >= 2) {
                  setComparedPropertyIds(properties.slice(0, 3).map((p) => p.id));
                }
                setIsCompareModalOpen(true);
              }}
              onViewDetails={(p) => setSelectedProperty(p)}
              onContactSeller={handleDirectContactSeller}
              onSaveProperty={handleSaveToggle}
            />

            {/* Split View: Map + Property Cards Grid */}
            <div className="flex items-center justify-between pt-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Discovered Matches ({properties.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    showMap ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Properties Grid Column */}
              <div className={`${showMap ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
                {properties.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
                    <Sparkles className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                    <h3 className="font-bold text-slate-800 text-base">No Matching Homes Found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Try asking the agent to broaden your search criteria or explore another neighborhood.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {properties.map((p, idx) => (
                      <PropertyCard
                        key={p.id}
                        property={p}
                        index={idx}
                        isSaved={savedProperties.some((sp) => sp.id === p.id)}
                        isCompared={comparedPropertyIds.includes(p.id)}
                        onSave={handleSaveToggle}
                        onToggleCompare={handleToggleCompare}
                        onSelectDetails={(prop) => setSelectedProperty(prop)}
                        onContactSeller={handleDirectContactSeller}
                        onScheduleViewing={handleDirectScheduleViewing}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Map Column */}
              {showMap && (
                <div className="lg:col-span-5 h-[420px] lg:h-[calc(100vh-280px)] sticky top-24 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                  <MapView
                    properties={properties}
                    selectedProperty={selectedProperty}
                    onSelectProperty={(prop) => setSelectedProperty(prop)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* View 2: Pure Properties Grid */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Verified Properties Catalog</h2>
                <p className="text-xs text-slate-500">Live verified listings with DreamHome Match Scores</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p, idx) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  index={idx}
                  isSaved={savedProperties.some((sp) => sp.id === p.id)}
                  isCompared={comparedPropertyIds.includes(p.id)}
                  onSave={handleSaveToggle}
                  onToggleCompare={handleToggleCompare}
                  onSelectDetails={(prop) => setSelectedProperty(prop)}
                  onContactSeller={handleDirectContactSeller}
                  onScheduleViewing={handleDirectScheduleViewing}
                />
              ))}
            </div>
          </div>
        )}

        {/* View 3: Side-by-Side Comparison */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Property Comparison Matrix</h2>
                <p className="text-xs text-slate-500">
                  Select 2 to 4 properties from the search results to evaluate specifications side by side.
                </p>
              </div>
            </div>

            {comparedProperties.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
                <Grid className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-base">No Properties Selected for Comparison</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click the compare icon on any property card or ask your agent "Compare the top three".
                </p>
              </div>
            ) : (
              <PropertyComparisonModal
                properties={comparedProperties}
                onClose={() => setActiveTab('workspace')}
                onSelectProperty={(p) => setSelectedProperty(p)}
              />
            )}
          </div>
        )}

        {/* View 4: Saved & Tours */}
        {activeTab === 'saved' && (
          <SavedAndTourModal
            savedProperties={savedProperties}
            onRemoveSaved={(id) => handleSaveToggle({ id } as Property)}
            onSelectProperty={(p) => setSelectedProperty(p)}
            onRefresh={loadSavedProperties}
          />
        )}
      </main>

      {/* Clean Minimalism Application Footer */}
      <footer className="p-3 sm:p-4 bg-slate-900 text-slate-400 shrink-0 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 bg-emerald-400 rounded-full" />
          <span className="font-medium">DreamHome Agent</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Intelligent Real Estate Discovery</span>
        </div>
        <div className="text-slate-500 text-xs">
          Verified Listings & Live OpenStreetMap Amenities
        </div>
      </footer>

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        isSaved={selectedProperty ? savedProperties.some((p) => p.id === selectedProperty.id) : false}
        onSave={handleSaveToggle}
        onContactSeller={handleDirectContactSeller}
        onScheduleViewing={handleDirectScheduleViewing}
      />

      {/* Property Comparison Modal */}
      {isCompareModalOpen && (
        <PropertyComparisonModal
          properties={comparedProperties.length > 0 ? comparedProperties : properties.slice(0, 3)}
          onClose={() => setIsCompareModalOpen(false)}
          onSelectProperty={(p) => setSelectedProperty(p)}
        />
      )}

      {/* Consequential Action: Human-in-the-Loop Approval Gate Modal */}
      <ApprovalGateModal
        request={approvalRequest}
        onClose={() => setApprovalRequest(null)}
      />

      {/* Settings & Integration Diagnostics Modal */}
      {isSettingsOpen && (
        <SettingsModal
          systemStatus={systemStatus}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
export default App;
