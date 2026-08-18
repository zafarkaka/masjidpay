'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      if (data.user.role === 'SUPER_ADMIN') {
        router.push('/super-admin/masjids');
      } else if (data.user.masjidStatus === 'PENDING') {
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

      if (data.user.role === 'SUPER_ADMIN') {
        router.push('/super-admin/masjids');
      } else if (data.user.masjidStatus === 'PENDING') {
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
    <div className="min-h-screen flex flex-col justify-center bg-[#FFF9EC] py-12 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 text-2xl font-bold text-slate-900 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#064E3B] text-[#F4D06F] border border-[#D4AF37]/50 flex items-center justify-center shadow-lg shadow-emerald-950/20">
            <i className="fas fa-mosque text-lg"></i>
          </div>
          <span>Masjid<span className="text-[#064E3B]">Pay</span></span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {step === 1 ? 'Account Login' : 'Security PIN Verification'}
        </h2>
        <p className="mt-1 text-xs text-slate-600 font-medium">
          {step === 1 ? 'Access your financial control center' : `Organization: ${pinMasjidName}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="masjid-card p-6 sm:p-8 bg-white shadow-xl border border-[#D4AF37]/30 rounded-3xl space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <i className="fas fa-exclamation-circle text-rose-500 shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: EMAIL & PASSWORD FORM */}
          {step === 1 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fas fa-envelope text-sm"></i>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#D4AF37]/40 bg-[#FFF9EC] focus:border-[#064E3B] text-xs font-semibold outline-none transition"
                    placeholder="admin@jamamasjid.org"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                    <i className="fas fa-lock text-sm"></i>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#D4AF37]/40 bg-[#FFF9EC] focus:border-[#064E3B] text-xs font-semibold outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold rounded-2xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
              >
                {loading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i> Authenticating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-arrow-right"></i> Continue to Sign In
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: SECURITY ACCESS CODE / PIN FORM */}
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
                    className="w-full pl-10 pr-10 py-3 rounded-2xl border border-[#D4AF37]/40 bg-[#FFF9EC] focus:border-[#064E3B] text-sm font-mono font-black tracking-widest outline-none transition"
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
                  className="w-full py-3.5 px-4 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold rounded-2xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                >
                  {verifyingPin ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Verifying Access Code...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-unlock-keyhole"></i> Verify & Enter Dashboard
                    </>
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

          {/* REGISTER LINK & WHATSAPP SUPPORT BUTTON */}
          <div className="border-t border-slate-100 pt-4 space-y-3 text-center">
            <div className="text-xs text-slate-500">
              Need to register a new masjid?{' '}
              <Link href="/register" className="font-bold text-[#064E3B] hover:underline">
                Register Here
              </Link>
            </div>

            <div className="p-3 bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Support WhatsApp:</span>
              <a
                href="https://wa.me/919894977003?text=Assalamu%20Alaikum%2C%20I%20need%20support%20with%20MasjidPay%20SaaS"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-[#128C7E] hover:underline flex items-center gap-1"
              >
                <i className="fab fa-whatsapp text-sm text-[#25D366]"></i> +91 98949 77003
              </a>
            </div>

            <div className="pt-2 text-center">
              <Link href="/super-admin/login" className="text-[11px] font-extrabold text-slate-400 hover:text-[#064E3B] transition flex items-center justify-center gap-1">
                <i className="fas fa-shield-halved text-[10px]"></i> Super Admin Portal Login →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D4AF37]/30 space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
                  Enter your registered mosque admin email address to receive a secure password reset OTP code.
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
