'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MonthlyFinanceReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  // Filters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());
  const [selectedBank, setSelectedBank] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        year: selectedYear,
        month: selectedMonth,
      });
      if (selectedBank !== 'ALL') params.append('bankAccountId', selectedBank);
      if (selectedType !== 'ALL') params.append('type', selectedType);

      const res = await fetch(`/api/finance/reports?${params.toString()}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error('Error fetching monthly report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedYear, selectedMonth, selectedBank, selectedType]);

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      year: selectedYear,
      month: selectedMonth,
      format: 'csv',
    });
    if (selectedBank !== 'ALL') params.append('bankAccountId', selectedBank);
    if (selectedType !== 'ALL') params.append('type', selectedType);

    window.open(`/api/finance/reports?${params.toString()}`, '_blank');
  };

  const maskAccount = (acc: string) => {
    if (!acc) return '••••';
    if (acc.length <= 4) return acc;
    return `•••• ${acc.slice(-4)}`;
  };

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const summary = reportData?.summary || {
    openingBankBalance: 0,
    totalCashDeposits: 0,
    totalChequeDeposits: 0,
    totalBankDeposits: 0,
    totalWithdrawalsExpenses: 0,
    closingBankBalance: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <Link href="/dashboard/finance" className="hover:text-emerald-800 transition">
              Finance
            </Link>
            <span>/</span>
            <span className="text-slate-800">Monthly Statement</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <i className="fas fa-file-invoice-dollar text-emerald-800"></i> Month-wise Finance Report
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audited monthly breakdown of bank opening balances, cash & cheque deposits, expenses, and closing balance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/dashboard/finance/reports/print?year=${selectedYear}&month=${selectedMonth}&bank=${selectedBank}`}
            target="_blank"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <i className="fas fa-print text-slate-500"></i> Print / PDF
          </Link>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <i className="fas fa-file-excel"></i> Download Excel / CSV
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-3">
        {/* MONTH FILTER */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* YEAR FILTER */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            {years.map((y) => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>
        </div>

        {/* BANK FILTER */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bank:</span>
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Bank Accounts</option>
            {reportData?.bankAccounts?.map((b: any) => (
              <option key={b.id} value={b.id}>{b.bankName} ({maskAccount(b.accountNumber)})</option>
            ))}
          </select>
        </div>

        {/* TYPE FILTER */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Transactions</option>
            <option value="CASH_DEPOSIT">Cash Deposits</option>
            <option value="CHEQUE_DEPOSIT">Cheque Deposits</option>
            <option value="WITHDRAWAL">Withdrawals</option>
          </select>
        </div>
      </div>

      {/* MONTHLY SUMMARY METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OPENING BANK BALANCE */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Opening Bank Balance</span>
            <i className="fas fa-landmark text-slate-400"></i>
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            ₹{summary.openingBankBalance.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 block">
            Balance on Day 1 of {reportData?.period?.monthName}
          </span>
        </div>

        {/* TOTAL DEPOSITS (CASH + CHEQUE) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Bank Deposits</span>
            <i className="fas fa-arrow-trend-up text-emerald-700"></i>
          </div>
          <span className="text-2xl font-black text-emerald-800 block">
            +₹{summary.totalBankDeposits.toLocaleString('en-IN')}
          </span>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span>Cash: ₹{summary.totalCashDeposits.toLocaleString('en-IN')}</span>
            <span>Cheque: ₹{summary.totalChequeDeposits.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* TOTAL WITHDRAWALS / EXPENSES */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Outflows & Expenses</span>
            <i className="fas fa-arrow-trend-down text-rose-600"></i>
          </div>
          <span className="text-2xl font-black text-rose-600 block">
            -₹{summary.totalWithdrawalsExpenses.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] font-semibold text-slate-400 block">
            Audited monthly disbursements
          </span>
        </div>

        {/* CLOSING BANK BALANCE */}
        <div className="bg-gradient-to-br from-[#0F3D26] to-emerald-950 text-white rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-[10px] font-bold uppercase tracking-wider">Closing Bank Balance</span>
            <i className="fas fa-vault text-base"></i>
          </div>
          <span className="text-2xl font-black text-white block">
            ₹{summary.closingBankBalance.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] font-semibold text-emerald-200 block">
            End of {reportData?.period?.monthName} {selectedYear}
          </span>
        </div>
      </div>

      {/* BANK-WISE BREAKDOWN TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">Bank-wise Monthly Distribution</h2>
            <p className="text-xs text-slate-500 mt-0.5">Summary of deposits and withdrawals grouped per bank account.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                <th className="pb-3 px-3">Bank Name</th>
                <th className="pb-3 px-3">Account Number</th>
                <th className="pb-3 px-3 text-right">Cash Deposited</th>
                <th className="pb-3 px-3 text-right">Cheque Deposited</th>
                <th className="pb-3 px-3 text-right">Total Deposits</th>
                <th className="pb-3 px-3 text-right">Withdrawals</th>
                <th className="pb-3 px-3 text-right">Live Account Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {reportData?.bankWiseBreakdown?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">No bank accounts found</td>
                </tr>
              ) : (
                reportData?.bankWiseBreakdown?.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">{b.bankName}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{maskAccount(b.accountNumber)}</td>
                    <td className="py-3 px-3 text-right text-blue-700">₹{b.cashDeposits.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right text-purple-700">₹{b.chequeDeposits.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-800">₹{b.totalDeposits.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right text-rose-600">₹{b.withdrawals.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">₹{(b.currentBalance || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED TRANSACTIONS LIST */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Transactions in {reportData?.period?.monthName} {selectedYear}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Itemized list of cash and cheque deposit entries.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {reportData?.transactions?.length || 0} Transactions
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading transactions...</div>
        ) : reportData?.transactions?.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No transactions recorded for this month.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Bank</th>
                  <th className="pb-3 px-3">Account Number</th>
                  <th className="pb-3 px-3">Cheque Details</th>
                  <th className="pb-3 px-3">Reference / Notes</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {reportData.transactions.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {t.type === 'CASH_DEPOSIT' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          Cash Deposit
                        </span>
                      )}
                      {t.type === 'CHEQUE_DEPOSIT' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                          Cheque Deposit
                        </span>
                      )}
                      {t.type === 'WITHDRAWAL' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          Withdrawal
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">{t.bankAccount?.bankName}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-500">{maskAccount(t.bankAccount?.accountNumber)}</td>
                    <td className="py-3 px-3">
                      {t.chequeNo ? (
                        <span className="font-mono text-purple-900 font-bold">
                          #{t.chequeNo} {t.chequeDate ? `(${new Date(t.chequeDate).toLocaleDateString('en-IN')})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {t.referenceNo ? <span className="font-bold mr-1">[{t.referenceNo}]</span> : ''}
                      {t.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-black whitespace-nowrap text-slate-900">
                      <span className={t.type === 'WITHDRAWAL' ? 'text-rose-600' : 'text-emerald-800'}>
                        {t.type === 'WITHDRAWAL' ? '-' : '+'}₹{Number(t.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
