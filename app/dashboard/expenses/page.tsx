'use client';

import { useEffect, useState } from 'react';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [voidingExpense, setVoidingExpense] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');

  const [form, setForm] = useState({
    title: '',
    amount: '',
    categoryId: '',
    fundId: '',
    vendor: '',
    paymentMethod: 'CASH',
    referenceNo: '',
    description: '',
  });

  const masjidId = 'jama-masjid';

  const loadExpenses = () => {
    setLoading(true);
    fetch(`/api/expenses?masjidId=${masjidId}`)
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data.expenses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadExpenses();

    fetch(`/api/funds?masjidId=${masjidId}`)
      .then((res) => res.json())
      .then((data) => setFunds(data.funds || []));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      // Fetch default categories & funds if missing
      const fId = form.fundId || funds[0]?.id;
      const cId = form.categoryId || 'default-exp-cat';

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, masjidId, fundId: fId, categoryId: cId }),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({
          title: '',
          amount: '',
          categoryId: '',
          fundId: '',
          vendor: '',
          paymentMethod: 'CASH',
          referenceNo: '',
          description: '',
        });
        loadExpenses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoid = async () => {
    if (!voidingExpense) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/expenses/${voidingExpense.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voidReason }),
      });

      if (res.ok) {
        setVoidingExpense(null);
        setVoidReason('');
        loadExpenses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Expense Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Track outgoing operational expenses, vendor bills, and maintenance overhead</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md text-xs transition flex items-center gap-2"
        >
          <i className="fas fa-[#164e31] fa-minus text-rose-400"></i> Record New Expense
        </button>
      </div>

      <div className="masjid-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mr-2"></i> Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-receipt text-3xl mb-2 text-slate-300 block"></i>
            <p className="text-sm font-semibold">No expense records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="masjid-table">
              <thead>
                <tr>
                  <th>Title & Vendor</th>
                  <th>Category & Fund</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className={exp.isVoided ? 'opacity-50 bg-slate-50' : ''}>
                    <td>
                      <span className="font-bold text-slate-900 block">{exp.title}</span>
                      <span className="text-[10px] text-slate-400 block">Vendor: {exp.vendor || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-slate-800 block">{exp.category?.name}</span>
                      <span className="text-[10px] text-emerald-700 block font-medium">{exp.fund?.name}</span>
                    </td>
                    <td className="text-xs text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="font-extrabold text-slate-900 text-sm">₹{exp.amount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className="masjid-badge masjid-badge-info">{exp.paymentMethod}</span>
                    </td>
                    <td>
                      {exp.isVoided ? (
                        <span className="masjid-badge masjid-badge-danger">Voided</span>
                      ) : (
                        <span className="masjid-badge masjid-badge-success">Paid</span>
                      )}
                    </td>
                    <td className="text-right">
                      {!exp.isVoided && (
                        <button
                          onClick={() => setVoidingExpense(exp)}
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

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Record New Expense</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Electricity Bill July 2026"
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
                    placeholder="8500"
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    placeholder="TNEB Electricity Board"
                    className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                  />
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
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {actionLoading ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID MODAL */}
      {voidingExpense && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Void Expense Record</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to void <strong className="text-slate-900">{voidingExpense.title}</strong> (₹{voidingExpense.amount})? This will restore the fund balance.
            </p>

            <textarea
              required
              rows={3}
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Reason for voiding..."
              className="w-full p-3 border rounded-xl text-xs outline-none focus:border-red-500"
            ></textarea>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setVoidingExpense(null)}
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
