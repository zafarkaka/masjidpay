'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MaintenancePage() {
  const [config, setConfig] = useState<any>({
    title: 'Website Maintenance',
    heading: 'We’ll Be Back Soon!',
    message: `Our website is currently undergoing scheduled maintenance to improve your experience.\n\nWe apologize for any inconvenience caused and appreciate your patience.\n\nPlease check back again shortly.\n\nThank you for your understanding.`,
    estimatedRestorationTime: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/maintenance')
      .then((res) => res.json())
      .then((data) => {
        if (data) setConfig((prev: any) => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formattedRestorationTime = config.estimatedRestorationTime
    ? new Date(config.estimatedRestorationTime).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-[#0a1910] to-[#04120a] text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* BACKGROUND ISLAMIC GEOMETRIC ACCENTS */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* TOP BRANDING BAR */}
      <header className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center text-lg shadow-lg shadow-emerald-900/40 border border-emerald-500/30">
            <i className="fas fa-mosque"></i>
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight block leading-tight">
              Masjid<span className="text-[#F4D06F]">Pay</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
              Mosque Management System
            </span>
          </div>
        </div>

        <span className="px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Maintenance Mode
        </span>
      </header>

      {/* CENTER NOTICE CARD */}
      <main className="relative z-10 max-w-2xl w-full mx-auto my-auto py-10">
        <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-900/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center">
          {/* ICON BADGE */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-amber-500/20 to-emerald-950/60 border border-amber-400/30 text-[#F4D06F] flex items-center justify-center text-3xl mx-auto shadow-xl shadow-amber-950/30 animate-bounce duration-1000">
            <i className="fas fa-screwdriver-wrench"></i>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#F4D06F] block">
              {config.title || 'Website Maintenance'}
            </span>
            <h1 className="text-2xl sm:text-4xl font-serif font-black text-white tracking-tight">
              {config.heading || 'We’ll Be Back Soon!'}
            </h1>
          </div>

          {/* MESSAGE CONTENT */}
          <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line bg-slate-950/50 p-5 sm:p-6 rounded-2xl border border-slate-800 text-left font-medium space-y-3">
            {config.message}
          </div>

          {/* ESTIMATED TIME NOTICE (IF CONFIGURED) */}
          {formattedRestorationTime && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-700/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-300 flex items-center justify-center text-base shrink-0">
                  <i className="fas fa-clock"></i>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-400 block tracking-wider">
                    Estimated Restoration Time
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white block">
                    {formattedRestorationTime}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-900/80 text-emerald-200 text-[10.5px] font-bold rounded-lg shrink-0">
                In Progress
              </span>
            </div>
          )}

          {/* REFRESH STATUS BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition inline-flex items-center gap-2 cursor-pointer"
            >
              <i className="fas fa-arrows-rotate text-xs"></i>
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER BAR */}
      <footer className="relative z-10 max-w-4xl w-full mx-auto py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-800/80">
        <span>© {new Date().getFullYear()} MasjidPay. All rights reserved.</span>

        <Link
          href="/super-admin/login"
          className="text-slate-500 hover:text-emerald-400 text-[11px] font-bold transition flex items-center gap-1.5"
        >
          <i className="fas fa-shield-halved text-[10px]"></i>
          <span>Super Admin Access</span>
        </Link>
      </footer>
    </div>
  );
}
