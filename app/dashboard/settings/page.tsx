'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: 'Jama Masjid',
    regNumber: '',
    waqfId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    bankName: '',
    bankAccNo: '',
    bankIfsc: '',
    upiId: '',
    upiPayeeName: '',
    financialYear: '2026-2027',
    communityAccessCode: '7860',
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((uData) => {
        if (uData.user?.role === 'SUPER_ADMIN') {
          setIsSuperAdmin(true);
        }
      })
      .catch(() => {});

    fetch('/api/masjid/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.masjid) {
          setForm({
            name: data.masjid.name || '',
            regNumber: data.masjid.regNumber || '',
            waqfId: data.masjid.waqfId || '',
            address: data.masjid.address || '',
            city: data.masjid.city || '',
            state: data.masjid.state || '',
            zipCode: data.masjid.zipCode || '',
            phone: data.masjid.phone || '',
            email: data.masjid.email || '',
            bankName: data.masjid.bankName || data.gateway?.bankName || '',
            bankAccNo: data.masjid.bankAccNo || data.gateway?.bankAccNo || '',
            bankIfsc: data.masjid.bankIfsc || data.gateway?.bankIfsc || '',
            upiId: data.masjid.upiId || data.gateway?.upiId || '',
            upiPayeeName: data.gateway?.upiPayeeName || data.masjid.name || '',
            financialYear: data.masjid.financialYear || '2026-2027',
            communityAccessCode: data.masjid.communityAccessCode || '7860',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/masjid/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        <i className="fas fa-circle-notch fa-spin text-emerald-700 text-2xl mb-2"></i>
        <p>Loading Mosque & Financial Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* TOP-LEFT PROMINENT MASJID PROFILE BANNER */}
      <div className="p-6 bg-gradient-to-r from-[#064E3B] via-[#0F3D26] to-[#102A25] text-white rounded-3xl border border-[#D4AF37]/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF9EC] border-2 border-[#D4AF37] text-[#064E3B] flex items-center justify-center text-3xl shadow-lg shrink-0">
            <i className="fas fa-mosque"></i>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/60 text-[#F4D06F] text-[10px] font-black tracking-widest uppercase flex items-center gap-1">
                <i className="fas fa-shield-check"></i> Single Source of Truth
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold">
                Waqf ID: {form.waqfId || 'W-Verified'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F4D06F] tracking-tight leading-tight">
              {form.name || 'Official Mosque Profile'}
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              <i className="fas fa-location-dot text-[#D4AF37] mr-1"></i> {form.city || 'Tamil Nadu'}, {form.state || 'India'} • Permanent System Identifier
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Financial Year</span>
            <span className="font-mono font-black text-[#F4D06F] text-sm">{form.financialYear || '2026-2027'}</span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-3 bg-[#D4AF37] hover:bg-[#c49f2e] text-[#102A25] font-black rounded-2xl text-xs shadow-lg transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <i className="fas fa-save"></i> {saving ? 'Saving...' : 'Save Mosque Settings'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <i className="fas fa-check-circle text-emerald-600 text-base"></i>
          Mosque profile settings updated successfully in database.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. ORGANIZATION & WAQF IDENTIFIERS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <i className="fas fa-mosque text-emerald-700 text-sm"></i> Mosque Profile & Waqf Registration
            </h2>
            <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <i className="fas fa-lock"></i> Name Locked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* LOCKED MASJID OFFICIAL NAME */}
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Masjid Official Name (Single Source of Truth) *
                </label>
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                  <i className="fas fa-lock text-amber-600"></i> Locked by Admin Security Protocol
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={!isSuperAdmin && Boolean(form.name)}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-2xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:bg-slate-100 disabled:text-slate-900 disabled:cursor-not-allowed cursor-not-allowed"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  <i className="fas fa-shield-halved text-emerald-700"></i>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                This official Mosque Name is permanently locked and synced as the single source of truth across all <strong>Payment Links, Direct UPI QR Codes, Donor Receipts, WhatsApp Slips, and Public Pages</strong>.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Waqf Property ID / No
              </label>
              <input
                type="text"
                placeholder="e.g. WQF-TN-2024-9842 / W-4029"
                value={form.waqfId}
                onChange={(e) => setForm({ ...form, waqfId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono font-bold text-emerald-900 transition"
              />
              <span className="text-[10px] text-slate-400 block mt-1">State Waqf Board property / gazette registration identifier</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Society / Trust Registration No
              </label>
              <input
                type="text"
                placeholder="e.g. REG/SOC/2018/742"
                value={form.regNumber}
                onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono transition"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Official registered trust / society certificate number</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Street Address
              </label>
              <input
                type="text"
                placeholder="e.g. 14 Mosque Street, Main Bazaar"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">City / Town</label>
              <input
                type="text"
                placeholder="e.g. Vaniyambadi"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">State / Region</label>
              <input
                type="text"
                placeholder="e.g. Tamil Nadu"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Official Email</label>
              <input
                type="email"
                placeholder="admin@masjid.org"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Current Financial Year</label>
              <input
                type="text"
                value={form.financialYear}
                onChange={(e) => setForm({ ...form, financialYear: e.target.value })}
                placeholder="2026-2027"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold transition"
              />
            </div>

            {/* VIEWER SECRET ACCESS CODE BOX */}
            <div className="sm:col-span-2 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-[11px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fas fa-key text-emerald-700"></i> Secret Code for Dashboard Viewer (Read-Only)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
                    setForm({ ...form, communityAccessCode: randomCode });
                  }}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline self-start sm:self-auto cursor-pointer"
                >
                  Generate 4-Digit Code
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. 7860 or community123"
                value={form.communityAccessCode}
                onChange={(e) => setForm({ ...form, communityAccessCode: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-600 font-mono font-bold text-emerald-900 tracking-wider shadow-xs transition"
              />
              <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                Share this secret code with your mosque community members and donors. They can click <strong>&quot;View as Community (Read Only)&quot;</strong> on the login page to inspect live financial records, collections, and balance statements without edit permissions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-save text-emerald-300"></i> {saving ? 'Saving Changes...' : 'Save Mosque Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
