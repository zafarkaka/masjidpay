'use client';

import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'member_collections' | 'donations' | 'expenses'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = () => {
    setLoading(true);
    let url = `/api/reports/export?reportType=${reportType}&format=json`;
    if (reportType === 'daily') url += `&date=${selectedDate}`;
    else if (reportType === 'monthly' || reportType === 'member_collections') url += `&month=${selectedMonth}`;

    fetch(url)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadReport();
  }, [reportType, selectedDate, selectedMonth]);

  // Download Excel / CSV
  const handleExportExcel = () => {
    let url = `/api/reports/export?reportType=${reportType}&format=excel`;
    if (reportType === 'daily') url += `&date=${selectedDate}`;
    else if (reportType === 'monthly' || reportType === 'member_collections') url += `&month=${selectedMonth}`;
    window.open(url, '_blank');
  };

  // Download / Print PDF Document
  const handlePrintPDF = () => {
    let url = `/dashboard/reports/print?reportType=${reportType}&autoPrint=true`;
    if (reportType === 'daily') url += `&date=${selectedDate}`;
    else if (reportType === 'monthly' || reportType === 'member_collections') url += `&month=${selectedMonth}`;
    window.open(url, '_blank');
  };

  const records = data?.records || [];
  const summary = data?.summary || { totalIncome: 0, totalExpenses: 0, totalMemberCollections: 0, netBalance: 0 };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 font-sans print:p-0 print:m-0 print:bg-white">
      {/* HEADER (HIDE ON PRINT) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Reports & Data Exports</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Generate daily collection statements, monthly audit reports, and download as Excel or PDF</p>
        </div>

        {/* DOWNLOAD ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <i className="fas fa-file-excel text-sm"></i> Export to Excel (.csv)
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-4 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <i className="fas fa-file-pdf text-sm"></i> Download / Print PDF
          </button>
        </div>
      </div>

      {/* REPORT SELECTION TABS & CONTROLS (HIDE ON PRINT) */}
      <div className="masjid-card p-6 bg-white border border-slate-200 shadow-sm space-y-4 print:hidden">
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Select Report Type:</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'daily', label: 'Daily Collection', icon: 'fa-calendar-day' },
            { id: 'monthly', label: 'Monthly Financial', icon: 'fa-calendar-days' },
            { id: 'member_collections', label: 'Member Collections', icon: 'fa-id-card' },
            { id: 'donations', label: 'Donations Audit', icon: 'fa-heart' },
            { id: 'expenses', label: 'Expenses Outflow', icon: 'fa-receipt' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                reportType === tab.id
                  ? 'bg-[#0F3D26] text-white border-[#0F3D26] shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span className="text-center">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* DATE / MONTH FILTER SELECTOR */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-slate-100">
          {reportType === 'daily' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Target Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
              />
            </div>
          )}

          {(reportType === 'monthly' || reportType === 'member_collections') && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Target Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="masjid-card p-6 bg-emerald-50 border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">TOTAL INCOME & COLLECTIONS</span>
          <span className="text-2xl font-extrabold text-emerald-950">IN ₹{summary.totalIncome?.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-emerald-800 font-semibold block">All donor funds & member fees</span>
        </div>

        <div className="masjid-card p-6 bg-rose-50 border border-rose-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">TOTAL EXPENSES & OUTFLOW</span>
          <span className="text-2xl font-extrabold text-rose-950">IN ₹{summary.totalExpenses?.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-rose-800 font-semibold block font-mono">Disbursements & maintenance</span>
        </div>

        <div className="masjid-card p-6 bg-[#faf8f5] border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">NET BALANCE</span>
          <span className={`text-2xl font-extrabold ${summary.netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            IN ₹{summary.netBalance?.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 font-semibold block">Net operational surplus</span>
        </div>
      </div>

      {/* REPORT DATA TABLE */}
      <div className="masjid-card bg-white border border-slate-200 shadow-sm overflow-hidden rounded-3xl">
        <div className="p-5 border-b border-slate-100 font-bold text-slate-900 text-sm flex justify-between items-center">
          <span>{data?.masjidName || 'Jama Masjid'} • Report Data Preview</span>
          <span className="text-xs text-slate-500 font-normal">Showing {records.length} records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-2xl mb-2"></i>
            <p>Loading report records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            No financial entries found for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="masjid-table w-full">
              <thead>
                <tr>
                  <th>RECEIPT / ID</th>
                  <th>DATE</th>
                  <th>CONTRIBUTOR / DESCRIPTION</th>
                  <th>CATEGORY</th>
                  <th>AMOUNT</th>
                  <th>PAYMENT MODE</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r: any, idx: number) => (
                  <tr key={idx}>
                    <td className="font-mono font-bold text-emerald-800">{r.receiptNo || r.id || `REC-${idx + 1}`}</td>
                    <td className="text-xs text-slate-500">{r.date}</td>
                    <td className="font-bold text-slate-900">{r.name || r.title}</td>
                    <td><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase">{r.category || r.sourceType || 'Income'}</span></td>
                    <td className="font-extrabold text-slate-900 text-sm">IN ₹{r.amount?.toLocaleString('en-IN')}</td>
                    <td><span className="masjid-badge masjid-badge-info">{r.paymentMethod}</span></td>
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
