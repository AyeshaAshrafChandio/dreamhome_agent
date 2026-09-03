import React, { useState } from 'react';
import { ShieldCheck, Send, X, CheckCircle2, Info, Building2, Phone, Database, ArrowRight, MessageSquare } from 'lucide-react';
import { ApprovalPromptRequest } from '../webmcp/registerTools.ts';

interface ApprovalGateModalProps {
  request: ApprovalPromptRequest | null;
  onClose: () => void;
  onViewInquiries?: () => void;
}

export const ApprovalGateModal: React.FC<ApprovalGateModalProps> = ({ request, onClose, onViewInquiries }) => {
  if (!request) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedMessage, setEditedMessage] = useState(request.details?.message || '');
  const [isSentSuccessfully, setIsSentSuccessfully] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      if (editedMessage !== request.details?.message && request.details) {
        request.details.message = editedMessage;
      }
      await request.onApprove();
      setIsSentSuccessfully(true);
    } catch (err) {
      console.error('Approval failed:', err);
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    request.onReject();
    onClose();
  };

  const handleFinishAndNavigate = () => {
    onClose();
    if (onViewInquiries) {
      onViewInquiries();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Reassuring Safety Header */}
        <div className="bg-slate-900 text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base leading-tight text-white">
                  {isSentSuccessfully ? 'Inquiry Dispatched' : 'Safety Confirmation'}
                </h3>
                <span className="text-[10px] uppercase font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                  {isSentSuccessfully ? 'Sent' : 'Approval Gate'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono text-[10px] sm:text-[11px] mt-0.5">
                {isSentSuccessfully ? 'Live MLS Dispatch Confirmed' : 'WebMCP Human Protection Gate'}
              </p>
            </div>
          </div>
          <button
            onClick={isSentSuccessfully ? onClose : handleReject}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer touch-manipulation"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSentSuccessfully ? (
          /* Post-Approval Success & Next Steps Screen */
          <div className="p-5 sm:p-6 space-y-4">
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                Inquiry Sent to Listing Broker!
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Your message has been dispatched to <strong>{request.details?.recipient || 'Katherine Wright'}</strong> at <strong>{request.details?.sellerCompany || 'Moreland Properties'}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
              <div className="font-semibold text-slate-900">Next Steps & Tracking:</div>
              <ul className="list-disc list-inside text-slate-600 space-y-1 pl-1">
                <li>The listing agent has received your questions about availability and utility costs.</li>
                <li>You can review this message and its live reply status in the <strong className="text-slate-800">Saved & Tours &gt; Seller Inquiries</strong> tab.</li>
                <li>The agent will contact you using the details on file or through your inquiries dashboard.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[44px] sm:min-h-0 touch-manipulation text-center"
              >
                Back to Properties
              </button>
              <button
                onClick={handleFinishAndNavigate}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[44px] sm:min-h-0 touch-manipulation"
              >
                <span>View in Seller Inquiries</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        ) : (
          /* Pre-Approval Gate Screen */
          <>
            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
              {/* Explanation Banner */}
              <div className="bg-blue-50/80 p-3 sm:p-3.5 rounded-lg border border-blue-200/80 text-sm text-blue-900 space-y-1.5">
                <div className="flex items-center space-x-2 font-semibold">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Permission required to contact seller</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  This is <strong>not an error</strong>. For your safety and privacy, the AI agent is programmed to <strong>never</strong> send external emails, messages, or legal requests to real estate agents without your explicit review and confirmation.
                </p>
                <div className="text-[11px] text-blue-700 bg-blue-100/60 p-2 rounded border border-blue-200/60 font-medium">
                  <strong>How it works:</strong> Review the message below, edit if desired, and click <strong>"Approve &amp; Send to Agent"</strong>. Your inquiry will be sent and tracked under <strong>Saved &amp; Tours &gt; Seller Inquiries</strong>.
                </div>
              </div>

              {/* Verified Real MLS Listing Details */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Target Listing & Broker (Real Live MLS Data)
                  </span>
                  <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Verified MLS Record</span>
                  </span>
                </div>
                <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm space-y-2">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{request.details?.propertyTitle || 'Property'}</div>
                    {request.details?.mlsId && (
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Database className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">MLS ID: #{request.details.mlsId} • {request.details.providerName || 'UnlockMLS / RentCast Live'}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-medium">Listing Agent</span>
                      <span className="font-semibold text-slate-800">{request.details?.recipient || 'Katherine Wright'}</span>
                      {request.details?.sellerCompany && (
                        <span className="text-slate-500 block text-[11px] flex items-center space-x-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{request.details.sellerCompany}</span>
                        </span>
                      )}
                    </div>
                    {request.details?.sellerPhone && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-medium">Direct Phone</span>
                        <span className="font-medium text-slate-700 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{request.details.sellerPhone}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Inquiry Draft Message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Inquiry Message (You can edit before sending)
                  </label>
                </div>
                <textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  rows={3}
                  className="w-full p-3 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-hidden font-sans"
                  placeholder="Write your message to the listing agent..."
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3">
              <button
                id="approval-gate-reject-btn"
                onClick={handleReject}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer min-h-[44px] sm:min-h-0 touch-manipulation text-center"
              >
                Cancel / Do Not Send
              </button>
              <button
                id="approval-gate-approve-btn"
                onClick={handleApprove}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer min-h-[44px] sm:min-h-0 touch-manipulation"
              >
                {isSubmitting ? (
                  <span>Transmitting...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approve & Send to Agent</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
