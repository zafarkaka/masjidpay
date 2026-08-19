'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaymentGatewaySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Gateway state
  const [enableRazorpay, setEnableRazorpay] = useState(true);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState('');

  const [enableUpi, setEnableUpi] = useState(true);
  const [upiId, setUpiId] = useState('jama.masjid@upi');
  const [upiPayeeName, setUpiPayeeName] = useState('');
  const [masjidName, setMasjidName] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [bankAccNo, setBankAccNo] = useState('38920194821');
  const [bankIfsc, setBankIfsc] = useState('SBIN0001234');

  useEffect(() => {
    fetch('/api/masjid/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.masjid) {
          setMasjidName(data.masjid.name || '');
        }
        if (data.gateway) {
          setEnableRazorpay(data.gateway.enableRazorpay);
          setRazorpayKeyId(data.gateway.razorpayKeyId || '');
          setRazorpayKeySecret(data.gateway.razorpayKeySecret || '');
          setRazorpayWebhookSecret(data.gateway.razorpayWebhookSecret || '');
          setEnableUpi(data.gateway.enableUpi);
          setUpiId(data.gateway.upiId || 'jama.masjid@upi');
          setUpiPayeeName(data.gateway.upiPayeeName || data.masjid?.name || '');
          setBankName(data.gateway.bankName || 'State Bank of India');
          setBankAccNo(data.gateway.bankAccNo || '38920194821');
          setBankIfsc(data.gateway.bankIfsc || 'SBIN0001234');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/masjid/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enableRazorpay,
          razorpayKeyId,
          razorpayKeySecret,
          razorpayWebhookSecret,
          enableUpi,
          upiId,
          upiPayeeName,
          bankName,
          bankAccNo,
          bankIfsc,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Payment Gateway API keys & Direct UPI configuration updated successfully!');
      } else {
        setErrorMsg(data.error || 'Failed to update payment gateway settings.');
      }
    } catch (err) {
      setErrorMsg('An error occurred while saving gateway settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const activePayeeName = upiPayeeName.trim() || masjidName || 'Mosque Trust';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(activePayeeName)}&cu=INR`
  )}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">SYSTEM</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Payment Gateway & UPI Setup</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Configure Razorpay API Key credentials and Direct UPI QR Code options for automated donations
          </p>
        </div>

        <Link
          href="/dashboard/payment-links"
          className="px-4 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2"
        >
          <i className="fas fa-qrcode"></i> View Payment Links →
        </Link>
      </div>

      {/* ALERTS */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <i className="fas fa-check-circle text-emerald-600"></i> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <i className="fas fa-circle-exclamation text-rose-600"></i> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold">
          <i className="fas fa-circle-notch fa-spin text-emerald-700 text-2xl mb-2"></i>
          <p>Loading gateway configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* RAZORPAY CONFIGURATION CARD */}
          <div className="masjid-card p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-black">
                  <i className="fas fa-credit-card"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Razorpay Payment Gateway</h3>
                  <p className="text-xs text-slate-500">Accept Credit Cards, Debit Cards, Netbanking & UPI via Razorpay</p>
                </div>
              </div>

              <label className="inline-flex items-center gap-3 cursor-pointer p-2 rounded-2xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={enableRazorpay}
                  onChange={(e) => setEnableRazorpay(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 accent-[#0F3D26] cursor-pointer"
                />
                <span className={`text-xs font-bold ${enableRazorpay ? 'text-emerald-800' : 'text-slate-400'}`}>
                  {enableRazorpay ? '☑ Enabled' : '☐ Disabled'}
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    RAZORPAY KEY ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    placeholder="rzp_live_..."
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    RAZORPAY KEY SECRET <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  WEBHOOK SECRET <span className="text-slate-400 font-normal">(OPTIONAL FOR INSTANT WEBHOOK SYNC)</span>
                </label>
                <input
                  type="text"
                  value={razorpayWebhookSecret}
                  onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* DIRECT UPI & BANK QR CARD */}
          <div className="masjid-card p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black">
                  <i className="fas fa-qrcode"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Direct UPI & Bank QR Code</h3>
                  <p className="text-xs text-slate-500">Allow donors to scan directly via Google Pay, PhonePe, Paytm, and BHIM</p>
                </div>
              </div>

              <label className="inline-flex items-center gap-3 cursor-pointer p-2 rounded-2xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={enableUpi}
                  onChange={(e) => setEnableUpi(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 accent-[#0F3D26] cursor-pointer"
                />
                <span className={`text-xs font-bold ${enableUpi ? 'text-emerald-800' : 'text-slate-400'}`}>
                  {enableUpi ? '☑ Enabled' : '☐ Disabled'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      MOSQUE UPI VPA ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@upi or 9894977003@okaxis"
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      UPI PAYEE / DISPLAY NAME <span className="text-slate-400 font-normal">(AS IN BANK / UPI APP)</span>
                    </label>
                    <input
                      type="text"
                      value={upiPayeeName}
                      onChange={(e) => setUpiPayeeName(e.target.value)}
                      placeholder={masjidName || 'e.g. Your Registered Mosque / Trust Name'}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      BANK NAME
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      IFSC CODE
                    </label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      placeholder="e.g. SBIN0001234"
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    ACCOUNT NUMBER
                  </label>
                  <input
                    type="text"
                    value={bankAccNo}
                    onChange={(e) => setBankAccNo(e.target.value)}
                    placeholder="e.g. 38920194821"
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* LIVE GENERATED UPI QR CODE PREVIEW */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">LIVE DYNAMIC QR CODE</span>
                <div className="w-36 h-36 bg-white p-2 border rounded-2xl shadow-sm flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-extrabold text-emerald-800 block">{upiId}</span>
                  <span className="text-[11px] text-slate-600 block font-bold truncate max-w-[180px]">
                    {activePayeeName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-950/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <i className="fas fa-save"></i>
              {submitting ? 'Saving Gateway Settings...' : 'Save Payment Gateway & UPI Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
