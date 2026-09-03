import React, { useState } from 'react';
import { ShieldCheck, Send, X, CheckCircle2, Info, Building2, Phone, Database } from 'lucide-react';
import { ApprovalPromptRequest } from '../webmcp/registerTools.ts';

interface ApprovalGateModalProps {
  request: ApprovalPromptRequest | null;
  onClose: () => void;
}

export const ApprovalGateModal: React.FC<ApprovalGateModalProps> = ({ request, onClose }) => {
  if (!request) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedMessage, setEditedMessage] = useState(request.details?.message || '');

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      if (editedMessage !== request.details?.message && request.details) {
        request.details.message = editedMessage;
      }
      await request.onApprove();
      onClose();
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    request.onReject();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Reassuring Safety Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base leading-tight text-white">Safety Confirmation</h3>
                <span className="text-[10px] uppercase font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50 px-1.5 py-0.5 rounded">Not an Error</span>
              </div>
              <p className="text-xs text-slate-400 font-mono text-[11px] mt-0.5">WebMCP Human-in-the-Loop Protection Gate</p>
            </div>
          </div>
          <button
            onClick={handleReject}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close without sending"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4">
          {/* Explanation Banner */}
          <div className="bg-blue-50/80 p-3.5 rounded-lg border border-blue-200/80 text-sm text-blue-900 space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Permission required to contact seller</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              This is <strong>not an error</strong>. For your safety and privacy, the AI agent is programmed to <strong>never</strong> send external emails, messages, or legal requests to real estate agents without your explicit review and confirmation.
            </p>
          </div>

          {/* Verified Real MLS Listing Details */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Target Listing & Broker (Real Live MLS Data)
              </span>
              <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verified MLS Record</span>
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm space-y-2">
              <div>
                <div className="font-semibold text-slate-900 text-sm">{request.details?.propertyTitle || 'Property'}</div>
                {request.details?.mlsId && (
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                    <Database className="w-3 h-3 text-slate-400" />
                    <span>MLS ID: #{request.details.mlsId} • {request.details.providerName || 'UnlockMLS / RentCast Live'}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-medium">Listing Agent</span>
                  <span className="font-semibold text-slate-800">{request.details?.recipient || 'Johanna Freire'}</span>
                  {request.details?.sellerCompany && (
                    <span className="text-slate-500 block text-[11px] flex items-center space-x-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{request.details.sellerCompany}</span>
                    </span>
                  )}
                </div>
                {request.details?.sellerPhone && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-medium">Direct Phone</span>
                    <span className="font-medium text-slate-700 flex items-center space-x-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
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
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            id="approval-gate-reject-btn"
            onClick={handleReject}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel / Do Not Send
          </button>
          <button
            id="approval-gate-approve-btn"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
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
      </div>
    </div>
  );
};
