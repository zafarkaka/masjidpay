'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  // FORM STATE
  const [masjidName, setMasjidName] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('IN');
  const [communityAccessCode, setCommunityAccessCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP MODAL & SUBMISSION STATE
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState('');
  const [otpModalError, setOtpModalError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // COMMUNITY MODAL STATE
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [masjidList, setMasjidList] = useState<any[]>([]);
  const [selectedMasjidSlug, setSelectedMasjidSlug] = useState('');
  const [enteredCommunityCode, setEnteredCommunityCode] = useState('');
  const [communityError, setCommunityError] = useState('');
  const [verifyingCommunity, setVerifyingCommunity] = useState(false);

  useEffect(() => {
    fetch('/api/auth/community-login')
      .then((res) => res.json())
      .then((data) => {
        if (data.masjids) {
          setMasjidList(data.masjids);
          if (data.masjids.length > 0) setSelectedMasjidSlug(data.masjids[0].slug);
        }
      })
      .catch(() => {});
  }, []);

  // STEP 1: INITIAL SUBMIT -> SEND OTP
  const handleInitiateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOtpModalError('');

    if (!masjidName.trim() || !address.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
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
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          masjidName: masjidName.trim(),
          purpose: 'SIGNUP_VERIFICATION',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.otpToken) setOtpToken(data.otpToken);
        setShowOtpModal(true);
      } else {
        setError(data.error || 'Failed to send OTP verification email.');
      }
    } catch (err) {
      setError('Connection error while reaching the mail server.');
    } finally {
      setSendingOtp(false);
    }
  };

  // STEP 2: VERIFY OTP AND COMPLETE REGISTRATION
  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpModalError('Please enter the 6-digit OTP code received in your email.');
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
          name: masjidName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
          masjidName: masjidName.trim(),
          address: address.trim(),
          city: address.trim(),
          state: 'State',
          country,
          communityAccessCode: communityAccessCode.trim() || '7860',
        }),
      });

      const regData = await regRes.json();
      if (regRes.ok) {
        setShowOtpModal(false);
        setRegistrationSuccess(true);
      } else {
        setOtpModalError(regData.error || 'Registration failed.');
      }
    } catch (err) {
      setOtpModalError('Failed to complete registration.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // COMMUNITY READ-ONLY LOGIN SUBMIT
  const handleCommunityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredCommunityCode.trim()) {
      setCommunityError('Please enter the Community Access Code.');
      return;
    }

    setVerifyingCommunity(true);
    setCommunityError('');

    try {
      const res = await fetch('/api/auth/community-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedMasjidSlug,
          communityCode: enteredCommunityCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowCommunityModal(false);
        router.push('/dashboard');
      } else {
        setCommunityError(data.error || 'Invalid Community Access Code.');
      }
    } catch (err: any) {
      setCommunityError(err.message || 'An error occurred.');
    } finally {
      setVerifyingCommunity(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#FCFBF7] py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* HEADER BRANDING */}
        <div className="text-left mb-5">
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Register your mosque
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create an account to get started
          </p>
        </div>

        {/* TOP PILL SWITCHER: LOGIN / REGISTER MOSQUE */}
        <div className="p-1 bg-[#F5EFE6] rounded-2xl flex items-center mb-6 border border-[#EADBCE]">
          <Link
            href="/login"
            className="w-1/2 py-2 text-center text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition"
          >
            Login
          </Link>
          <div className="w-1/2 py-2 text-center text-xs font-extrabold text-[#064E3B] bg-white rounded-xl shadow-xs border border-slate-200/80">
            Register Mosque
          </div>
        </div>

        {/* REGISTRATION FORM CARD */}
        <div className="bg-white p-6 sm:p-7 shadow-xl border border-[#EADBCE] rounded-3xl space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-rose-500 shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          {registrationSuccess ? (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h3 className="text-base font-bold text-emerald-950">Registration Submitted!</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your mosque registration for <strong>{masjidName}</strong> has been submitted. Our Super Admin team will review and approve your portal shortly.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-[#064E3B] text-white font-extrabold text-xs rounded-xl shadow-md inline-block"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInitiateRegistration} className="space-y-3.5">
              {/* MOSQUE NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mosque Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="far fa-building text-sm"></i>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jama Masjid"
                    value={masjidName}
                    onChange={(e) => setMasjidName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#064E3B] transition"
                  />
                </div>
              </div>

              {/* ADDRESS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-location-dot text-sm"></i>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Mosque Location"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#064E3B] transition"
                  />
                </div>
              </div>

              {/* COUNTRY */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Country
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-globe text-sm"></i>
                  </div>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#064E3B] appearance-none transition"
                  >
                    <option value="IN">IN  India (₹)</option>
                    <option value="AE">AE  United Arab Emirates (AED)</option>
                    <option value="SA">SA  Saudi Arabia (SAR)</option>
                    <option value="US">US  United States ($)</option>
                    <option value="GB">GB  United Kingdom (£)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                    <i className="fas fa-chevron-down"></i>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Currency will be set based on your country.
                </span>
              </div>

              {/* COMMUNITY ACCESS CODE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Community Access Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-key text-xs"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 7860 or community123"
                    value={communityAccessCode}
                    onChange={(e) => setCommunityAccessCode(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#064E3B] transition"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Share this code with members for read-only access.
                </span>
              </div>

              {/* EMAIL ADDRESS */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="far fa-envelope text-sm"></i>
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="zafukaka@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#064E3B] transition"
                  />
                </div>
              </div>

              {/* PHONE NUMBER (OPTIONAL) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-phone text-xs"></i>
                  </div>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#064E3B] transition"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-lock text-xs"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-blue-50/50 border border-blue-200/80 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#064E3B] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <i className={`far ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-lock text-xs"></i>
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#064E3B] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <i className={`far ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full py-3 px-4 bg-[#1E5D42] hover:bg-[#164732] text-white font-extrabold rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                >
                  {sendingOtp ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Sending Verification Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* OR CONTINUE WITH DIVIDER */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-extrabold text-slate-400">
              <span className="bg-white px-3">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* VIEW AS COMMUNITY (READ ONLY) BUTTON */}
          <button
            type="button"
            onClick={() => setShowCommunityModal(true)}
            className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF8F5] text-slate-800 font-bold rounded-2xl border border-slate-300 transition text-xs flex items-center justify-center gap-2 shadow-xs"
          >
            <i className="fas fa-key text-slate-600 text-xs"></i>
            <span>View as Community (Read Only)</span>
          </button>
        </div>
      </div>

      {/* OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Email Verification Code</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Code sent to <strong>{email}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base"
              >
                ✕
              </button>
            </div>

            {otpModalError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {otpModalError}
              </div>
            )}

            <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-center text-lg font-mono font-black tracking-widest outline-none focus:border-[#064E3B] bg-[#FAF8F5]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || otpCode.trim().length !== 6}
                  className="px-5 py-2 bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {verifyingOtp ? 'Verifying...' : 'Confirm & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMMUNITY READ-ONLY ACCESS MODAL */}
      {showCommunityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-base font-bold shadow-xs">
                  <i className="fas fa-key"></i>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Community Access</h3>
                  <p className="text-xs text-slate-500 font-medium">Read-Only Mosque Financial View</p>
                </div>
              </div>
              <button
                onClick={() => setShowCommunityModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base"
              >
                ✕
              </button>
            </div>

            {communityError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {communityError}
              </div>
            )}

            <form onSubmit={handleCommunityLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Mosque *
                </label>
                <select
                  required
                  value={selectedMasjidSlug}
                  onChange={(e) => setSelectedMasjidSlug(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#064E3B]"
                >
                  {masjidList.length === 0 ? (
                    <option value="jama-masjid">Jama Masjid Vaniyambadi</option>
                  ) : (
                    masjidList.map((m) => (
                      <option key={m.id} value={m.slug}>
                        {m.name} ({m.city || 'Mosque'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Community Access Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7860 or community123"
                  value={enteredCommunityCode}
                  onChange={(e) => setEnteredCommunityCode(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-slate-200 rounded-xl text-xs font-mono font-bold text-center tracking-widest text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Enter the read-only access code provided by your mosque committee.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCommunityModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingCommunity || !enteredCommunityCode.trim()}
                  className="px-5 py-2 bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {verifyingCommunity ? 'Verifying...' : 'Unlock Read-Only View'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
