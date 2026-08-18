'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MosqueIncomePage() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State matching screenshot
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const [categoryName, setCategoryName] = useState('Donation');
  const [amount, setAmount] = useState('0');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isViewer, setIsViewer] = useState(false);

  const loadIncomes = () => {
    setLoading(true);
    fetch('/api/income')
      .then((res) => res.json())
      .then((data) => {
        setIncomes(data.income || data.incomes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        const role = d?.user?.role;
        setIsViewer(role === 'VIEWER' || role === 'COMMUNITY_VIEWER');
      })
      .catch(() => {});
    loadIncomes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid Name and Amount.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const titleText = incomeSource ? `${incomeSource} (${name})` : `${categoryName} from ${name}`;

      const res = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleText,
          amount: Number(amount),
          categoryName,
          payer: mobileNumber ? `${name} (${mobileNumber})` : name,
          paymentMethod: paymentMode.toUpperCase().replace(/\s+/g, '_'),
          description: `${incomeSource ? `Source: ${incomeSource}. ` : ''}${address ? `Address: ${address}. ` : ''}${description}`.trim(),
          date,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Income record for "${name}" (IN ₹${Number(amount).toLocaleString('en-IN')}) successfully saved to Financial Ledger!`);
        setName('');
        setMobileNumber('');
        setAddress('');
        setIncomeSource('');
        setAmount('0');
        setDescription('');
        loadIncomes();
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setErrorMsg(data.error || 'Failed to record mosque income.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving income.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-800 font-sans">
      {/* HEADER */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">FINANCE</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Add Mosque Income</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Record income from various sources</p>
      </div>

      {/* INFO CALLOUT BOX */}
      <div className="p-4 bg-[#f0f7f2] border border-[#d3e9d7] rounded-2xl flex items-start gap-3 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 flex items-center justify-center text-lg shrink-0">
          <i className="fas fa-wallet"></i>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-medium pt-1">
          Recording mosque income helps track all donations, box collections, rentals, and other incoming funds to maintain a transparent and accurate financial ledger for the community.
        </p>
      </div>

      {/* VIEWER NOTICE */}
      {isViewer && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900 flex items-center gap-2">
          <i className="fas fa-eye text-amber-600"></i> Guest View-Only Mode: You are viewing transparency income records. Income entry creation is disabled.
        </div>
      )}

      {/* ALERTS */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <i className="fas fa-check-circle text-emerald-600"></i> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <i className="fas fa-circle-exclamation text-rose-600"></i> {errorMsg}
        </div>
      )}

      {/* FORM CARD MATCHING SCREENSHOT */}
      {!isViewer && (
        <div className="masjid-card p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              $
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">New Income Record</h3>
              <p className="text-[11px] text-slate-500 font-medium">All fields marked * are required</p>
            </div>
          </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NAME */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              NAME <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <i className="fas fa-user absolute left-4 top-3.5 text-slate-400 text-xs"></i>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                className="w-full pl-10 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
              />
            </div>
          </div>

          {/* MOBILE & ADDRESS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                MOBILE NUMBER <span className="text-slate-400 font-normal">(OPTIONAL)</span>
              </label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                ADDRESS <span className="text-slate-400 font-normal">(OPTIONAL)</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop #1, Market Complex"
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
              />
            </div>
          </div>

          {/* INCOME SOURCE (OPTIONAL) */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              INCOME SOURCE <span className="text-slate-400 font-normal">(OPTIONAL)</span>
            </label>
            <input
              type="text"
              value={incomeSource}
              onChange={(e) => setIncomeSource(e.target.value)}
              placeholder="e.g., Wedding Hall Rent, Ramadan Fundraiser"
              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
            />
          </div>

          {/* CATEGORY & AMOUNT ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                CATEGORY <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
              >
                <option value="Donation">Donation</option>
                <option value="Box Collection">Box Collection</option>
                <option value="Rentals">Rentals</option>
                <option value="Friday Collection">Friday Collection</option>
                <option value="Zakat">Zakat</option>
                <option value="Sadqah">Sadqah</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                AMOUNT <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-xs font-bold text-slate-500">IN ₹</span>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-14 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* PAYMENT MODE & DATE ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                PAYMENT MODE <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                DATE <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
              />
            </div>
          </div>

          {/* DESCRIPTION (OPTIONAL) */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              DESCRIPTION <span className="text-slate-400 font-normal">(OPTIONAL)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details about this income"
              className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
            ></textarea>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-start gap-3 pt-3 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-emerald-950/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <i className="fas fa-save"></i> {submitting ? 'Saving Income...' : 'Add Income'}
            </button>

            <button
              type="button"
              onClick={() => {
                setName('');
                setMobileNumber('');
                setAddress('');
                setIncomeSource('');
                setAmount('0');
                setDescription('');
              }}
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-2xl text-xs transition flex items-center gap-2"
            >
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </form>
      </div>
      )}

      {/* INCOME LEDGER TABLE */}
      <div className="masjid-card bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 font-bold text-slate-900 text-sm flex justify-between items-center">
          <span>Recent Mosque Income Ledger</span>
          <span className="text-xs text-slate-500 font-normal">Reflects automatically in Financial Reports</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mr-2"></i> Loading income records...
          </div>
        ) : incomes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No income entries recorded yet. Use the form above to add mosque income.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="masjid-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>PAYER / SOURCE</th>
                  <th>CATEGORY</th>
                  <th>AMOUNT</th>
                  <th>MODE</th>
                  <th>DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((inc) => (
                  <tr key={inc.id}>
                    <td className="text-xs text-slate-500">{new Date(inc.date).toLocaleDateString('en-IN')}</td>
                    <td className="font-bold text-slate-900">{inc.title}</td>
                    <td><span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase">{inc.category?.name || 'General'}</span></td>
                    <td className="font-extrabold text-emerald-800 text-sm">IN ₹{inc.amount?.toLocaleString('en-IN')}</td>
                    <td><span className="masjid-badge masjid-badge-info">{inc.paymentMethod}</span></td>
                    <td className="text-xs text-slate-600 truncate max-w-xs">{inc.description || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
