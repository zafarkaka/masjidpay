'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PrintMonthlyFinanceReportPage() {
  const searchParams = useSearchParams();
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();
  const bank = searchParams.get('bank') || 'ALL';

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const params = new URLSearchParams({ year, month });
        if (bank !== 'ALL') params.append('bankAccountId', bank);

        const res = await fetch(`/api/finance/reports?${params.toString()}`);
        const data = await res.json();
        setReportData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [year, month, bank]);

  const maskAccount = (acc: string) => {
    if (!acc) return '••••';
    if (acc.length <= 4) return acc;
    return `•••• ${acc.slice(-4)}`;
  };

  const summary = reportData?.summary || {
    openingBankBalance: 0,
    totalCashDeposits: 0,
    totalChequeDeposits: 0,
    totalBankDeposits: 0,
    totalWithdrawalsExpenses: 0,
    closingBankBalance: 0,
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-sans text-xs">
        Preparing official financial statement for print...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-8 max-w-4xl mx-auto space-y-6 print:p-0 print:m-0">
      {/* PRINT CONTROLS (HIDDEN ON PRINT) */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl print:hidden">
        <span className="text-xs font-bold text-slate-600">
          Print Preview: {reportData?.period?.monthName} {year} Finance Statement
        </span>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2"
        >
          <i className="fas fa-print"></i> Print / Save as PDF
        </button>
      </div>

      {/* REPORT HEADER / LETTERHEAD */}
      <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
        <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-xl tracking-tight">
          <i className="fas fa-mosque"></i>
          <span>MASJIDPAY OFFICIAL FINANCIAL STATEMENT</span>
        </div>
        <h1 className="text-base font-bold text-slate-700">
          Monthly Bank Deposits & Finance Statement
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          Statement Period: {reportData?.period?.monthName} {year} • Generated on {new Date().toLocaleDateString('en-IN')}
        </p>
      </div>

      {/* SUMMARY BOXES */}
      <div className="grid grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Opening Bank Balance</span>
          <span className="text-base font-black text-slate-900 block">₹{summary.openingBankBalance.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Total Bank Deposits</span>
          <span className="text-base font-black text-emerald-800 block">+₹{summary.totalBankDeposits.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Total Outflows & Expenses</span>
          <span className="text-base font-black text-rose-600 block">-₹{summary.totalWithdrawalsExpenses.toLocaleString('en-IN')}</span>
        </div>
        <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 block">Closing Bank Balance</span>
          <span className="text-base font-black text-emerald-400 block">₹{summary.closingBankBalance.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* BANK-WISE BREAKDOWN */}
      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">1. Bank-wise Breakdown</h2>
        <table className="w-full text-left text-xs border border-slate-200">
          <thead className="bg-slate-100 font-bold text-slate-700 text-[10px] uppercase">
            <tr>
              <th className="p-2 border-b border-r border-slate-200">Bank Name</th>
              <th className="p-2 border-b border-r border-slate-200">Account Number</th>
              <th className="p-2 border-b border-r border-slate-200 text-right">Cash Deposits</th>
              <th className="p-2 border-b border-r border-slate-200 text-right">Cheque Deposits</th>
              <th className="p-2 border-b border-r border-slate-200 text-right">Total Deposits</th>
              <th className="p-2 border-b border-slate-200 text-right">Closing Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reportData?.bankWiseBreakdown?.map((b: any) => (
              <tr key={b.id}>
                <td className="p-2 border-r border-slate-200 font-bold">{b.bankName}</td>
                <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{maskAccount(b.accountNumber)}</td>
                <td className="p-2 border-r border-slate-200 text-right">₹{b.cashDeposits.toLocaleString('en-IN')}</td>
                <td className="p-2 border-r border-slate-200 text-right">₹{b.chequeDeposits.toLocaleString('en-IN')}</td>
                <td className="p-2 border-r border-slate-200 text-right font-bold text-emerald-800">₹{b.totalDeposits.toLocaleString('en-IN')}</td>
                <td className="p-2 text-right font-black">₹{(b.currentBalance || 0).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ITEMISED TRANSACTIONS */}
      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">2. Itemized Transactions</h2>
        <table className="w-full text-left text-xs border border-slate-200">
          <thead className="bg-slate-100 font-bold text-slate-700 text-[10px] uppercase">
            <tr>
              <th className="p-2 border-b border-r border-slate-200">Date</th>
              <th className="p-2 border-b border-r border-slate-200">Type</th>
              <th className="p-2 border-b border-r border-slate-200">Bank</th>
              <th className="p-2 border-b border-r border-slate-200">Account</th>
              <th className="p-2 border-b border-r border-slate-200">Cheque / Reference</th>
              <th className="p-2 border-b border-slate-200 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reportData?.transactions?.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-400">No transactions recorded for this period.</td>
              </tr>
            ) : (
              reportData?.transactions?.map((t: any) => (
                <tr key={t.id}>
                  <td className="p-2 border-r border-slate-200 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-2 border-r border-slate-200 font-bold text-[11px]">
                    {t.type === 'CASH_DEPOSIT' ? 'Cash Deposit' : t.type === 'CHEQUE_DEPOSIT' ? 'Cheque Deposit' : 'Withdrawal'}
                  </td>
                  <td className="p-2 border-r border-slate-200">{t.bankAccount?.bankName}</td>
                  <td className="p-2 border-r border-slate-200 font-mono text-slate-600">{maskAccount(t.bankAccount?.accountNumber)}</td>
                  <td className="p-2 border-r border-slate-200 text-[11px]">
                    {t.chequeNo ? `Cheque #${t.chequeNo}` : t.referenceNo ? `Ref: ${t.referenceNo}` : '—'}
                  </td>
                  <td className="p-2 text-right font-bold text-slate-900">
                    ₹{Number(t.amount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* SIGNATURE SECTION */}
      <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs font-bold text-slate-700">
        <div className="border-t border-slate-400 pt-2">
          <span>Prepared By (Accountant)</span>
        </div>
        <div className="border-t border-slate-400 pt-2">
          <span>Verified By (Treasurer)</span>
        </div>
        <div className="border-t border-slate-400 pt-2">
          <span>Approved By (President / Secretary)</span>
        </div>
      </div>
    </div>
  );
}
