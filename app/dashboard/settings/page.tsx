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
    financialYear: '2026-2027',
  });

  useEffect(() => {
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
            financialYear: data.masjid.financialYear || '2026-2027',
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
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Masjid Profile & Financial Settings</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Configure Waqf Property identification, official credentials, bank details, and financial year
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <i className="fas fa-save text-emerald-300"></i> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <i className="fas fa-check-circle text-emerald-600 text-sm"></i>
          Settings and Waqf Property ID updated successfully in database.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. ORGANIZATION & WAQF IDENTIFIERS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <i className="fas fa-mosque text-emerald-700 text-sm"></i> Mosque Profile & Waqf Registration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Masjid Official Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold transition"
              />
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
          </div>
        </div>

        {/* 2. BANK & PAYMENT CONFIGURATION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <i className="fas fa-university text-emerald-700 text-sm"></i> Bank & UPI Payment Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. State Bank of India"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Account Number</label>
              <input
                type="text"
                placeholder="e.g. 30492817405"
                value={form.bankAccNo}
                onChange={(e) => setForm({ ...form, bankAccNo: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">IFSC Code</label>
              <input
                type="text"
                placeholder="e.g. SBIN0000921"
                value={form.bankIfsc}
                onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono uppercase transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Primary UPI ID (VPA)</label>
              <input
                type="text"
                placeholder="e.g. jamamasjid@sbi"
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold text-emerald-900 transition"
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
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-save text-emerald-300"></i> {saving ? 'Saving Changes...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
