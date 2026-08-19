'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RentalPrintStatementPage() {
  const searchParams = useSearchParams();
  const shopId = searchParams.get('shopId') || 'ALL';
  const tenant = searchParams.get('tenant') || 'ALL';
  const month = searchParams.get('month') || 'ALL';

  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [masjidName, setMasjidName] = useState('Newtown Masjid');

  useEffect(() => {
    fetch('/api/rentals')
      .then((res) => res.json())
      .then((data) => {
        setShops(data.shops || []);
        setPayments(data.payments || []);
        if (data.masjidName) setMasjidName(data.masjidName);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedShop = shopId !== 'ALL' ? shops.find((s) => s.id === shopId) : null;

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (shopId !== 'ALL' && p.shopId !== shopId) return false;
    if (tenant !== 'ALL' && p.tenantName?.toLowerCase().trim() !== tenant.toLowerCase().trim()) return false;
    if (month !== 'ALL' && !p.forMonth?.toLowerCase().includes(month.toLowerCase())) return false;
    return true;
  });

  // Calculate totals
  const totalReceived = filteredPayments
    .filter((p) => !p.forMonth?.toLowerCase().includes('advance returned') && !p.forMonth?.toLowerCase().includes('refund'))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalReturned = filteredPayments
    .filter((p) => p.forMonth?.toLowerCase().includes('advance returned') || p.forMonth?.toLowerCase().includes('refund'))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const netBalance = totalReceived - totalReturned;

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-sans text-xs">
        <i className="fas fa-circle-notch fa-spin text-emerald-800 text-2xl mb-2"></i>
        <p>Generating Official Rental Statement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-4xl mx-auto space-y-6 print:p-0 print:m-0">
      {/* PRINT CONTROLS (HIDDEN WHEN PRINTING) */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/rentals"
            className="px-3.5 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <i className="fas fa-arrow-left"></i> Back to Rentals
          </Link>
          <span className="text-xs font-bold text-slate-600">
            Statement Preview: {selectedShop ? selectedShop.shopNo : 'All Properties'}
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <i className="fas fa-print"></i> Print / Save as PDF
        </button>
      </div>

      {/* REPORT HEADER / LETTERHEAD */}
      <div className="text-center pb-5 border-b-2 border-slate-900 space-y-1">
        <div className="flex items-center justify-center gap-2 text-emerald-900 font-black text-xl tracking-tight uppercase">
          <i className="fas fa-mosque"></i>
          <span>{masjidName}</span>
        </div>
        <h1 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
          Official Rental Collection Statement & Ledger
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* PROPERTY & TENANT SUMMARY CARD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Property / Shop</span>
          <span className="font-extrabold text-slate-900 text-sm">
            {selectedShop ? selectedShop.shopNo : (shopId !== 'ALL' ? shopId : 'All Registered Units')}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Tenant Name</span>
          <span className="font-extrabold text-slate-900 text-sm">
            {selectedShop ? selectedShop.tenantName : (tenant !== 'ALL' ? tenant : 'All Tenants')}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Monthly Rate</span>
          <span className="font-extrabold text-emerald-800 text-sm">
            {selectedShop ? `₹${Number(selectedShop.monthlyRent || 0).toLocaleString('en-IN')}/mo` : 'Variable'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Filter Period</span>
          <span className="font-extrabold text-slate-900 text-sm">
            {month !== 'ALL' ? month : 'Complete History'}
          </span>
        </div>
      </div>

      {/* FINANCIAL SUMMARY BOXES */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Total Rent & Advance Received
          </span>
          <span className="text-lg font-black text-emerald-800">
            ₹{totalReceived.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Total Advance Refunded / Returned
          </span>
          <span className="text-lg font-black text-rose-600">
            ₹{totalReturned.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 block">
            Net Collections Retained
          </span>
          <span className="text-lg font-black text-[#F4D06F]">
            ₹{netBalance.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold text-slate-700 uppercase">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Voucher No</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Shop & Tenant</th>
              <th className="py-2.5 px-3">Transaction / Period</th>
              <th className="py-2.5 px-3">Payment Mode</th>
              <th className="py-2.5 px-3 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-semibold">
                  No rental payment vouchers recorded for this filter.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p, idx) => {
                const isReturned =
                  p.forMonth?.toLowerCase().includes('advance returned') ||
                  p.forMonth?.toLowerCase().includes('refund');

                return (
                  <tr key={p.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.receiptNo || 'RNT-OFFICIAL'}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{p.shopNo}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{p.tenantName}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {p.forMonth || 'Monthly Rent'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700 uppercase">
                        {p.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 text-right font-extrabold ${isReturned ? 'text-rose-600' : 'text-emerald-800'}`}>
                      {isReturned ? '-' : '+'}₹{Number(p.amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-black text-xs">
              <td colSpan={6} className="py-3 px-3 text-right uppercase tracking-wider text-slate-700">
                Grand Total Net Collections:
              </td>
              <td className="py-3 px-3 text-right text-emerald-900 text-sm">
                ₹{netBalance.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* SIGNATURE SECTION */}
      <div className="pt-12 grid grid-cols-2 gap-10 text-xs">
        <div className="border-t border-slate-400 pt-2 text-center">
          <span className="font-bold text-slate-700 block">Prepared By</span>
          <span className="text-[11px] text-slate-400">Rental Committee / Staff</span>
        </div>
        <div className="border-t border-slate-400 pt-2 text-center">
          <span className="font-bold text-slate-700 block">Authorized Signature</span>
          <span className="text-[11px] text-slate-400">Mutawalli / Treasurer</span>
        </div>
      </div>
    </div>
  );
}
