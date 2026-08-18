'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SuperAdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/super-admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <i className="fas fa-circle-notch fa-spin text-emerald-400 text-2xl mr-3"></i> Loading platform stats...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Platform Master Control</h1>
        <p className="text-slate-400 text-sm mt-1">Multi-Tenant Masjid Operations Overview</p>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Registered Masjids</span>
            <i className="fas fa-mosque text-emerald-400 text-lg"></i>
          </div>
          <div className="text-3xl font-extrabold text-white">{stats?.totalMasjids || 0}</div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {stats?.activeMasjids || 0} Active Masjids
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Pending Approvals</span>
            <i className="fas fa-clock text-amber-400 text-lg"></i>
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{stats?.pendingMasjids || 0}</div>
          <div className="mt-2 text-xs text-slate-400">
            <Link href="/super-admin/masjids" className="text-amber-400 underline hover:text-amber-300 font-semibold">
              Review Pending Queue →
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Donation Volume</span>
            <i className="fas fa-hand-holding-dollar text-emerald-400 text-lg"></i>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            ₹{(stats?.totalDonationVolume || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400">Recorded across all tenant masjids</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Expense Volume</span>
            <i className="fas fa-receipt text-rose-400 text-lg"></i>
          </div>
          <div className="text-3xl font-extrabold text-white">
            ₹{(stats?.totalExpenseVolume || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-400">Audited outgoing expenditure</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Online Transactions</span>
            <i className="fas fa-credit-card text-sky-400 text-lg"></i>
          </div>
          <div className="text-3xl font-extrabold text-sky-400">{stats?.totalOnlineTransactions || 0}</div>
          <div className="mt-2 text-xs text-slate-400">Verified Razorpay payment events</div>
        </div>
      </div>

      {/* QUICK ACTIONS BANNER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">Masjid Verification Queue</h3>
          <p className="text-xs text-slate-400 mt-1">Review pending masjid applications and grant access control.</p>
        </div>
        <Link
          href="/super-admin/masjids"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
        >
          <i className="fas fa-tasks"></i> Open Masjid Manager
        </Link>
      </div>
    </div>
  );
}
