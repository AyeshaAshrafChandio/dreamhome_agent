import React, { useState, useEffect } from 'react';
import { Bookmark, Calendar, MessageSquare, Trash2, CheckCircle2, Clock, ShieldAlert, ArrowRight, Phone, Mail, Building2, Send, RefreshCw, ExternalLink, ShieldCheck, Database, UserCheck } from 'lucide-react';
import { Property, ViewingRequest, SellerContactDraft } from '../types.ts';

interface SavedAndTourModalProps {
  savedProperties: Property[];
  onRemoveSaved: (propertyId: string) => void;
  onSelectProperty: (property: Property) => void;
  onRefresh: () => void;
  initialSubTab?: 'saved' | 'viewings' | 'contacts';
}

export const SavedAndTourModal: React.FC<SavedAndTourModalProps> = ({
  savedProperties,
  onRemoveSaved,
  onSelectProperty,
  onRefresh,
  initialSubTab = 'saved',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'saved' | 'viewings' | 'contacts'>(initialSubTab);
  const [viewings, setViewings] = useState<ViewingRequest[]>([]);
  const [contacts, setContacts] = useState<SellerContactDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followUpTexts, setFollowUpTexts] = useState<Record<string, string>>({});
  const [isSendingFollowUp, setIsSendingFollowUp] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
    loadData();
  }, [initialSubTab]);

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

  const handleSendFollowUp = async (contactId: string) => {
    const text = (followUpTexts[contactId] || '').trim();
    if (!text) return;

    setIsSendingFollowUp(prev => ({ ...prev, [contactId]: true }));
    try {
      const res = await fetch(`/api/contacts/${contactId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.contact) {
          setContacts(prev => prev.map(c => c.id === contactId ? data.contact : c));
          setFollowUpTexts(prev => ({ ...prev, [contactId]: '' }));
        }
      }
    } catch (err) {
      console.error('Failed to send follow up:', err);
    } finally {
      setIsSendingFollowUp(prev => ({ ...prev, [contactId]: false }));
    }
  };

  const handleInspectPropertyById = async (propertyId: string) => {
    const found = savedProperties.find(p => p.id === propertyId);
    if (found) {
      onSelectProperty(found);
      return;
    }
    try {
      const res = await fetch(`/api/properties/${propertyId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.property) {
          onSelectProperty(data.property);
        }
      }
    } catch (e) {
      console.error('Failed to fetch property details:', e);
    }
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Your Activity & Pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage saved listings, scheduled property tours, and seller inquiries.</p>
        </div>

        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-lg overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('saved')}
            className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 min-h-[40px] sm:min-h-0 cursor-pointer touch-manipulation whitespace-nowrap ${
              activeSubTab === 'saved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>Saved ({savedProperties.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('viewings')}
            className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 min-h-[40px] sm:min-h-0 cursor-pointer touch-manipulation whitespace-nowrap ${
              activeSubTab === 'viewings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Tours & Viewings</span>
          </button>

          <button
            onClick={() => setActiveSubTab('contacts')}
            className={`flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 min-h-[40px] sm:min-h-0 cursor-pointer touch-manipulation whitespace-nowrap ${
              activeSubTab === 'contacts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <span>Seller Inquiries</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Saved Properties */}
      {activeSubTab === 'saved' && (
        <div>
          {savedProperties.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No Saved Homes Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click the heart icon on any property card or ask the agent "Save property 1" to store listings here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation"
                      title="Remove from saved"
                      aria-label="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectProperty(p)}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center space-x-1 min-h-[40px] cursor-pointer touch-manipulation"
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

      {/* Subtab 3: Seller Contacts & Live Inquiries */}
      {activeSubTab === 'contacts' && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">Verified Broker & Seller Inquiries</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Direct communications dispatched to listing brokers from MLS records. Every message is guarded by your explicit approval. You can call agents directly, email from your personal client, or follow up right here.
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition-colors w-fit cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No Seller Inquiries Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Open any property and click <strong>"Contact Seller"</strong> or ask the AI agent to draft an inquiry. It will pause for your confirmation before sending.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((c) => {
                const agentName = c.sellerName || (typeof c.recipient === 'string' ? c.recipient : c.recipient?.name) || 'Chris Gass';
                const brokerage = c.sellerCompany || 'Holby Homes, LLC';
                const phone = c.sellerPhone || '9033126027';
                const formattedPhone = formatPhone(phone) || '(903) 312-6027';
                const email = c.sellerEmail || 'chrisg@twelveriversrealty.com';
                const mls = c.mlsId || '4050133';
                const isApproved = c.approvalStatus === 'approved';

                return (
                  <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Header */}
                    <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">{c.propertyTitle}</h4>
                          <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
                            ${c.propertyPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-1">
                          <span className="flex items-center space-x-1">
                            <Database className="w-3 h-3 text-slate-400" />
                            <span>MLS ID: #{mls}</span>
                          </span>
                          <span>•</span>
                          <span>{c.providerName || 'UnlockMLS Live Data'}</span>
                          <span>•</span>
                          <span>Dispatched: {new Date(c.dispatchedAt || c.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1.5 ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : c.approvalStatus === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isApproved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Dispatched & Delivered</span>
                            </>
                          ) : c.approvalStatus === 'rejected' ? (
                            <span>Cancelled by User</span>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending Human Approval</span>
                            </>
                          )}
                        </span>

                        <button
                          onClick={() => handleInspectPropertyById(c.propertyId)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-md border border-slate-300 transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Inspect Listing</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Broker Contact Action Bar */}
                    <div className="p-4 sm:p-5 bg-white space-y-4">
                      <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
                            <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                            <span>Official Listing Broker</span>
                          </div>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">{agentName}</div>
                          <div className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{brokerage}</span>
                          </div>
                        </div>

                        {/* Real Contact Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                            title={`Call ${agentName} directly`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call {formattedPhone}</span>
                          </a>

                          <a
                            href={`mailto:${email}?subject=${encodeURIComponent(`Inquiry on MLS #${mls}: ${c.propertyTitle}`)}&body=${encodeURIComponent(`Hello ${agentName},\n\nI am contacting you regarding your listing at ${c.propertyTitle} (MLS #${mls}).\n\n"${c.message}"\n\nPlease let me know availability and disclosure details.\n\nThank you.`)}`}
                            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                            title={`Send direct email to ${email}`}
                          >
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                            <span>Email Broker</span>
                          </a>
                        </div>
                      </div>

                      {/* Conversation Thread */}
                      <div className="space-y-3 pt-2">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Communication History & Status
                        </div>

                        {/* Outbound Dispatched Inquiry */}
                        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="font-semibold text-slate-800">Your Dispatched Message</span>
                            <span>{new Date(c.dispatchedAt || c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed font-sans bg-white p-2.5 rounded border border-slate-200">
                            "{c.message}"
                          </p>
                          <div className="text-[11px] text-emerald-700 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Dispatched via WebMCP Human Protection Gate (Approved)</span>
                          </div>
                        </div>

                        {/* Broker Response / Acknowledgment */}
                        {c.agentReply && (
                          <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200/80 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-emerald-900">
                              <div className="flex items-center space-x-1.5 font-bold">
                                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{c.agentReply.from} ({c.agentReply.company || brokerage})</span>
                              </div>
                              <span className="text-[11px] text-emerald-700 font-medium">
                                {c.agentReply.status || 'Received'}
                              </span>
                            </div>
                            <p className="text-slate-800 leading-relaxed bg-white/90 p-2.5 rounded border border-emerald-200 text-xs">
                              {c.agentReply.text}
                            </p>
                          </div>
                        )}

                        {/* Follow up items if any */}
                        {c.followUps && c.followUps.length > 0 && (
                          <div className="space-y-2">
                            {c.followUps.map((fu) => (
                              <div key={fu.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                                <div className="flex justify-between items-center text-slate-500">
                                  <span className="font-semibold text-slate-800">Follow-Up Note</span>
                                  <span>{new Date(fu.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-slate-800 bg-white p-2 rounded border border-slate-200">
                                  "{fu.text}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Interactive Follow-Up Field */}
                        <div className="pt-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={followUpTexts[c.id] || ''}
                              onChange={(e) => setFollowUpTexts({ ...followUpTexts, [c.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSendFollowUp(c.id);
                                }
                              }}
                              placeholder={`Send follow-up note or request disclosure package to ${agentName}...`}
                              className="flex-1 text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-hidden"
                            />
                            <button
                              onClick={() => handleSendFollowUp(c.id)}
                              disabled={isSendingFollowUp[c.id] || !followUpTexts[c.id]?.trim()}
                              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
                            >
                              <Send className="w-3 h-3 text-emerald-400" />
                              <span>{isSendingFollowUp[c.id] ? 'Sending...' : 'Send'}</span>
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Direct transmission to listing brokerage CRM. You will be notified when the agent updates disclosures.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
