'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  getAllPaidMonthsForMember,
  getPendingMonthsUpToCurrent,
  getExpectedMonthsUpToCurrent,
  MONTH_NAMES,
} from '@/lib/memberMonths';
import { generateMemberStatusWhatsAppUrl } from '@/lib/whatsapp';

interface MemberSoaModalProps {
  member: any;
  collections: any[];
  masjidName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberSoaModal({
  member,
  collections,
  masjidName = 'Jama Masjid',
  isOpen,
  onClose,
}: MemberSoaModalProps) {
  if (!isOpen || !member) return null;

  const printRef = useRef<HTMLDivElement>(null);

  // Filter collections specific to this member
  const memberCols = (collections || [])
    .filter((c) => {
      const phoneMatch =
        member.phone &&
        c.memberPhone &&
        c.memberPhone.replace(/[^0-9]/g, '') === member.phone.replace(/[^0-9]/g, '');
      const nameMatch =
        member.name && c.memberName?.toLowerCase().trim() === member.name?.toLowerCase().trim();
      const idMatch = c.memberId && c.memberId === member.id;
      return idMatch || phoneMatch || nameMatch;
    })
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());

  const monthlyRate = Number(member.monthlyAmount || 100);
  const totalPaid = memberCols.reduce((acc, c) => acc + Number(c.amount || 0), 0);

  const { paidMonths, pendingMonths, isFullyPaid, currentMonthStr } = getPendingMonthsUpToCurrent(
    member,
    memberCols
  );

  const expectedMonths = getExpectedMonthsUpToCurrent(member.createdAt || member.joiningDate);
  const totalExpectedAmount = expectedMonths.length * monthlyRate;
  const pendingAmount = pendingMonths.length * monthlyRate;
  const openingBalance = 0; // Standard 0 opening balance for mosque fee subscription
  const currentBalance = pendingAmount; // Outstanding due

  const statusType: 'FULLY_PAID' | 'PARTIALLY_PAID' | 'PENDING' =
    pendingMonths.length === 0
      ? 'FULLY_PAID'
      : totalPaid > 0
      ? 'PARTIALLY_PAID'
      : 'PENDING';

  const statusLabel =
    statusType === 'FULLY_PAID'
      ? 'Fully Paid (Up to date)'
      : statusType === 'PARTIALLY_PAID'
      ? `Partially Paid (${pendingMonths.length} Months Due)`
      : `Pending (${pendingMonths.length} Months Due)`;

  const latestPaidMonth = paidMonths.length > 0 ? paidMonths[paidMonths.length - 1] : 'None';

  // Calculate Running Balances for the Statement Ledger
  let runningPaid = 0;
  const ledgerRows = memberCols.map((col, idx) => {
    runningPaid += Number(col.amount || 0);
    return {
      ...col,
      runningPaid,
    };
  });

  // Share Handlers
  const handlePrint = () => {
    window.print();
  };

  const whatsappUrl = generateMemberStatusWhatsAppUrl({
    phone: member.phone,
    memberName: member.name,
    memberNo: member.memberNo || 'MBR',
    monthlyRate,
    totalPaid,
    pendingAmount,
    statusText: statusLabel,
    statusType: isFullyPaid ? 'FULLY_PAID' : 'PENDING',
    paidTillMonth: latestPaidMonth,
    pendingMonthsList: pendingMonths,
    masjidName,
  });

  const emailSubject = encodeURIComponent(`Statement of Account (SOA) - ${member.name} (${masjidName})`);
  const emailBody = encodeURIComponent(`Assalamu Alaikum ${member.name},

Please find below your Statement of Account (SOA) from ${masjidName}:

• Member ID: ${member.memberNo || 'MBR'}
• Monthly Fee Rate: INR ${monthlyRate}/month
• Total Fees Paid: INR ${totalPaid.toLocaleString('en-IN')}
• Total Pending Dues: INR ${pendingAmount.toLocaleString('en-IN')}
• Status: ${statusLabel}
• Pending Months: ${pendingMonths.length > 0 ? pendingMonths.join(', ') : 'None (Fully Settled)'}

JazakAllah Khair for your support!
${masjidName}`);

  const emailUrl = `mailto:${member.email || ''}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* TOP ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0F3D26] text-white flex items-center justify-center text-sm shadow-xs">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                Statement of Account (SOA)
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {member.name} • {member.memberNo || 'MBR'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* PRINT / PDF BUTTON */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#0F3D26] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Print or Save as PDF"
            >
              <i className="fas fa-file-pdf text-[11px]"></i>
              <span className="hidden xs:inline">Print / PDF</span>
            </button>

            {/* OPEN DEDICATED SOA PAGE */}
            <Link
              href={`/dashboard/monthly-members/soa?memberId=${member.id}`}
              target="_blank"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Open full dedicated SOA page"
            >
              <i className="fas fa-arrow-up-right-from-square text-[10px]"></i>
              <span className="hidden sm:inline">Full Page</span>
            </Link>

            {/* WHATSAPP SHARE BUTTON */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Share SOA on WhatsApp"
            >
              <i className="fab fa-whatsapp text-sm"></i>
              <span className="hidden xs:inline">WhatsApp</span>
            </a>

            {/* EMAIL SHARE BUTTON */}
            <a
              href={emailUrl}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Share via Email"
            >
              <i className="far fa-envelope text-[11px]"></i>
              <span className="hidden md:inline">Email</span>
            </a>

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold ml-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PRINTABLE SOA CONTENT BODY */}
        <div ref={printRef} className="overflow-y-auto flex-1 pr-1 py-4 space-y-5 print:p-0">
          {/* 1. OFFICIAL MASJID & STATEMENT HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-br from-[#0F3D26] to-[#0A291A] text-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl text-[#F4D06F]">
                <i className="fas fa-mosque"></i>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F4D06F] block">
                  OFFICIAL STATEMENT OF ACCOUNT
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{masjidName}</h1>
                <p className="text-[11px] text-emerald-100/80">Monthly Member Fee & Financial Ledger</p>
              </div>
            </div>

            <div className="text-left sm:text-right border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
              <div className="inline-block px-2.5 py-1 bg-white/15 border border-white/20 rounded-lg text-[11px] font-mono font-bold">
                Statement Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <span className="block text-[10px] text-emerald-200/80 mt-1 font-mono">
                Current Billing Period: {currentMonthStr}
              </span>
            </div>
          </div>

          {/* 2. MEMBER PROFILE DETAILS & FINANCIAL SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MEMBER INFO CARD */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Member Information
              </span>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">{member.name}</h3>
                  <p className="text-xs font-mono text-slate-600 mt-0.5">📞 {member.phone}</p>
                  {member.email && <p className="text-xs text-slate-500">✉️ {member.email}</p>}
                  {member.address && <p className="text-xs text-slate-500 mt-0.5">📍 {member.address}</p>}
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-mono font-black text-xs rounded-lg border border-emerald-300">
                  {member.memberNo || 'MBR'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <span>Monthly Rate: <strong className="text-emerald-900 font-bold">IN ₹{monthlyRate}/mo</strong></span>
                <span>
                  Member Since: {new Date(member.createdAt || member.joiningDate || new Date()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* FINANCIAL SUMMARY 4-BOX GRID */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Opening Balance
                </span>
                <span className="text-base font-extrabold text-slate-800 font-mono block">
                  IN ₹{openingBalance.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400 block">At Registration</span>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Total Expected
                </span>
                <span className="text-base font-extrabold text-slate-900 font-mono block">
                  IN ₹{totalExpectedAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400 block">{expectedMonths.length} Months Billed</span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-0.5 shadow-2xs">
                <span className="text-[9.5px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  Total Paid
                </span>
                <span className="text-base font-black text-emerald-950 font-mono block">
                  IN ₹{totalPaid.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-emerald-700 block">{paidMonths.length} Months Settled</span>
              </div>

              <div
                className={`p-3 rounded-xl space-y-0.5 shadow-2xs border ${
                  pendingAmount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'
                }`}
              >
                <span
                  className={`text-[9.5px] font-extrabold uppercase tracking-wider block ${
                    pendingAmount > 0 ? 'text-amber-900' : 'text-emerald-800'
                  }`}
                >
                  Current Due
                </span>
                <span
                  className={`text-base font-black font-mono block ${
                    pendingAmount > 0 ? 'text-rose-700' : 'text-emerald-950'
                  }`}
                >
                  IN ₹{pendingAmount.toLocaleString('en-IN')}
                </span>
                <span
                  className={`text-[9px] font-bold block ${
                    pendingAmount > 0 ? 'text-amber-800' : 'text-emerald-700'
                  }`}
                >
                  {pendingAmount > 0 ? `${pendingMonths.length} Months Pending` : 'All Settled ✓'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. MONTHLY DUES & CLEARANCE SCHEDULE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <i className="fas fa-calendar-alt text-emerald-700"></i> Monthly Fee Clearance Schedule
              </span>
              <span className="text-[11px] font-extrabold text-slate-500">
                Status: <strong className={isFullyPaid ? 'text-emerald-700' : 'text-amber-700'}>{statusLabel}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
              {expectedMonths.map((mStr) => {
                const isPaid = paidMonths.includes(mStr);
                return (
                  <div
                    key={mStr}
                    className={`p-2 rounded-xl text-center border text-xs transition ${
                      isPaid
                        ? 'bg-white border-emerald-300 text-emerald-950 shadow-2xs'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold block truncate">{mStr}</span>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      {isPaid ? (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded text-[9px] font-black uppercase">
                          ✓ PAID
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 rounded text-[9px] font-black uppercase">
                          DUE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. COMPLETE TRANSACTION HISTORY TABLE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <i className="fas fa-receipt text-emerald-700"></i> Complete Collection & Payment History ({memberCols.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Lifetime Total: <strong>IN ₹{totalPaid.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            {ledgerRows.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-medium">
                No payment collection transactions recorded yet.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <th className="p-3">Date</th>
                      <th className="p-3">Receipt No</th>
                      <th className="p-3">Period / Description</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                      <th className="p-3 text-right">Cumulative Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-bold text-slate-700">
                          {new Date(row.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-3 font-mono font-extrabold text-emerald-900">
                          {row.receiptNo || 'MC-REC'}
                        </td>
                        <td className="p-3 font-medium text-slate-800 max-w-[200px] truncate">
                          {row.forMonths || 'Monthly Fee'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9.5px] font-bold uppercase">
                            {row.paymentMethod || 'CASH'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                          IN ₹{Number(row.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-900">
                          IN ₹{row.runningPaid.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 5. FOOTER & AUTHORIZATION */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[10px]">
            <div className="flex items-center gap-2">
              <i className="fas fa-shield-halved text-emerald-700"></i>
              <span>Generated electronically by <strong>MasjidPay</strong> with Amanah & Transparency</span>
            </div>
            <div className="font-mono text-[9.5px]">
              Auth Sign / Mosque Seal: _______________________
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
