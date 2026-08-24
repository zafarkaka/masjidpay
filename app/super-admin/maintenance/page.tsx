'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SuperAdminMaintenancePage() {
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState('Website Maintenance');
  const [heading, setHeading] = useState('We’ll Be Back Soon!');
  const [message, setMessage] = useState(
    `Our website is currently undergoing scheduled maintenance to improve your experience.\n\nWe apologize for any inconvenience caused and appreciate your patience.\n\nPlease check back again shortly.\n\nThank you for your understanding.`
  );
  const [estimatedRestorationTime, setEstimatedRestorationTime] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchConfig = () => {
    setLoading(true);
    fetch('/api/super-admin/maintenance')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setEnabled(Boolean(data.enabled));
          if (data.title) setTitle(data.title);
          if (data.heading) setHeading(data.heading);
          if (data.message) setMessage(data.message);
          if (data.estimatedRestorationTime) setEstimatedRestorationTime(data.estimatedRestorationTime);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusFeedback(null);

    try {
      const res = await fetch('/api/super-admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          title,
          heading,
          message,
          estimatedRestorationTime,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusFeedback({
          type: 'success',
          message: data.message || 'Maintenance settings successfully saved.',
        });
      } else {
        setStatusFeedback({
          type: 'error',
          message: data.error || 'Failed to save maintenance settings.',
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'error',
        message: err.message || 'Network error while saving.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetRecommendedTemplate = () => {
    setTitle('Website Maintenance');
    setHeading('We’ll Be Back Soon!');
    setMessage(
      `Our website is currently undergoing scheduled maintenance to improve your experience.\n\nWe apologize for any inconvenience caused and appreciate your patience.\n\nPlease check back again shortly.\n\nThank you for your understanding.`
    );
  };

  const formattedRestorationPreview = estimatedRestorationTime
    ? new Date(estimatedRestorationTime).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <i className="fas fa-screwdriver-wrench text-[#F4D06F]"></i>
            <span>Maintenance Mode Control</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Activate scheduled maintenance across all public pages & mosque dashboards while retaining Super Admin control.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <i className="fas fa-eye text-[#F4D06F]"></i>
            <span>Preview Website Message</span>
          </button>
        </div>
      </div>

      {/* STATUS FEEDBACK ALERT */}
      {statusFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <i
              className={`fas ${
                statusFeedback.type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-rose-400'
              }`}
            ></i>
            <span>{statusFeedback.message}</span>
          </div>
          <button
            onClick={() => setStatusFeedback(null)}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <i className="fas fa-circle-notch fa-spin text-emerald-400 text-2xl mb-3"></i>
          <p className="text-xs font-semibold">Loading system maintenance status...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. MASTER TOGGLE CARD */}
          <div className={`p-6 sm:p-7 rounded-3xl border transition shadow-xl ${
            enabled
              ? 'bg-rose-950/30 border-rose-800/80 shadow-rose-950/30'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${enabled ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
                  <h2 className="text-lg font-black text-white">
                    {enabled ? 'Maintenance Mode is ENABLED' : 'Maintenance Mode is DISABLED'}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 max-w-xl">
                  {enabled
                    ? '⚠️ Visitors, mosque members, and admins will see the Maintenance Page. Only Super Admin has platform access.'
                    : '✓ The website and all mosque dashboards are operating normally in LIVE production mode.'}
                </p>
              </div>

              {/* TOGGLE SWITCH */}
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`w-16 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer shrink-0 ${
                  enabled ? 'bg-rose-600 justify-end' : 'bg-slate-800 justify-start'
                }`}
                aria-label="Toggle Maintenance Mode"
              >
                <div className="w-6 h-6 rounded-full bg-white shadow-md transform transition duration-300"></div>
              </button>
            </div>
          </div>

          {/* 2. MAINTENANCE MESSAGE CONTROLS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div>
                <h3 className="text-sm font-extrabold text-white">Website Maintenance Message</h3>
                <p className="text-xs text-slate-400">Configure the announcement displayed to visitors during maintenance.</p>
              </div>

              <button
                type="button"
                onClick={handleSetRecommendedTemplate}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Reset to recommended text"
              >
                <i className="fas fa-wand-magic-sparkles text-[#F4D06F]"></i>
                <span>Use Recommended Template</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Page Badge / Category
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Website Maintenance"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="We’ll Be Back Soon!"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white font-bold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Maintenance Explanation & Apology Message
              </label>
              <textarea
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter detailed maintenance explanation..."
                className="w-full p-3.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl text-xs text-slate-200 leading-relaxed outline-none font-sans font-medium"
              ></textarea>
            </div>

            {/* ESTIMATED RESTORATION TIME */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Optional Estimated Restoration Time</span>
                <span className="text-slate-500 font-normal lowercase">(optional)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="datetime-local"
                  value={estimatedRestorationTime}
                  onChange={(e) => setEstimatedRestorationTime(e.target.value)}
                  className="sm:col-span-2 px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white font-bold outline-none"
                />
                {estimatedRestorationTime && (
                  <button
                    type="button"
                    onClick={() => setEstimatedRestorationTime('')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <i className="fas fa-times"></i> Clear Date
                  </button>
                )}
              </div>
              {formattedRestorationPreview && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-1.5 flex items-center gap-1.5">
                  <i className="fas fa-clock text-xs"></i>
                  <span>Will display as: <strong>{formattedRestorationPreview}</strong></span>
                </p>
              )}
            </div>
          </div>

          {/* SAVE CONTROLS ACTION BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <i className="fas fa-shield-halved text-emerald-400"></i>
              <span>Super Admin bypass is permanently active.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Preview
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i> Saving Changes...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. LIVE WEBSITE PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-900/60 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-slate-100 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#F4D06F] flex items-center gap-1.5">
                <i className="fas fa-display"></i> Preview: Visitor Maintenance Screen
              </span>
              <button
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* PREVIEW CARD REPLICA */}
            <div className="bg-slate-900/90 border border-emerald-900/40 rounded-3xl p-6 sm:p-8 space-y-5 text-center shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-[#F4D06F] border border-amber-500/30 flex items-center justify-center text-2xl mx-auto">
                <i className="fas fa-screwdriver-wrench"></i>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#F4D06F] block">
                  {title || 'Website Maintenance'}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
                  {heading || 'We’ll Be Back Soon!'}
                </h3>
              </div>

              <div className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-left font-medium">
                {message}
              </div>

              {formattedRestorationPreview && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-700/40 rounded-xl flex items-center justify-between text-left text-xs">
                  <div className="flex items-center gap-2.5">
                    <i className="fas fa-clock text-emerald-400"></i>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 block uppercase">
                        Estimated Restoration Time
                      </span>
                      <span className="font-extrabold text-white">{formattedRestorationPreview}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-900/80 text-emerald-200 text-[10px] font-bold rounded">
                    In Progress
                  </span>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
