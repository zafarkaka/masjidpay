'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface StepData {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  problemSolved: string;
  description: string;
  badgeColor: string;
  icon: string;
  highlights: string[];
  mockType: 'onboarding' | 'dashboard' | 'collections' | 'payroll' | 'rentals' | 'transparency';
}

const DEMO_STEPS: StepData[] = [
  {
    id: 1,
    tag: 'Step 1: Mosque Setup',
    title: 'Fast Mosque Onboarding & Vault Setup',
    subtitle: 'Setup Multi-Bank Accounts, Zakat Vaults & Cash in Hand in 2 Minutes',
    problemSolved: 'Eliminates commingled funds and messy notebook balances across multiple committee members.',
    description: 'Register your mosque with Waqf credentials, configure your starting liquid cash-in-hand, link bank accounts (SBI, HDFC, etc.), and create segregated vaults for Zakat, Construction, and General Funds.',
    badgeColor: 'bg-emerald-900 text-emerald-300 border-emerald-700',
    icon: 'fa-mosque',
    highlights: [
      'Separate Zakat, Sadaqah, and Construction vaults',
      'Multi-bank account tracking with live balances',
      'Granular committee roles (President, Secretary, Treasurer)',
      '1-Click automated database backups',
    ],
    mockType: 'onboarding',
  },
  {
    id: 2,
    tag: 'Step 2: Command Center',
    title: 'Live Executive Financial Dashboard',
    subtitle: '100% Real-Time Visibility Over Every Rupee Across All Accounts',
    problemSolved: 'Replaces guessing and end-of-month panic with instant live liquidity figures and cash counters.',
    description: 'The committee gets a high-altitude executive dashboard displaying total liquid funds, current month collections vs expenses, pending member dues, rental occupancy, and recent donor receipts at a single glance.',
    badgeColor: 'bg-teal-900 text-teal-300 border-teal-700',
    icon: 'fa-chart-pie',
    highlights: [
      'Liquid Cash-in-Hand + Bank balance live tickers',
      'Real-time monthly revenue vs operational burn',
      'Quick action shortcuts for Collections & Expenses',
      'Multi-currency support with Indian Rupee (₹) formatting',
    ],
    mockType: 'dashboard',
  },
  {
    id: 3,
    tag: 'Step 3: Member Collections',
    title: 'Monthly Member Subscriptions & Auto WhatsApp Slips',
    subtitle: 'Collect in 5 Seconds & Auto-Dispatch Official WhatsApp Receipts',
    problemSolved: 'Solves lost paper counterfoils, unrecorded cash, and embarrassing member payment disputes.',
    description: 'Search any registered monthly member with instant predictive search. Enter the collected amount, choose cash or UPI, and the system records the ledger entry, updates the fund balance, and triggers a PDF/WhatsApp receipt slip immediately.',
    badgeColor: 'bg-amber-900 text-amber-300 border-amber-700',
    icon: 'fa-hand-holding-dollar',
    highlights: [
      'Instant predictive search by Member ID, Name, or Phone',
      'Statement of Account (SOA) tracking all historical dues',
      '1-Click automated WhatsApp message with payment link',
      'Official printable PDF counterfoils with mosque watermark',
    ],
    mockType: 'collections',
  },
  {
    id: 4,
    tag: 'Step 4: Payroll & Staff',
    title: 'Smart Imam & Staff Payroll Engine',
    subtitle: 'Automated Attendance, Allowances & Duplicate-Safe Salary Disbursements',
    problemSolved: 'Stops accidental double payouts, manual salary calculations, and missing deduction records.',
    description: 'Manage Imams, Moazzins, and cleaning staff with built-in working day attendance counters. Calculate automated gross-to-net pay, housing allowances, and strictly prevent duplicate salary payments in the same calendar month.',
    badgeColor: 'bg-indigo-900 text-indigo-300 border-indigo-700',
    icon: 'fa-id-card',
    highlights: [
      'Automated net salary computation based on present days',
      'Strict duplicate payment prevention per month',
      'Automatic expense ledger entry under Staff Salary category',
      'Downloadable official monthly salary slips',
    ],
    mockType: 'payroll',
  },
  {
    id: 5,
    tag: 'Step 5: Commercial Rentals',
    title: 'Mosque Commercial Complex & Tenant Advances',
    subtitle: 'Track Shop Rent Collections, Vacancies & Security Deposits',
    problemSolved: 'Prevents forgotten tenant rent arrears, disputed advance deposits, and vacant shop losses.',
    description: 'Track all Waqf-owned commercial shops, tenant agreements, monthly rent collection statuses, and security deposit ledgers with automatic income logging.',
    badgeColor: 'bg-purple-900 text-purple-300 border-purple-700',
    icon: 'fa-building',
    highlights: [
      'Occupancy vs Vacancy rate visual gauges',
      'Monthly tenant rent expected vs collected tracker',
      'Security deposit advance liability ledger',
      'Auto-generated tenant rent payment vouchers',
    ],
    mockType: 'rentals',
  },
  {
    id: 6,
    tag: 'Step 6: Public Trust',
    title: 'Public Transparency & Community Read-Only View',
    subtitle: 'Build 100% Community Trust with Secret Access Codes & UPI QR Codes',
    problemSolved: 'Eliminates suspicions, rumors, and lack of transparency regarding community donation usage.',
    description: 'Allow community members and donors to view verified financial transparency statements using a secure Secret Access Code, or accept instant online contributions via dedicated Razorpay and UPI QR codes.',
    badgeColor: 'bg-emerald-900 text-[#F4D06F] border-[#D4AF37]',
    icon: 'fa-shield-halved',
    highlights: [
      'Guest Read-Only Viewer mode with Secret Access Code',
      'Public donation campaign pages with UPI QR generation',
      'Audited Income/Expense balance sheet exports',
      '100% tamper-proof audit trails for every transaction',
    ],
    mockType: 'transparency',
  },
];

export default function DemoPage() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simulatedMember, setSimulatedMember] = useState('Farhan Akhtar (#MP-104)');
  const [simulatedAmount, setSimulatedAmount] = useState('1000');
  const [simulatedPaymentMethod, setSimulatedPaymentMethod] = useState('CASH');
  const [collectionSuccess, setCollectionSuccess] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);

  const activeStep = DEMO_STEPS[activeStepIndex];

  // Auto-play timer for interactive product walkthrough
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStepIndex((prev) => (prev + 1) % DEMO_STEPS.length);
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleSimulatedCollection = (e: React.FormEvent) => {
    e.preventDefault();
    setCollectionSuccess(true);
    setTimeout(() => {
      setShowWhatsAppPreview(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#04120a] text-slate-100 font-sans selection:bg-[#D4AF37]/30 flex flex-col justify-between relative overflow-hidden">
      {/* BACKGROUND GEOMETRIC ACCENTS */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#04120a]/90 border-b border-emerald-900/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-[#064E3B] border border-[#D4AF37]/60 text-[#F4D06F] flex items-center justify-center shadow-lg shadow-emerald-950/50 transition transform group-hover:scale-105">
              <i className="fas fa-mosque text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Masjid<span className="text-[#F4D06F]">Pay</span>
                </span>
                <span className="text-[#D4AF37] text-base font-black leading-none">✦</span>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 block -mt-0.5">
                Interactive Product Walkthrough
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />

            <Link
              href="/"
              className="text-xs font-extrabold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-emerald-900/30 transition hidden sm:inline-flex items-center gap-1.5"
            >
              <i className="fas fa-arrow-left text-[10px]"></i>
              <span>Back to Home</span>
            </Link>

            <Link
              href="/register"
              className="text-xs font-black bg-gradient-to-r from-[#064E3B] to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-[#FFF9EC] border border-[#D4AF37]/60 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center gap-1.5"
            >
              <span>Register Mosque</span>
              <i className="fas fa-arrow-right text-[10px] text-[#F4D06F]"></i>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO INTRO BANNER */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-[#D4AF37]/40 text-[#F4D06F] text-xs font-black uppercase tracking-widest shadow-md">
          <i className="fas fa-play-circle animate-pulse text-amber-400"></i>
          <span>Live Interactive Software Tour</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          See How MasjidPay Transforms{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F4D06F] via-[#D4AF37] to-amber-200">
            Mosque Financial Operations
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
          From first-time setup to recording monthly member subscriptions, generating automated WhatsApp receipts, and managing Imam payroll — experience the complete workflow below.
        </p>

        {/* CONTROLS BAR: STEP SELECTORS & AUTO-PLAY TOGGLE */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 border shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-emerald-900/50 hover:bg-emerald-800/60 text-[#F4D06F] border-[#D4AF37]/50'
            }`}
          >
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xs`}></i>
            <span>{isPlaying ? 'Pause Auto Tour' : 'Play Guided Auto Tour'}</span>
          </button>

          <span className="text-xs text-slate-400 font-bold hidden sm:inline">•</span>

          <span className="text-xs text-emerald-400 font-extrabold">
            Step {activeStepIndex + 1} of {DEMO_STEPS.length}: {activeStep.title}
          </span>
        </div>
      </section>

      {/* 3. STEP SELECTOR PILL TABS */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {DEMO_STEPS.map((step, idx) => {
            const active = idx === activeStepIndex;
            return (
              <button
                key={step.id}
                onClick={() => {
                  setActiveStepIndex(idx);
                  setIsPlaying(false);
                }}
                className={`p-3 rounded-2xl text-left transition flex flex-col justify-between gap-2 border cursor-pointer ${
                  active
                    ? 'bg-gradient-to-b from-emerald-900/90 to-[#064E3B] border-[#D4AF37] text-white shadow-xl shadow-emerald-950/60 scale-[1.02]'
                    : 'bg-slate-900/60 hover:bg-slate-800/70 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                    active ? 'bg-[#F4D06F] text-[#064E3B]' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <i className={`fas ${step.icon} text-sm ${active ? 'text-[#F4D06F]' : 'text-slate-500'}`}></i>
                </div>
                <div>
                  <span className="text-[11px] font-black block leading-tight truncate">
                    {step.title.split('&')[0].trim()}
                  </span>
                  <span className="text-[9.5px] font-semibold text-slate-400 block mt-0.5">
                    {step.tag.split(':')[1]?.trim() || step.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. MAIN INTERACTIVE SIMULATION & STEP BREAKDOWN */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: STEP EXPLANATION & VALUE HIGHLIGHTS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${activeStep.badgeColor}`}>
                  {activeStep.tag}
                </span>
                <span className="text-xs font-extrabold text-[#F4D06F] flex items-center gap-1.5">
                  <i className="fas fa-check-circle text-emerald-400"></i>
                  <span>Verified Workflow</span>
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {activeStep.title}
                </h2>
                <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-1">
                  {activeStep.subtitle}
                </p>
              </div>

              {/* PROBLEM SOLVED CALLOUT */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-black uppercase text-[10.5px] text-[#F4D06F] tracking-wider">
                  <i className="fas fa-triangle-exclamation"></i>
                  <span>Core Problem Solved</span>
                </div>
                <p className="font-medium text-slate-300">
                  {activeStep.problemSolved}
                </p>
              </div>

              {/* DESCRIPTION */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {activeStep.description}
              </p>

              {/* BULLET HIGHLIGHTS */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-extrabold text-[#F4D06F] uppercase tracking-wider block">
                  Key Capabilities in This Step:
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {activeStep.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <i className="fas fa-circle-check text-emerald-400 mt-0.5 shrink-0 text-xs"></i>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* STEP NAVIGATION BUTTONS */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={activeStepIndex === 0}
                  onClick={() => {
                    setActiveStepIndex((prev) => Math.max(0, prev - 1));
                    setIsPlaying(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
                >
                  <i className="fas fa-chevron-left text-[10px]"></i>
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveStepIndex((prev) => (prev + 1) % DEMO_STEPS.length);
                    setIsPlaying(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white shadow-md shadow-emerald-950 transition flex items-center gap-1.5"
                >
                  <span>{activeStepIndex === DEMO_STEPS.length - 1 ? 'Restart Walkthrough' : 'Next Step'}</span>
                  <i className="fas fa-chevron-right text-[10px]"></i>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE MOCK APPLICATION VIEW (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/95 border-2 border-emerald-800/60 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-950/80 flex flex-col">
              {/* MOCK BROWSER / OS WINDOW TOP BAR */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-[11px] text-slate-400 font-mono flex items-center gap-2 max-w-xs truncate">
                  <i className="fas fa-lock text-emerald-400 text-[10px]"></i>
                  <span>https://masjidpay.org/{activeStep.mockType === 'onboarding' ? 'register' : `dashboard/${activeStep.mockType}`}</span>
                </div>

                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Live Preview
                </span>
              </div>

              {/* MOCK APPLICATION SCREEN BODY */}
              <div className="p-4 sm:p-6 bg-slate-950/70 min-h-[460px] flex flex-col justify-between">
                {/* 1. ONBOARDING MOCK */}
                {activeStep.mockType === 'onboarding' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Mosque Setup Wizard</span>
                        <h4 className="text-lg font-black text-white">Jama Masjid Trust (#MP-786)</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700 text-[10px] font-bold">
                        ✓ Verified Waqf
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Bank Account</span>
                        <p className="font-black text-white text-sm">State Bank of India</p>
                        <p className="text-slate-400 font-mono text-[11px]">A/C: *******4920 (IFSC: SBIN000123)</p>
                        <span className="text-emerald-400 font-bold text-[11px] block pt-1">Balance: ₹4,85,000</span>
                      </div>

                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Liquid Cash-in-Hand</span>
                        <p className="font-black text-white text-sm">Safe / Golak Vault</p>
                        <p className="text-slate-400 text-[11px]">Physical Safe Locker Custody</p>
                        <span className="text-[#F4D06F] font-bold text-[11px] block pt-1">Balance: ₹65,400</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Segregated Vaults</span>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-800">
                          🕌 General Fund (₹2,10,000)
                        </span>
                        <span className="px-2.5 py-1 bg-amber-950 text-amber-300 rounded-lg text-xs font-bold border border-amber-800">
                          🤲 Zakat Vault (₹1,95,000)
                        </span>
                        <span className="px-2.5 py-1 bg-teal-950 text-teal-300 rounded-lg text-xs font-bold border border-teal-800">
                          🏗️ Construction Fund (₹1,45,400)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DASHBOARD MOCK */}
                {activeStep.mockType === 'dashboard' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Financial Overview</span>
                        <h4 className="text-lg font-black text-white">August 2026 Live Ledger</h4>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                        ● All Systems Reconciled
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Balance</span>
                        <span className="text-base font-black text-[#F4D06F] block mt-0.5">₹5,50,400</span>
                        <span className="text-[9.5px] text-emerald-400 font-bold block">+12% vs last mo</span>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Month Revenue</span>
                        <span className="text-base font-black text-emerald-400 block mt-0.5">₹1,85,200</span>
                        <span className="text-[9.5px] text-slate-400 font-semibold block">142 Receipts</span>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Month Expenses</span>
                        <span className="text-base font-black text-rose-400 block mt-0.5">₹64,500</span>
                        <span className="text-[9.5px] text-slate-400 font-semibold block">Imam pay & electric</span>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Members Paid</span>
                        <span className="text-base font-black text-teal-300 block mt-0.5">88 / 112</span>
                        <span className="text-[9.5px] text-teal-400 font-bold block">78.5% Target Met</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Recent Transactions
                      </span>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                          <span className="font-bold text-white">Rashid Khan (Monthly Member #MP-012)</span>
                          <span className="font-black text-emerald-400">+₹1,000 (UPI)</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                          <span className="font-bold text-white">Electricity Bill (MSEDCL Meter #8291)</span>
                          <span className="font-black text-rose-400">-₹4,200 (Bank)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. COLLECTIONS MOCK (INTERACTIVE) */}
                {activeStep.mockType === 'collections' && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Interactive Collection Terminal</span>
                        <h4 className="text-base font-black text-white">Record Member Subscription</h4>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-700">
                        Try It Live ↓
                      </span>
                    </div>

                    <form onSubmit={handleSimulatedCollection} className="space-y-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs">
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-400 uppercase block mb-1">
                          Select Monthly Member
                        </label>
                        <select
                          value={simulatedMember}
                          onChange={(e) => setSimulatedMember(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none"
                        >
                          <option value="Farhan Akhtar (#MP-104)">Farhan Akhtar — #MP-104 (₹1,000/mo)</option>
                          <option value="Mohammad Zafar (#MP-001)">Mohammad Zafar — #MP-001 (₹2,500/mo)</option>
                          <option value="Syed Tariq (#MP-045)">Syed Tariq — #MP-045 (₹500/mo)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-400 uppercase block mb-1">
                            Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={simulatedAmount}
                            onChange={(e) => setSimulatedAmount(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-black text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-400 uppercase block mb-1">
                            Payment Method
                          </label>
                          <select
                            value={simulatedPaymentMethod}
                            onChange={(e) => setSimulatedPaymentMethod(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none"
                          >
                            <option value="CASH">Cash (Hand-to-Hand)</option>
                            <option value="UPI">UPI / QR Code</option>
                            <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-950 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fas fa-check-circle"></i>
                        <span>Record Collection & Dispatch WhatsApp Slip</span>
                      </button>
                    </form>

                    {/* WHATSAPP MODAL POPUP PREVIEW */}
                    {collectionSuccess && (
                      <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-2xl animate-in zoom-in-95 duration-200 text-xs space-y-2">
                        <div className="flex items-center justify-between text-emerald-300 font-extrabold">
                          <span className="flex items-center gap-1.5">
                            <i className="fab fa-whatsapp text-emerald-400 text-sm"></i>
                            <span>WhatsApp Slip Ready for {simulatedMember.split('(')[0]}</span>
                          </span>
                          <span className="text-[10px] text-emerald-400">Receipt #MP-REC-8902</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          &quot;Assalamu Alaikum! Receipt #MP-REC-8902 for ₹{simulatedAmount} received with thanks for Jama Masjid. May Allah reward you. View PDF: https://masjidpay.org/r/8902&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. PAYROLL MOCK */}
                {activeStep.mockType === 'payroll' && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Staff Payroll Terminal</span>
                        <h4 className="text-base font-black text-white">Monthly Salary Disbursements</h4>
                      </div>
                      <span className="text-[10px] font-extrabold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-700">
                        Duplicate Prevention Active
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* STAFF 1 */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-extrabold text-white text-sm block">Maulana Irfan Nadvi</span>
                          <span className="text-[10.5px] text-slate-400">Head Imam • 30/30 Days Present</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-400 text-sm block">₹25,000</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                            Paid ✓ (Aug 2026)
                          </span>
                        </div>
                      </div>

                      {/* STAFF 2 */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-extrabold text-white text-sm block">Qari Bilal Ahmed</span>
                          <span className="text-[10.5px] text-slate-400">Moazzin & Khateeb • 30/30 Days Present</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-[#F4D06F] text-sm block">₹18,000</span>
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] transition shadow cursor-pointer"
                          >
                            Disburse Salary
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. RENTALS MOCK */}
                {activeStep.mockType === 'rentals' && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Commercial Waqf Property</span>
                        <h4 className="text-base font-black text-white">Complex Units & Shop Rents</h4>
                      </div>
                      <span className="text-[10px] font-extrabold text-purple-300 bg-purple-950 px-2 py-0.5 rounded border border-purple-700">
                        8 / 8 Shops Occupied (100%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Monthly Rent Due</span>
                        <span className="text-base font-black text-white block mt-0.5">₹48,000 / mo</span>
                        <span className="text-emerald-400 text-[10px] font-bold block">₹40,000 Collected</span>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Security Deposits</span>
                        <span className="text-base font-black text-[#F4D06F] block mt-0.5">₹2,40,000</span>
                        <span className="text-slate-400 text-[10px] font-semibold block">Held in Trust Vault</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Shop #1: Al-Madina Book Depot (Tenant: Zameer)</span>
                        <span className="text-emerald-400 font-extrabold">₹6,000 (Paid ✓)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Shop #2: Rehmat Medicals (Tenant: Dr. Aslam)</span>
                        <span className="text-amber-400 font-extrabold">₹6,000 (Pending)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. TRANSPARENCY MOCK */}
                {activeStep.mockType === 'transparency' && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-[#F4D06F] uppercase tracking-wider block">Community Transparency Portal</span>
                        <h4 className="text-base font-black text-white">Verified Public Audit Record</h4>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        🔒 Read-Only Access Code: 7860
                      </span>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-[#D4AF37]/40 rounded-2xl p-4 text-center space-y-2">
                      <i className="fas fa-qrcode text-3xl text-[#F4D06F]"></i>
                      <p className="text-xs font-extrabold text-white">
                        Scan with Google Pay, PhonePe, or Paytm
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Direct to Official Mosque Bank Account • Instant Verified Receipt Generated
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
                        <span className="text-[9.5px] text-slate-400 block font-bold">General Vault</span>
                        <span className="font-black text-white text-xs">₹2,10,000</span>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
                        <span className="text-[9.5px] text-slate-400 block font-bold">Zakat Funds</span>
                        <span className="font-black text-[#F4D06F] text-xs">₹1,95,000</span>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
                        <span className="text-[9.5px] text-slate-400 block font-bold">Construction</span>
                        <span className="font-black text-emerald-400 text-xs">₹1,45,400</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTTOM STATUS BAR */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Live Mosque Simulator Mode</span>
                  </span>
                  <span>Press Next to continue walkthrough →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BENEFITS SECTION (AS REQUIRED) */}
      <section className="relative z-10 bg-slate-950/80 border-t border-b border-emerald-900/60 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="px-3.5 py-1 rounded-full bg-emerald-950 text-[#F4D06F] border border-[#D4AF37]/40 text-xs font-black uppercase tracking-widest">
              Why Masjids Choose MasjidPay
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Transforming Mosque Administration with 6 Core Benefits
            </h2>
            <p className="text-sm text-slate-300 font-medium">
              Built specifically for Islamic institutions, Waqf committees, Treasurers, and community donors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. SAVES TIME */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xl shadow-lg">
                <i className="fas fa-clock-rotate-left"></i>
              </div>
              <h3 className="text-lg font-black text-white">Saves 15+ Hours Weekly</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automates manual receipt writing, physical ledger entries, member follow-ups, and bank balance reconciliations so committee members can focus on community service.
              </p>
            </div>

            {/* 2. REDUCES MANUAL WORK */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-950 text-[#F4D06F] border border-amber-800 flex items-center justify-center text-xl shadow-lg">
                <i className="fas fa-calculator"></i>
              </div>
              <h3 className="text-lg font-black text-white">Reduces Manual Work & Errors</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Eliminates notebook arithmetic mistakes, calculation discrepancies, and duplicate payroll disbursements with 100% mathematical precision.
              </p>
            </div>

            {/* 3. IMPROVES PRODUCTIVITY */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-6 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-950 text-teal-400 border border-teal-800 flex items-center justify-center text-xl shadow-lg">
                <i className="fab fa-whatsapp"></i>
              </div>
              <h3 className="text-lg font-black text-white">Instant WhatsApp Payment Slips</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automatically delivers official digital receipt vouchers to member mobile numbers in real time, increasing donor responsiveness and collection fulfillment by over 35%.
              </p>
            </div>

            {/* 4. EASIER TO MANAGE */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center text-xl shadow-lg">
                <i className="fas fa-layer-group"></i>
              </div>
              <h3 className="text-lg font-black text-white">Centralized & Simple to Use</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Members, staff payroll, tenant shops, Zakat vaults, and bank accounts all in one clean, multi-lingual interface accessible from any mobile phone or computer.
              </p>
            </div>

            {/* 5. BETTER VISIBILITY & CONTROL */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 rounded-3xl p-6 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center text-xl shadow-lg">
                <i className="fas fa-vault"></i>
              </div>
              <h3 className="text-lg font-black text-white">Strict Vault Segregation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Guarantees that Zakat and Construction funds never get mixed into general operational accounts, preserving Sharia compliance and Waqf integrity.
              </p>
            </div>

            {/* 6. FASTER & BETTER DECISIONS */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-[#D4AF37]/50 rounded-3xl p-6 transition space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-[#F4D06F] border border-[#D4AF37] flex items-center justify-center text-xl shadow-lg">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <h3 className="text-lg font-black text-white">1-Click Official Audit Reports</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generate and print complete Income & Expense statements, Statement of Accounts (SOA), and annual audit balance sheets with one click for Waqf board inspections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CALL-TO-ACTION */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
        <div className="bg-gradient-to-r from-emerald-950 via-[#064E3B] to-slate-950 border-2 border-[#D4AF37]/60 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#064E3B] border border-[#D4AF37] text-[#F4D06F] flex items-center justify-center text-2xl mx-auto shadow-lg">
            <i className="fas fa-mosque"></i>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Upgrade Your Mosque Management?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-medium">
              Join mosques modernizing their member collections, payroll, and financial transparency. Setup takes only 2 minutes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-950/40 transition transform hover:scale-105 flex items-center gap-2"
            >
              <span>Register Your Mosque Now</span>
              <i className="fas fa-arrow-right text-xs"></i>
            </Link>

            <Link
              href="/login"
              className="px-8 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 font-bold text-sm rounded-xl transition flex items-center gap-2"
            >
              <i className="fas fa-right-to-bracket text-xs text-emerald-400"></i>
              <span>Sign In to Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="relative z-10 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} MasjidPay SaaS. All rights reserved. • Unified Financial Management for Smart Mosques</p>
      </footer>
    </div>
  );
}
