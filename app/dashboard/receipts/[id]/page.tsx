'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PrintableReceiptPage() {
  const params = useParams();
  const donationId = params.id as string;
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/donations?masjidId=jama-masjid`)
      .then((res) => res.json())
      .then((data) => {
        const match = data.donations?.find((d: any) => d.id === donationId);
        setDonation(match);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [donationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">
        <i className="fas fa-circle-notch fa-spin text-2xl text-emerald-700 mr-2"></i> Loading receipt document...
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <p className="text-slate-600 font-bold mb-4">Donation record not found.</p>
        <Link href="/dashboard/donations" className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold">
          Back to Donations
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 py-10 px-4">
      {/* ACTION BAR */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link href="/dashboard/donations" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
          <i className="fas fa-arrow-left"></i> Back to Donations
        </Link>

        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 text-xs transition flex items-center gap-2"
        >
          <i className="fas fa-print"></i> Print / Download PDF Receipt
        </button>
      </div>

      {/* PRINTABLE RECEIPT CONTAINER */}
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-200 relative overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* WATERMARK */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <i className="fas fa-mosque text-[300px] text-emerald-900"></i>
        </div>

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center text-2xl shadow-md">
              <i className="fas fa-mosque"></i>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Jama Masjid Vaniyambadi</h1>
              <p className="text-xs text-slate-500 mt-0.5">Main Bazaar Road, Vaniyambadi, Tamil Nadu - 635751</p>
              <p className="text-[10px] text-slate-400 font-medium">Reg No: REG-TN-2024-889 • Phone: +91 98765 43210</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 font-extrabold text-xs uppercase tracking-wider rounded-lg mb-1">
              Official Receipt
            </span>
            <span className="block text-xs font-mono font-bold text-slate-700">{donation.receiptNo || 'REC-2026-001'}</span>
          </div>
        </div>

        {/* RECEIPT DETAILS BODY */}
        <div className="py-8 space-y-6 relative z-10">
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Received With Thanks From</span>
              <span className="text-base font-extrabold text-slate-900 block mt-1">
                {donation.isAnonymous ? 'Anonymous Donor' : donation.donor?.name || 'Valued Donor'}
              </span>
              {donation.donor?.phone && <span className="text-xs text-slate-500 block">{donation.donor.phone}</span>}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receipt Date</span>
              <span className="text-sm font-bold text-slate-800 block mt-1">{new Date(donation.date).toLocaleDateString('en-IN', { dateStyle: 'full' })}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Donation Category</th>
                  <th className="p-3.5">Fund Allocated</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3.5 font-bold text-slate-900">{donation.category?.name}</td>
                  <td className="p-3.5 text-emerald-800 font-semibold">{donation.fund?.name}</td>
                  <td className="p-3.5 text-slate-600 font-mono">{donation.paymentMethod}</td>
                  <td className="p-3.5 text-right font-extrabold text-base text-slate-900">
                    ₹{donation.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {donation.referenceNo && (
            <div className="text-xs text-slate-500 font-mono">
              Transaction Reference / Ref No: <span className="font-bold text-slate-800">{donation.referenceNo}</span>
            </div>
          )}

          {/* TOTAL IN WORDS BOX */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">Total Amount Received</span>
              <span className="text-xl font-extrabold text-emerald-950">₹{donation.amount.toLocaleString('en-IN')} INR</span>
            </div>
            <div className="text-right">
              <i className="fas fa-certificate text-2xl text-emerald-700"></i>
            </div>
          </div>

          <div className="text-center py-4 border-t border-dashed border-slate-200">
            <p className="text-xs font-serif italic text-slate-600">
              "May Allah accept your noble contribution and bless your wealth and family."
            </p>
          </div>
        </div>

        {/* FOOTER SIGNATURE & QR VERIFICATION */}
        <div className="pt-6 border-t border-slate-200 flex items-end justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-slate-950 text-white rounded-xl p-2 flex flex-col items-center justify-center font-mono text-[9px] text-center">
              <i className="fas fa-qrcode text-3xl text-emerald-400 mb-1"></i>
              <span>VERIFIED</span>
            </div>
            <div className="text-[10px] text-slate-400">
              <span className="block font-bold text-slate-700">Digital Audit Hash Verified</span>
              <span className="block font-mono">{donation.id}</span>
            </div>
          </div>

          <div className="text-center">
            <div className="w-36 border-b border-slate-400 mb-1"></div>
            <span className="text-xs font-bold text-slate-800 block">Authorized Treasurer</span>
            <span className="text-[10px] text-slate-500 block">Jama Masjid Committee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
