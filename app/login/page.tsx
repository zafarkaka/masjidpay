'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // STEP-UP ACCESS CODE (2FA) STATE
  const [step, setStep] = useState<1 | 2>(1); // 1 = Password, 2 = Access PIN
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [accessPin, setAccessPin] = useState('');
  const [pinMasjidName, setPinMasjidName] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // FORGOT PASSWORD STATE
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

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

  // STEP 1: SUBMIT EMAIL & PASSWORD
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // If Step-Up 2FA PIN is required for this user/masjid
      if (data.requirePin && data.twoFactorToken) {
        setTwoFactorToken(data.twoFactorToken);
        setPinMasjidName(data.masjidName || 'Your Mosque Portal');
        setStep(2);
        setAccessPin('');
        return;
      }

      // Standard direct login
      if (data.user?.role === 'SUPER_ADMIN') {
        router.push('/super-admin/masjids');
      } else if (data.user?.masjidStatus === 'PENDING') {
        router.push('/status');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY ACCESS CODE / SECURITY PIN
  const handleVerifyPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessPin.trim()) {
      setError('Please enter your Access Code / Security PIN.');
      return;
    }

    setVerifyingPin(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twoFactorToken,
          accessPin: accessPin.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid Access Code');
      }

      if (data.user?.role === 'SUPER_ADMIN') {
        router.push('/super-admin/masjids');
      } else if (data.user?.masjidStatus === 'PENDING') {
        router.push('/status');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifyingPin(false);
    }
  };

  // COMMUNITY / GUEST READ-ONLY LOGIN SUBMIT
  const handleCommunityLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enteredCommunityCode.trim() || enteredCommunityCode.trim() === '0') {
      setCommunityError('Secret Access Code is required to view the mosque dashboard. It cannot be blank or 0.');
      return;
    }

    setVerifyingCommunity(true);
    setCommunityError('');

    try {
      const res = await fetch('/api/auth/community-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedMasjidSlug || (masjidList[0]?.slug) || 'jama-masjid',
          communityCode: enteredCommunityCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowCommunityModal(false);
        router.push('/dashboard');
      } else {
        setCommunityError(data.error || 'Failed to enter guest view.');
      }
    } catch (err: any) {
      setCommunityError(err.message || 'An error occurred.');
    } finally {
      setVerifyingCommunity(false);
    }
  };

  // SEND RESET OTP VIA RESEND API
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setSendingOtp(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), purpose: 'PASSWORD_RESET' }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.otpToken) setOtpToken(data.otpToken);
        setForgotSuccess(`Password reset OTP sent to ${forgotEmail} via Resend!`);
        setForgotStep(2);
      } else {
        setForgotError(data.error || 'Failed to send reset OTP.');
      }
    } catch (err) {
      setForgotError('An error occurred while sending OTP code.');
    } finally {
      setSendingOtp(false);
    }
  };

  // VERIFY OTP AND RESET PASSWORD
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword) {
      setForgotError('Please enter both the OTP code and new password.');
      return;
    }

    setResettingPassword(true);
    setForgotError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          otpToken,
          otp: otpCode.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('✓ Password reset successfully! You can now log in.');
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setOtpCode('');
        setNewPassword('');
      } else {
        setForgotError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setForgotError('An error occurred while resetting password.');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#FCFBF7] py-4 sm:py-8 px-3 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        {/* HEADER BRANDING */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight">
              {step === 1 ? 'Login to your mosque' : 'Security PIN Verification'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
              {step === 1 ? 'Access your financial control center' : `Organization: ${pinMasjidName}`}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* TOP PILL SWITCHER: LOGIN / REGISTER MOSQUE */}
        <div className="p-1 bg-[#F5EFE6] rounded-xl sm:rounded-2xl flex items-center mb-3 sm:mb-4 border border-[#EADBCE]">
          <div className="w-1/2 py-1.5 sm:py-2 text-center text-xs font-extrabold text-[#064E3B] bg-white rounded-lg sm:rounded-xl shadow-xs border border-slate-200/80">
            Login
          </div>
          <Link
            href="/register"
            className="w-1/2 py-1.5 sm:py-2 text-center text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg sm:rounded-xl transition"
          >
            Register Mosque
          </Link>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white p-4 sm:p-6 shadow-lg border border-[#EADBCE] rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4">
          {error && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <i className="fas fa-exclamation-circle text-rose-500 shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: EMAIL & PASSWORD FORM */}
          {step === 1 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-0.5 sm:mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <i className="far fa-envelope text-xs"></i>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 sm:py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-xl sm:rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#064E3B] transition"
                    placeholder="admin@jamamasjid.org"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] sm:text-xs font-bold text-[#064E3B] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-lock text-xs"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 sm:py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-xl sm:rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#064E3B] transition"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <i className={`far ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 sm:py-3 px-4 bg-[#1E5D42] hover:bg-[#164732] text-white font-extrabold rounded-xl sm:rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Authenticating...
                    </>
                  ) : (
                    'Sign In to Dashboard'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: SECURITY ACCESS PIN FORM */}
          {step === 2 && (
            <form onSubmit={handleVerifyPinSubmit} className="space-y-3 sm:space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <i className="fas fa-key"></i>
                </div>
                <div>
                  <span className="text-[11px] font-black text-emerald-950 block">Two-Factor PIN Protected</span>
                  <span className="text-[10px] font-semibold text-emerald-800 block">Logged in as {email}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Enter Organization Access PIN *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-shield-halved text-xs text-emerald-700"></i>
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    autoFocus
                    maxLength={12}
                    value={accessPin}
                    onChange={(e) => setAccessPin(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-[#FAF8F5] focus:border-[#064E3B] text-xs font-mono font-black tracking-widest outline-none transition"
                    placeholder="Enter PIN"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <i className={`fas ${showPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Enter the access code generated by your mosque administrator.
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="submit"
                  disabled={verifyingPin}
                  className="w-full py-2.5 sm:py-3 px-4 bg-[#1E5D42] hover:bg-[#164732] text-white font-extrabold rounded-xl sm:rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                >
                  {verifyingPin ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Verifying Access Code...
                    </>
                  ) : (
                    'Verify & Enter Dashboard'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                  }}
                  className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  ← Back to Email & Password
                </button>
              </div>
            </form>
          )}

          {/* OR CONTINUE WITH DIVIDER */}
          <div className="relative py-1 sm:py-1.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-extrabold text-slate-400">
              <span className="bg-white px-2.5">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* VIEW AS COMMUNITY (READ ONLY) BUTTON */}
          <button
            type="button"
            onClick={() => setShowCommunityModal(true)}
            className="w-full py-2 sm:py-2.5 px-3 bg-white hover:bg-[#FAF8F5] text-slate-800 font-bold rounded-xl sm:rounded-2xl border border-slate-300 transition text-xs flex items-center justify-center gap-2 shadow-xs"
          >
            <i className="fas fa-key text-slate-600 text-xs"></i>
            <span>View as Community (Read Only)</span>
          </button>
        </div>

        {/* FOOTER LINKS */}
        <div className="mt-4 sm:mt-6 text-center space-y-1.5">
          <div className="text-[11px] sm:text-xs text-slate-500">
            Need support?{' '}
            <a
              href="https://wa.me/919894977003?text=Assalamu%20Alaikum%2C%20I%20need%20support%20with%20MasjidPay"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#064E3B] hover:underline"
            >
              WhatsApp Support (+91 98949 77003)
            </a>
          </div>

          <div>
            <Link href="/super-admin/login" className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 hover:text-[#064E3B] transition flex items-center justify-center gap-1">
              <i className="fas fa-shield-halved text-[9px]"></i> Super Admin Portal Login →
            </Link>
          </div>
        </div>
      </div>

      {/* COMMUNITY READ-ONLY ACCESS MODAL */}
      {showCommunityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-[#EADBCE] animate-in fade-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setShowCommunityModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 text-base"
            >
              ✕
            </button>

            {/* KEY ICON */}
            <div className="text-center space-y-2 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF9EC] border border-[#D4AF37]/50 text-[#B45309] flex items-center justify-center text-lg mx-auto shadow-xs">
                <i className="fas fa-key"></i>
              </div>
              <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                Community Access
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Enter the Community Access Code to view mosque data
              </p>
            </div>

            {/* READ-ONLY PILL NOTICE */}
            <div className="px-4 py-2.5 bg-[#FFF9EC] border border-[#D4AF37]/40 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-[#92400E]">
              <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0"></span>
              <span>Read-only access — no changes can be made</span>
            </div>

            {communityError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {communityError}
              </div>
            )}

            <form onSubmit={handleCommunityLogin} className="space-y-4">
              {masjidList.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Mosque
                  </label>
                  <select
                    value={selectedMasjidSlug}
                    onChange={(e) => setSelectedMasjidSlug(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#064E3B]"
                  >
                    {masjidList.map((m) => (
                      <option key={m.id} value={m.slug}>
                        {m.name} ({m.city || 'Mosque'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Community Access Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-key text-xs"></i>
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter Community Access Code"
                    value={enteredCommunityCode}
                    onChange={(e) => setEnteredCommunityCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#064E3B] transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={verifyingCommunity}
                  className="w-full py-3.5 px-4 bg-[#1E5D42] hover:bg-[#164732] text-white font-extrabold rounded-2xl shadow-md transition disabled:opacity-50 text-xs tracking-wide cursor-pointer"
                >
                  {verifyingCommunity ? 'Verifying Access Code...' : 'Access Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-bold">
                  <i className="fas fa-key"></i>
                </div>
                <h3 className="text-sm font-black text-slate-900">Reset Account Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep(1);
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 text-base"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                {forgotSuccess}
              </div>
            )}

            {/* MODAL STEP 1: REQUEST OTP */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendResetOtp} className="space-y-3.5 text-xs font-bold text-slate-700">
                <p className="text-slate-500 font-semibold">
                  Enter your registered mosque admin email address to receive a password reset OTP code.
                </p>

                <div>
                  <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                    Registered Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. admin@jamamasjid.org"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingOtp}
                    className="px-5 py-2 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {sendingOtp ? 'Sending OTP...' : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            )}

            {/* MODAL STEP 2: VERIFY OTP & ENTER NEW PASSWORD */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                    6-Digit OTP Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono font-black text-base text-center tracking-widest"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={resettingPassword}
                    className="px-5 py-2 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {resettingPassword ? 'Updating...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
