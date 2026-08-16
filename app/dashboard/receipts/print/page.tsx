'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function UniversalPrintableReceiptPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'collection'; // collection, donation, income, payroll
  const autoPrint = searchParams.get('autoPrint') === 'true';

  const [record, setRecord] = useState<any>(null);
  const [masjidName, setMasjidName] = useState('Jama Masjid Vaniyambadi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === 'collection' && id) {
      fetch('/api/member-collections')
        .then((r) => r.json())
        .then((data) => {
          const match = data.collections?.find((c: any) => c.id === id || c.receiptNo === id);
          setRecord(match);
          if (data.masjidName) setMasjidName(data.masjidName);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else if (type === 'income' && id) {
      fetch('/api/income?masjidId=jama-masjid')
        .then((r) => r.json())
        .then((data) => {
          const match = data.incomes?.find((i: any) => i.id === id);
          setRecord(match);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // Default demo record fallback if created on the fly
      setRecord({
        receiptNo: id || 'REC-2026-0089',
        memberName: searchParams.get('name') || 'Zafar Ali',
        memberPhone: searchParams.get('phone') || '9894977003',
        amount: Number(searchParams.get('amount') || 2400),
        forMonths: searchParams.get('period') || 'August 2026',
        paymentDate: searchParams.get('date') || new Date().toISOString(),
        paymentMethod: searchParams.get('method') || 'CASH',
        category: searchParams.get('category') || 'Monthly Member Collection',
      });
      setLoading(false);
    }
  }, [id, type, searchParams]);

  useEffect(() => {
    if (!loading && record && autoPrint) {
      setTimeout(() => window.print(), 800);
    }
  }, [loading, record, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 font-sans">
        <i className="fas fa-circle-notch fa-spin text-2xl text-emerald-800 mr-2"></i> Generating PDF Receipt Document...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 font-sans">
        <p className="text-slate-600 font-bold mb-4">Receipt record not found.</p>
        <Link href="/dashboard/member-collections" className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold">
          Back to Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 py-8 px-4 font-sans text-slate-800">
      {/* ACTION BAR HELD FOR SCREEN VIEW */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link href="/dashboard/member-collections" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl shadow-lg text-xs transition flex items-center gap-2"
          >
            <i className="fas fa-file-pdf"></i> Download PDF / Print Receipt
          </button>
        </div>
      </div>

      {/* HIGH RESOLUTION PRINTABLE PDF RECEIPT CARD */}
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200 relative overflow-hidden print:shadow-none print:border-none print:rounded-none print:p-4">
        {/* WATERMARK */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <i className="fas fa-mosque text-[320px] text-emerald-900"></i>
        </div>

        {/* HEADER */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0F3D26] text-white flex items-center justify-center text-2xl shadow-md">
              <i className="fas fa-mosque"></i>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{masjidName}</h1>
              <p className="text-xs text-slate-500 font-medium">Main Bazaar Road, Vaniyambadi, Tamil Nadu - 635751</p>
              <p className="text-[10px] text-slate-400 font-semibold">Reg No: REG-TN-2024-889 • Phone: +91 98949 77003</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs uppercase tracking-wider rounded-lg mb-1">
              OFFICIAL PAYMENT RECEIPT
            </span>
            <span className="block text-xs font-mono font-bold text-slate-700">{record.receiptNo || 'REC-2026-0089'}</span>
          </div>
        </div>

        {/* BISMILLAH BANNER */}
        <div className="text-center py-4 border-b border-slate-100 relative z-10">
          <span className="text-lg font-serif text-emerald-900 font-extrabold">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
        </div>

        {/* RECEIPT DETAILS */}
        <div className="py-6 space-y-6 relative z-10">
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RECEIVED FROM</span>
              <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                {record.memberName || record.payer || 'Zafar Ali'}
              </span>
              <span className="text-xs font-mono text-slate-600 block mt-0.5">{record.memberPhone || record.phone || '9894977003'}</span>
              {record.memberAddress && <span className="text-[11px] text-slate-500 block">{record.memberAddress}</span>}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PAYMENT DATE</span>
              <span className="text-xs font-bold text-slate-800 block mt-1">
                {new Date(record.paymentDate || record.date || Date.now()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-3">PAYMENT MODE</span>
              <span className="text-xs font-mono font-bold text-emerald-800 uppercase block">{record.paymentMethod || 'CASH'}</span>
            </div>
          </div>

          {/* TABLE SUMMARY */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3">DESCRIPTION / PERIOD</th>
                <th className="py-3 text-center">CATEGORY</th>
                <th className="py-3 text-right">AMOUNT (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="py-4 font-bold text-slate-900">
                  {record.forMonths || record.title || 'Monthly Member Contribution'}
                </td>
                <td className="py-4 text-center font-semibold text-slate-600">
                  {record.paymentType || record.category || 'Monthly Collection'}
                </td>
                <td className="py-4 text-right font-extrabold text-slate-900 text-sm">
                  IN ₹{Number(record.amount || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* TOTAL SUMMARY CARD */}
          <div className="p-4 bg-[#f4faf6] border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">STATUS</span>
              <span className="text-xs font-black text-emerald-800 flex items-center gap-1">
                <i className="fas fa-check-circle"></i> FULLY PAID & VERIFIED
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">TOTAL RECEIVED</span>
              <span className="text-2xl font-black text-emerald-950">IN ₹{Number(record.amount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* ISLAMIC DUA & FOOTER SIGNATURE */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 items-end">
            <div>
              <p className="text-xs font-semibold text-slate-700 italic">
                &quot;May Allah accept your donations and grant barakah in your wealth and family. JazakAllah Khair!&quot;
              </p>
            </div>

            <div className="text-center space-y-1">
              <div className="w-32 border-b-2 border-slate-400 mx-auto pb-6 text-[10px] text-slate-400 font-mono">
                [ MANAGEMENT STAMP ]
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 block">AUTHORIZED SIGNATURE</span>
              <span className="text-[9px] text-slate-400 block">Mosque Executive Committee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
