'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage, SupportedLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, languages } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // PWA INSTALL PROMPT STATE
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push('/login');
        } else if (data.user.role === 'SUPER_ADMIN') {
          // Super Admin is strictly directed to Super Admin control center
          router.push('/super-admin/masjids');
        } else if (data.user.masjidStatus && data.user.masjidStatus === 'PENDING') {
          router.push('/status');
        } else {
          setUser(data.user);
          setLoading(false);
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // LISTEN TO PWA INSTALL EVENT FOR MOBILE & DESKTOP PC
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        '📲 To install MasjidPay PWA:\n\n• On Chrome/Edge (PC/Laptop): Click the Install icon in the URL browser bar.\n• On Android: Tap "Install App" or "Add to Home Screen".\n• On iPhone/iOS: Tap Share -> "Add to Home Screen".'
      );
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleShareApp = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6faf6]">
        <div className="text-center text-slate-500 font-sans">
          <i className="fas fa-mosque fa-spin text-3xl text-emerald-700 mb-3"></i>
          <p className="text-sm font-semibold">Loading Mosque Financial Dashboard...</p>
        </div>
      </div>
    );
  }

  interface NavItem {
    label: string;
    href: string;
    icon: string;
    external?: boolean;
  }

  interface NavGroup {
    group: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [{ label: 'Dashboard', href: '/dashboard', icon: 'fa-chart-pie' }],
    },
    {
      group: 'FINANCE & ACCOUNTS',
      items: [
        { label: 'Mosque Income', href: '/dashboard/income', icon: 'fa-wallet' },
        { label: 'Mosque Expenses', href: '/dashboard/expenses', icon: 'fa-receipt' },
        { label: 'Bank & Cash Deposits', href: '/dashboard/finance', icon: 'fa-building-columns' },
        { label: 'Opening Balances', href: '/dashboard/finance/opening-balance', icon: 'fa-scale-balanced' },
        { label: 'Monthly Finance Report', href: '/dashboard/finance/reports', icon: 'fa-file-invoice-dollar' },
      ],
    },
    {
      group: 'MEMBERS & OPERATIONS',
      items: [
        { label: 'Monthly Members', href: '/dashboard/monthly-members', icon: 'fa-users' },
        { label: 'Member Collections', href: '/dashboard/member-collections', icon: 'fa-hand-holding-dollar' },
        { label: 'Staff & Payroll', href: '/dashboard/payroll', icon: 'fa-id-card' },
        { label: 'Rental Management', href: '/dashboard/rentals', icon: 'fa-building' },
      ],
    },
    {
      group: 'DONATIONS & PAYMENTS',
      items: [
        { label: 'Donor Collections', href: '/dashboard/donations', icon: 'fa-hand-holding-heart' },
        { label: 'Payment Links & QR', href: '/dashboard/payment-links', icon: 'fa-qrcode' },
        { label: 'Donor Directory', href: '/dashboard/donors', icon: 'fa-address-book' },
      ],
    },
    {
      group: 'ADMINISTRATION & SYSTEM',
      items: [
        { label: 'Documents', href: '/dashboard/documents', icon: 'fa-folder-closed' },
        { label: 'Users & Permissions', href: '/dashboard/users', icon: 'fa-user-shield' },
        { label: 'Mosque Profile', href: '/dashboard/settings', icon: 'fa-gear' },
        { label: 'Payment Gateway', href: '/dashboard/payment-gateway', icon: 'fa-credit-card' },
        { label: 'Data Backup', href: '/dashboard/backup', icon: 'fa-database' },
        { label: 'Audit & Reports', href: '/dashboard/reports', icon: 'fa-file-lines' },
        { label: 'Recycle Bin', href: '/dashboard/recycle-bin', icon: 'fa-trash-can' },
      ],
    },
  ];

  const isViewer = user?.role === 'VIEWER' || user?.role === 'COMMUNITY_VIEWER';

  const communityNavGroups: NavGroup[] = [
    {
      group: 'OVERVIEW',
      items: [{ label: 'Dashboard', href: '/dashboard', icon: 'fa-table-cells-large' }],
    },
    {
      group: 'FINANCE & ACCOUNTS',
      items: [
        { label: 'Mosque Income', href: '/dashboard/income', icon: 'fa-arrow-trend-up' },
        { label: 'Mosque Expenses', href: '/dashboard/expenses', icon: 'fa-arrow-trend-down' },
      ],
    },
    {
      group: 'COMMUNITY & OPERATIONS',
      items: [
        { label: 'Donor Collections', href: '/dashboard/donations', icon: 'fa-hand-holding-heart' },
        { label: 'Monthly Member Collection', href: '/dashboard/member-collections', icon: 'fa-hand-holding-dollar' },
        { label: 'Monthly Members', href: '/dashboard/monthly-members', icon: 'fa-users' },
        { label: 'Staff Management & Payroll', href: '/dashboard/payroll', icon: 'fa-id-card' },
        { label: 'Rental Management', href: '/dashboard/rentals', icon: 'fa-building' },
      ],
    },
  ];

  const visibleNavGroups = isViewer ? communityNavGroups : navGroups;

  return (
    <div className={`min-h-screen flex text-slate-800 font-sans ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f6faf6]'}`}>
      {/* MASJID ADMIN SIDEBAR - CLEAN, COMPACT & ORGANIZED */}
      <aside className="w-60 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col justify-between hidden md:flex shrink-0 z-30">
        <div className="flex flex-col min-h-0 flex-1">
          {/* BRANDING */}
          <div className="p-3.5 border-b border-slate-100 flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-base shadow-xs shrink-0">
              <i className="fas fa-mosque"></i>
            </div>
            <div className="overflow-hidden flex-1">
              <span className="font-extrabold text-xs text-slate-900 block leading-tight truncate" title={user?.masjidName || 'Mosque Dashboard'}>
                {user?.masjidName || 'Mosque Dashboard'}
              </span>
              {isViewer ? (
                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-block mt-0.5">
                  👀 Guest (Read-Only)
                </span>
              ) : (
                <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                  Verified Mosque
                </span>
              )}
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-3">
            {visibleNavGroups.map((group, idx) => (
              <div key={idx}>
                <div className="px-2 mb-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  {group.group}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href.split('?')[0]));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                          active
                            ? 'bg-[#0F3D26] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <i className={`fas ${item.icon} text-xs w-4 text-center ${active ? 'text-white' : 'text-emerald-700'}`}></i>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* BOTTOM SIDEBAR CONTROLS */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 space-y-2 shrink-0">
          {/* DARK MODE TOGGLE */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <span className="flex items-center gap-2">
              <i className={`fas ${darkMode ? 'fa-sun text-amber-500' : 'fa-moon text-slate-500'} text-xs`}></i>
              <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${darkMode ? 'bg-amber-950 text-amber-400' : 'bg-slate-200 text-slate-600'}`}>
              {darkMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* LANGUAGE SELECTOR */}
          <div className="px-2 py-1 bg-slate-100/90 rounded-lg">
            <div className="relative flex items-center">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                aria-label="Language selection"
                className="w-full pl-6 pr-3 py-0.5 bg-transparent text-[11px] font-bold text-slate-700 outline-none appearance-none cursor-pointer"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeLabel} ({l.label})
                  </option>
                ))}
              </select>
              <i className="fas fa-globe absolute left-0 top-1 text-slate-400 text-xs pointer-events-none"></i>
            </div>
          </div>

          {/* USER PROFILE FOOTER */}
          <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                {user?.name?.[0] || 'M'}
              </div>
              <div className="overflow-hidden">
                <span className="text-[11px] font-extrabold text-slate-900 block truncate">{user?.name}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-600 transition text-xs p-1 rounded"
            >
              <i className="fas fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR WITH BACKDROP */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* BACKDROP OVERLAY */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* SLIDE-OVER DRAWER CONTENT */}
          <aside className="relative w-68 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            <div className="flex flex-col min-h-0 flex-1">
              {/* BRANDING & CLOSE BUTTON */}
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-sm shadow-xs shrink-0">
                    <i className="fas fa-mosque"></i>
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-extrabold text-xs text-slate-900 block leading-tight truncate">
                      {user?.masjidName || 'Mosque Dashboard'}
                    </span>
                    {isViewer ? (
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-block mt-0.5">
                        👀 Guest (Read-Only)
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                        Verified Mosque
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg text-base"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* NAVIGATION LINKS */}
              <nav className="flex-1 overflow-y-auto p-2.5 space-y-3">
                {visibleNavGroups.map((group, idx) => (
                  <div key={idx}>
                    <div className="px-2 mb-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                      {group.group}
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href.split('?')[0]));
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            target={item.external ? '_blank' : undefined}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold transition ${
                              active
                                ? 'bg-[#0F3D26] text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                            }`}
                          >
                            <i className={`fas ${item.icon} text-xs w-4 text-center ${active ? 'text-white' : 'text-emerald-700'}`}></i>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* BOTTOM SIDEBAR CONTROLS */}
            <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 space-y-2 shrink-0">
              {/* DARK MODE TOGGLE */}
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
              >
                <span className="flex items-center gap-2">
                  <i className={`fas ${darkMode ? 'fa-sun text-amber-500' : 'fa-moon text-slate-500'} text-xs`}></i>
                  <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${darkMode ? 'bg-amber-950 text-amber-400' : 'bg-slate-200 text-slate-600'}`}>
                  {darkMode ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* LANGUAGE SELECTOR */}
              <div className="px-2 py-1 bg-slate-100/90 rounded-lg">
                <div className="relative flex items-center">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    aria-label="Language selection"
                    className="w-full pl-6 pr-3 py-0.5 bg-transparent text-[11px] font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                  >
                    {languages.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeLabel} ({l.label})
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-globe absolute left-0 top-1 text-slate-400 text-xs pointer-events-none"></i>
                </div>
              </div>

              {/* USER PROFILE FOOTER */}
              <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-6 h-6 rounded-full bg-emerald-800 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                    {user?.name?.[0] || 'M'}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-extrabold text-slate-900 block truncate">{user?.name}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="text-slate-400 hover:text-rose-600 transition text-xs p-1 rounded"
                >
                  <i className="fas fa-right-from-bracket"></i>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition text-base flex items-center justify-center"
              aria-label="Open navigation menu"
            >
              <i className="fas fa-bars"></i>
            </button>

            <span className="font-extrabold text-slate-900 text-sm hidden sm:inline truncate max-w-[250px] lg:max-w-none">
              {user?.masjidName || 'Mosque Financial Control Center'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">

            <LanguageSwitcher />

            {/* PWA TOP INSTALL BUTTON */}
            <button
              onClick={handleInstallPwa}
              className="px-3 py-1.5 bg-[#0F3D26] hover:bg-emerald-950 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <i className="fas fa-download text-[11px]"></i>
              <span className="hidden xs:inline">{isPwaInstalled ? '✓ App Installed' : 'Install PWA'}</span>
              <span className="xs:hidden">App</span>
            </button>

            <div className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold flex items-center gap-1.5 hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              FY 2026-2027
            </div>
          </div>
        </header>

        {/* READ-ONLY GUEST BANNER */}
        {isViewer && (
          <div className="bg-[#FFF9EC] border-b border-[#D4AF37]/30 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-white border border-[#D4AF37]/40 rounded-2xl shadow-xs">
              <span className="text-sm">👁</span>
              <span className="text-xs font-black text-slate-800 tracking-tight">Viewing as Community</span>
              <span className="px-2.5 py-0.5 bg-[#FDE68A] text-[#78350F] rounded-lg text-[10px] font-black uppercase tracking-wider">
                Read Only
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-amber-900 hover:text-black font-extrabold underline shrink-0 text-xs ml-3 cursor-pointer"
            >
              Exit Guest View
            </button>
          </div>
        )}

        {/* PAGE BODY */}
        <main className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
