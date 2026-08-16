'use client';

import { useEffect, useState } from 'react';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({
    categoryId: '',
    period: 'ANNUAL',
    year: '2026',
    budgetedAmount: '',
  });

  const masjidId = 'jama-masjid';

  const loadBudgets = () => {
    setLoading(true);
    fetch(`/api/budgets?masjidId=${masjidId}`)
      .then((res) => res.json())
      .then((data) => {
        setBudgets(data.budgets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, masjidId }),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ categoryId: '', period: 'ANNUAL', year: '2026', budgetedAmount: '' });
        loadBudgets();
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Category Spending Budgets</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Define annual spending limits and monitor budget utilization against actual expenses</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 text-xs transition flex items-center gap-2"
        >
          <i className="fas fa-calculator"></i> Set Category Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center text-slate-400 py-8 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 mr-2"></i> Loading budget utilization...
          </div>
        ) : budgets.length === 0 ? (
          <div className="col-span-2 masjid-card p-12 text-center text-slate-500">
            <i className="fas fa-calculator text-3xl mb-2 text-slate-300 block"></i>
            <p className="text-sm font-semibold">No budget limits configured for this fiscal year.</p>
          </div>
        ) : (
          budgets.map((b) => {
            const pct = Math.min(100, Math.round((b.actualAmount / b.budgetedAmount) * 100));
            const isOver = b.actualAmount > b.budgetedAmount;

            return (
              <div key={b.id} className="masjid-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{b.expenseCategory?.name || 'Category Overhead'}</h3>
                    <span className="text-[11px] text-slate-500">FY {b.year} • {b.period}</span>
                  </div>

                  {isOver ? (
                    <span className="masjid-badge masjid-badge-danger">Over Budget ({pct}%)</span>
                  ) : (
                    <span className="masjid-badge masjid-badge-success">{pct}% Utilized</span>
                  )}
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-red-500' : pct > 85 ? 'bg-amber-500' : 'bg-emerald-700'
                    }`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block">Actual Spend</span>
                    <span className="font-extrabold text-slate-900 text-sm">₹{b.actualAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block">Budgeted Limit</span>
                    <span className="font-extrabold text-emerald-800 text-sm">₹{b.budgetedAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Set Category Budget Target</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Annual Limit (₹) *</label>
                <input
                  type="number"
                  required
                  value={form.budgetedAmount}
                  onChange={(e) => setForm({ ...form, budgetedAmount: e.target.value })}
                  placeholder="120000"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold"
                />
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
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Save Budget Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
