'use client';

import { useEffect, useState } from 'react';

export default function RecurringDonationsPage() {
  const [recurring, setRecurring] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({
    donorName: '',
    donorPhone: '',
    donorEmail: '',
    amount: '',
    frequency: 'MONTHLY',
    categoryId: '',
    fundId: '',
    startDate: '',
    paymentMethod: 'RAZORPAY',
  });

  const masjidId = 'jama-masjid';

  const loadRecurring = () => {
    setLoading(true);
    fetch(`/api/recurring-donations?masjidId=${masjidId}`)
      .then((res) => res.json())
      .then((data) => {
        setRecurring(data.recurring || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadRecurring();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      // Fetch default categories & funds if missing
      const fRes = await fetch(`/api/funds?masjidId=${masjidId}`).then((r) => r.json());
      const cRes = await fetch(`/api/dashboard/stats?masjidId=${masjidId}`).then((r) => r.json());

      const payload = {
        ...form,
        masjidId,
        fundId: form.fundId || fRes.funds?.[0]?.id,
        categoryId: form.categoryId || 'default-cat',
      };

      const res = await fetch('/api/recurring-donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({
          donorName: '',
          donorPhone: '',
          donorEmail: '',
          amount: '',
          frequency: 'MONTHLY',
          categoryId: '',
          fundId: '',
          startDate: '',
          paymentMethod: 'RAZORPAY',
        });
        loadRecurring();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/recurring-donations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) loadRecurring();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recurring Donations Subscriptions</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage recurring monthly, weekly, and annual donor commitments</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 text-xs transition flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> New Recurring Commitment
        </button>
      </div>

      <div className="masjid-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mr-2"></i> Loading recurring subscriptions...
          </div>
        ) : recurring.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-rotate text-3xl mb-2 text-slate-300 block"></i>
            <p className="text-sm font-semibold">No active recurring commitments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="masjid-table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Amount & Frequency</th>
                  <th>Next Charge Date</th>
                  <th>Total Collected</th>
                  <th>Cycles</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recurring.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <span className="font-bold text-slate-900 block">{rec.donor?.name || 'Donor'}</span>
                      <span className="text-[10px] text-slate-400 block">{rec.donor?.email || rec.donor?.phone}</span>
                    </td>
                    <td>
                      <span className="font-extrabold text-slate-900 block">₹{rec.amount.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-emerald-800 font-bold uppercase block">{rec.frequency}</span>
                    </td>
                    <td className="text-xs text-slate-600 font-medium">
                      {new Date(rec.nextPaymentDate).toLocaleDateString()}
                    </td>
                    <td className="font-extrabold text-emerald-800 text-sm">
                      ₹{rec.totalCollected.toLocaleString('en-IN')}
                    </td>
                    <td className="text-xs text-slate-500">{rec.cyclesCount} cycles</td>
                    <td>
                      {rec.status === 'ACTIVE' && <span className="masjid-badge masjid-badge-success">Active</span>}
                      {rec.status === 'PAUSED' && <span className="masjid-badge masjid-badge-warning">Paused</span>}
                      {rec.status === 'CANCELLED' && <span className="masjid-badge masjid-badge-danger">Cancelled</span>}
                    </td>
                    <td className="text-right space-x-2">
                      {rec.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(rec.id, 'PAUSED')}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg text-xs transition"
                        >
                          Pause
                        </button>
                      )}
                      {rec.status === 'PAUSED' && (
                        <button
                          onClick={() => handleStatusChange(rec.id, 'ACTIVE')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs transition"
                        >
                          Resume
                        </button>
                      )}
                      {rec.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleStatusChange(rec.id, 'CANCELLED')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-xs transition"
                        >
                          Cancel
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

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Recurring Commitment</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Donor Name *</label>
                <input
                  type="text"
                  required
                  value={form.donorName}
                  onChange={(e) => setForm({ ...form, donorName: e.target.value })}
                  placeholder="Ahmed Hassan"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="1000"
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Frequency *</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-semibold"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
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
                  {actionLoading ? 'Saving...' : 'Create Commitment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
