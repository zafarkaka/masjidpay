'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OpeningBalancePage() {
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [openingCashBalance, setOpeningCashBalance] = useState<string>('0');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankBalances, setBankBalances] = useState<{ [key: string]: string }>({});

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOpeningData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/opening-balance?financialYear=${financialYear}`);
      const data = await res.json();

      if (data.openingCashBalance !== undefined) {
        setOpeningCashBalance(data.openingCashBalance.toString());
      }
      if (data.bankAccounts) {
        setBankAccounts(data.bankAccounts);
        const map: { [key: string]: string } = {};
        data.bankAccounts.forEach((b: any) => {
          map[b.id] = (b.openingBalance || 0).toString();
        });
        setBankBalances(map);
      }
    } catch (err) {
      console.error('Error fetching opening balance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpeningData();
  }, [financialYear]);

  const handleBankBalanceChange = (id: string, value: string) => {
    setBankBalances((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const bankOpeningBalances = Object.keys(bankBalances).map((id) => ({
        id,
        openingBalance: Number(bankBalances[id] || 0),
      }));

      const res = await fetch('/api/finance/opening-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          financialYear,
          openingCashBalance: Number(openingCashBalance || 0),
          bankOpeningBalances,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update opening balances');
        setSaving(false);
        return;
      }

      setSuccessMsg('Opening cash & bank balances updated successfully!');
      fetchOpeningData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const totalBankOpening = Object.values(bankBalances).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );
  const totalCombinedOpening = (Number(openingCashBalance) || 0) + totalBankOpening;

  const maskAccount = (acc: string) => {
    if (!acc) return '••••';
    if (acc.length <= 4) return acc;
    return `•••• ${acc.slice(-4)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* TOP BREADCRUMB & HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <Link href="/dashboard/finance" className="hover:text-emerald-800 transition">
              Finance
            </Link>
            <span>/</span>
            <span className="text-slate-800">Opening Balance</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <i className="fas fa-scale-balanced text-emerald-800"></i> Financial Year Opening Balances
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Set the baseline starting Cash and Bank balances for your chosen financial year.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/finance"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            ← Back to Finance
          </Link>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center justify-between">
          <span>⚠ {errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-900">✕</button>
        </div>
      )}

      {/* SUMMARY OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[10px] font-black uppercase tracking-wider">Starting Cash Balance</span>
            <i className="fas fa-hand-holding-dollar text-base"></i>
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            ₹{(Number(openingCashBalance) || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 block">Cash in hand baseline</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-black uppercase tracking-wider">Starting Bank Balances</span>
            <i className="fas fa-building-columns text-base"></i>
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            ₹{totalBankOpening.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 block">Across {bankAccounts.length} bank accounts</span>
        </div>

        <div className="bg-gradient-to-br from-[#0F3D26] to-emerald-950 text-white rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Opening Balance</span>
            <i className="fas fa-vault text-base"></i>
          </div>
          <span className="text-2xl font-black text-white block">
            ₹{totalCombinedOpening.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] font-semibold text-emerald-200 block">Combined liquid baseline</span>
        </div>
      </div>

      {/* EDIT FORM */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-6">
        {/* FINANCIAL YEAR SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <label className="block text-xs font-black text-slate-900">Select Financial Year</label>
            <p className="text-xs text-slate-500 mt-0.5">Opening balances will apply as the starting baseline for this financial year.</p>
          </div>
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            <option value="2024-2025">FY 2024–2025</option>
            <option value="2025-2026">FY 2025–2026</option>
            <option value="2026-2027">FY 2026–2027 (Active)</option>
            <option value="2027-2028">FY 2027–2028</option>
          </select>
        </div>

        {/* OPENING CASH SECTION */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-bold">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Physical Cash in Hand (Starting Balance)</h3>
              <p className="text-xs text-slate-500">Unbanked cash physically kept in the mosque vault or with the treasurer on Day 1.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Opening Cash Amount (INR) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0"
              value={openingCashBalance}
              onChange={(e) => setOpeningCashBalance(e.target.value)}
              className="w-full sm:w-72 p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-500"
              placeholder="e.g. 25000"
            />
          </div>
        </div>

        {/* BANK ACCOUNTS SECTION */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-sm font-bold">
                <i className="fas fa-building-columns"></i>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Bank Accounts (Starting Balances)</h3>
                <p className="text-xs text-slate-500">Enter the starting ledger balance for each active mosque bank account.</p>
              </div>
            </div>

            <Link
              href="/dashboard/finance"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <i className="fas fa-plus text-[10px]"></i> Add Bank Account
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading bank details...</div>
          ) : bankAccounts.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <p className="text-xs font-bold text-slate-600">No bank accounts configured</p>
              <Link
                href="/dashboard/finance"
                className="text-xs font-extrabold text-emerald-800 underline block"
              >
                Add a bank account in Finance to configure starting balance →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((b) => (
                <div
                  key={b.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-black text-slate-900 block">{b.bankName}</span>
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      {b.accountName || 'Mosque Account'} • <span className="font-mono">{maskAccount(b.accountNumber)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Opening Balance:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={bankBalances[b.id] ?? ''}
                        onChange={(e) => handleBankBalanceChange(b.id, e.target.value)}
                        className="w-40 pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/dashboard/finance"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i> Saving...
              </>
            ) : (
              <>
                <i className="fas fa-floppy-disk"></i> Save Opening Balances
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
