'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="min-h-screen flex flex-col justify-center bg-[#FCFBF7] py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* HEADER BRANDING */}
        <div className="text-left mb-5">
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            {step === 1 ? 'Login to your mosque' : 'Security PIN Verification'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {step === 1 ? 'Access your financial control center' : `Organization: ${pinMasjidName}`}
          </p>
        </div>

        {/* TOP PILL SWITCHER: LOGIN / REGISTER MOSQUE */}
        <div className="p-1 bg-[#F5EFE6] rounded-2xl flex items-center mb-6 border border-[#EADBCE]">
          <div className="w-1/2 py-2 text-center text-xs font-extrabold text-[#064E3B] bg-white rounded-xl shadow-xs border border-slate-200/80">
            Login
          </div>
          <Link
            href="/register"
            className="w-1/2 py-2 text-center text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition"
          >
            Register Mosque
          </Link>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white p-6 sm:p-7 shadow-xl border border-[#EADBCE] rounded-3xl space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <i className="fas fa-exclamation-circle text-rose-500 shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: EMAIL & PASSWORD FORM */}
          {step === 1 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#064E3B] transition"
                    placeholder="admin@jamamasjid.org"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-bold text-[#064E3B] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-lock text-xs"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#064E3B] transition"
                    placeholder="••••••••"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#1E5D42] hover:bg-[#164732] text-white font-extrabold rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
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
            <form onSubmit={handleVerifyPinSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  <i className="fas fa-key"></i>
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-950 block">Two-Factor PIN Protected</span>
                  <span className="text-[11px] font-semibold text-emerald-800 block">Logged in as {email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Enter Organization Access PIN *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-shield-halved text-sm text-emerald-700"></i>
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    autoFocus
                    maxLength={12}
                    value={accessPin}
                    onChange={(e) => setAccessPin(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-200 bg-[#FAF8F5] focus:border-[#064E3B] text-sm font-mono font-black tracking-widest outline-none transition"
                    placeholder="Enter PIN"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <i className={`fas ${showPin ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Enter the access code generated by your mosque administrator.
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={verifyingPin}
                  className="w-full py-3 px-4 bg-[#1E5D42] hover:bg-[#164732] text-white font-extrabold rounded-2xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
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
                  className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  ← Back to Email & Password
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

        {/* FOOTER LINKS */}
        <div className="mt-6 text-center space-y-2">
          <div className="text-xs text-slate-500">
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
            <Link href="/super-admin/login" className="text-[11px] font-extrabold text-slate-400 hover:text-[#064E3B] transition flex items-center justify-center gap-1">
              <i className="fas fa-shield-halved text-[10px]"></i> Super Admin Portal Login →
            </Link>
          </div>
        </div>
      </div>

      {/* COMMUNITY READ-ONLY ACCESS MODAL */}
      {showCommunityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-base font-bold shadow-xs">
                  <i className="fas fa-eye"></i>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Community & Guest Access</h3>
                  <p className="text-xs text-slate-500 font-medium">Read-Only Financial Transparency</p>
                </div>
              </div>
              <button
                onClick={() => setShowCommunityModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 leading-relaxed space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                <i className="fas fa-shield-halved text-emerald-700"></i> Read-Only Transparency Mode
              </p>
              <p className="text-slate-600">
                You can browse financial income, expenditures, budgets, and collections. <strong>Editing, creating, and amendments are disabled.</strong>
              </p>
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
                  Secret Access Code * <span className="text-rose-600 font-bold text-[10px]">(Required)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter mosque secret code (e.g. 7860)"
                  value={enteredCommunityCode}
                  onChange={(e) => setEnteredCommunityCode(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-slate-200 rounded-xl text-xs font-mono font-bold text-center tracking-widest text-slate-900 focus:outline-none focus:border-[#064E3B]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ask your mosque administrator/committee for the secret code to enter read-only transparency mode.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCommunityModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingCommunity}
                  className="px-5 py-2.5 bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <i className="fas fa-eye"></i>
                  {verifyingCommunity ? 'Opening Guest View...' : 'View Mosque (Read Only)'}
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
