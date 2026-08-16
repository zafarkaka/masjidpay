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

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Automatically redirect based on authenticated user role
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

  // STEP 1: SEND RESET OTP VIA RESEND API
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

  // STEP 2: VERIFY OTP AND RESET PASSWORD
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword) {
      setForgotError('Please enter both the OTP code and new password.');
      return;
    }

    setResettingPassword(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), otp: otpCode.trim(), newPassword, otpToken }),
      });

      const data = await res.json();
      if (res.ok) {
        setForgotSuccess('Password reset successfully! Auto-filling your credentials...');
        setEmail(forgotEmail);
        setPassword(newPassword);
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
        }, 2000);
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
          Account Login
        </h2>
        <p className="mt-1 text-xs text-slate-600 font-medium">
          Access your financial control center
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="masjid-card p-6 sm:p-8 bg-white shadow-xl border border-[#D4AF37]/30 rounded-3xl space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-rose-500 shrink-0"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  <i className="fas fa-sign-in-alt"></i> Sign In to Dashboard
                </>
              )}
            </button>
          </form>

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

      {/* FORGOT PASSWORD MODAL WITH RESEND OTP */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  <i className="fas fa-key"></i>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Reset Account Password</h3>
              </div>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {forgotSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <i className="fas fa-check-circle text-emerald-600"></i> {forgotSuccess}
              </div>
            )}

            {forgotError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-rose-600"></i> {forgotError}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetOtp} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Enter your registered official email address. A 6-digit verification code will be dispatched to your inbox.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Official Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@jamamasjid.org"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-emerald-700 text-xs font-semibold outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingOtp}
                    className="w-1/2 py-3 bg-[#064E3B] text-white font-extrabold rounded-2xl text-xs shadow-md disabled:opacity-50"
                  >
                    {sendingOtp ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 text-center tracking-widest text-lg font-bold rounded-2xl border border-slate-300 focus:border-emerald-700 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-emerald-700 text-xs font-semibold outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-1/2 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={resettingPassword}
                    className="w-1/2 py-3 bg-[#064E3B] text-white font-extrabold rounded-2xl text-xs shadow-md disabled:opacity-50"
                  >
                    {resettingPassword ? 'Resetting...' : 'Reset Password'}
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
