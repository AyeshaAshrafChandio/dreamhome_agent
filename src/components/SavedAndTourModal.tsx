import React, { useState, useEffect } from 'react';
import { Bookmark, Calendar, MessageSquare, Trash2, CheckCircle2, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { Property, ViewingRequest, SellerContactDraft } from '../types.ts';

interface SavedAndTourModalProps {
  savedProperties: Property[];
  onRemoveSaved: (propertyId: string) => void;
  onSelectProperty: (property: Property) => void;
  onRefresh: () => void;
}

export const SavedAndTourModal: React.FC<SavedAndTourModalProps> = ({
  savedProperties,
  onRemoveSaved,
  onSelectProperty,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'saved' | 'viewings' | 'contacts'>('saved');
  const [viewings, setViewings] = useState<ViewingRequest[]>([]);
  const [contacts, setContacts] = useState<SellerContactDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeSubTab === 'viewings') {
        const res = await fetch('/api/viewings');
        if (res.ok) {
          const data = await res.json();
          setViewings(data.viewings || []);
        }
      } else if (activeSubTab === 'contacts') {
        const res = await fetch('/api/contacts');
        if (res.ok) {
          const data = await res.json();
          setContacts(data.contacts || []);
        }
      }
    } catch (e) {
      console.error('Error loading saved/viewings data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Your Activity & Pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage saved listings, scheduled property tours, and seller inquiries.</p>
        </div>

        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveSubTab('saved')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeSubTab === 'saved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-rose-500" />
            <span>Saved ({savedProperties.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('viewings')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeSubTab === 'viewings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Tours & Viewings</span>
          </button>

          <button
            onClick={() => setActiveSubTab('contacts')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeSubTab === 'contacts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-700" />
            <span>Seller Inquiries</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Saved Properties */}
      {activeSubTab === 'saved' && (
        <div>
          {savedProperties.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No Saved Homes Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click the heart icon on any property card or ask the agent "Save property 1" to store listings here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProperties.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold text-slate-900 font-mono">${p.price.toLocaleString()}</span>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {p.matchScore?.overall || 85}% Fit
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-800 text-sm line-clamp-1 mt-1">{p.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{p.location.address || p.location.city}</p>
                    <div className="text-xs text-slate-600 mt-2">
                      {p.bedrooms} Beds • {p.bathrooms} Baths • {p.areaSqFt.toLocaleString()} sqft
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onRemoveSaved(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectProperty(p)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center space-x-1"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Viewings */}
      {activeSubTab === 'viewings' && (
        <div className="space-y-3">
          {viewings.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No Scheduled Viewings</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Schedule a tour from any property modal or ask the agent "Schedule a viewing for property 1".
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              {viewings.map((vr) => (
                <div key={vr.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                  <div>
                    <div className="font-bold text-slate-900">{vr.propertyTitle}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Requested Date: <strong className="text-slate-800">{vr.preferredDate}</strong> at <strong className="text-slate-800">{vr.preferredTime}</strong>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pending Confirmation</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Seller Contacts */}
      {activeSubTab === 'contacts' && (
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No Seller Contacts Recorded</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Ask your agent "Contact the seller" to trigger the human approval gate.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              {contacts.map((c) => (
                <div key={c.id} className="p-4 space-y-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-bold text-slate-900">{c.propertyTitle}</div>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold flex items-center space-x-1 w-fit ${
                      c.approvalStatus === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : c.approvalStatus === 'rejected'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {c.approvalStatus === 'approved' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dispatched (Human Approved)</span>
                        </>
                      ) : c.approvalStatus === 'rejected' ? (
                        <span>Cancelled (Human Rejected)</span>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Pending Approval</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-200 font-mono">
                    "{c.message}"
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Recipient: {typeof c.recipient === 'string' ? c.recipient : c.recipient?.name || 'Seller Agent'} • Created {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
