'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = !pathname || pathname.startsWith('/super-admin/login');

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    let isCurrent = true;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!isCurrent) return;
        if (!data?.user || data.user.role !== 'SUPER_ADMIN') {
          router.push('/super-admin/login');
        } else {
          setUser(data.user);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isCurrent) router.push('/super-admin/login');
      });

    return () => {
      isCurrent = false;
    };
  }, [router, isLoginPage, pathname]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <i className="fas fa-shield-halved fa-spin text-3xl text-emerald-400 mb-3"></i>
          <p className="text-sm text-slate-400">Loading Super Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <i className="fas fa-shield-halved fa-spin text-3xl text-emerald-400 mb-3"></i>
          <p className="text-sm text-slate-400">Verifying Super Admin Authorization...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/super-admin/login');
  };

  const navItems = [
    { label: 'Platform Overview', href: '/super-admin', icon: 'fa-chart-line' },
    { label: 'Masjids Approval & Queue', href: '/super-admin/masjids', icon: 'fa-mosque' },
    { label: 'System Audit Logs', href: '/super-admin/audit', icon: 'fa-history' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100 font-sans">
      {/* DESKTOP SUPER ADMIN SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-emerald-600/30">
              <i className="fas fa-shield-halved"></i>
            </div>
            <div>
              <span className="font-extrabold text-lg text-white block">Super Admin</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">Platform Control</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                    active
                      ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <i className={`fas ${item.icon} text-sm`}></i>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-slate-800/40 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-300 flex items-center justify-center text-xs font-bold">
              SA
            </div>
            <div className="truncate text-xs">
              <span className="font-semibold text-white block truncate">{user?.name}</span>
              <span className="text-slate-400 block truncate">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-3 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-900/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE SUPER ADMIN DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 h-full border-r border-slate-800 flex flex-col justify-between z-10 p-4">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                    <i className="fas fa-shield-halved"></i>
                  </div>
                  <span className="font-bold text-white text-sm">Super Admin</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-white p-1 text-base"
                >
                  ✕
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                        active ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <i className={`fas ${item.icon} text-sm`}></i>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full py-2 px-3 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-900/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-sign-out-alt"></i> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* MOBILE TOP BAR */}
        <header className="md:hidden h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg"
          >
            <i className="fas fa-bars text-lg"></i>
          </button>
          <span className="font-bold text-xs text-slate-300">Super Admin Panel</span>
          <div className="w-8"></div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
