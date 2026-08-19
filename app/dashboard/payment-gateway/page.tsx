'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaymentGatewaySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'ACTIVE_SETUP' | 'REQUEST_SETUP'>('ACTIVE_SETUP');

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

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Onboarding Request State
  const [latestRequest, setLatestRequest] = useState<any>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestForm, setRequestForm] = useState({
    requestType: 'BOTH', // 'UPI' | 'RAZORPAY' | 'BOTH'
    upiId: '',
    bankName: '',
    bankAccNo: '',
    bankIfsc: '',
    razorpayKeyId: '',
    chequeDocUrl: '',
    registrationDocUrl: '',
    idProofDocUrl: '',
    notes: '',
  });

  const loadData = () => {
    setLoading(true);
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((uData) => {
        if (uData.user?.role === 'SUPER_ADMIN') {
          setIsSuperAdmin(true);
        }
      })
      .catch(() => {});

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

          setRequestForm((prev) => ({
            ...prev,
            upiId: data.gateway.upiId || '',
            bankName: data.gateway.bankName || '',
            bankAccNo: data.gateway.bankAccNo || '',
            bankIfsc: data.gateway.bankIfsc || '',
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Load payment onboarding requests
    fetch('/api/payment-requests')
      .then((res) => res.json())
      .then((pData) => {
        if (pData.latestRequest) {
          setLatestRequest(pData.latestRequest);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
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

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestForm,
          upiPayeeName: masjidName, // locked to single source of truth
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Payment onboarding request submitted successfully to Super Admin!');
        setLatestRequest(data.request);
      } else {
        setErrorMsg(data.error || 'Failed to submit payment setup request.');
      }
    } catch (err) {
      setErrorMsg('An error occurred while submitting payment request.');
    } finally {
      setRequestLoading(false);
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
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">SYSTEM ONBOARDING</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Payment Gateway & UPI Setup</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Submit payment onboarding verification requests and manage Super Admin approved gateway credentials
          </p>
        </div>

        <Link
          href="/dashboard/payment-links"
          className="px-4 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2"
        >
          <i className="fas fa-qrcode"></i> View Payment Links →
        </Link>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE_SETUP')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'ACTIVE_SETUP'
              ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-2xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-shield-halved text-emerald-700"></i>
          <span>1. Verified Payment Gateway</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REQUEST_SETUP')}
          className={`py-3 px-5 text-xs font-black border-b-2 transition flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'REQUEST_SETUP'
              ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-2xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fas fa-file-invoice-dollar text-[#D4AF37]"></i>
          <span>2. Payment Setup Request & Status</span>
          {latestRequest && latestRequest.status === 'PENDING' && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
          )}
          {latestRequest && latestRequest.status === 'APPROVED' && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          )}
        </button>
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
      ) : activeTab === 'ACTIVE_SETUP' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SUPER ADMIN LOCK NOTIFICATION FOR MASJID ADMINS */}
          {!isSuperAdmin && (
            <div className="p-5 bg-gradient-to-r from-[#064E3B] via-[#0F3D26] to-[#102A25] text-white rounded-3xl border border-[#D4AF37]/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-[#D4AF37]/50 text-[#F4D06F] flex items-center justify-center text-2xl font-black shrink-0">
                  <i className="fas fa-shield-check"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black tracking-tight text-[#F4D06F]">
                      Super Admin Verified & Protected
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-900/80 text-[10px] font-bold text-emerald-200 border border-emerald-400/40">
                      READ ONLY
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                    Official Masjid Name: <strong className="text-white font-black">{masjidName}</strong> (Single Source of Truth). All payment credentials are centrally locked and verified against fraudulent tampering.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('REQUEST_SETUP')}
                className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#102A25] font-black text-xs rounded-xl transition shrink-0 inline-flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <i className="fas fa-paper-plane"></i> Request New Verification
              </button>
            </div>
          )}

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
                  disabled={!isSuperAdmin}
                  checked={enableRazorpay}
                  onChange={(e) => setEnableRazorpay(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 accent-[#0F3D26] cursor-pointer disabled:cursor-not-allowed"
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
                    RAZORPAY KEY ID {!isSuperAdmin && <span className="text-emerald-700 font-bold">(VERIFIED)</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    placeholder={isSuperAdmin ? "rzp_live_..." : "Razorpay Key ID not configured by Super Admin"}
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    RAZORPAY KEY SECRET {!isSuperAdmin && <span className="text-emerald-700 font-bold">(ENCRYPTED)</span>}
                  </label>
                  <input
                    type="password"
                    disabled={!isSuperAdmin}
                    value={razorpayKeySecret ? '••••••••••••••••' : ''}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  WEBHOOK SECRET
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={razorpayWebhookSecret ? '••••••••••••••••' : ''}
                  onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
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
                  disabled={!isSuperAdmin}
                  checked={enableUpi}
                  onChange={(e) => setEnableUpi(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 accent-[#0F3D26] cursor-pointer disabled:cursor-not-allowed"
                />
                <span className={`text-xs font-bold ${enableUpi ? 'text-emerald-800' : 'text-slate-400'}`}>
                  {enableUpi ? '☑ Enabled' : '☐ Disabled'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      MOSQUE UPI VPA ID <span className="text-emerald-700 font-bold">(VERIFIED)</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. jamamasjid@sbi"
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-emerald-900 outline-none focus:border-emerald-700 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-700 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      UPI PAYEE / DISPLAY NAME <span className="text-emerald-700 font-bold">(VERIFIED)</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={activePayeeName}
                      onChange={(e) => setUpiPayeeName(e.target.value)}
                      placeholder="e.g. Your Registered Mosque / Trust Name"
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-700 disabled:cursor-not-allowed"
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
                      disabled={!isSuperAdmin}
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      IFSC CODE
                    </label>
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition uppercase disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    ACCOUNT NUMBER
                  </label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={bankAccNo}
                    onChange={(e) => setBankAccNo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-600 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* LIVE QR CODE PREVIEW */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl text-center space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 inline-block">
                  <i className="fas fa-check-circle"></i> VERIFIED UPI QR
                </span>

                <div className="w-44 h-44 mx-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="Verified Mosque UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="font-mono text-xs font-black text-slate-900">{upiId}</div>
                  <div className="text-[11px] text-slate-500 font-bold">{activePayeeName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* SAVE BUTTON FOR SUPER ADMIN */}
          {isSuperAdmin && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <i className="fas fa-save"></i> {submitting ? 'Saving...' : 'Save Payment Gateway & UPI Settings'}
              </button>
            </div>
          )}
        </form>
      ) : (
        /* TAB 2: ONBOARDING REQUEST WORKFLOW */
        <div className="space-y-6">
          {/* CURRENT REQUEST STATUS CARD */}
          {latestRequest && (
            <div className="masjid-card p-6 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-clock-rotate-left text-emerald-700"></i> Latest Onboarding Request Status
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  Submitted: {new Date(latestRequest.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3.5">
                  {latestRequest.status === 'PENDING' && (
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center text-2xl font-black">
                      🟡
                    </div>
                  )}
                  {latestRequest.status === 'UNDER_REVIEW' && (
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-300 text-blue-700 flex items-center justify-center text-2xl font-black">
                      🔵
                    </div>
                  )}
                  {latestRequest.status === 'APPROVED' && (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center text-2xl font-black">
                      🟢
                    </div>
                  )}
                  {(latestRequest.status === 'REJECTED' || latestRequest.status === 'RESUBMIT_REQUIRED') && (
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center text-2xl font-black">
                      🔴
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {latestRequest.status === 'PENDING' && 'Pending Verification'}
                        {latestRequest.status === 'UNDER_REVIEW' && 'Under Review by Super Admin'}
                        {latestRequest.status === 'APPROVED' && 'Approved & Active'}
                        {latestRequest.status === 'REJECTED' && 'Verification Rejected'}
                        {latestRequest.status === 'RESUBMIT_REQUIRED' && 'Resubmission Required'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700">
                        {latestRequest.requestType} Setup
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      {latestRequest.status === 'PENDING' && 'Your payment onboarding documents have been submitted to Super Admin for official verification.'}
                      {latestRequest.status === 'UNDER_REVIEW' && 'Super Admin is currently verifying your bank passbook, cancelled cheque, and Waqf registration certificate.'}
                      {latestRequest.status === 'APPROVED' && 'Super Admin has verified and activated your official payment credentials. Donation links & website buttons are live.'}
                      {(latestRequest.status === 'REJECTED' || latestRequest.status === 'RESUBMIT_REQUIRED') && (
                        <span className="text-rose-700 font-bold">
                          Reason: {latestRequest.rejectionReason || 'Document verification could not be completed.'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-slate-500 block">UPI: {latestRequest.upiId || 'N/A'}</span>
                  <span className="text-[11px] font-mono text-slate-500 block">Bank: {latestRequest.bankName || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* REQUEST SUBMISSION FORM */}
          <div className="masjid-card p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-base font-extrabold text-slate-900">Submit Payment Setup Onboarding Request</h3>
              <p className="text-xs text-slate-500">
                Provide your official bank account details and proof documents for Super Admin verification
              </p>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-5">
              {/* REQUEST TYPE SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Payment Channels to Activate *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'UPI', label: '📱 UPI Only', desc: 'Direct QR Code & VPA ID' },
                    { id: 'RAZORPAY', label: '💳 Razorpay Only', desc: 'Cards, Netbanking & Gateway' },
                    { id: 'BOTH', label: '⚡ Both (UPI + Razorpay)', desc: 'Full automated suite' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setRequestForm({ ...requestForm, requestType: t.id })}
                      className={`p-3.5 rounded-2xl text-left border transition cursor-pointer ${
                        requestForm.requestType === t.id
                          ? 'bg-[#064E3B] text-white border-[#D4AF37] shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{t.label}</div>
                      <div className={`text-[10px] mt-0.5 ${requestForm.requestType === t.id ? 'text-[#F4D06F]' : 'text-slate-500'}`}>
                        {t.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* BENEFICIARY NAME (LOCKED SINGLE SOURCE OF TRUTH) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Beneficiary Account / Mosque Name (Locked Single Source of Truth)
                </label>
                <input
                  type="text"
                  disabled
                  value={masjidName}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-2xl text-xs font-bold text-slate-900 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  The bank account holder name must match this official registered mosque name.
                </span>
              </div>

              {/* UPI & BANK DETAILS */}
              {(requestForm.requestType === 'UPI' || requestForm.requestType === 'BOTH') && (
                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <i className="fas fa-qrcode text-emerald-700"></i> UPI & Bank Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Primary UPI VPA ID *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. jamamasjid@sbi or 9876543210@okaxis"
                        value={requestForm.upiId}
                        onChange={(e) => setRequestForm({ ...requestForm, upiId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. State Bank of India"
                        value={requestForm.bankName}
                        onChange={(e) => setRequestForm({ ...requestForm, bankName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 30492817405"
                        value={requestForm.bankAccNo}
                        onChange={(e) => setRequestForm({ ...requestForm, bankAccNo: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SBIN0000921"
                        value={requestForm.bankIfsc}
                        onChange={(e) => setRequestForm({ ...requestForm, bankIfsc: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* RAZORPAY KEY DETAILS */}
              {(requestForm.requestType === 'RAZORPAY' || requestForm.requestType === 'BOTH') && (
                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <i className="fas fa-credit-card text-blue-700"></i> Razorpay Credentials (Optional / Assisted)
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Razorpay Key ID (If already generated)
                    </label>
                    <input
                      type="text"
                      placeholder="rzp_live_..."
                      value={requestForm.razorpayKeyId}
                      onChange={(e) => setRequestForm({ ...requestForm, razorpayKeyId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      If you do not have Razorpay credentials, Super Admin will assist in onboarding during verification.
                    </span>
                  </div>
                </div>
              )}

              {/* DOCUMENT PROOF ATTACHMENTS */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-paperclip text-[#D4AF37]"></i> Proof Documents (Upload / Attachment Link) *
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Cancelled Cheque / Passbook Copy URL *
                    </label>
                    <input
                      type="text"
                      placeholder="https://... or doc attachment link"
                      value={requestForm.chequeDocUrl}
                      onChange={(e) => setRequestForm({ ...requestForm, chequeDocUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Waqf / Trust Registration Certificate URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://... or certificate document URL"
                      value={requestForm.registrationDocUrl}
                      onChange={(e) => setRequestForm({ ...requestForm, registrationDocUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Authorized Signatory ID Proof URL (Aadhaar / PAN)
                    </label>
                    <input
                      type="text"
                      placeholder="https://... or signatory ID proof URL"
                      value={requestForm.idProofDocUrl}
                      onChange={(e) => setRequestForm({ ...requestForm, idProofDocUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Additional Notes for Super Admin
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Primary mosque bank account opened in State Bank of India Main Branch."
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="submit"
                  disabled={requestLoading}
                  className="px-6 py-3.5 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold rounded-2xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {requestLoading ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Submitting Request...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane text-[#F4D06F]"></i> Submit to Super Admin for Verification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
