'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [shareCopied, setShareCopied] = useState(false);

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

  const navGroups = [
    {
      group: 'GENERAL',
      items: [{ label: 'Dashboard', href: '/dashboard', icon: 'fa-chart-pie' }],
    },
    {
      group: 'INCOME',
      items: [{ label: 'Mosque Income', href: '/dashboard/income', icon: 'fa-wallet' }],
    },
    {
      group: 'EXPENSES',
      items: [{ label: 'Mosque Expenses', href: '/dashboard/expenses', icon: 'fa-receipt' }],
    },
    {
      group: 'MONTHLY MEMBERS',
      items: [
        { label: 'Monthly Members', href: '/dashboard/monthly-members?tab=directory', icon: 'fa-users' },
        { label: 'Record Member Amount', href: '/dashboard/member-collections', icon: 'fa-hand-holding-dollar' },
        { label: 'Add Member', href: '/dashboard/monthly-members?tab=add', icon: 'fa-user-plus' },
      ],
    },
    {
      group: 'STAFF PAYROLL',
      items: [{ label: 'Staff Management & Payroll', href: '/dashboard/payroll', icon: 'fa-id-card' }],
    },
    {
      group: 'RENTALS',
      items: [{ label: 'Rental Management', href: '/dashboard/rentals', icon: 'fa-building' }],
    },
    {
      group: 'DOCUMENTS',
      items: [{ label: 'Documents', href: '/dashboard/documents', icon: 'fa-folder-closed' }],
    },
    {
      group: 'FUNDRAISING & PAYMENTS',
      items: [
        { label: 'Donations', href: '/dashboard/donations', icon: 'fa-heart' },
        { label: 'Recurring Donations', href: '/dashboard/recurring-donations', icon: 'fa-rotate' },
        { label: 'Campaigns', href: '/dashboard/campaigns', icon: 'fa-bullhorn' },
        { label: 'Payment Links & QR', href: '/dashboard/payment-links', icon: 'fa-qrcode' },
        { label: 'Public Donation Page', href: `/donate/${user?.masjidSlug || 'jama-masjid'}`, icon: 'fa-external-link-alt', external: true },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { label: 'Users & Permissions', href: '/dashboard/users', icon: 'fa-user-shield' },
        { label: 'Mosque Profile', href: '/dashboard/settings', icon: 'fa-gear' },
        { label: 'Payment Gateway (Razorpay & UPI)', href: '/dashboard/payment-gateway', icon: 'fa-credit-card' },
        { label: 'Data Backup', href: '/dashboard/backup', icon: 'fa-database' },
        { label: 'Recycle Bin', href: '/dashboard/recycle-bin', icon: 'fa-trash-can' },
      ],
    },
    {
      group: 'PEOPLE & REPORTS',
      items: [
        { label: 'Donor Directory', href: '/dashboard/donors', icon: 'fa-users' },
        { label: 'Financial Reports', href: '/dashboard/reports', icon: 'fa-file-invoice-dollar' },
        { label: 'Audit Logs', href: '/dashboard/audit', icon: 'fa-clock-rotate-left' },
      ],
    },
  ];

  return (
    <div className={`min-h-screen flex text-slate-800 font-sans ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f6faf6]'}`}>
      {/* MASJID ADMIN SIDEBAR MATCHING SCREENSHOT */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0">
        <div>
          {/* BRANDING */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-700/20 shrink-0">
                <i className="fas fa-mosque"></i>
              </div>
              <div className="overflow-hidden">
                <span className="font-extrabold text-sm text-slate-900 block leading-tight truncate" title={user?.masjidName || 'Mosque Dashboard'}>
                  {user?.masjidName || 'Mosque Dashboard'}
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block mt-0.5">
                  Verified Mosque
                </span>
              </div>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-280px)]">
            {navGroups.map((group, idx) => (
              <div key={idx}>
                <div className="px-3 mb-1.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                  {group.group}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = pathname === item.href || (item.href.includes('/dashboard/monthly-members') && pathname === '/dashboard/monthly-members');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition ${
                          active
                            ? 'bg-[#0F3D26] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
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
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          {/* DARK MODE TOGGLE */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <span className="flex items-center gap-2.5">
              <i className={`fas ${darkMode ? 'fa-sun text-amber-500' : 'fa-moon text-slate-500'}`}></i>
              <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${darkMode ? 'bg-amber-950 text-amber-400' : 'bg-slate-200 text-slate-600'}`}>
              {darkMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* LANGUAGE SELECTOR */}
          <div className="px-3 py-1.5 bg-slate-100/80 rounded-xl">
            <div className="relative flex items-center">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                aria-label="Language selection"
                className="w-full pl-7 pr-4 py-1 bg-transparent text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer"
              >
                <option value="en">English (US)</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
              <i className="fas fa-globe absolute left-0 top-1.5 text-slate-400 text-xs pointer-events-none"></i>
            </div>
          </div>

          {/* SHARE APP BUTTON */}
          <button
            type="button"
            onClick={handleShareApp}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <i className="fas fa-share-nodes text-slate-600"></i>
            <span>{shareCopied ? '✓ Link Copied!' : 'Share App'}</span>
          </button>

          {/* USER PROFILE FOOTER */}
          <div className="pt-2 border-t flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                {user?.name?.[0] || 'M'}
              </div>
              <div className="overflow-hidden">
                <span className="text-[11px] font-extrabold text-slate-900 block truncate">{user?.name}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-600 transition text-xs p-1 rounded-lg"
            >
              <i className="fas fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-600 text-lg">
              <i className="fas fa-bars"></i>
            </button>
            <span className="font-extrabold text-slate-900 text-sm hidden sm:inline">
              {user?.masjidName || 'Mosque Financial Control Center'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* PWA TOP INSTALL BUTTON */}
            <button
              onClick={handleInstallPwa}
              className="px-3 py-1.5 bg-[#0F3D26] hover:bg-emerald-950 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <i className="fas fa-download"></i>
              <span>{isPwaInstalled ? '✓ App Installed' : 'Install PWA App'}</span>
            </button>

            <div className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold flex items-center gap-1.5 hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              FY 2026-2027
            </div>
          </div>
        </header>

        {/* PAGE BODY */}
        <main className="p-6 md:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
