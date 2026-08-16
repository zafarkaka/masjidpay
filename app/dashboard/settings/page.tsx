'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: 'Jama Masjid Vaniyambadi',
    city: 'Vaniyambadi',
    state: 'Tamil Nadu',
    phone: '+91 98765 43210',
    email: 'admin@jamamasjid.org',
    bankName: 'State Bank of India',
    bankAccNo: '30492817405',
    bankIfsc: 'SBIN0000921',
    upiId: 'jamamasjid@sbi',
    financialYear: '2026-2027',
  });

  useEffect(() => {
    fetch('/api/masjid/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.masjid) {
          setForm({
            name: data.masjid.name || '',
            city: data.masjid.city || '',
            state: data.masjid.state || '',
            phone: data.masjid.phone || '',
            email: data.masjid.email || '',
            bankName: data.masjid.bankName || '',
            bankAccNo: data.masjid.bankAccNo || '',
            bankIfsc: data.masjid.bankIfsc || '',
            upiId: data.masjid.upiId || '',
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
    <div className="space-y-6 max-w-4xl font-sans">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Masjid & Financial Settings</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Configure organization profile, bank account details, UPI ID, and financial year settings</p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <i className="fas fa-check-circle text-emerald-600"></i> Settings saved & updated in database successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ORGANIZATION PROFILE */}
        <div className="masjid-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
            <i className="fas fa-building text-emerald-700"></i> Organization Profile
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Masjid Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City / Town</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State / Region</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* BANK & PAYMENT CONFIGURATION */}
        <div className="masjid-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
            <i className="fas fa-university text-emerald-700"></i> Bank & UPI Payment Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bank Name</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Number</label>
              <input
                type="text"
                value={form.bankAccNo}
                onChange={(e) => setForm({ ...form, bankAccNo: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">IFSC Code</label>
              <input
                type="text"
                value={form.bankIfsc}
                onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Primary UPI ID</label>
              <input
                type="text"
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold text-emerald-800"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50"
        >
          {saving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
