'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  // 1. FORM STATE
  const [masjidName, setMasjidName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2. OTP MODAL & SUBMISSION STATE
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState('');
  const [otpModalError, setOtpModalError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // STEP 1: INITIAL CLICK ON "Submit Registration for Approval"
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOtpModalError('');

    if (!masjidName.trim() || !city.trim() || !state.trim() || !adminName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields before submitting.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), masjidName: masjidName.trim(), purpose: 'SIGNUP_VERIFICATION' }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.otpToken) setOtpToken(data.otpToken);
        setShowOtpModal(true);
      } else {
        setError(data.error || 'Failed to send OTP verification email. Please verify your email address.');
      }
    } catch (err) {
      setError('Connection error while connecting to mail server. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // STEP 2: VERIFY OTP AND SUBMIT REGISTRATION FOR SUPER ADMIN APPROVAL
  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpModalError('Please enter the valid 6-digit OTP code received in your email.');
      return;
    }

    setVerifyingOtp(true);
    setOtpModalError('');

    try {
      // 1. Verify OTP
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otpCode.trim(), otpToken }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setOtpModalError(verifyData.error || 'Invalid or expired 6-digit OTP code.');
        setVerifyingOtp(false);
        return;
      }

      // 2. Submit Registration
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName.trim(),
          email: email.trim().toLowerCase(),
          password,
          masjidName: masjidName.trim(),
          city: city.trim(),
          state: state.trim(),
          country: 'IN',
          currency: 'INR',
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        setOtpModalError(regData.error || 'Registration failed to process. Please try again.');
        setVerifyingOtp(false);
        return;
      }

      // 3. Show Approval Pending Success Screen
      setShowOtpModal(false);
      setRegistrationSuccess(true);
    } catch (err: any) {
      setOtpModalError(err.message || 'An unexpected error occurred.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // RESEND OTP HELPER
  const handleResendOtp = async () => {
    setSendingOtp(true);
    setOtpModalError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), masjidName: masjidName.trim(), purpose: 'SIGNUP_VERIFICATION' }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.otpToken) setOtpToken(data.otpToken);
        alert(`A new 6-digit verification code has been dispatched to ${email}.`);
      } else {
        setOtpModalError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setOtpModalError('Connection error while resending OTP.');
    } finally {
      setSendingOtp(false);
  };

  // REGISTRATION SUCCESSFUL - SENT TO SUPER ADMIN FOR APPROVAL
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-[#f6faf6] py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 flex flex-col justify-center items-center">
        <div className="max-w-lg w-full bg-white border border-slate-200 shadow-2xl rounded-3xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center text-3xl mx-auto shadow-inner">
            <i className="fas fa-paper-plane"></i>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold uppercase tracking-wider">
              Registration Submitted
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sent for Super Admin Approval</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Your registration application for <strong>{masjidName}</strong> has been successfully verified and submitted to Super Admin (<strong>masjidpay3@gmail.com</strong>) for verification & approval.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 font-bold">Mosque Name:</span>
              <span className="font-extrabold text-slate-800">{masjidName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 font-bold">Location:</span>
              <span className="font-extrabold text-slate-800">{city}, {state}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 font-bold">Admin Email:</span>
              <span className="font-extrabold text-slate-800">{email}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-bold">Application Status:</span>
              <span className="font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                ⏳ Pending Review
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/status"
              className="w-full py-3.5 px-4 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-clock-rotate-left"></i> Check Approval Status
            </Link>

            <Link
              href="/login"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition block"
            >
              Return to Login
            </Link>
          </div>

          <div className="pt-2 text-[11px] text-slate-400">
            For expedited approval, reach out to Super Admin on WhatsApp: <a href="https://wa.me/919894977003" target="_blank" className="font-bold text-emerald-700">9894977003</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6faf6] py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800 flex flex-col justify-center">
      {/* BRANDING HEADER */}
      <div className="max-w-lg mx-auto w-full text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-bold text-slate-900 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#0F3D26] text-white flex items-center justify-center shadow-lg shadow-emerald-950/20">
            <i className="fas fa-mosque text-lg"></i>
          </div>
          <span>Masjid<span className="text-emerald-700">Pay</span></span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Register Your Masjid</h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">Join the unified multi-tenant financial SaaS platform</p>
      </div>

      {/* FORM CARD MATCHING USER SCREENSHOT */}
      <div className="max-w-lg mx-auto w-full">
        <div className="masjid-card p-6 sm:p-8 bg-white border border-slate-200/90 shadow-xl rounded-3xl space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <i className="fas fa-circle-exclamation text-rose-500 shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleInitiateRegistration} className="space-y-6">
            {/* 1. MASJID INFORMATION */}
            <div className="space-y-4">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                1. MASJID INFORMATION
              </span>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  MASJID OFFICIAL NAME <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={masjidName}
                  onChange={(e) => setMasjidName(e.target.value)}
                  placeholder="e.g. Al-Noor Islamic Center"
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    CITY <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Vaniyambadi"
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    STATE <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Tamil Nadu"
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 2. ADMIN CREDENTIALS & EMAIL OTP */}
            <div className="space-y-4">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                2. ADMIN CREDENTIALS & EMAIL OTP
              </span>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  COMMITTEE REPRESENTATIVE NAME <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Syed Usman (Secretary)"
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  OFFICIAL ADMIN EMAIL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@alnoormasjid.org"
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  PASSWORD <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>
            </div>

            {/* SINGLE ACTION BUTTON MATCHING EXACT SCREENSHOT */}
            <button
              type="submit"
              disabled={sendingOtp}
              className="w-full py-4 px-4 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-emerald-950/20 transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {sendingOtp ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i> Sending Real Verification Code...
                </>
              ) : (
                'Submit Registration for Approval'
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="border-t border-slate-100 pt-4 text-center space-y-3">
            <div className="text-xs text-slate-500">
              Already have an approved masjid account?{' '}
              <Link href="/login" className="font-bold text-emerald-700 hover:underline">
                Sign In
              </Link>
            </div>
            <div className="text-[11px] text-slate-400">
              Super Admin: <span className="font-semibold text-slate-600">masjidpay3@gmail.com</span> • WhatsApp: <a href="https://wa.me/919894977003" target="_blank" className="font-bold text-emerald-700">9894977003</a>
            </div>
          </div>
        </div>
      </div>

      {/* REAL OTP VERIFICATION MODAL STEP */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  <i className="fas fa-shield-halved"></i>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Email OTP Verification</h3>
                  <p className="text-[11px] text-slate-500">Sent by Super Admin (masjidpay3@gmail.com)</p>
                </div>
              </div>
              <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              We have dispatched a real 6-digit verification code to <strong>{email}</strong>. Please check your inbox (and spam folder) and enter it below to complete your submission.
            </p>

            {otpModalError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <i className="fas fa-circle-exclamation text-rose-600 shrink-0"></i>
                <span>{otpModalError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1 text-center">
                  ENTER 6-DIGIT OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="------"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-mono font-black text-center tracking-widest text-emerald-950 outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex justify-between items-center gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={sendingOtp}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
                >
                  Resend Code
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingOtp}
                    className="px-5 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {verifyingOtp ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin"></i> Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check"></i> Verify & Submit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
