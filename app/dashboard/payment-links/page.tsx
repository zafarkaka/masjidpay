'use client';

import { useEffect, useState } from 'react';

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          masjidId,
          categoryId: form.categoryId || 'default-cat',
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Razorpay Online Payment Links & QR Codes</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Generate UPI payment links, shareable URLs, and printable QR codes for online contributions</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 text-xs transition flex items-center gap-2"
        >
          <i className="fas fa-qrcode"></i> Generate Payment Link
        </button>
      </div>

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
                        <i className="fas fa-copy"></i> Copy
                      </button>
                      <button
                        onClick={() => setQrModalUrl(link.linkUrl || `https://rzp.io/l/${link.id}`)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs transition"
                      >
                        <i className="fas fa-qrcode"></i> QR
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Generate Razorpay Payment Link</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Purpose / Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Help Support Our Masjid"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fixed Amount (₹) (Optional)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Leave blank to allow donor custom amount"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Create Razorpay Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {qrModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Scan to Donate via UPI</h3>
            <div className="p-4 bg-slate-50 border rounded-2xl inline-block">
              {/* SVG QR Code Simulation */}
              <div className="w-48 h-48 bg-emerald-950 rounded-xl p-3 flex flex-col justify-between items-center text-white text-xs text-center font-mono">
                <i className="fas fa-qrcode text-8xl text-emerald-400 my-auto"></i>
                <span className="text-[10px] text-emerald-300">UPI / RAZORPAY SECURE</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-mono truncate">{qrModalUrl}</p>
            <button
              onClick={() => setQrModalUrl(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
