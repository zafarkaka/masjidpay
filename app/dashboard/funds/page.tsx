'use client';

import { useEffect, useState } from 'react';

export default function FundsPage() {
  const [funds, setFunds] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showFundModal, setShowFundModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [fundForm, setFundForm] = useState({
    name: '',
    description: '',
    openingBalance: '',
    isRestricted: false,
  });

  const [transferForm, setTransferForm] = useState({
    sourceFundId: '',
    destFundId: '',
    amount: '',
    reason: '',
    reference: '',
  });

  const masjidId = 'jama-masjid';

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/funds?masjidId=${masjidId}`).then((r) => r.json()),
      fetch(`/api/transfers?masjidId=${masjidId}`).then((r) => r.json()),
    ])
      .then(([fData, tData]) => {
        setFunds(fData.funds || []);
        setTransfers(tData.transfers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fundForm, masjidId }),
      });

      if (res.ok) {
        setShowFundModal(false);
        setFundForm({ name: '', description: '', openingBalance: '', isRestricted: false });
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const sId = transferForm.sourceFundId || funds[0]?.id;
      const dId = transferForm.destFundId || funds[1]?.id;

      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transferForm,
          masjidId,
          sourceFundId: sId,
          destFundId: dId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      setShowTransferModal(false);
      setTransferForm({ sourceFundId: '', destFundId: '', amount: '', reason: '', reference: '' });
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fund Allocation & Transfers</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage restricted funds (Zakat, Construction, Emergency) and audit internal transfers</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 text-xs transition flex items-center gap-2"
          >
            <i className="fas fa-right-left"></i> Transfer Money
          </button>
          <button
            onClick={() => setShowFundModal(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-2"
          >
            <i className="fas fa-plus text-emerald-700"></i> New Fund
          </button>
        </div>
      </div>

      {/* FUNDS CARDS GRID */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Active Masjid Funds</h2>
        {loading ? (
          <div className="text-center text-slate-400 py-8 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 mr-2"></i> Loading funds...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {funds.map((fund) => (
              <div key={fund.id} className="masjid-card p-6 border-l-4 border-l-emerald-700 relative">
                {fund.isRestricted && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Restricted
                  </span>
                )}

                <h3 className="text-lg font-bold text-slate-900">{fund.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{fund.description || 'General purpose operational fund'}</p>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Balance</span>
                    <span className="text-2xl font-extrabold text-slate-900">₹{fund.currentBalance.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Opening</span>
                    <span className="text-xs font-semibold text-slate-600">₹{fund.openingBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INTERNAL TRANSFERS HISTORY */}
      <div className="masjid-card p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Internal Transfers Audit History</h2>

        {transfers.length === 0 ? (
          <div className="text-center text-slate-400 py-6 text-xs font-medium">No internal fund transfers recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="masjid-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source Fund</th>
                  <th>Destination Fund</th>
                  <th>Amount</th>
                  <th>Reason & Reference</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="font-bold text-slate-900 text-xs">{tx.sourceFund?.name}</td>
                    <td className="font-bold text-emerald-800 text-xs">{tx.destFund?.name}</td>
                    <td className="font-extrabold text-slate-900 text-sm">₹{tx.amount.toLocaleString('en-IN')}</td>
                    <td className="text-xs text-slate-600">
                      <span>{tx.reason}</span>
                      {tx.reference && <span className="text-[10px] text-slate-400 block">Ref: {tx.reference}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW FUND MODAL */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create New Fund</h3>
            <form onSubmit={handleCreateFund} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fund Name *</label>
                <input
                  type="text"
                  required
                  value={fundForm.name}
                  onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })}
                  placeholder="e.g. Ramadan Iftar Fund"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  value={fundForm.openingBalance}
                  onChange={(e) => setFundForm({ ...fundForm, openingBalance: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="restrictCheck"
                  checked={fundForm.isRestricted}
                  onChange={(e) => setFundForm({ ...fundForm, isRestricted: e.target.checked })}
                />
                <label htmlFor="restrictCheck" className="text-xs font-semibold text-slate-700">
                  Restricted Fund (Money cannot be used for general overheads)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Save Fund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Transfer Money Between Funds</h3>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Source Fund (Debit)</label>
                <select
                  value={transferForm.sourceFundId}
                  onChange={(e) => setTransferForm({ ...transferForm, sourceFundId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-semibold"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Available: ₹{f.currentBalance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Destination Fund (Credit)</label>
                <select
                  value={transferForm.destFundId}
                  onChange={(e) => setTransferForm({ ...transferForm, destFundId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-semibold"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Transfer Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  placeholder="50000"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason / Authorization *</label>
                <input
                  type="text"
                  required
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="Approved by committee for dome renovation"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
