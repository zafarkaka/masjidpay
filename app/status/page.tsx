'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AccountStatusPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6faf6]">
        <div className="text-center text-slate-500">
          <i className="fas fa-circle-notch fa-spin text-3xl text-emerald-700 mb-3"></i>
          <p className="text-sm">Checking account verification status...</p>
        </div>
      </div>
    );
  }

  const status = user?.masjidStatus || 'PENDING';

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#f6faf6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 text-2xl font-bold text-slate-900 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-700/20">
            <i className="fas fa-mosque text-lg"></i>
          </div>
          <span>Masjid<span className="text-emerald-700">Pay</span></span>
        </Link>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="masjid-card p-8 bg-white text-center shadow-xl">
          {status === 'PENDING' && (
            <div>
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mx-auto mb-4">
                <i className="fas fa-[#164e31] fa-clock"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Registration Pending Approval</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Thank you for registering your masjid. Your application has been logged and is currently in the <strong className="text-amber-700">Pending Review</strong> queue.
              </p>
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-left">
                <i className="fas fa-info-circle mr-1.5"></i>
                For security and multi-tenant integrity, the platform owner (Super Admin) must verify and approve new masjid accounts before dashboard access is unlocked.
              </div>
            </div>
          )}

          {status === 'REJECTED' && (
            <div>
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-2xl mx-auto mb-4">
                <i className="fas fa-times-circle"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Registration Request Rejected</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Your application to join MasjidPay was rejected by the platform Super Admin.
              </p>
            </div>
          )}

          {status === 'SUSPENDED' && (
            <div>
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-2xl mx-auto mb-4">
                <i className="fas fa-ban"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Account Suspended</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Access for this masjid account is temporarily suspended.
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Return to Homepage
            </Link>
            <button
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' }).then(() => (window.location.href = '/login'));
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition"
            >
              Log Out / Switch Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
