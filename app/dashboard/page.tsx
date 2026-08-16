'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState<'Monthly' | 'Yearly' | 'Range' | 'All Time'>('Monthly');

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <i className="fas fa-circle-notch fa-spin text-emerald-700 text-3xl mb-3"></i>
        <p className="text-sm font-semibold">Loading Mosque Financial Control Center...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const memberOverview = data?.memberOverview || { totalMembers: 2, paidMembers: 1, pendingMembers: 1, completionRate: 41.7, expected: 1200, collected: 2500, pending: 700 };
  const payrollOverview = data?.payrollOverview || { activeStaff: 1, salaryBudget: 25000, salaryPaid: 0, salaryPending: 25000 };
  const dailyCollections = data?.dailyCollections || [];
  const twelveMonthAnalytics = data?.twelveMonthAnalytics || [];
  const recentDonations = data?.recentActivity?.donations || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-800">
      {/* TOP HEADER STATUS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Saturday, August 15</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full border border-emerald-200">
              Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/member-collections"
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> Record Member Payment
          </Link>
        </div>
      </div>

      {/* TOP DARK EMERALD TOTAL BALANCE BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0F3D26] text-white p-6 sm:p-8 shadow-2xl border border-emerald-950">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 text-[180px] font-extrabold pointer-events-none select-none text-emerald-300 pr-6 leading-none flex items-center">
          م
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-300/80 block">Total Balance</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1">
              IN ₹{kpis.currentBalance?.toLocaleString('en-IN') || '6,500'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] font-medium text-emerald-200 block">Total Income</span>
              <span className="text-lg font-extrabold text-white block mt-0.5">
                IN ₹{kpis.totalIncome?.toLocaleString('en-IN') || '7,500'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] font-medium text-emerald-200 block">Total Expenses</span>
              <span className="text-lg font-extrabold text-white block mt-0.5">
                IN ₹{kpis.totalExpenses?.toLocaleString('en-IN') || '1,000'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] font-medium text-emerald-200 block">This Month</span>
              <span className="text-lg font-extrabold text-white block mt-0.5">
                IN ₹{kpis.thisMonthDonations?.toLocaleString('en-IN') || '2,500'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW (4 CARDS) */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Financial Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
              <i className="fas fa-coins"></i>
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 block">
                IN ₹{kpis.totalIncome?.toLocaleString('en-IN') || '7,500'}
              </span>
              <span className="text-xs text-slate-500 font-semibold block">Total Income</span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">All time income</span>
            </div>
          </div>

          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0">
              <i className="fas fa-[#e05252] fa-arrow-trend-down"></i>
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 block">
                IN ₹{kpis.totalExpenses?.toLocaleString('en-IN') || '1,000'}
              </span>
              <span className="text-xs text-slate-500 font-semibold block">Total Expenses</span>
              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">IN ₹1,000 this month</span>
            </div>
          </div>

          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shrink-0">
              <i className="fas fa-wallet"></i>
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 block">
                IN ₹{kpis.currentBalance?.toLocaleString('en-IN') || '6,500'}
              </span>
              <span className="text-xs text-slate-500 font-semibold block">Balance</span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Net liquidity</span>
            </div>
          </div>

          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0">
              <i className="fas fa-hand-holding-dollar"></i>
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 block">
                IN ₹{kpis.memberCollectionTotal?.toLocaleString('en-IN') || '2,500'}
              </span>
              <span className="text-xs text-slate-500 font-semibold block">Monthly Member Collection</span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">IN ₹2,500 this month</span>
            </div>
          </div>
        </div>
      </div>

      {/* MEMBER OVERVIEW ROW */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Member Overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">Monthly members are community members who donate a fixed monthly contribution to support the Masjid's running expenses.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-users"></i>
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 block">{memberOverview.totalMembers}</span>
              <span className="text-xs text-slate-500 font-medium">Total Members</span>
            </div>
          </div>

          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-check-circle"></i>
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 block">{memberOverview.paidMembers}</span>
              <span className="text-xs text-slate-500 font-medium">Paid Members</span>
            </div>
          </div>

          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-clock"></i>
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 block">{memberOverview.pendingMembers}</span>
              <span className="text-xs text-slate-500 font-medium">Pending</span>
            </div>
          </div>

          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-chart-line"></i>
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 block">{memberOverview.completionRate}%</span>
              <span className="text-xs text-slate-500 font-medium">Completion</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAYROLL OVERVIEW ROW */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Payroll Overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">Track monthly payroll expenses, active staff members, and outstanding salary payouts.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-user-tie"></i>
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 block">{payrollOverview.activeStaff}</span>
              <span className="text-xs text-slate-500 font-medium">Active Staff</span>
            </div>
          </div>

          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 block">IN ₹{payrollOverview.salaryBudget?.toLocaleString('en-IN')}</span>
              <span className="text-xs text-slate-500 font-medium">Salary Budget <span className="text-[10px] text-slate-400 block">Monthly expected</span></span>
            </div>
          </div>

          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-[#20bd5a] fa-check"></i>
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 block">IN ₹{payrollOverview.salaryPaid?.toLocaleString('en-IN')}</span>
              <span className="text-xs text-slate-500 font-medium">Salary Paid <span className="text-[10px] text-slate-400 block">This month</span></span>
            </div>
          </div>

          <div className="masjid-card p-5 bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-hourglass-half"></i>
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 block">IN ₹{payrollOverview.salaryPending?.toLocaleString('en-IN')}</span>
              <span className="text-xs text-slate-500 font-medium">Salary Pending <span className="text-[10px] text-slate-400 block">This month</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* GENERATE REPORT FILTER WIDGET */}
      <div className="masjid-card p-6 bg-white border border-slate-200 shadow-md space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-lg border border-emerald-200">
            <i className="fas fa-[#20bd5a] fa-file-invoice"></i>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Generate Report</h3>
            <p className="text-xs text-slate-500">Filter by period & category, download combined slip</p>
          </div>
        </div>

        {/* PERIOD TABS */}
        <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto">
          {(['Monthly', 'Yearly', 'Range', 'All Time'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setReportPeriod(period)}
              className={`px-5 py-2 rounded-xl font-bold text-xs transition ${
                reportPeriod === period
                  ? 'bg-slate-100 text-slate-900 border border-slate-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        {/* SELECTORS & RESULT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Income Category</label>
            <select className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600">
              <option value="">Select Category...</option>
              <option value="cat1">General Donation</option>
              <option value="cat2">Monthly Member Collection</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expense Category</label>
            <select className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600">
              <option value="">Select Category...</option>
              <option value="exp1">Utilities & Electricity</option>
              <option value="exp2">Staff Salaries</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
            <span className="text-[11px] font-bold text-emerald-800 block uppercase">Income</span>
            <span className="text-base font-extrabold text-slate-900 block mt-1">IN ₹0</span>
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
            <span className="text-[11px] font-bold text-amber-800 block uppercase">Expense</span>
            <span className="text-base font-extrabold text-slate-900 block mt-1">IN ₹0</span>
          </div>

          <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl">
            <span className="text-[11px] font-bold text-teal-800 block uppercase">Balance</span>
            <span className="text-base font-extrabold text-slate-900 block mt-1">IN ₹0</span>
          </div>
        </div>

        <div className="text-center pt-2">
          <button className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition inline-flex items-center gap-2 border border-slate-300">
            <i className="fas fa-download"></i> Download Report
          </button>
        </div>
      </div>

      {/* ANALYTICAL BREAKDOWN (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CIRCULAR GAUGE & MEMBER STATS */}
        <div className="masjid-card p-6 bg-white border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Monthly Member Collection</h3>

          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 stroke-current" strokeWidth="3.8" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-emerald-700 stroke-current" strokeDasharray="41.7, 100" strokeWidth="3.8" strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl font-black text-slate-900 block leading-none">41.7%</span>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase">Done</span>
              </div>
            </div>

            <div className="space-y-3 flex-1 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500 font-medium">Expected:</span>
                <span className="font-bold text-slate-900">IN ₹{memberOverview.expected?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500 font-medium">Collected:</span>
                <span className="font-bold text-emerald-700">IN ₹{memberOverview.collected?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Pending:</span>
                <span className="font-bold text-rose-600">IN ₹{memberOverview.pending?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 12-MONTH ANALYTICS COMPARATIVE BARS */}
        <div className="masjid-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">12-Month Analytics</h3>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-700 inline-block"></span> Income</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Expense</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {twelveMonthAnalytics.map((item: any) => (
              <div key={item.month} className="flex items-center text-xs gap-3">
                <span className="w-14 font-semibold text-slate-500 text-[11px]">{item.month}</span>
                <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-700 h-full" style={{ width: item.income > 0 ? '75%' : '0%' }}></div>
                  <div className="bg-rose-500 h-full" style={{ width: item.expense > 0 ? '25%' : '0%' }}></div>
                </div>
                <span className="w-24 text-right text-[11px] font-mono">
                  <span className="text-emerald-700 font-bold">IN ₹{item.income}</span> / <span className="text-rose-600 font-bold">IN ₹{item.expense}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DAILY COLLECTION SECTION (2 COLUMNS) */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Daily Collection</h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TODAY FEATURED EMERALD CARD */}
          <div className="rounded-3xl bg-[#0F3D26] text-white p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800">
                TODAY
              </span>
              <h4 className="text-3xl font-black mt-4">IN ₹0</h4>
              <p className="text-xs text-emerald-200 mt-1">Sat, Aug 15</p>
            </div>

            <div className="pt-8 text-right opacity-15 text-5xl">
              <i className="fas fa-calendar-check"></i>
            </div>
          </div>

          {/* 7-DAY FEED LIST */}
          <div className="lg:col-span-2 masjid-card p-4 bg-emerald-50/40 border border-emerald-100 space-y-2">
            {dailyCollections.map((day: any) => (
              <div
                key={day.dateStr}
                className={`p-3 rounded-2xl flex items-center justify-between border transition text-xs ${
                  day.isToday ? 'bg-emerald-100/70 border-emerald-300 font-bold' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-[11px] text-slate-700">
                    {day.dayName}
                  </span>
                  <span className="font-semibold text-slate-800">{day.dateStr}</span>
                </div>

                <span className="font-extrabold text-slate-900">IN ₹{day.amount?.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT PAYMENTS (LAST 1 WEEK) TABLE */}
      <div className="masjid-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Recent Payments (Last 1 Week)</h3>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-xs">
            {recentDonations.length} transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="masjid-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>TYPE</th>
                <th>DESCRIPTION</th>
                <th>PAYMENT MODE</th>
                <th>AMOUNT</th>
                <th className="text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {recentDonations.map((don: any) => (
                <tr key={don.id}>
                  <td className="text-xs text-slate-500">{new Date(don.date).toLocaleDateString()}</td>
                  <td>
                    <span className="masjid-badge masjid-badge-success">Income</span>
                  </td>
                  <td>
                    <span className="font-bold text-slate-900 block">{don.donor?.name || don.notes || 'General Contribution'}</span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-slate-700">{don.paymentMethod}</span>
                  </td>
                  <td className="font-extrabold text-emerald-800 text-sm">
                    +IN ₹{don.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/dashboard/receipts/${don.id}`}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition inline-flex text-xs"
                    >
                      <i className="fas fa-download"></i>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
