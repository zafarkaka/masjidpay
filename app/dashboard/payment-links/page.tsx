'use client';

import { useEffect, useState } from 'react';

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [qrModalData, setQrModalData] = useState<{ url: string; title?: string; amount?: number | null } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [masjidData, setMasjidData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    amount: '',
    categoryId: '',
    isCustomAmount: true,
  });

  const masjidId = 'jama-masjid';

  const loadLinks = () => {
    setLoading(true);
    fetch(`/api/payment-links?masjidId=${masjidId}`)
      .then((res) => res.json())
      .then((data) => {
        setLinks(data.paymentLinks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadLinks();

    // Fetch gateway & mosque approval status from settings
    fetch('/api/masjid/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.masjid) setMasjidData(data.masjid);
        if (data.gateway) setGatewayStatus(data.gateway);
      })
      .catch(() => {});

    fetch('/api/funds')
      .then((res) => res.json())
      .then((data) => {
        if (data.funds) setCategories(data.funds);
      })
      .catch(() => {});
  }, []);

  const isMasjidApproved = masjidData?.status === 'APPROVED';
  const isUpiApproved = Boolean(gatewayStatus?.enableUpi && gatewayStatus?.upiId && gatewayStatus?.upiId.trim() !== '');
  const isRazorpayApproved = Boolean(gatewayStatus?.enableRazorpay && gatewayStatus?.razorpayKeyId && gatewayStatus?.razorpayKeyId.trim() !== '');
  const isPaymentApproved = isMasjidApproved && (isUpiApproved || isRazorpayApproved);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPaymentApproved) {
      alert('Payment link generation requires Super Admin approval of your Mosque and UPI/Razorpay setup.');
      return;
    }
    setActionLoading(true);

    try {
      const res = await fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          masjidId,
          categoryId: form.categoryId || categories[0]?.id || 'default-cat',
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ title: '', amount: '', categoryId: '', isCustomAmount: true });
        loadLinks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Payment link copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">DONATIONS ENGINE</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Online Payment Links & QR Codes</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Generate shareable contribution links and instant printable UPI QR codes for donors
          </p>
        </div>

        {isPaymentApproved ? (
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-3 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-950/20 text-xs transition flex items-center gap-2"
          >
            <i className="fas fa-qrcode text-[#F4D06F]"></i> Generate Payment Link
          </button>
        ) : (
          <button
            disabled
            title="Locked until Super Admin approves your mosque UPI / Razorpay setup"
            className="px-5 py-3 bg-slate-100 border border-slate-300 text-slate-400 font-extrabold rounded-2xl text-xs cursor-not-allowed flex items-center gap-2 opacity-80"
          >
            <i className="fas fa-lock"></i> Generate Link (Approval Pending)
          </button>
        )}
      </div>

      {/* SUPER ADMIN APPROVAL STATUS CARD */}
      {!isPaymentApproved ? (
        <div className="p-4 sm:p-5 bg-amber-950 text-amber-100 rounded-3xl border border-amber-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-900 text-amber-300 flex items-center justify-center text-lg font-black shrink-0 border border-amber-700">
              <i className="fas fa-lock"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  Super Admin Approval Required
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-amber-900/80 text-[10px] font-bold text-amber-300 border border-amber-700">
                  AUTO-ENABLES ON APPROVAL
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Payment link generation and printable QR codes will <strong>automatically unlock</strong> once Super Admin verifies your mosque documents and configures your official UPI ID or Razorpay Gateway.
              </p>
            </div>
          </div>

          <a
            href="mailto:masjidpay3@gmail.com?subject=Payment%20Gateway%20Verification%20Status"
            className="px-4 py-2 bg-amber-900 hover:bg-amber-800 text-amber-200 font-bold text-xs rounded-xl transition shrink-0 inline-flex items-center gap-1.5 border border-amber-700 self-start sm:self-auto"
          >
            <i className="fas fa-envelope"></i> Contact Super Admin
          </a>
        </div>
      ) : (
        <div className="p-4 bg-emerald-950 text-emerald-100 rounded-3xl border border-emerald-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-emerald-300 flex items-center justify-center text-lg font-black shrink-0 border border-emerald-700">
              <i className="fas fa-check-circle text-emerald-400"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Payment Gateway & Direct UPI Active
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-emerald-900/80 text-[10px] font-bold text-emerald-300 border border-emerald-700">
                  VERIFIED BY SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Verified Payee: <span className="font-mono text-emerald-300 font-bold">{gatewayStatus?.upiId || 'Direct UPI'}</span> {gatewayStatus?.upiPayeeName ? `(${gatewayStatus.upiPayeeName})` : ''}. Link generation is fully active.
              </p>
            </div>
          </div>

          <span className="px-3.5 py-1.5 bg-emerald-900 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-700 hidden sm:inline-block">
            ⚡ Unlocked & Ready
          </span>
        </div>
      )}

      <div className="masjid-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mr-2"></i> Loading payment links...
          </div>
        ) : links.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-qrcode text-3xl mb-2 text-slate-300 block"></i>
            <p className="text-sm font-semibold">No active payment links generated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="masjid-table">
              <thead>
                <tr>
                  <th>Title & Category</th>
                  <th>Amount Setting</th>
                  <th>Shareable Payment URL</th>
                  <th>Total Collected</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td>
                      <span className="font-bold text-slate-900 block">{link.title}</span>
                      <span className="text-[10px] text-emerald-800 font-semibold block">{link.category?.name}</span>
                    </td>
                    <td>
                      {link.amount ? (
                        <span className="font-extrabold text-slate-900 text-sm">₹{link.amount.toLocaleString('en-IN')} (Fixed)</span>
                      ) : (
                        <span className="masjid-badge masjid-badge-info">Custom Amount</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600 font-mono">
                      <span className="bg-slate-100 px-2 py-1 rounded border text-[11px] block truncate max-w-xs">
                        {link.linkUrl || `https://rzp.io/l/${link.id}`}
                      </span>
                    </td>
                    <td className="font-extrabold text-emerald-800 text-sm">
                      ₹{link.totalCollected.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className="masjid-badge masjid-badge-success">{link.status}</span>
                    </td>
                    <td className="text-right space-x-2">
                      <button
                        onClick={() => copyToClipboard(link.linkUrl || `https://rzp.io/l/${link.id}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                      >
                        <i className="fas fa-copy"></i> Copy Link
                      </button>
                      <button
                        onClick={() =>
                          setQrModalData({
                            url: link.linkUrl || `https://rzp.io/l/${link.id}`,
                            title: link.title,
                            amount: link.amount,
                          })
                        }
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs transition"
                      >
                        <i className="fas fa-qrcode"></i> View QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Generate Contribution Link & QR</h3>
                <p className="text-xs text-slate-500">Create a shareable link or printable QR code</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Donation Purpose / Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Jummah Maintenance Fund / Ramadan Iftar"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:bg-white transition font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Fund Category Allocation
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:bg-white transition font-medium"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Fixed Amount (₹) (Optional)
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Leave empty for donor custom amount"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:bg-white transition font-bold font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  If left empty, donors can enter any custom contribution amount.
                </span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-medium">
                <i className="fas fa-shield-halved text-emerald-700"></i>
                <span>Direct settlement to approved Mosque Bank Account ({gatewayStatus?.bankName || 'Verified'}).</span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white rounded-xl text-xs font-extrabold transition shadow-md flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Generating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i> Generate Link & QR
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {qrModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 truncate">{qrModalData.title || 'Donation QR Code'}</h3>
              <button
                type="button"
                onClick={() => setQrModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-4 bg-[#FFF9EC] border border-[#D4AF37]/40 rounded-2xl inline-block shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  qrModalData.url.startsWith('http')
                    ? qrModalData.url
                    : `upi://pay?pa=${encodeURIComponent(gatewayStatus?.upiId || '')}&pn=${encodeURIComponent(
                        gatewayStatus?.upiPayeeName || masjidData?.name || 'Mosque'
                      )}${qrModalData.amount ? `&am=${qrModalData.amount}` : ''}&cu=INR`
                )}`}
                alt="Donation QR Code"
                className="w-48 h-48 mx-auto object-contain bg-white p-2 rounded-xl border border-[#D4AF37]/50"
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg truncate">
                {qrModalData.url}
              </div>
              <p className="text-[11px] text-slate-500">
                Scan using Google Pay, PhonePe, Paytm, or BHIM UPI app.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(qrModalData.url)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-copy"></i> Copy Link
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <i className="fas fa-print"></i> Print QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
