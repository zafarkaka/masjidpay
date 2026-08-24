'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');

  // New Donation Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    donorName: '',
    donorPhone: '',
    donorEmail: '',
    amount: '',
    categoryId: '',
    fundId: '',
    campaignId: '',
    paymentMethod: 'CASH',
    referenceNo: '',
    notes: '',
    isAnonymous: false,
  });

  // Void Modal State
  const [voidingDonation, setVoidingDonation] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isViewer, setIsViewer] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch(`/api/donations?categoryId=${selectedCat}&paymentMethod=${selectedMethod}&q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        setDonations(data.donations || []);
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

    loadData();

    fetch('/api/funds')
      .then((res) => res.json())
      .then((fData) => setFunds(fData.funds || []));
  }, [selectedCat, selectedMethod]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({
          donorName: '',
          donorPhone: '',
          donorEmail: '',
          amount: '',
          categoryId: '',
          fundId: '',
          campaignId: '',
          paymentMethod: 'CASH',
          referenceNo: '',
          notes: '',
          isAnonymous: false,
        });
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!voidingDonation) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/donations/${voidingDonation.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voidReason }),
      });

      if (res.ok) {
        setVoidingDonation(null);
        setVoidReason('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const totalDonationAmount = donations
    .filter((d) => !d.isVoided)
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Donor Collections</h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold rounded-full">
              Total: ₹{totalDonationAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Record incoming donor contributions, issue receipts, and manage collections</p>
        </div>

        {!isViewer && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs text-xs transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <i className="fas fa-plus text-emerald-300"></i> Record Donor Collection
          </button>
        )}
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search donor or reference..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full sm:w-64 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer border border-slate-200"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
      </div>

      {/* DONATIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-xs font-medium">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-lg mr-2"></i> Loading donor collections...
          </div>
        ) : donations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <i className="fas fa-hand-holding-heart text-3xl text-slate-300 block"></i>
            <p className="text-sm font-bold text-slate-700">No donor collection records found</p>
            <p className="text-xs text-slate-400">
              {isViewer ? 'No donor collection records found.' : 'Click "Record Donor Collection" to log your first donor contribution.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 whitespace-nowrap">Receipt No</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Donor Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Category & Fund</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Payment Method</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {donations.map((don) => (
                  <tr key={don.id} className={`hover:bg-slate-50/70 transition-colors ${don.isVoided ? 'opacity-50 bg-slate-50/40' : ''}`}>
                    <td className="px-5 py-3.5 font-bold text-xs text-emerald-800 whitespace-nowrap">
                      {don.receiptNo || 'REC-N/A'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(don.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 block text-xs">
                        {don.isAnonymous ? 'Anonymous Donor' : don.donor?.name || don.donorName || 'Valued Donor'}
                      </span>
                      {(don.donor?.phone || don.donorPhone) && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">{don.donor?.phone || don.donorPhone}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800 block text-xs">{don.category?.name || 'General Donation'}</span>
                      <span className="text-[10px] text-emerald-700 font-medium block">{don.fund?.name || 'General Fund'}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-black text-slate-900 text-xs">
                      ₹{Number(don.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {don.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {don.isVoided ? (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Voided
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-1.5">
                      <Link
                        href={`/dashboard/receipts/${don.id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1 border border-slate-200"
                      >
                        <i className="fas fa-file-invoice text-emerald-700"></i> Receipt
                      </Link>

                      {!don.isVoided && !isViewer && (
                        <button
                          onClick={() => setVoidingDonation(don)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] transition cursor-pointer border border-rose-100"
                        >
                          Void
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE DONATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Record Donor Collection</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Donor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Haji Abdul Rahman"
                    value={form.donorName}
                    onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.donorPhone}
                    onChange={(e) => setForm({ ...form, donorPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="1000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Reference / Cheque No</label>
                  <input
                    type="text"
                    placeholder="Optional reference"
                    value={form.referenceNo}
                    onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Notes / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Friday Jumaah collection, Quran completion"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Donor Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID MODAL */}
      {voidingDonation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Void Donation Record</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to void donation <strong>#{voidingDonation.receiptNo}</strong> (₹{voidingDonation.amount})?
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Reason for Void *</label>
              <input
                type="text"
                required
                placeholder="e.g. Entered incorrect amount"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVoidingDonation(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !voidReason.trim()}
                onClick={handleVoid}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
