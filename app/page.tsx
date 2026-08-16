'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchCity, setSearchCity] = useState('');
  const [searchFund, setSearchFund] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'All Capabilities', icon: 'fa-mosque' },
    { id: 'MEMBERS', label: 'Monthly Members', icon: 'fa-users' },
    { id: 'ZAKAT', label: 'Zakat & Sadaqah', icon: 'fa-hand-holding-dollar' },
    { id: 'EXPENSES', label: 'Expense Ledgers', icon: 'fa-receipt' },
    { id: 'PAYROLL', label: 'Imam & Staff Payroll', icon: 'fa-id-card' },
    { id: 'RENTALS', label: 'Rental Shops', icon: 'fa-building' },
    { id: 'REPORTS', label: 'PDF & WhatsApp Slips', icon: 'fa-file-invoice-dollar' },
    { id: 'PAYMENTS', label: 'UPI & Razorpay QR', icon: 'fa-qrcode' },
  ];

  const featuredMasjids = [
    {
      id: 'jama-masjid',
      name: 'Jama Masjid Vaniyambadi',
      city: 'Vaniyambadi, Tamil Nadu',
      tag: 'Verified Historical Mosque',
      rating: '4.98',
      monthlyMembers: 340,
      activeFunds: ['General Fund', 'Madrasa Support', 'Maintenance'],
      image: '/images/masjid_hero_sunset.jpg',
      collectedThisMonth: '₹4,85,000',
      target: '₹5,00,000',
      percent: 97,
    },
    {
      id: 'al-noor',
      name: 'Al-Noor Islamic Center',
      city: 'Chennai, Tamil Nadu',
      tag: 'Community Hub',
      rating: '4.95',
      monthlyMembers: 215,
      activeFunds: ['Construction Fund', 'Zakat Vault', 'Orphan Aid'],
      image: '/images/masjid_hero_sunset.jpg',
      collectedThisMonth: '₹3,20,000',
      target: '₹4,00,000',
      percent: 80,
    },
    {
      id: 'madina-masjid',
      name: 'Madina Grand Mosque',
      city: 'Bengaluru, Karnataka',
      tag: 'Urban Islamic Center',
      rating: '4.99',
      monthlyMembers: 520,
      activeFunds: ['Solar Energy Project', 'Daily Iftar', 'Medical Aid'],
      image: '/images/masjid_hero_sunset.jpg',
      collectedThisMonth: '₹8,90,000',
      target: '₹10,000,000',
      percent: 89,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9EC] text-[#1c2e28] font-sans selection:bg-[#D4AF37]/30">
      {/* 1. TOP NAVIGATION (AIRBNB STYLE WITH ROYAL ISLAMIC AESTHETICS) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF9EC]/90 border-b border-[#D4AF37]/25 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGO WITH ROYAL CRESCENT & GOLD ACCENT */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-[#064E3B] border border-[#D4AF37]/60 text-[#F4D06F] flex items-center justify-center shadow-md shadow-[#064E3B]/20 transition transform group-hover:scale-105">
              <i className="fas fa-mosque text-xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight text-[#102A25]">
                  Masjid<span className="text-[#064E3B]">Pay</span>
                </span>
                <span className="text-[#D4AF37] text-lg font-black leading-none">✦</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">
                Financial SaaS Engine
              </span>
            </div>
          </Link>

          {/* CENTER PRODUCT PILL TABS */}
          <nav className="hidden lg:flex items-center bg-white/80 border border-[#D4AF37]/30 rounded-full px-4 py-1.5 shadow-xs gap-1 text-xs font-extrabold">
            <Link
              href="#capabilities"
              className="px-4 py-2 text-[#064E3B] hover:text-[#102A25] rounded-full transition flex items-center gap-1.5"
            >
              <i className="fas fa-layer-group text-[#D4AF37]"></i> Capabilities
            </Link>
            <Link
              href="/donate/jama-masjid"
              className="px-4 py-2 text-[#0F766E] hover:text-[#064E3B] rounded-full transition flex items-center gap-1.5"
            >
              <i className="fas fa-heart text-rose-500"></i> Public Donation Demo
            </Link>
            <Link
              href="/masjid/jama-masjid/transparency"
              className="px-4 py-2 text-slate-700 hover:text-[#064E3B] rounded-full transition flex items-center gap-1.5"
            >
              <i className="fas fa-scale-balanced text-[#D4AF37]"></i> Transparency
            </Link>
          </nav>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-extrabold text-[#102A25] hover:text-[#064E3B] px-4 py-2.5 rounded-xl hover:bg-[#D4AF37]/10 transition"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-xs font-extrabold bg-[#064E3B] hover:bg-[#102A25] text-white border border-[#D4AF37]/60 px-5 py-2.5 rounded-xl shadow-md shadow-[#064E3B]/20 transition flex items-center gap-2"
            >
              <span>Register Masjid</span>
              <i className="fas fa-arrow-right text-[10px] text-[#F4D06F]"></i>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH LARGE MASJID SUNSET PHOTOGRAPH & EMERALD OVERLAY */}
      <section className="relative min-h-[580px] lg:min-h-[660px] flex items-center justify-center overflow-hidden border-b border-[#D4AF37]/30">
        {/* BACKGROUND PHOTOGRAPH WITH GOLDEN SUNSET & EMERALD GRADIENT */}
        <div
          className="absolute inset-0 bg-cover bg-center z-0 transform scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('/images/masjid_hero_sunset.jpg')`,
          }}
        />

        {/* EMERALD OVERLAY (#064E3B) WITH SOFT SUNSET & DARK GRADIENTS */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#064E3B]/85 via-[#064E3B]/75 to-[#102A25]/95 z-10" />

        {/* SUBTLE ISLAMIC GEOMETRIC LATTICE PATTERN */}
        <div className="absolute inset-0 bg-islamic-pattern opacity-30 z-10 pointer-events-none" />

        {/* HERO CONTENT */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-20 py-16 lg:py-24 space-y-6">
          {/* BISMILLAH & ARABESQUE WATERMARK BADGE */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#102A25]/80 border border-[#D4AF37]/50 text-[#F4D06F] text-xs font-extrabold shadow-lg backdrop-blur-sm">
            <span className="text-[#D4AF37] font-serif text-sm">﷽</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
            <span>Unified Multi-Tenant Financial Management Built for Masjids</span>
          </div>

          {/* MAIN HEADLINE WITH ROYAL GOLD GRADIENT KEYWORDS */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#FFF9EC] tracking-tight leading-[1.15] max-w-4xl mx-auto drop-shadow-sm">
            Complete Financial Transparency & Member Collections for{' '}
            <span className="gold-gradient-text underline decoration-[#D4AF37]/40 decoration-wavy decoration-2">
              Your Masjid
            </span>
          </h1>

          {/* VALUE SUBTITLE */}
          <p className="mt-4 text-base sm:text-lg text-[#FFF9EC]/90 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-xs">
            Replace manual registers. Track monthly member collections, Zakat vaults, construction donations, staff payroll, and dispatch automated WhatsApp & PDF receipts with 100% audit integrity.
          </p>

          {/* 3. AIRBNB PILL-SHAPED GLOBAL SEARCH BAR WITH ROYAL GOLD SEARCH ORB */}
          <div className="pt-4 max-w-3xl mx-auto">
            <div className="search-pill bg-white p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 sm:gap-0 justify-between text-left shadow-2xl">
              {/* WHERE SEGMENT */}
              <div className="px-5 py-2 sm:py-1 w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-[#e8dfc8]">
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#064E3B]">
                  Mosque Search
                </span>
                <input
                  type="text"
                  placeholder="Find by name or city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full text-xs font-bold text-[#102A25] placeholder-slate-400 outline-none bg-transparent"
                />
              </div>

              {/* FUND TYPE SEGMENT */}
              <div className="px-5 py-2 sm:py-1 w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-[#e8dfc8]">
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E]">
                  Fund Allocation
                </span>
                <select
                  value={searchFund}
                  onChange={(e) => setSearchFund(e.target.value)}
                  className="w-full text-xs font-bold text-[#102A25] outline-none bg-transparent cursor-pointer"
                >
                  <option value="ALL">All Funds (General, Zakat)</option>
                  <option value="ZAKAT">Zakat & Sadaqah Vault</option>
                  <option value="MEMBERS">Monthly Member Amount</option>
                  <option value="CONSTRUCTION">Construction & Renovation</option>
                </select>
              </div>

              {/* ACTION ORB BUTTON */}
              <div className="w-full sm:w-auto px-2 flex justify-end">
                <Link
                  href="/donate/jama-masjid"
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#D4AF37] hover:bg-[#B8860B] text-[#102A25] hover:text-white font-black rounded-full text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <i className="fas fa-magnifying-glass"></i>
                  <span>Explore Demo Portal</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 4 LIVE KPI TRUST BADGES */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-xs text-[#FFF9EC]/90 font-bold">
            <div className="flex items-center justify-center gap-2 bg-[#102A25]/60 border border-[#D4AF37]/30 rounded-xl p-2.5 backdrop-blur-xs">
              <i className="fas fa-shield-halved text-[#F4D06F]"></i>
              <span>100% Tax Compliant</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-[#102A25]/60 border border-[#D4AF37]/30 rounded-xl p-2.5 backdrop-blur-xs">
              <i className="fab fa-whatsapp text-[#25D366]"></i>
              <span>Auto WhatsApp Slips</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-[#102A25]/60 border border-[#D4AF37]/30 rounded-xl p-2.5 backdrop-blur-xs">
              <i className="fas fa-qrcode text-[#F4D06F]"></i>
              <span>Razorpay & UPI QR</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-[#102A25]/60 border border-[#D4AF37]/30 rounded-xl p-2.5 backdrop-blur-xs">
              <i className="fas fa-file-pdf text-rose-400"></i>
              <span>1-Click PDF Ledgers</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CATEGORY NAVIGATION STRIP (AIRBNB COMPONENT: category-strip) */}
      <section className="bg-white border-b border-[#D4AF37]/25 sticky top-20 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {categories.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-full text-xs font-extrabold transition flex items-center gap-2 border ${
                    active
                      ? 'bg-[#064E3B] text-[#F4D06F] border-[#D4AF37] shadow-sm'
                      : 'bg-[#FFF9EC] text-slate-700 border-[#e8dfc8] hover:border-[#D4AF37]/60 hover:bg-white'
                  }`}
                >
                  <i className={`fas ${cat.icon} text-xs ${active ? 'text-[#F4D06F]' : 'text-[#064E3B]'}`}></i>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. FEATURED MASJID PORTALS SHOWCASE (AIRBNB COMPONENT: property-card) */}
      <section id="capabilities" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#064E3B] text-xs font-black uppercase tracking-widest mb-1.5">
              <i className="fas fa-crown text-[#D4AF37]"></i> Verified Mosque Ecosystem
            </div>
            <h2 className="text-3xl font-black text-[#102A25] tracking-tight">
              Live Verified Mosques & Transparent Portals
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Explore how masjids record member fees, publish live transparency ledgers, and manage operations.
            </p>
          </div>

          <Link
            href="/register"
            className="px-5 py-2.5 bg-white text-[#064E3B] border border-[#D4AF37] hover:bg-[#FFF9EC] rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <i className="fas fa-plus text-[#D4AF37]"></i> Register Your Mosque
          </Link>
        </div>

        {/* MASJID CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredMasjids.map((masjid) => (
            <div key={masjid.id} className="masjid-card-luxury overflow-hidden flex flex-col group">
              {/* PHOTO WITH FLOATING BADGES */}
              <div className="relative h-56 bg-slate-900 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${masjid.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102A25] via-[#102A25]/30 to-transparent" />

                {/* TOP LEFT BADGE */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur border border-[#D4AF37]/50 rounded-full px-3 py-1 text-[11px] font-extrabold text-[#064E3B] shadow-sm flex items-center gap-1.5">
                  <i className="fas fa-certificate text-[#D4AF37]"></i>
                  <span>{masjid.tag}</span>
                </div>

                {/* TOP RIGHT RATING BADGE */}
                <div className="absolute top-3 right-3 bg-[#102A25]/90 border border-[#D4AF37]/40 rounded-full px-2.5 py-1 text-[11px] font-black text-[#F4D06F] flex items-center gap-1">
                  <i className="fas fa-star text-[#D4AF37] text-[10px]"></i>
                  <span>{masjid.rating}</span>
                </div>

                {/* BOTTOM TITLE OVERLAY */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-base font-extrabold leading-tight text-white drop-shadow-sm">{masjid.name}</h3>
                  <span className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <i className="fas fa-location-dot text-[#D4AF37]"></i> {masjid.city}
                  </span>
                </div>
              </div>

              {/* CARD BODY */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Active Registered Members:</span>
                    <span className="text-[#064E3B] font-extrabold bg-[#FFF9EC] px-2 py-0.5 rounded-md border border-[#D4AF37]/30">
                      {masjid.monthlyMembers} Families
                    </span>
                  </div>

                  {/* PROGRESS BAR */}
                  <div>
                    <div className="flex justify-between text-[11px] font-extrabold mb-1">
                      <span className="text-slate-500">Monthly Target: {masjid.target}</span>
                      <span className="text-[#064E3B]">{masjid.percent}% Collected</span>
                    </div>
                    <div className="w-full h-2 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0F766E] to-[#064E3B] rounded-full transition-all duration-1000"
                        style={{ width: `${masjid.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* ACTIVE FUNDS PILLS */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {masjid.activeFunds.map((fund, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold bg-[#FFF9EC] text-[#064E3B] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full"
                      >
                        {fund}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CARD ACTIONS */}
                <div className="pt-4 border-t border-[#e8dfc8] flex items-center gap-2">
                  <Link
                    href={`/donate/${masjid.id}`}
                    className="flex-1 py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold rounded-xl text-xs text-center shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <i className="fas fa-hand-holding-heart text-[#F4D06F]"></i>
                    <span>Donate Now</span>
                  </Link>

                  <Link
                    href={`/masjid/${masjid.id}/transparency`}
                    className="p-2.5 bg-[#FFF9EC] hover:bg-white text-[#064E3B] border border-[#D4AF37]/50 rounded-xl text-xs transition"
                    title="View Public Financial Transparency Portal"
                  >
                    <i className="fas fa-scale-balanced"></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. PURPOSE-BUILT CAPABILITIES GRID (AIRBNB COMPONENT: amenity-row & cards) */}
      <section className="py-16 lg:py-24 bg-white border-y border-[#D4AF37]/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
              Engineered Exclusively for Islamic Institutions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A25] tracking-tight">
              Six Core Pillars of Masjid Administration
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              A comprehensive operating system designed to elevate community trust and eliminate administrative burnout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* PILLAR 1 */}
            <div className="p-8 rounded-3xl bg-[#FFF9EC] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-xl shadow-md">
                <i className="fas fa-users-line"></i>
              </div>
              <h3 className="text-lg font-extrabold text-[#102A25]">Monthly Member Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Maintain directory of family heads, assign custom monthly contribution quotas, track pending balance slips, and dispatch instant payment reminders.
              </p>
            </div>

            {/* PILLAR 2 */}
            <div className="p-8 rounded-3xl bg-[#FFF9EC] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-xl shadow-md">
                <i className="fas fa-hand-holding-dollar"></i>
              </div>
              <h3 className="text-lg font-extrabold text-[#102A25]">Zakat & Sadaqah Vaults</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Strict fund segregation. Ensure Zakat collections are strictly audited and disbursed to eligible recipients without mixing with operational expense pools.
              </p>
            </div>

            {/* PILLAR 3 */}
            <div className="p-8 rounded-3xl bg-[#FFF9EC] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-xl shadow-md">
                <i className="fas fa-receipt"></i>
              </div>
              <h3 className="text-lg font-extrabold text-[#102A25]">Mosque Income & Expense Ledgers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track utility bills, maintenance contracts, hall bookings, and shop rental collections. Real-time budget alerts prevent monthly cash flow deficits.
              </p>
            </div>

            {/* PILLAR 4 */}
            <div className="p-8 rounded-3xl bg-[#FFF9EC] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-xl shadow-md">
                <i className="fab fa-whatsapp"></i>
              </div>
              <h3 className="text-lg font-extrabold text-[#102A25]">Instant WhatsApp Receipts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically generate customized WhatsApp billing and receipt templates with 1 click, delivering transparent confirmation to donor phones immediately.
              </p>
            </div>

            {/* PILLAR 5 */}
            <div className="p-8 rounded-3xl bg-[#FFF9EC] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-xl shadow-md">
                <i className="fas fa-file-pdf"></i>
              </div>
              <h3 className="text-lg font-extrabold text-[#102A25]">Instant Universal PDF Exporter</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate high-resolution printable PDF receipts with official Bismillah headers, authorized signature stamps, and monthly income/expense balance sheets.
              </p>
            </div>

            {/* PILLAR 6 */}
            <div className="p-8 rounded-3xl bg-[#FFF9EC] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-xl shadow-md">
                <i className="fas fa-scale-balanced"></i>
              </div>
              <h3 className="text-lg font-extrabold text-[#102A25]">Public Transparency Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Give your local community a shareable, tamper-proof transparency URL displaying ongoing development projects, verified balances, and audited statements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. COMMUNITY TRUST TESTIMONIALS (AIRBNB COMPONENT: reviews-card) */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <div className="flex items-center justify-center gap-1 text-[#D4AF37] text-sm">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
          </div>
          <h2 className="text-3xl font-black text-[#102A25] tracking-tight">
            Trusted by Mosque Committees & Trustees
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Read how mosques transformed their audit processes and elevated community contributions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-[#D4AF37]/30 rounded-3xl shadow-xs space-y-4">
            <p className="text-xs text-slate-700 italic leading-relaxed">
              "We eliminated three paper receipt books. Now when a monthly member pays their fee, they receive a professional WhatsApp slip in 5 seconds. Transparency has never been higher."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-[#e8dfc8]">
              <div className="w-9 h-9 rounded-full bg-[#064E3B] text-[#F4D06F] font-bold text-xs flex items-center justify-center">
                HM
              </div>
              <div>
                <span className="text-xs font-extrabold text-[#102A25] block">Haji Mohammed Usman</span>
                <span className="text-[10px] text-slate-500">General Secretary, Jama Masjid</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-[#D4AF37]/30 rounded-3xl shadow-xs space-y-4">
            <p className="text-xs text-slate-700 italic leading-relaxed">
              "The ability to generate instant PDF statements and grant granular view permissions to committee auditors saved us dozens of hours at our annual general meeting."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-[#e8dfc8]">
              <div className="w-9 h-9 rounded-full bg-[#0F766E] text-white font-bold text-xs flex items-center justify-center">
                IA
              </div>
              <div>
                <span className="text-xs font-extrabold text-[#102A25] block">Irfan Ahmed</span>
                <span className="text-[10px] text-slate-500">Treasurer, Islamic Center</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-[#D4AF37]/30 rounded-3xl shadow-xs space-y-4">
            <p className="text-xs text-slate-700 italic leading-relaxed">
              "Donors love the online payment links and instant receipts. Our Friday collections have doubled since implementing digital UPI QR codes at the entrance."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-[#e8dfc8]">
              <div className="w-9 h-9 rounded-full bg-[#102A25] text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                SB
              </div>
              <div>
                <span className="text-xs font-extrabold text-[#102A25] block">Syed Bilal</span>
                <span className="text-[10px] text-slate-500">Mosque Trustee, Madina Masjid</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER (DEEP EMERALD #064E3B WITH ROYAL GOLD #D4AF37 ACCENTS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-[#064E3B] via-[#0B5E48] to-[#102A25] border border-[#D4AF37]/50 p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl space-y-6">
          <div className="absolute -right-12 -bottom-12 text-[#D4AF37]/10 text-9xl font-serif pointer-events-none">
            <i className="fas fa-mosque"></i>
          </div>

          <span className="inline-block px-4 py-1 rounded-full bg-[#102A25]/60 border border-[#D4AF37]/40 text-[#F4D06F] text-xs font-extrabold uppercase tracking-widest">
            Join the Verified Network
          </span>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto text-[#FFF9EC]">
            Ready to Modernize Your Mosque Financial Management?
          </h2>

          <p className="text-xs sm:text-sm text-[#FFF9EC]/80 max-w-xl mx-auto leading-relaxed">
            Register your masjid today. Get approved by Super Admin, configure your donation categories, and start collecting seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#B8860B] text-[#102A25] hover:text-white font-black rounded-2xl shadow-xl transition flex items-center justify-center gap-2 text-sm"
            >
              <i className="fas fa-mosque"></i>
              <span>Register Your Mosque</span>
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-[#102A25]/80 hover:bg-[#102A25] text-white border border-[#D4AF37]/50 font-extrabold rounded-2xl transition flex items-center justify-center gap-2 text-sm"
            >
              <span>Existing Admin Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. LUXURY FOOTER (AIRBNB COMPONENT: footer-light WITH DARK ISLAMIC BASE) */}
      <footer className="bg-[#102A25] text-slate-300 border-t border-[#D4AF37]/30 py-12 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* BRAND COLUMN */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#064E3B] border border-[#D4AF37]/50 text-[#F4D06F] flex items-center justify-center font-bold text-sm">
                <i className="fas fa-mosque"></i>
              </div>
              <span className="text-lg font-extrabold text-white">
                Masjid<span className="text-[#D4AF37]">Pay</span>
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Multi-tenant financial operating engine engineered specifically for masjids, Islamic trusts, and charitable endowments worldwide.
            </p>
            <span className="text-[10px] text-[#F4D06F] block font-semibold">
              Domain: masjidpay.org • Verified SaaS
            </span>
          </div>

          {/* QUICK LINKS */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37] block">Mosque Portals</span>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link href="/donate/jama-masjid" className="hover:text-white transition">Public Donation Demo</Link></li>
              <li><Link href="/masjid/jama-masjid/transparency" className="hover:text-white transition">Transparency Dashboard</Link></li>
              <li><Link href="/register" className="hover:text-white transition">Register New Mosque</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Committee Admin Login</Link></li>
            </ul>
          </div>

          {/* FINANCIAL MODULES */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37] block">Financial Features</span>
            <ul className="space-y-1.5 text-slate-400">
              <li><span>Monthly Member Subscriptions</span></li>
              <li><span>Zakat & Sadaqah Vaults</span></li>
              <li><span>Razorpay UPI QR Generator</span></li>
              <li><span>PDF Statements & Ledgers</span></li>
            </ul>
          </div>

          {/* SUPPORT CONTACT */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37] block">Support & Helpdesk</span>
            <p className="text-slate-400 text-[11px]">
              Need assistance with onboarding or mosque verification? Contact our support team directly.
            </p>
            <a
              href="https://wa.me/919894977003"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] rounded-xl font-bold hover:bg-[#25D366]/30 transition text-[11px]"
            >
              <i className="fab fa-whatsapp text-sm"></i> WhatsApp: +91 98949 77003
            </a>
          </div>
        </div>

        {/* BOTTOM LEGAL BAND */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-4">
          <div>
            © {new Date().getFullYear()} MasjidPay SaaS (masjidpay.org). All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Sharia Compliant</span>
            <span>•</span>
            <span>256-Bit SSL Encrypted</span>
            <span>•</span>
            <span>Multi-Tenant Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
