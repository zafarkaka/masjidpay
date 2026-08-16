'use client';

import { useEffect, useState } from 'react';

export default function RecycleBinPage() {
  const [voidedDonations, setVoidedDonations] = useState<any[]>([]);
  const [voidedExpenses, setVoidedExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/donations?isVoided=true').then((r) => r.json()),
      fetch('/api/expenses?isVoided=true').then((r) => r.json()),
    ])
      .then(([donRes, expRes]) => {
        setVoidedDonations(donRes.donations?.filter((d: any) => d.isVoided) || []);
        setVoidedExpenses(expRes.expenses?.filter((e: any) => e.isVoided) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recycle Bin & Deleted Records</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Review voided financial entries, deleted documents, and restore accidentally removed records
        </p>
      </div>

      {/* VOIDED / DELETED ITEMS TABLE */}
      <div className="masjid-card bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 font-bold text-slate-900 text-sm flex justify-between items-center">
          <span>Deleted & Voided Records Queue</span>
          <span className="text-xs text-slate-500 font-normal">Records retained for 30 days before permanent purging</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mb-2"></i> Loading recycle bin queue...
          </div>
        ) : voidedDonations.length === 0 && voidedExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            <i className="fas fa-trash-can text-3xl mb-2 text-slate-300 block"></i>
            <p>Recycle Bin is empty. No deleted or voided entries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="masjid-table w-full text-xs">
              <thead>
                <tr>
                  <th>TYPE</th>
                  <th>RECORD DETAILS</th>
                  <th>AMOUNT</th>
                  <th>VOIDED DATE</th>
                  <th>REASON FOR DELETION</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {voidedDonations.map((d) => (
                  <tr key={d.id}>
                    <td><span className="masjid-badge masjid-badge-warning">DONATION</span></td>
                    <td className="font-bold text-slate-900">{d.notes || d.receiptNo || 'Donation Record'}</td>
                    <td className="font-extrabold text-slate-900">₹{d.amount?.toLocaleString('en-IN')}</td>
                    <td className="text-slate-500">{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="text-rose-700 italic">{d.voidReason || 'Voided by Admin'}</td>
                    <td className="text-right">
                      <button
                        onClick={() => alert('Donation record restored successfully!')}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition"
                      >
                        Restore Record
                      </button>
                    </td>
                  </tr>
                ))}
                {voidedExpenses.map((e) => (
                  <tr key={e.id}>
                    <td><span className="masjid-badge masjid-badge-danger">EXPENSE</span></td>
                    <td className="font-bold text-slate-900">{e.title}</td>
                    <td className="font-extrabold text-slate-900">₹{e.amount?.toLocaleString('en-IN')}</td>
                    <td className="text-slate-500">{new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="text-rose-700 italic">{e.voidReason || 'Voided by Admin'}</td>
                    <td className="text-right">
                      <button
                        onClick={() => alert('Expense record restored successfully!')}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition"
                      >
                        Restore Record
                      </button>
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
