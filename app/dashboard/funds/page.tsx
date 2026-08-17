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

  const [masjidId, setMasjidId] = useState('jama-masjid');

  const loadData = (targetMasjid = masjidId) => {
    setLoading(true);
    Promise.all([
      fetch(`/api/funds?masjidId=${targetMasjid}`).then((r) => r.json()),
      fetch(`/api/transfers?masjidId=${targetMasjid}`).then((r) => r.json()),
    ])
      .then(([fData, tData]) => {
        setFunds(fData.funds || []);
        setTransfers(tData.transfers || []);
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
        loadData(mId);
      })
      .catch(() => loadData());
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

      if (!sId || !dId || sId === dId) {
        setErrorMsg('Please select two different funds for the transfer.');
        setActionLoading(false);
        return;
      }

      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masjidId,
          sourceFundId: sId,
          destFundId: dId,
          amount: Number(transferForm.amount),
          reason: transferForm.reason,
          reference: transferForm.reference,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowTransferModal(false);
        setTransferForm({ sourceFundId: '', destFundId: '', amount: '', reason: '', reference: '' });
        loadData();
      } else {
        setErrorMsg(data.error || 'Failed to complete internal transfer.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const totalFundBalance = funds.reduce((sum, f) => sum + (Number(f.currentBalance) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Funds & Balances</h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold rounded-full">
              Total Assets: ₹{totalFundBalance.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage restricted endowment funds, zakat reserves, and internal liquidity transfers</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-right-left text-emerald-400"></i> Transfer Money
          </button>
          <button
            onClick={() => setShowFundModal(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <i className="fas fa-plus text-emerald-300"></i> New Fund
          </button>
        </div>
      </div>

      {/* FUNDS CARDS GRID */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Active Mosque Accounts & Funds</h2>
        {loading ? (
          <div className="text-center text-slate-400 py-10 text-xs font-medium bg-white rounded-2xl border border-slate-200">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 mr-2 text-base"></i> Loading funds...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {funds.map((fund) => (
              <div key={fund.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">{fund.name}</h3>
                    {fund.isRestricted && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Restricted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{fund.description || 'General purpose operational mosque fund'}</p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Current Balance</span>
                    <span className="text-xl font-black text-slate-900 block mt-0.5">
                      ₹{Number(fund.currentBalance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block tracking-wider">Opening</span>
                    <span className="text-xs font-bold text-slate-600">
                      ₹{Number(fund.openingBalance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INTERNAL TRANSFERS HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Internal Transfers Audit History</h2>
        </div>

        {transfers.length === 0 ? (
          <div className="text-center text-slate-400 py-8 text-xs font-medium">No internal fund transfers recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Source Fund</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Destination Fund</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Amount</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Reason & Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {transfers.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">{tx.sourceFund?.name}</td>
                    <td className="px-4 py-3.5 font-bold text-emerald-800 text-xs">{tx.destFund?.name}</td>
                    <td className="px-4 py-3.5 font-black text-slate-900 text-xs whitespace-nowrap">
                      ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span>{tx.reason}</span>
                      {tx.reference && <span className="text-[10px] text-slate-400 block mt-0.5">Ref: {tx.reference}</span>}
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Create New Fund</h3>
              <button onClick={() => setShowFundModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFund} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Fund Name *</label>
                <input
                  type="text"
                  required
                  value={fundForm.name}
                  onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })}
                  placeholder="e.g. Ramadan Iftar Fund, Masjid Expansion"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  value={fundForm.openingBalance}
                  onChange={(e) => setFundForm({ ...fundForm, openingBalance: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  value={fundForm.description}
                  onChange={(e) => setFundForm({ ...fundForm, description: e.target.value })}
                  placeholder="Purpose or restriction notes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="restrictCheck"
                  checked={fundForm.isRestricted}
                  onChange={(e) => setFundForm({ ...fundForm, isRestricted: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="restrictCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Restricted Fund (Money cannot be used for general expenses)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Creating...' : 'Create Fund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Transfer Between Funds</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Source Fund (From) *</label>
                  <select
                    value={transferForm.sourceFundId}
                    onChange={(e) => setTransferForm({ ...transferForm, sourceFundId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  >
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} (₹{f.currentBalance.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Destination Fund (To) *</label>
                  <select
                    value={transferForm.destFundId}
                    onChange={(e) => setTransferForm({ ...transferForm, destFundId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  >
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Transfer Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="5000"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Reason / Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Allocation for upcoming construction"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Reference Number</label>
                <input
                  type="text"
                  placeholder="Optional resolution number"
                  value={transferForm.reference}
                  onChange={(e) => setTransferForm({ ...transferForm, reference: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
