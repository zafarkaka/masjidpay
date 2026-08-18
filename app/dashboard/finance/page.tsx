'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FinanceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    openingCashBalance: 0,
    openingBankBalance: 0,
    totalOpeningBalance: 0,
    totalCashDeposited: 0,
    totalCashWithdrawn: 0,
    totalChequeDeposited: 0,
    totalDeposits: 0,
    totalIncome: 0,
    totalExpenses: 0,
    currentCashInHand: 0,
    currentBankBalance: 0,
    actualTotalBalance: 0,
  });

  // Filters
  const [selectedBank, setSelectedBank] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editingBank, setEditingBank] = useState<any>(null);

  // Form states
  const [txForm, setTxForm] = useState({
    bankAccountId: '',
    type: 'CASH_DEPOSIT', // CASH_DEPOSIT, CHEQUE_DEPOSIT, or WITHDRAWAL
    amount: '',
    date: new Date().toISOString().split('T')[0],
    chequeNo: '',
    chequeDate: '',
    referenceNo: '',
    notes: '',
  });

  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    openingBalance: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isViewer, setIsViewer] = useState(false);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBank !== 'ALL') params.append('bankAccountId', selectedBank);
      if (selectedType !== 'ALL') params.append('type', selectedType);

      const res = await fetch(`/api/finance/deposits?${params.toString()}`);
      const data = await res.json();

      if (data.transactions) setTransactions(data.transactions);
      if (data.bankAccounts) setBankAccounts(data.bankAccounts);
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      console.error('Error loading finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        const role = d?.user?.role;
        setIsViewer(role === 'VIEWER' || role === 'COMMUNITY_VIEWER');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchFinanceData();
  }, [selectedBank, selectedType]);

  const handleOpenTxModal = (tx: any = null, defaultType: string = 'CASH_DEPOSIT') => {
    setErrorMsg('');
    setSuccessMsg('');
    if (tx) {
      setEditingTransaction(tx);
      setTxForm({
        bankAccountId: tx.bankAccountId || '',
        type: tx.type || 'CASH_DEPOSIT',
        amount: tx.amount?.toString() || '',
        date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
        chequeNo: tx.chequeNo || '',
        chequeDate: tx.chequeDate ? new Date(tx.chequeDate).toISOString().split('T')[0] : '',
        referenceNo: tx.referenceNo || '',
        notes: tx.notes || '',
      });
    } else {
      setEditingTransaction(null);
      setTxForm({
        bankAccountId: bankAccounts[0]?.id || '',
        type: defaultType,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        chequeNo: '',
        chequeDate: '',
        referenceNo: '',
        notes: '',
      });
    }
    setShowTransactionModal(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const url = editingTransaction
        ? `/api/finance/deposits/${editingTransaction.id}`
        : '/api/finance/deposits';
      const method = editingTransaction ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to save transaction');
        setSubmitting(false);
        return;
      }

      setShowTransactionModal(false);
      setSuccessMsg(
        editingTransaction
          ? 'Transaction updated and balances recalculated'
          : txForm.type === 'WITHDRAWAL'
          ? 'Cash withdrawal recorded (Cash in Hand increased, Bank reduced)'
          : 'Bank deposit recorded successfully'
      );
      fetchFinanceData();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record? This will automatically restore bank and cash balances.')) return;

    try {
      const res = await fetch(`/api/finance/deposits/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMsg('Record removed and balances restored');
        fetchFinanceData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete record');
      }
    } catch (err) {
      alert('Error deleting record');
    }
  };

  const handleOpenBankModal = (bank: any = null) => {
    setErrorMsg('');
    if (bank) {
      setEditingBank(bank);
      setBankForm({
        bankName: bank.bankName || '',
        accountName: bank.accountName || '',
        accountNumber: bank.accountNumber || '',
        ifscCode: bank.ifscCode || '',
        branchName: bank.branchName || '',
        openingBalance: bank.openingBalance?.toString() || '0',
      });
    } else {
      setEditingBank(null);
      setBankForm({
        bankName: '',
        accountName: 'Main Mosque Account',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        openingBalance: '0',
      });
    }
    setShowBankModal(true);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const url = editingBank ? `/api/banks/${editingBank.id}` : '/api/banks';
      const method = editingBank ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to save bank account');
        setSubmitting(false);
        return;
      }

      setShowBankModal(false);
      setSuccessMsg(editingBank ? 'Bank account updated' : 'Bank account added');
      fetchFinanceData();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const maskAccount = (acc: string) => {
    if (!acc) return '••••';
    if (acc.length <= 4) return acc;
    return `•••• ${acc.slice(-4)}`;
  };

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.bankAccount?.bankName?.toLowerCase().includes(q) ||
      t.chequeNo?.toLowerCase().includes(q) ||
      t.referenceNo?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q) ||
      t.amount?.toString().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-base shadow-sm">
              <i className="fas fa-building-columns"></i>
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Finance & Account Balances</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage cash & cheque deposits, record cash withdrawals from bank, and maintain audited actual balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isViewer && (
            <Link
              href="/dashboard/finance/opening-balance"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <i className="fas fa-scale-balanced text-emerald-700"></i> Set Opening Balance
            </Link>
          )}
          <Link
            href="/dashboard/finance/reports"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <i className="fas fa-file-invoice-dollar text-emerald-700"></i> Monthly Statement
          </Link>
          {!isViewer && (
            <>
              <button
                onClick={() => handleOpenBankModal()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <i className="fas fa-plus"></i> Add Bank
              </button>
              <button
                onClick={() => handleOpenTxModal(null, 'WITHDRAWAL')}
                className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <i className="fas fa-money-bill-transfer"></i> Withdraw Cash
              </button>
              <button
                onClick={() => handleOpenTxModal(null, 'CASH_DEPOSIT')}
                className="px-4 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950/20"
              >
                <i className="fas fa-arrow-down-to-bracket"></i> Record Deposit
              </button>
            </>
          )}
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* COMPREHENSIVE 9-METRIC STATS OVERVIEW */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Live Financial Ledger Overview</h2>
        
        {/* ROW 1: OPENING BALANCES & ACTUAL CLOSING TOTAL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[10px] font-bold uppercase tracking-wider">Opening Cash Balance</span>
              <i className="fas fa-hand-holding-dollar"></i>
            </div>
            <span className="text-2xl font-black text-slate-900 block">
              ₹{(summary.openingCashBalance || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 block">Starting physical cash</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[10px] font-bold uppercase tracking-wider">Opening Bank Balance</span>
              <i className="fas fa-building-columns"></i>
            </div>
            <span className="text-2xl font-black text-slate-900 block">
              ₹{(summary.openingBankBalance || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 block">Across {bankAccounts.length} bank accounts</span>
          </div>

          <div className="bg-gradient-to-br from-[#0F3D26] to-emerald-950 text-white rounded-3xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-emerald-300">
              <span className="text-[10px] font-bold uppercase tracking-wider">Actual Total Balance</span>
              <i className="fas fa-vault text-base"></i>
            </div>
            <span className="text-2xl font-black text-white block">
              ₹{(summary.actualTotalBalance || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-emerald-200 block">Current Cash in Hand + Current Banks</span>
          </div>
        </div>

        {/* ROW 2: INFLOWS, OUTFLOWS, DEPOSITS, WITHDRAWALS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TOTAL INCOME */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Income</span>
              <i className="fas fa-arrow-trend-up"></i>
            </div>
            <span className="text-2xl font-black text-emerald-800 block">
              +₹{(summary.totalIncome || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 block">All donations & receipts</span>
          </div>

          {/* TOTAL EXPENSES */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Expenses</span>
              <i className="fas fa-arrow-trend-down"></i>
            </div>
            <span className="text-2xl font-black text-rose-600 block">
              -₹{(summary.totalExpenses || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 block">Mosque expenses & payrolls</span>
          </div>

          {/* CASH DEPOSITED TO BANK */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-blue-700">
              <span className="text-[10px] font-bold uppercase tracking-wider">Cash Deposited to Bank</span>
              <i className="fas fa-arrow-down-to-bracket"></i>
            </div>
            <span className="text-2xl font-black text-blue-700 block">
              ₹{(summary.totalCashDeposited || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 block">Cash moved from hand to bank</span>
          </div>

          {/* CASH WITHDRAWN FROM BANK */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-purple-700">
              <span className="text-[10px] font-bold uppercase tracking-wider">Cash Withdrawn from Bank</span>
              <i className="fas fa-arrow-up-from-bracket"></i>
            </div>
            <span className="text-2xl font-black text-purple-700 block">
              ₹{(summary.totalCashWithdrawn || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 block">Bank moved into hand cash</span>
          </div>
        </div>

        {/* ROW 3: CURRENT CASH IN HAND & CURRENT BANK BALANCE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Current Cash in Hand (Hand Balance)</span>
              <span className="text-3xl font-black text-slate-900 block mt-1">
                ₹{(summary.currentCashInHand || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">Physical cash currently available</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl">
              <i className="fas fa-money-bill-wave"></i>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Current Bank Balance</span>
              <span className="text-3xl font-black text-emerald-800 block mt-1">
                ₹{(summary.currentBankBalance || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">Total across all active accounts</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl">
              <i className="fas fa-landmark"></i>
            </div>
          </div>
        </div>
      </div>

      {/* BANK ACCOUNTS OVERVIEW CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Bank Accounts & Ledger Balances</h2>
          {!isViewer && (
            <button
              onClick={() => handleOpenBankModal()}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <i className="fas fa-plus text-[10px]"></i> Add Another Account
            </button>
          )}
        </div>

        {bankAccounts.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-lg mx-auto">
              <i className="fas fa-building-columns"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No bank accounts added yet</p>
              <p className="text-xs text-slate-500 mt-0.5">Add your mosque&apos;s bank accounts to begin recording deposits.</p>
            </div>
            {!isViewer && (
              <button
                onClick={() => handleOpenBankModal()}
                className="px-4 py-2 bg-[#0F3D26] text-white font-extrabold text-xs rounded-xl shadow-xs"
              >
                Add First Bank Account
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((b) => (
              <div key={b.id} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-300 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-sm font-black shrink-0">
                      <i className="fas fa-landmark"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">{b.bankName}</h3>
                      <span className="text-[11px] font-semibold text-slate-500 block">{b.accountName || 'Mosque Account'}</span>
                    </div>
                  </div>
                  {!isViewer && (
                    <button
                      onClick={() => handleOpenBankModal(b)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg text-xs"
                      title="Edit Bank Account"
                    >
                      <i className="fas fa-pen-to-square"></i>
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account No</span>
                    <span className="text-xs font-mono font-extrabold text-slate-700">{maskAccount(b.accountNumber)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Balance</span>
                    <span className="text-sm font-black text-emerald-800">₹{(b.currentBalance || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TRANSACTIONS SECTION */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900">Deposit & Cash Withdrawal History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time audited log of cash deposits, cheque deposits, and bank withdrawals.</p>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search reference, notes, amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-52"
              />
              <i className="fas fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-400 text-xs"></i>
            </div>

            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Banks</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>{b.bankName} ({maskAccount(b.accountNumber)})</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Transactions</option>
              <option value="CASH_DEPOSIT">Cash Deposit</option>
              <option value="CHEQUE_DEPOSIT">Cheque Deposit</option>
              <option value="WITHDRAWAL">Cash Withdrawal</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <i className="fas fa-circle-notch fa-spin text-emerald-600 text-lg"></i>
            <span>Loading finance ledger...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <i className="fas fa-receipt text-3xl text-slate-300"></i>
            <p>No deposit or withdrawal records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Bank</th>
                  <th className="pb-3 px-3">Account Number</th>
                  <th className="pb-3 px-3">Cheque / Reference</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  {!isViewer && <th className="pb-3 px-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {t.type === 'CASH_DEPOSIT' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          💵 Cash Deposit
                        </span>
                      )}
                      {t.type === 'CHEQUE_DEPOSIT' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                          📜 Cheque Deposit
                        </span>
                      )}
                      {t.type === 'WITHDRAWAL' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          📤 Cash Withdrawal
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-900">
                      {t.bankAccount?.bankName || 'Unknown Bank'}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-500">
                      {maskAccount(t.bankAccount?.accountNumber)}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        {t.chequeNo && (
                          <div className="text-[11px] font-bold text-purple-800">
                            Cheque #{t.chequeNo} {t.chequeDate ? `(${new Date(t.chequeDate).toLocaleDateString('en-IN')})` : ''}
                          </div>
                        )}
                        {t.referenceNo && (
                          <div className="text-[11px] text-slate-600">Ref: {t.referenceNo}</div>
                        )}
                        {t.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{t.notes}</div>}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap font-black text-slate-900">
                      <span className={t.type === 'WITHDRAWAL' ? 'text-rose-600' : 'text-emerald-800'}>
                        {t.type === 'WITHDRAWAL' ? '-' : '+'}₹{Number(t.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    {!isViewer && (
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenTxModal(t)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg transition"
                            title="Edit"
                          >
                            <i className="fas fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                            title="Delete"
                          >
                            <i className="fas fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECORD DEPOSIT / WITHDRAWAL MODAL */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingTransaction ? 'Edit Transaction Record' : 'Record Bank Transaction'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deposit or withdraw funds with automatic real-time balance synchronization.
                </p>
              </div>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveTransaction} className="space-y-3.5 text-xs font-bold text-slate-700">
              {/* TRANSACTION TYPE TOGGLE */}
              <div>
                <label className="block mb-1.5 text-slate-500 uppercase tracking-wider text-[10px]">
                  Transaction Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'CASH_DEPOSIT' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1 transition ${
                      txForm.type === 'CASH_DEPOSIT'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <i className="fas fa-money-bill-wave"></i> Cash Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'CHEQUE_DEPOSIT' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1 transition ${
                      txForm.type === 'CHEQUE_DEPOSIT'
                        ? 'bg-purple-800 text-white border-purple-800 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <i className="fas fa-money-check"></i> Cheque Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'WITHDRAWAL' })}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1 transition ${
                      txForm.type === 'WITHDRAWAL'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <i className="fas fa-hand-holding-dollar"></i> Cash Withdraw
                  </button>
                </div>
              </div>

              {/* TARGET BANK ACCOUNT */}
              <div>
                <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                  Select Bank Account *
                </label>
                <select
                  required
                  value={txForm.bankAccountId}
                  onChange={(e) => setTxForm({ ...txForm, bankAccountId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="" disabled>Select Bank Account</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} — {maskAccount(b.accountNumber)} (Bal: ₹{Number(b.currentBalance || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* AMOUNT & DATE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                    Amount (INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 15000"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              {/* CHEQUE DETAILS IF CHEQUE TYPE */}
              {txForm.type === 'CHEQUE_DEPOSIT' && (
                <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-purple-950 uppercase tracking-wider text-[10px]">
                        Cheque Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 049182"
                        value={txForm.chequeNo}
                        onChange={(e) => setTxForm({ ...txForm, chequeNo: e.target.value })}
                        className="w-full p-2 bg-white border border-purple-200 rounded-xl focus:outline-none focus:purple-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-purple-950 uppercase tracking-wider text-[10px]">
                        Cheque Date
                      </label>
                      <input
                        type="date"
                        value={txForm.chequeDate}
                        onChange={(e) => setTxForm({ ...txForm, chequeDate: e.target.value })}
                        className="w-full p-2 bg-white border border-purple-200 rounded-xl focus:outline-none focus:purple-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* REFERENCE NO */}
              <div>
                <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                  Deposit Slip / Cheque Ref / Voucher No (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SLIP-89201"
                  value={txForm.referenceNo}
                  onChange={(e) => setTxForm({ ...txForm, referenceNo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              {/* NOTES */}
              <div>
                <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                  Notes / Description
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    txForm.type === 'WITHDRAWAL'
                      ? 'e.g. Cash withdrawn from ATM/branch for monthly utility expenses'
                      : 'e.g. Friday collection deposited by treasurer'
                  }
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                ></textarea>
              </div>

              {/* ACTIONS */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTransaction ? 'Update Record' : 'Confirm Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE BANK MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure mosque bank account details.
                </p>
              </div>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveBank} className="space-y-3 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India, HDFC Bank"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                  Account Name / Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. General Operational Account"
                  value={bankForm.accountName}
                  onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 38920194821"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0000982"
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={bankForm.openingBalance}
                    onChange={(e) => setBankForm({ ...bankForm, openingBalance: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-500 uppercase tracking-wider text-[10px]">
                  Branch Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Town Branch"
                  value={bankForm.branchName}
                  onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingBank ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
