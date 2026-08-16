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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Donation Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Record incoming donations, issue receipts, and manage contributions</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 text-xs transition flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> Record New Donation
        </button>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="masjid-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search donor or reference..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full sm:w-64 px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-600"
          />
          <button
            onClick={loadData}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-700 font-semibold outline-none"
          >
            <option value="ALL">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>
      </div>

      {/* DONATIONS TABLE */}
      <div className="masjid-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mr-2"></i> Loading donations...
          </div>
        ) : donations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-hand-holding-dollar text-3xl mb-2 text-slate-300 block"></i>
            <p className="text-sm font-semibold">No donation records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="masjid-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Donor Name</th>
                  <th>Category & Fund</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((don) => (
                  <tr key={don.id} className={don.isVoided ? 'opacity-50 bg-slate-50' : ''}>
                    <td className="font-bold text-xs text-emerald-800">{don.receiptNo || 'REC-N/A'}</td>
                    <td className="text-xs text-slate-500">{new Date(don.date).toLocaleDateString()}</td>
                    <td>
                      <span className="font-bold text-slate-900 block">{don.isAnonymous ? 'Anonymous' : don.donor?.name || 'Valued Donor'}</span>
                      {don.donor?.phone && <span className="text-[10px] text-slate-400 block">{don.donor.phone}</span>}
                    </td>
                    <td>
                      <span className="font-semibold text-slate-800 block">{don.category?.name || 'General Donation'}</span>
                      <span className="text-[10px] text-emerald-700 block font-medium">{don.fund?.name || 'General Fund'}</span>
                    </td>
                    <td className="font-extrabold text-slate-900 text-sm">₹{don.amount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className="masjid-badge masjid-badge-info">{don.paymentMethod}</span>
                    </td>
                    <td>
                      {don.isVoided ? (
                        <span className="masjid-badge masjid-badge-danger">Voided</span>
                      ) : (
                        <span className="masjid-badge masjid-badge-success">Completed</span>
                      )}
                    </td>
                    <td className="text-right space-x-2">
                      <Link
                        href={`/dashboard/receipts/${don.id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition inline-flex items-center gap-1"
                      >
                        <i className="fas fa-file-invoice text-emerald-700"></i> Receipt
                      </Link>

                      {!don.isVoided && (
                        <button
                          onClick={() => setVoidingDonation(don)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-xs transition"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Record New Donation</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Donor Name</label>
                  <input
                    type="text"
                    value={form.donorName}
                    onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                    placeholder="Ahmed Hassan (Leave blank for Anonymous)"
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.donorPhone}
                    onChange={(e) => setForm({ ...form, donorPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={form.donorEmail}
                    onChange={(e) => setForm({ ...form, donorEmail: e.target.value })}
                    placeholder="donor@gmail.com"
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="500"
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-semibold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="RAZORPAY">Razorpay Online</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={form.isAnonymous}
                  onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                />
                <label htmlFor="anonymousCheck" className="text-xs text-slate-700 font-semibold">
                  Anonymous Donation (Hide donor name on public records)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {actionLoading ? 'Saving...' : 'Save & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID MODAL */}
      {voidingDonation && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Void Donation Record</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to void receipt <strong className="text-slate-900">{voidingDonation.receiptNo}</strong> (₹{voidingDonation.amount})? This will reverse the fund balance entry.
            </p>

            <textarea
              required
              rows={3}
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="State reason for voiding (e.g. Duplicate entry or cheque bounce)..."
              className="w-full p-3 border rounded-xl text-xs outline-none focus:border-red-500"
            ></textarea>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setVoidingDonation(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={actionLoading || !voidReason}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
