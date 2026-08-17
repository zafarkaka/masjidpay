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

  const [formError, setFormError] = useState('');
  const [masjidId, setMasjidId] = useState('jama-masjid');

  const loadExpenses = (targetMasjid = masjidId) => {
    setLoading(true);
    fetch(`/api/expenses?masjidId=${targetMasjid}`)
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data.expenses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        const mId = d?.user?.masjidId || d?.user?.masjidSlug || 'jama-masjid';
        setMasjidId(mId);
        loadExpenses(mId);
        fetch(`/api/funds?masjidId=${mId}`)
          .then((res) => res.json())
          .then((data) => setFunds(data.funds || []));
      })
      .catch(() => {
        loadExpenses();
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFormError('');

    try {
      const fId = form.fundId || funds[0]?.id;
      const cId = form.categoryId || 'default-exp-cat';

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          masjidId,
          fundId: fId,
          categoryId: cId,
        }),
      });

      const data = await res.json();

      if (res.ok && (data.success || data.expense)) {
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
      } else {
        setFormError(data.error || 'Failed to record expense. Please try again.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving the expense.');
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

  const totalExpenseAmount = expenses
    .filter((e) => !e.isVoided)
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expense Management</h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold rounded-full">
              Total: ₹{totalExpenseAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Track outgoing operational expenses, vendor bills, and maintenance overhead</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs text-xs transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <i className="fas fa-plus text-emerald-300"></i> Record New Expense
        </button>
      </div>

      {/* EXPENSES TABLE CONTAINER CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-xs font-medium">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-lg mr-2"></i> Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <i className="fas fa-receipt text-3xl text-slate-300 block"></i>
            <p className="text-sm font-bold text-slate-700">No expense records found</p>
            <p className="text-xs text-slate-400">Click &quot;Record New Expense&quot; above to log your first bill or purchase.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 whitespace-nowrap">Title & Vendor</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Category & Fund</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Payment Method</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {expenses.map((exp) => (
                  <tr key={exp.id} className={`hover:bg-slate-50/70 transition-colors ${exp.isVoided ? 'opacity-50 bg-slate-50/40' : ''}`}>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block text-xs">{exp.title}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Vendor: {exp.vendor || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800 block text-xs">{exp.category?.name || 'General'}</span>
                      <span className="text-[10px] text-emerald-700 font-medium block">{exp.fund?.name || 'Mosque Fund'}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-black text-slate-900 text-xs">
                      ₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {exp.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {exp.isVoided ? (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Voided
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Paid
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      {!exp.isVoided && (
                        <button
                          onClick={() => setVoidingExpense(exp)}
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

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Record New Expense</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity Bill August, Cleaning Materials"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="2500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer / UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. EB Department, Hardware Store"
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Bill / Reference No</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9821"
                    value={form.referenceNo}
                    onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional remarks or details"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition resize-none"
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
                  {actionLoading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID MODAL */}
      {voidingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Void Expense Record</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to void the expense &ldquo;<strong>{voidingExpense.title}</strong>&rdquo; (₹{voidingExpense.amount})?
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Reason for Void *</label>
              <input
                type="text"
                required
                placeholder="e.g. Duplicate entry, Incorrect bill amount"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setVoidingExpense(null)}
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
