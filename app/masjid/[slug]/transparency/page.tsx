'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicTransparencyPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/stats?masjidId=jama-masjid`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6faf6]">
        <div className="text-center text-slate-500">
          <i className="fas fa-mosque fa-spin text-3xl text-emerald-700 mb-3"></i>
          <p className="text-sm font-semibold">Loading Public Financial Statement...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="min-h-screen bg-[#f6faf6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER BRANDING */}
        <div className="masjid-card p-8 bg-white text-center shadow-xl border border-emerald-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-3xl mx-auto mb-3 shadow-md shadow-emerald-700/20">
            <i className="fas fa-mosque"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Jama Masjid Vaniyambadi</h1>
          <p className="text-sm text-slate-500 mt-1">Official Community Financial Transparency Statement</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <i className="fas fa-eye text-emerald-600"></i> Public Disclosure Verified
          </div>
        </div>

        {/* OVERVIEW STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="masjid-card p-6 bg-white">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">This Month Collections</span>
            <span className="text-2xl font-extrabold text-emerald-700 block mt-1">
              ₹{(kpis.thisMonthDonations || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="masjid-card p-6 bg-white">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">This Month Overhead Spend</span>
            <span className="text-2xl font-extrabold text-slate-900 block mt-1">
              ₹{(kpis.thisMonthExpenses || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="masjid-card p-6 bg-white">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Verified Net Balance</span>
            <span className="text-2xl font-extrabold text-emerald-900 block mt-1">
              ₹{(kpis.currentBalance || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* ANONYMITY NOTICE */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-3">
          <i className="fas fa-shield-halved text-emerald-600 text-xl"></i>
          <span>
            This public disclosure displays anonymized financial data and community-wide fund distributions to ensure complete financial integrity while strictly respecting donor privacy.
          </span>
        </div>

        <div className="text-center pt-4">
          <Link
            href={`/donate/${slug}`}
            className="px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-700/25 transition inline-flex items-center gap-2"
          >
            <i className="fas fa-heart"></i> Contribute Online to Jama Masjid
          </Link>
        </div>
      </div>
    </div>
  );
}
