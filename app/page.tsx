'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeNav, setActiveNav] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', href: '#' },
    { id: 'about', label: 'About Us', href: '#about' },
    { id: 'pricing', label: 'Pricing', href: '#pricing' },
    { id: 'faq', label: 'FAQ', href: '#faq' },
    { id: 'blog', label: 'Blog', href: '#blog' },
    { id: 'contact', label: 'Contact Us', href: '#contact' },
  ];

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
      {/* 1. TOP NAVIGATION WITH SLEEK AIRBNB / ROYAL ISLAMIC AESTHETICS */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF9EC]/95 border-b border-[#D4AF37]/25 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* LOGO WITH ROYAL CRESCENT & GOLD ACCENT */}
          <Link href="/" onClick={() => setActiveNav('home')} className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-[#064E3B] border border-[#D4AF37]/60 text-[#F4D06F] flex items-center justify-center shadow-md shadow-[#064E3B]/20 transition transform group-hover:scale-105">
              <i className="fas fa-mosque text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#102A25]">
                  Masjid<span className="text-[#064E3B]">Pay</span>
                </span>
                <span className="text-[#D4AF37] text-base font-black leading-none">✦</span>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0F766E] block -mt-0.5">
                Financial SaaS Engine
              </span>
            </div>
          </Link>

          {/* WEBSITE NAVIGATION MENU (EXACTLY MATCHING USER SCREENSHOT) */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/80 backdrop-blur-xs border border-[#D4AF37]/30 px-3 py-1.5 rounded-full shadow-2xs">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setActiveNav(item.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#EBF7F2] text-[#064E3B] font-extrabold shadow-2xs'
                      : 'text-slate-600 hover:text-[#064E3B] hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* ACTION BUTTONS & MOBILE MENU TOGGLE */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-xs font-extrabold text-[#102A25] hover:text-[#064E3B] px-3.5 py-2 rounded-xl hover:bg-[#D4AF37]/10 transition"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-xs font-extrabold bg-[#064E3B] hover:bg-[#102A25] text-white border border-[#D4AF37]/60 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl shadow-md shadow-[#064E3B]/20 transition flex items-center gap-1.5"
            >
              <span>Register</span>
              <i className="fas fa-arrow-right text-[10px] text-[#F4D06F] hidden sm:inline"></i>
            </Link>

            {/* MOBILE HAMBURGER BUTTON */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-emerald-800 rounded-xl hover:bg-slate-100 transition text-base"
              aria-label="Toggle menu"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>

        {/* MOBILE DROPDOWN MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 border-b border-[#D4AF37]/30 px-4 py-3 space-y-1 backdrop-blur-md animate-in slide-in-from-top duration-200">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`block px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#EBF7F2] text-[#064E3B] font-extrabold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        )}
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
          {/* BISMILLAH & ARABESQUE WATERMARK BADGE - ENLARGED & PROMINENT */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 px-6 sm:px-9 py-2.5 sm:py-3.5 rounded-full bg-[#102A25]/90 border-2 border-[#D4AF37]/60 text-[#F4D06F] shadow-2xl shadow-[#102A25]/50 backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37] hover:scale-[1.01]">
            <span className="text-[#F4D06F] text-lg sm:text-2xl font-serif font-bold tracking-wide leading-none drop-shadow-xs" dir="rtl">
              بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </span>
            <span className="text-[#D4AF37] text-base sm:text-lg font-black leading-none hidden xs:inline">
              •
            </span>
            <span className="text-xs sm:text-sm md:text-[15px] font-black text-[#FFF9EC] tracking-wide">
              Unified Multi-Tenant Financial Management Built for Masjids
            </span>
          </div>

          {/* MAIN HEADLINE WITH ROYAL GOLD GRADIENT KEYWORDS */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#FFF9EC] tracking-tight leading-[1.15] max-w-4xl mx-auto drop-shadow-sm">
            Complete Financial Transparency & Member Collections for{' '}
            <span className="gold-gradient-text">
              Your Masjid
            </span>
          </h1>

          {/* VALUE SUBTITLE */}
          <p className="mt-4 text-base sm:text-lg text-[#FFF9EC]/90 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-xs">
            Replace manual registers. Track monthly member collections, Zakat vaults, construction donations, staff payroll, and dispatch automated WhatsApp & PDF receipts with 100% audit integrity.
          </p>

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

      {/* 7.5 ABOUT US SECTION (#about) */}
      <section id="about" className="py-16 lg:py-24 bg-white border-y border-[#D4AF37]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
              About MasjidPay
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A25] tracking-tight">
              Empowering Mosques with Modern Islamic Financial Technology
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Built upon the values of Amanah (trust) and Shifafiyyah (transparency), MasjidPay transforms paper bookkeeping into a secure, multi-tenant digital operating system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center font-bold text-base">
                <i className="fas fa-hand-holding-heart"></i>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Amanah & Integrity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Segregated fund ledgers prevent mixing of Zakat, general donations, and construction pools, adhering strictly to Islamic principles.
              </p>
            </div>

            <div className="p-6 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center font-bold text-base">
                <i className="fas fa-bolt"></i>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Speed & Automation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automate monthly member collection tracking, instant WhatsApp receipts, and one-click PDF statements for committee meetings.
              </p>
            </div>

            <div className="p-6 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center font-bold text-base">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Enterprise Security</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-tenant cloud architecture, encrypted database backups, and granular role permissions keep your mosque records safe and private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7.6 PRICING SECTION (#pricing) */}
      <section id="pricing" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#102A25] tracking-tight">
            Simple, Accessible Pricing for Every Mosque
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Choose a plan tailored to your community size. No hidden setup fees or surprise transaction cuts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* STARTER */}
          <div className="p-7 bg-white border border-[#D4AF37]/30 rounded-3xl space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase rounded-full">Community Free</span>
              <h3 className="text-xl font-black text-slate-900">Small Mosque</h3>
              <div className="text-3xl font-black text-[#064E3B]">₹0 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
              <p className="text-xs text-slate-600">Ideal for mohalla and village masjids starting digital recordkeeping.</p>
              <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Up to 100 Members</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Mosque Income & Expense Ledger</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Basic PDF Receipts</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> 1 Admin Account</li>
              </ul>
            </div>
            <Link href="/register" className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl text-center block transition">
              Get Started Free
            </Link>
          </div>

          {/* PROFESSIONAL */}
          <div className="p-7 bg-[#FFF9EC] border-2 border-[#D4AF37] rounded-3xl space-y-5 shadow-xl flex flex-col justify-between relative transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#064E3B] text-[#F4D06F] text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-[#D4AF37] shadow-sm">
              Most Popular
            </div>
            <div className="space-y-3">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase rounded-full">Pro Mosque</span>
              <h3 className="text-xl font-black text-slate-900">Standard Masjid</h3>
              <div className="text-3xl font-black text-[#064E3B]">₹499 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
              <p className="text-xs text-slate-600">Complete operating suite for active urban and town mosques.</p>
              <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-[#D4AF37]/30">
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Unlimited Monthly Members</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Automated WhatsApp Receipts</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Razorpay & UPI QR Payment Gateway</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Staff Payroll & Rental Management</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Public Transparency Portal</li>
              </ul>
            </div>
            <Link href="/register" className="w-full py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white text-xs font-black rounded-xl text-center block transition shadow-md">
              Register Pro Mosque
            </Link>
          </div>

          {/* FEDERATION / TRUST */}
          <div className="p-7 bg-white border border-[#D4AF37]/30 rounded-3xl space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase rounded-full">Grand Waqf / Trust</span>
              <h3 className="text-xl font-black text-slate-900">Islamic Trust</h3>
              <div className="text-3xl font-black text-[#064E3B]">₹1,499 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
              <p className="text-xs text-slate-600">Multi-branch management for Waqf boards, madrasa chains, and large endowments.</p>
              <ul className="space-y-2 text-xs text-slate-700 pt-3 border-t border-slate-100">
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Multi-Masjid Consolidated Audit</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Custom Subdomain & Branding</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> Dedicated Account Manager & Priority Phone Support</li>
                <li className="flex items-center gap-2"><i className="fas fa-check text-emerald-600 text-xs"></i> 99.9% SLA & Automated Backups</li>
              </ul>
            </div>
            <Link href="#contact" className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl text-center block transition">
              Contact Trust Team
            </Link>
          </div>
        </div>
      </section>

      {/* 7.7 FAQ SECTION (#faq) */}
      <section id="faq" className="py-16 lg:py-24 bg-white border-y border-[#D4AF37]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
              Common Questions
            </span>
            <h2 className="text-3xl font-black text-[#102A25] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Everything you need to know about setting up MasjidPay for your mosque committee.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does member collection and WhatsApp receipting work?',
                a: 'When an admin records a member collection or rental payment, MasjidPay generates an instant WhatsApp message template with donor name, amount, months cleared, and mosque branding, which you can dispatch with one click.',
              },
              {
                q: 'Is our mosque financial data private and secure?',
                a: 'Yes. Each mosque has isolated multi-tenant records protected by enterprise encryption. Committee members can be assigned granular roles (Admin, Accountant, Viewer) and public transparency views can be toggled on or off at any time.',
              },
              {
                q: 'Can we generate printable PDF reports for Annual General Meetings?',
                a: 'Yes! MasjidPay includes a 1-click Universal PDF Report generator that produces high-resolution balance sheets, income/expense ledgers, and donor slips complete with official Bismillah headers and signature stamps.',
              },
              {
                q: 'How can our mosque accept online UPI and Card donations?',
                a: 'You can connect your mosque’s Razorpay or direct UPI account from Dashboard > Payment Gateway. MasjidPay automatically generates scannable dynamic QR codes and online payment links for Friday jummah and Ramzan appeals.',
              },
            ].map((faq, i) => (
              <div key={i} className="p-5 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-2xl space-y-2 shadow-2xs">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <i className="fas fa-circle-question text-emerald-700"></i>
                  {faq.q}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed pl-5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7.8 BLOG & INSIGHTS SECTION (#blog) */}
      <section id="blog" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
            Articles & Guidance
          </span>
          <h2 className="text-3xl font-black text-[#102A25] tracking-tight">
            Mosque Management & Islamic Finance Insights
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Practical guides and best practices for trustees, mutawallis, and mosque finance teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#D4AF37]/30 rounded-3xl overflow-hidden shadow-xs hover:border-[#D4AF37] transition flex flex-col">
            <div className="h-44 bg-[#064E3B]/10 p-6 flex items-center justify-center">
              <i className="fas fa-hand-holding-dollar text-5xl text-[#064E3B]/80"></i>
            </div>
            <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Zakat Guidelines</span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1">Best Practices for Mosque Zakat Vaults & Fund Segregation</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">How to ensure compliance with Sharia guidelines when collecting and disbursing Zakat vs operational funds.</p>
              </div>
              <span className="text-[11px] font-bold text-[#064E3B] pt-2 inline-flex items-center gap-1">Read Article →</span>
            </div>
          </div>

          <div className="bg-white border border-[#D4AF37]/30 rounded-3xl overflow-hidden shadow-xs hover:border-[#D4AF37] transition flex flex-col">
            <div className="h-44 bg-[#0F766E]/10 p-6 flex items-center justify-center">
              <i className="fas fa-qrcode text-5xl text-[#0F766E]/80"></i>
            </div>
            <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider">Digital Transformation</span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1">How UPI QR Codes Doubled Jummah Collections in 30 Days</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">A case study on transitioning community mosques from cash-only boxes to hybrid digital kiosks.</p>
              </div>
              <span className="text-[11px] font-bold text-[#064E3B] pt-2 inline-flex items-center gap-1">Read Article →</span>
            </div>
          </div>

          <div className="bg-white border border-[#D4AF37]/30 rounded-3xl overflow-hidden shadow-xs hover:border-[#D4AF37] transition flex flex-col">
            <div className="h-44 bg-[#102A25]/10 p-6 flex items-center justify-center">
              <i className="fas fa-file-invoice-dollar text-5xl text-[#102A25]/80"></i>
            </div>
            <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Audit & Transparency</span>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1">Preparing Fault-Free Annual Financial Reports for Your Trust</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">Step-by-step checklist to prepare transparent monthly and yearly accounts for trustees and congregation.</p>
              </div>
              <span className="text-[11px] font-bold text-[#064E3B] pt-2 inline-flex items-center gap-1">Read Article →</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7.9 CONTACT US SECTION (#contact) */}
      <section id="contact" className="py-16 lg:py-24 bg-white border-t border-[#D4AF37]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
              Get in Touch
            </span>
            <h2 className="text-3xl font-black text-[#102A25] tracking-tight">
              Contact Our Mosque Onboarding Team
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Have questions or need assistance registering your masjid? We are here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center text-lg shadow-sm">
                <i className="fab fa-whatsapp"></i>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Instant WhatsApp Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect directly with our team for quick onboarding guidance, verification assistance, or product demos.
              </p>
              <a
                href="https://wa.me/919894977003"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl font-extrabold text-xs shadow-xs hover:bg-[#1EBE5D] transition"
              >
                <i className="fab fa-whatsapp"></i> Chat: +91 98949 77003
              </a>
            </div>

            <div className="p-6 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-lg shadow-sm">
                <i className="fas fa-envelope"></i>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Email Helpdesk</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For formal trust inquiries, Waqf documentation, or custom enterprise requirements.
              </p>
              <a
                href="mailto:masjidpay3@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#064E3B] text-white rounded-xl font-extrabold text-xs shadow-xs hover:bg-[#102A25] transition"
              >
                <i className="fas fa-envelope"></i> masjidpay3@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION BANNER */}
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
              <li><Link href="/donate/jama-masjid" className="hover:text-white transition">Public Contribution Portal</Link></li>
              <li><Link href="/masjid/jama-masjid/transparency" className="hover:text-white transition">Transparency Dashboard</Link></li>
              <li><Link href="/register" className="hover:text-white transition">Register New Mosque</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Committee Admin Login</Link></li>
              <li><Link href="/super-admin/login" className="hover:text-[#F4D06F] text-slate-400 font-semibold transition">Super Admin Console →</Link></li>
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
            <div className="flex flex-col gap-2">
              <a
                href="https://wa.me/919894977003"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] rounded-xl font-bold hover:bg-[#25D366]/30 transition text-[11px]"
              >
                <i className="fab fa-whatsapp text-sm"></i> WhatsApp: +91 98949 77003
              </a>
              <a
                href="mailto:masjidpay3@gmail.com"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 text-[#F4D06F] rounded-xl font-bold hover:bg-slate-700 transition text-[11px]"
              >
                <i className="fas fa-envelope text-xs"></i> masjidpay3@gmail.com
              </a>
            </div>
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
