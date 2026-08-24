'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  const memberOverview = data?.memberOverview || { totalMembers: 0, paidMembers: 0, pendingMembers: 0, completionRate: 0, expected: 0, collected: 0, pending: 0 };
  const payrollOverview = data?.payrollOverview || { activeStaff: 0, salaryBudget: 0, salaryPaid: 0, salaryPending: 0 };
  const rentalOverview = data?.rentalOverview || {
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    occupancyRate: 0,
    monthlyRentExpected: 0,
    securityAdvanceHeld: 0,
    totalAdvanceReceived: 0,
    totalAdvanceReturned: 0,
    rentCollectedTotal: 0,
    rentCollectedThisMonth: 0,
    rentPendingThisMonth: 0,
    recentPayments: [],
  };
  const donorOverview = data?.donorOverview || {
    totalCollected: 0,
    monthCollected: 0,
    totalCount: 0,
    monthCount: 0,
    categoryCount: 0,
    recentCollections: [],
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const netBalance = (kpis.totalIncome || 0) - (kpis.totalExpenses || 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-slate-800 font-sans pb-10">
      {/* TOP HEADER STATUS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-serif italic text-slate-500 block">{currentDateFormatted}</span>
          <h1 className="text-3xl font-serif font-extrabold text-slate-900 tracking-tight mt-0.5">Dashboard</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live System
          </span>
        </div>
      </div>

      {/* HERO NET BALANCE CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0F3D26] text-white p-6 sm:p-8 shadow-xl border border-emerald-950">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 text-[140px] sm:text-[180px] font-extrabold pointer-events-none select-none text-emerald-300 font-serif leading-none flex items-center">
          مسجد
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-200/90 block">Net Balance</span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1">
              IN ₹{netBalance.toLocaleString('en-IN')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] font-semibold text-emerald-200 block">Total Income</span>
              <span className="text-lg sm:text-xl font-extrabold text-white block mt-0.5">
                IN ₹{(kpis.totalIncome || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] font-semibold text-emerald-200 block">Total Expenses</span>
              <span className="text-lg sm:text-xl font-extrabold text-white block mt-0.5">
                IN ₹{(kpis.totalExpenses || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] font-semibold text-emerald-200 block">This Month</span>
              <span className="text-lg sm:text-xl font-extrabold text-white block mt-0.5">
                IN ₹{(kpis.memberCollectionTotal || memberOverview.collected || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. FINANCIAL OVERVIEW SECTION */}
      <div className="space-y-3.5">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Financial Overview</h3>

        {/* ROW 1: PRIMARY CURRENT BALANCES & ACTUAL TOTAL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* ACTUAL TOTAL BALANCE */}
          <div className="bg-gradient-to-br from-[#0F3D26] to-emerald-950 text-white rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-300 flex items-center justify-center text-base">
                <i className="fas fa-vault"></i>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-700">
                Liquid Net
              </span>
            </div>
            <div>
              <span className="text-3xl font-black text-white block">
                IN ₹{(kpis.actualTotalBalance || kpis.currentBalance || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-emerald-200 block mt-0.5">Actual Total Balance</span>
              <span className="text-[11px] font-semibold text-emerald-300/80 block mt-0.5">
                Current Cash (₹{(kpis.currentCashInHand || kpis.cashInHand || 0).toLocaleString('en-IN')}) + Banks (₹{(kpis.currentBankBalance || kpis.totalBankBalance || 0).toLocaleString('en-IN')})
              </span>
            </div>
          </div>

          {/* CURRENT BANK BALANCE */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:border-emerald-300 transition space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base">
                <i className="fas fa-building-columns"></i>
              </div>
              <Link href="/dashboard/finance" className="text-[10px] font-bold text-emerald-700 hover:underline">
                Manage Banks →
              </Link>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                IN ₹{(kpis.currentBankBalance || kpis.totalBankBalance || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Current Bank Balance</span>
              <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                Across all active accounts
              </span>
            </div>
          </div>

          {/* CURRENT CASH IN HAND */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:border-amber-300 transition space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-base">
                <i className="fas fa-hand-holding-dollar"></i>
              </div>
              <Link href="/dashboard/finance/opening-balance" className="text-[10px] font-bold text-amber-700 hover:underline">
                Opening Balance →
              </Link>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                IN ₹{(kpis.currentCashInHand || kpis.cashInHand || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Current Cash in Hand</span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                Physical cash in vault
              </span>
            </div>
          </div>
        </div>

        {/* ROW 2: DETAILED INFLOWS, OUTFLOWS & OPENING BREAKDOWN */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* OPENING CASH */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Opening Cash</span>
            <span className="text-base font-black text-slate-900 block">
              ₹{(kpis.openingCashBalance || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block">Day 1 baseline</span>
          </div>

          {/* OPENING BANK */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Opening Bank</span>
            <span className="text-base font-black text-slate-900 block">
              ₹{(kpis.openingBankBalance || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block">Day 1 baseline</span>
          </div>

          {/* TOTAL INCOME */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs space-y-1">
            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Total Income</span>
            <span className="text-base font-black text-emerald-800 block">
              +₹{(kpis.totalIncome || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-600 block">All sources</span>
          </div>

          {/* TOTAL EXPENSES */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs space-y-1">
            <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block">Total Expenses</span>
            <span className="text-base font-black text-rose-600 block">
              -₹{(kpis.totalExpenses || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-rose-500 block">Expenses & payroll</span>
          </div>

          {/* CASH DEPOSITED */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs space-y-1">
            <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wider block">Cash Deposited</span>
            <span className="text-base font-black text-blue-700 block">
              ₹{(kpis.cashDeposited || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-blue-500 block">Moved to bank</span>
          </div>

          {/* CASH WITHDRAWN */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs space-y-1">
            <span className="text-[9px] font-bold text-purple-700 uppercase tracking-wider block">Cash Withdrawn</span>
            <span className="text-base font-black text-purple-700 block">
              ₹{(kpis.cashWithdrawn || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-purple-500 block">Moved to hand</span>
          </div>
        </div>
      </div>

      {/* 2. MEMBER OVERVIEW SECTION */}
      <div className="space-y-3.5">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Member Overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">Monthly members are community members who donate a fixed monthly contribution to support the Masjid&apos;s running expenses.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TOTAL MEMBERS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-base">
              <i className="fas fa-users"></i>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 block">{memberOverview.totalMembers}</span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Total Members</span>
            </div>
          </div>

          {/* PAID MEMBERS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base">
              <i className="fas fa-circle-check"></i>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 block">{memberOverview.paidMembers}</span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Paid Members</span>
            </div>
          </div>

          {/* PENDING MEMBERS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-base">
              <i className="fas fa-circle-exclamation"></i>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 block">{memberOverview.pendingMembers}</span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Pending</span>
            </div>
          </div>

          {/* COMPLETION */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-base">
              <i className="fas fa-bolt"></i>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 block">{memberOverview.completionRate}%</span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Completion</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PAYROLL OVERVIEW SECTION */}
      <div className="space-y-3.5">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Payroll Overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">Track monthly payroll expenses, active staff members, and outstanding salary payouts.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ACTIVE STAFF */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-base">
              <i className="fas fa-user-tie"></i>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 block">{payrollOverview.activeStaff}</span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Active Staff</span>
            </div>
          </div>

          {/* SALARY BUDGET */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base">
              <i className="fas fa-arrow-trend-up"></i>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                IN ₹{(payrollOverview.salaryBudget || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Salary Budget</span>
              <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">Monthly expected</span>
            </div>
          </div>

          {/* SALARY PAID */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base">
              <i className="fas fa-circle-check"></i>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                IN ₹{(payrollOverview.salaryPaid || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Salary Paid</span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">This month</span>
            </div>
          </div>

          {/* SALARY PENDING */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-base">
              <i className="fas fa-clock"></i>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                IN ₹{(payrollOverview.salaryPending || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Salary Pending</span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">This month</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RENTAL OVERVIEW SECTION */}
      <div className="space-y-3.5">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Rental Overview</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Track mosque commercial properties, security advances held, rent collections, and pending tenant dues.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SECURITY ADVANCE HELD */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-base">
                <i className="fas fa-vault"></i>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                Deposit Held
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                IN ₹{rentalOverview.securityAdvanceHeld.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Security Advance Held</span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                Total In: ₹{rentalOverview.totalAdvanceReceived.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* RENT COLLECTED */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base">
                <i className="fas fa-hand-holding-dollar"></i>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                Revenue
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-800 block">
                IN ₹{rentalOverview.rentCollectedTotal.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Rent Collected</span>
              <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                This Month: ₹{rentalOverview.rentCollectedThisMonth.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* RENT PENDING */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-base">
                <i className="fas fa-clock"></i>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                Due
              </span>
            </div>
            <div>
              <span className={`text-2xl font-black block ${rentalOverview.rentPendingThisMonth > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                IN ₹{rentalOverview.rentPendingThisMonth.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Rent Pending</span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                Expected: ₹{rentalOverview.monthlyRentExpected.toLocaleString('en-IN')}/mo
              </span>
            </div>
          </div>

          {/* OCCUPANCY & UNITS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-base">
                <i className="fas fa-store"></i>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                {rentalOverview.occupancyRate}% Occupied
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                {rentalOverview.occupiedUnits} / {rentalOverview.totalUnits} Units
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Commercial Occupancy</span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                {rentalOverview.vacantUnits} Vacant Units
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DONOR COLLECTIONS OVERVIEW SECTION */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Donor Collections Overview</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking of incoming donor contributions, general collections, Zakat vaults, and issued receipts.
            </p>
          </div>
          <Link
            href="/dashboard/donations"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Donor Collections</span>
            <i className="fas fa-arrow-right text-[10px]"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TOTAL DONOR COLLECTIONS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-base">
                <i className="fas fa-hand-holding-heart"></i>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                All-Time Total
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                IN ₹{donorOverview.totalCollected.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Total Donor Collections</span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                Across all active funds
              </span>
            </div>
          </div>

          {/* THIS MONTH'S COLLECTIONS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-base">
                <i className="fas fa-calendar-check"></i>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                This Month
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-800 block">
                IN ₹{donorOverview.monthCollected.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Collected This Month</span>
              <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                {donorOverview.monthCount} receipts logged this month
              </span>
            </div>
          </div>

          {/* TOTAL RECEIPTS ISSUED */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-base">
                <i className="fas fa-receipt"></i>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                Receipts
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                {donorOverview.totalCount} Receipts
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Total Receipts Issued</span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                Average: ₹{donorOverview.totalCount > 0 ? Math.round(donorOverview.totalCollected / donorOverview.totalCount).toLocaleString('en-IN') : 0} / receipt
              </span>
            </div>
          </div>

          {/* ACTIVE CATEGORIES & FUNDS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-base">
                <i className="fas fa-folder-tree"></i>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                Active Vaults
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                {donorOverview.categoryCount} Categories
              </span>
              <span className="text-xs font-bold text-slate-600 block mt-0.5">Active Donation Funds</span>
              <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                General, Zakat, Construction & more
              </span>
            </div>
          </div>
        </div>

        {/* RECENT DONOR COLLECTIONS MINI TABLE */}
        {donorOverview.recentCollections && donorOverview.recentCollections.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <i className="fas fa-clock-rotate-left text-emerald-700"></i> Recent Donor Collections
              </span>
              <Link href="/dashboard/donations" className="text-xs font-bold text-emerald-700 hover:underline">
                View Full Log →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-2.5">Receipt No</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Donor Name</th>
                    <th className="px-4 py-2.5">Fund / Category</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-5 py-2.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {donorOverview.recentCollections.slice(0, 5).map((don: any) => (
                    <tr key={don.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3 font-bold text-emerald-800">{don.receiptNo}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(don.date).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{don.donorName}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800">{don.categoryName}</span>
                        <span className="text-[10px] text-emerald-700 block">{don.fundName}</span>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-slate-900">₹{don.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                          {don.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/dashboard/receipts/${don.id}`}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] transition inline-flex items-center gap-1 border border-emerald-200"
                        >
                          <i className="fas fa-receipt text-xs"></i> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
