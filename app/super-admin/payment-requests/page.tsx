'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SuperAdminPaymentRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionModalAction, setRejectionModalAction] = useState<'REJECT' | 'RESUBMIT_REQUIRED' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRequests = () => {
    setLoading(true);
    fetch(`/api/payment-requests?status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.requests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleAction = async (requestId: string, action: string, reason?: string) => {
    setActionLoading(true);
    setFeedbackMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/payment-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          rejectionReason: reason || rejectionReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg(data.message || `Request updated to ${action} successfully!`);
        setSelectedRequest(null);
        setRejectionModalAction(null);
        setRejectionReason('');
        fetchRequests();
      } else {
        setErrorMsg(data.error || 'Failed to update request');
      }
    } catch (err) {
      setErrorMsg('An error occurred during request processing');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const underReviewCount = requests.filter((r) => r.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Payment Setup & Onboarding Verification</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-pulse">
                {pendingCount} New Request{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Verify mosque banking credentials, cancelled cheques, and approve UPI / Razorpay payment gateways
          </p>
        </div>

        <Link
          href="/super-admin/masjids"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition flex items-center gap-2 self-start sm:self-auto"
        >
          <i className="fas fa-mosque"></i> Back to Masjids Queue
        </Link>
      </div>

      {/* ALERTS */}
      {feedbackMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
          <i className="fas fa-check-circle"></i> {feedbackMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/80 border border-rose-700 text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-2">
          <i className="fas fa-circle-exclamation"></i> {errorMsg}
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        {[
          { id: 'ALL', label: 'All Requests' },
          { id: 'PENDING', label: `🟡 Pending (${pendingCount})` },
          { id: 'UNDER_REVIEW', label: `🔵 Under Review (${underReviewCount})` },
          { id: 'APPROVED', label: '🟢 Approved' },
          { id: 'RESUBMIT_REQUIRED', label: '🟠 Resubmit Req.' },
          { id: 'REJECTED', label: '🔴 Rejected' },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === st.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* REQUESTS LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-semibold">
            <i className="fas fa-circle-notch fa-spin text-emerald-500 text-2xl mb-2"></i>
            <p>Loading payment onboarding requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <i className="fas fa-file-invoice-dollar text-4xl mb-3 text-slate-700 block"></i>
            <h3 className="text-sm font-bold text-slate-300">No payment onboarding requests found</h3>
            <p className="text-xs text-slate-500 mt-1">Requests submitted by mosque admins will appear here for verification.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-400">
                <tr>
                  <th className="p-4">Mosque & Location</th>
                  <th className="p-4">Channel Requested</th>
                  <th className="p-4">Bank & UPI VPA</th>
                  <th className="p-4">Proof Documents</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <span className="font-bold text-white text-sm block">{req.masjid?.name || 'Mosque'}</span>
                      <span className="text-[11px] text-slate-400">
                        {req.masjid?.city}, {req.masjid?.state} • Waqf: {req.masjid?.waqfId || 'N/A'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700 inline-block">
                        {req.requestType === 'BOTH' ? '⚡ UPI + Razorpay' : req.requestType === 'UPI' ? '📱 UPI Only' : '💳 Razorpay Only'}
                      </span>
                    </td>

                    <td className="p-4 space-y-0.5">
                      <div className="font-mono text-emerald-300 font-bold">{req.upiId || 'Direct UPI'}</div>
                      <div className="text-[11px] text-slate-400">
                        {req.bankName} • Acc: {req.bankAccNo}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">IFSC: {req.bankIfsc}</div>
                    </td>

                    <td className="p-4 space-y-1">
                      {req.chequeDocUrl ? (
                        <a
                          href={req.chequeDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <i className="fas fa-file-pdf"></i> Cheque / Passbook
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic block">No Cheque URL</span>
                      )}
                      {req.registrationDocUrl && (
                        <a
                          href={req.registrationDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <i className="fas fa-file-lines"></i> Registration Doc
                        </a>
                      )}
                      {req.idProofDocUrl && (
                        <a
                          href={req.idProofDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <i className="fas fa-id-card"></i> Signatory ID Proof
                        </a>
                      )}
                    </td>

                    <td className="p-4">
                      {req.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-black">
                          🟡 Pending
                        </span>
                      )}
                      {req.status === 'UNDER_REVIEW' && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-black">
                          🔵 Under Review
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black">
                          🟢 Approved & Active
                        </span>
                      )}
                      {req.status === 'RESUBMIT_REQUIRED' && (
                        <span className="px-2.5 py-1 rounded-full bg-orange-950 text-orange-300 border border-orange-800 text-[10px] font-black">
                          🟠 Resubmit Req.
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-black">
                          🔴 Rejected
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {req.status !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleAction(req.id, 'APPROVE')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shadow-sm"
                        >
                          <i className="fas fa-check"></i> Approve
                        </button>
                      )}

                      {req.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleAction(req.id, 'UNDER_REVIEW')}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 font-bold rounded-xl text-xs transition border border-blue-700"
                        >
                          Reviewing
                        </button>
                      )}

                      {req.status !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(req);
                            setRejectionModalAction('RESUBMIT_REQUIRED');
                          }}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 bg-orange-950/60 hover:bg-orange-900 text-orange-300 font-bold rounded-xl text-xs transition border border-orange-800"
                        >
                          Resubmit
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequest(req);
                          setRejectionModalAction('REJECT');
                        }}
                        disabled={actionLoading}
                        className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold rounded-xl text-xs transition border border-rose-800"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REJECTION / RESUBMIT REASON MODAL */}
      {selectedRequest && rejectionModalAction && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">
                {rejectionModalAction === 'RESUBMIT_REQUIRED' ? 'Request Document Resubmission' : 'Reject Payment Request'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionModalAction(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Mosque: <strong className="text-white">{selectedRequest.masjid?.name}</strong>. Provide clear feedback explaining what is missing or required from the mosque administrator.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Reason / Required Amendments *
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. The account holder name on the cancelled cheque does not match the registered Waqf Trust name. Please provide an authorized bank letter."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-red-500 text-white placeholder-slate-600"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionModalAction(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={() => handleAction(selectedRequest.id, rejectionModalAction, rejectionReason)}
                className={`px-5 py-2 text-white font-extrabold rounded-xl text-xs transition disabled:opacity-50 ${
                  rejectionModalAction === 'RESUBMIT_REQUIRED'
                    ? 'bg-orange-600 hover:bg-orange-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {actionLoading ? 'Processing...' : 'Confirm & Notify Mosque Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
