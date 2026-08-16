'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function UniversalPrintableReportPage() {
  const searchParams = useSearchParams();
  const reportType = searchParams.get('reportType') || 'daily'; // daily, monthly, member_collections, expenses, income
  const dateParam = searchParams.get('date');
  const monthParam = searchParams.get('month');
  const autoPrint = searchParams.get('autoPrint') === 'true';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `/api/reports/export?reportType=${reportType}&date=${dateParam || ''}&month=${monthParam || ''}&format=json`;
    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [reportType, dateParam, monthParam]);

  useEffect(() => {
    if (!loading && data && autoPrint) {
      setTimeout(() => window.print(), 800);
    }
  }, [loading, data, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 font-sans">
        <i className="fas fa-circle-notch fa-spin text-2xl text-emerald-800 mr-2"></i> Generating PDF Financial Report...
      </div>
    );
  }

  if (!data || !data.records) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 font-sans">
        <p className="text-slate-600 font-bold mb-4">No report data found for selected criteria.</p>
        <Link href="/dashboard/reports" className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold">
          Back to Report Center
        </Link>
      </div>
    );
  }

  const titleMap: Record<string, string> = {
    daily: 'DAILY COLLECTION FINANCIAL REPORT',
    monthly: 'MONTHLY FINANCIAL AUDIT STATEMENT',
    member_collections: 'MONTHLY MEMBER COLLECTIONS AUDIT SLIP',
    expenses: 'MOSQUE EXPENSES & DISBURSEMENTS LEDGER',
    income: 'MOSQUE INCOME & CONTRIBUTIONS REPORT',
  };

  return (
    <div className="min-h-screen bg-slate-200 py-8 px-4 font-sans text-slate-800">
      {/* SCREEN ACTION BAR */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link href="/dashboard/reports" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
          <i className="fas fa-arrow-left"></i> Back to Report Center
        </Link>

        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-2xl shadow-lg text-xs transition flex items-center gap-2"
        >
          <i className="fas fa-file-pdf"></i> Download PDF / Print Report
        </button>
      </div>

      {/* PRINTABLE PDF REPORT CONTAINER */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200 relative overflow-hidden print:shadow-none print:border-none print:rounded-none print:p-4">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0F3D26] text-white flex items-center justify-center text-2xl shadow-md">
              <i className="fas fa-mosque"></i>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{data.masjidName || 'Jama Masjid Vaniyambadi'}</h1>
              <p className="text-xs text-slate-500 font-semibold">Official Financial Statement & Management Report</p>
              <p className="text-[10px] text-slate-400 font-medium">Generated Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs uppercase tracking-wider rounded-lg mb-1">
              {titleMap[reportType] || 'FINANCIAL REPORT'}
            </span>
            <span className="block text-xs font-mono font-bold text-slate-700">Period: {data.monthParam || data.dateParam || 'August 2026'}</span>
          </div>
        </div>

        {/* SUMMARY METRICS CARDS */}
        <div className="py-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100">
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-emerald-800 block">TOTAL INCOME / COLLECTIONS</span>
            <span className="text-xl font-extrabold text-emerald-950">IN ₹{Number(data.summary?.totalIncome || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-rose-800 block">TOTAL EXPENSES</span>
            <span className="text-xl font-extrabold text-rose-950">IN ₹{Number(data.summary?.totalExpenses || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl">
            <span className="text-[10px] font-black uppercase text-slate-700 block">NET BALANCE</span>
            <span className="text-xl font-extrabold text-slate-900">IN ₹{Number(data.summary?.netBalance || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* DETAILED DATA TABLE */}
        <div className="py-6 space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Detailed Financial Ledger ({data.records.length} Transactions)</h3>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3">RECEIPT NO / ID</th>
                <th className="py-3">DATE</th>
                <th className="py-3">CONTRIBUTOR / DESCRIPTION</th>
                <th className="py-3">CATEGORY / SOURCE</th>
                <th className="py-3 text-right">AMOUNT (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {data.records.map((r: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-3 font-mono font-bold text-emerald-900">{r.receiptNo || r.id || `REC-${idx + 1}`}</td>
                  <td className="py-3 text-slate-600">{r.date}</td>
                  <td className="py-3 font-bold text-slate-900">{r.name || r.title}</td>
                  <td className="py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded text-[10px] uppercase">{r.category || r.sourceType || 'General'}</span></td>
                  <td className="py-3 text-right font-extrabold text-slate-900">IN ₹{Number(r.amount || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER & SIGNATURE */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-6 items-end">
          <div>
            <p className="text-[11px] text-slate-500 font-semibold">
              This document is an official financial ledger generated by Fort Masjid SaaS Engine for community transparency and executive audit.
            </p>
          </div>

          <div className="text-center space-y-1">
            <div className="w-36 border-b-2 border-slate-400 mx-auto pb-6 text-[10px] text-slate-400 font-mono">
              [ MOSQUE AUDITOR STAMP ]
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">TREASURER & EXECUTIVE COMMITTEE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
