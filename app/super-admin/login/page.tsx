'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.user?.role !== 'SUPER_ADMIN') {
        throw new Error('Access denied: This portal is strictly for Platform Super Administrators.');
      }

      router.push('/super-admin/masjids');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* LOGO BADGE */}
        <Link href="/" className="inline-flex items-center gap-3 text-2xl font-bold text-white mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] border border-[#D4AF37]/50 flex items-center justify-center shadow-xl shadow-emerald-950/40">
            <i className="fas fa-shield-halved text-xl"></i>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-2xl font-black tracking-tight text-white">Masjid<span className="text-[#F4D06F]">Pay</span></span>
              <span className="text-[#D4AF37] text-sm">✦</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block mt-1">
              Super Admin Console
            </span>
          </div>
        </Link>

        <h2 className="text-2xl font-black text-white tracking-tight">
          Root Platform Login
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Masjid approvals, system configuration, and audit logs
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="p-7 sm:p-8 bg-slate-900 shadow-2xl border border-slate-800 rounded-3xl space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
              <i className="fas fa-exclamation-circle text-rose-400 shrink-0 text-sm"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Super Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <i className="fas fa-envelope text-sm"></i>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-700 bg-slate-950/80 focus:border-[#D4AF37] text-white text-xs font-semibold outline-none transition placeholder-slate-600"
                  placeholder="admin@masjidpay.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <i className="fas fa-lock text-sm"></i>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-700 bg-slate-950/80 focus:border-[#D4AF37] text-white text-xs font-semibold outline-none transition placeholder-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#064E3B] hover:bg-[#043327] text-white font-extrabold rounded-2xl shadow-lg border border-[#D4AF37]/50 transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
            >
              {loading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i> Authenticating Super Admin...
                </>
              ) : (
                <>
                  <i className="fas fa-shield-halved text-[#F4D06F]"></i> Authenticate to Console
                </>
              )}
            </button>
          </form>

          <div className="border-t border-slate-800 pt-4 text-center">
            <Link href="/login" className="text-xs text-slate-400 hover:text-emerald-400 transition font-medium">
              ← Return to Standard Mosque Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
