'use client';

import { useEffect, useState } from 'react';

export default function PayrollPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Staff Filter
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'LEDGER' | 'PROFILES'>('LEDGER');

  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  // Staff Creation Form
  const [staffName, setStaffName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Muazzin');
  const [phone, setPhone] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('15000');

  // Salary Payout Form with Attendance & Calculations
  const [monthPaid, setMonthPaid] = useState('August 2026');
  const [baseSalary, setBaseSalary] = useState(15000);
  const [workingDays, setWorkingDays] = useState(30);
  const [presentDays, setPresentDays] = useState(30);
  const [allowance, setAllowance] = useState(0);
  const [deduction, setDeduction] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [payError, setPayError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isViewer, setIsViewer] = useState(false);

  const MONTH_OPTIONS = [
    'January 2026', 'February 2026', 'March 2026', 'April 2026',
    'May 2026', 'June 2026', 'July 2026', 'August 2026',
    'September 2026', 'October 2026', 'November 2026', 'December 2026',
    'January 2027', 'February 2027', 'March 2027', 'April 2027',
    'May 2027', 'June 2027', 'July 2027', 'August 2027',
  ];

  // Calculated Real-Time Values
  const absentDays = Math.max(0, Number(workingDays) - Number(presentDays));
  const perDaySalary = Number(workingDays) > 0 ? (Number(baseSalary) / Number(workingDays)) : 0;
  const earnedSalary = Math.round(perDaySalary * Number(presentDays) * 100) / 100;
  const netSalary = Math.max(0, Math.round((earnedSalary + Number(allowance) - Number(deduction)) * 100) / 100);

  const loadData = () => {
    setLoading(true);
    fetch('/api/payroll')
      .then((res) => res.json())
      .then((data) => {
        const staffList = data.staff || [];
        setStaff(staffList);
        setPayrolls(data.payrolls || []);
        if (staffList.length > 0 && !selectedStaffId) {
          setSelectedStaffId(staffList[0].id);
          setBaseSalary(staffList[0].monthlySalary || 15000);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        const role = d?.user?.role;
        setIsViewer(role === 'VIEWER' || role === 'COMMUNITY_VIEWER');
      })
      .catch(() => {});
    loadData();
  }, []);

  const activeStaff = staff.find((s) => s.id === selectedStaffId) || staff[0];
  const staffPayrolls = selectedStaffId === 'ALL'
    ? payrolls
    : payrolls.filter((p) => p.staffId === activeStaff?.id);

  const totalSalaryPaid = staffPayrolls.reduce((sum, p) => sum + (p.netSalary || p.amount || 0), 0);
  const paidMonthsCount = staffPayrolls.length;
  const tenureMonths = 1;
  const pendingMonthsCount = Math.max(0, tenureMonths - paidMonthsCount);

  // Check if chosen month is already paid for activeStaff
  const isMonthAlreadyPaid = Boolean(
    activeStaff &&
    payrolls.some(
      (p) =>
        p.staffId === activeStaff.id &&
        ((p.monthPaid && p.monthPaid.trim().toLowerCase() === monthPaid.trim().toLowerCase()) ||
         (p.month && p.month.trim().toLowerCase() === monthPaid.trim().toLowerCase()))
    )
  );

  const handleOpenPayModal = (staffMember?: any) => {
    const target = staffMember || activeStaff;
    if (target) {
      setBaseSalary(target.monthlySalary || 15000);
      setWorkingDays(30);
      setPresentDays(30);
      setAllowance(0);
      setDeduction(0);
      setNotes('');
      setPayError('');

      // Auto-suggest next unpaid month if August 2026 is already paid
      const paidMonthsForTarget = payrolls
        .filter((p) => p.staffId === target.id)
        .map((p) => (p.monthPaid || p.month || '').trim().toLowerCase());

      const firstUnpaidMonth = MONTH_OPTIONS.find(
        (m) => !paidMonthsForTarget.includes(m.toLowerCase())
      );

      if (firstUnpaidMonth) {
        setMonthPaid(firstUnpaidMonth);
      } else {
        setMonthPaid('August 2026');
      }

      setShowPayModal(true);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_STAFF',
          name: staffName,
          roleTitle,
          phone,
          monthlySalary: Number(monthlySalary),
        }),
      });
      if (res.ok) {
        setShowStaffModal(false);
        setStaffName('');
        setPhone('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;

    if (isMonthAlreadyPaid) {
      setPayError(`Salary for ${activeStaff.name} has already been paid for ${monthPaid}. Duplicate monthly disbursements are not allowed.`);
      return;
    }

    setSubmitting(true);
    setPayError('');

    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PAY_SALARY',
          staffId: activeStaff.id,
          monthPaid: monthPaid.trim(),
          baseSalary,
          workingDays,
          presentDays,
          absentDays,
          perDaySalary,
          earnedSalary,
          allowance,
          deduction,
          netSalary,
          paymentMethod,
          notes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowPayModal(false);
        setNotes('');
        setPayError('');
        loadData();
      } else {
        setPayError(data.error || 'Failed to process salary payment.');
      }
    } catch (err: any) {
      setPayError(err.message || 'An error occurred during payment processing.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayroll = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payroll voucher record?')) return;
    try {
      const res = await fetch(`/api/payroll?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete record.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <i className="fas fa-circle-notch fa-spin text-[#064E3B] text-3xl mb-3"></i>
        <p className="text-sm font-semibold">Loading Staff Management & Payroll...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 font-sans pb-12">
      {/* TOP TITLE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">FINANCE & HUMAN RESOURCES</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A25] tracking-tight">Staff Management & Payroll</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Automated working days, allowances, deductions, and salary disbursement calculations</p>
        </div>

        {/* TOGGLE BUTTONS */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#D4AF37]/30 shadow-xs">
          <button
            onClick={() => setViewMode('LEDGER')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              viewMode === 'LEDGER' ? 'bg-[#064E3B] text-[#F4D06F] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-receipt mr-1.5"></i> Payroll Ledger
          </button>
          <button
            onClick={() => setViewMode('PROFILES')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              viewMode === 'PROFILES' ? 'bg-[#064E3B] text-[#F4D06F] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-users-gear mr-1.5"></i> Staff Profiles
          </button>
        </div>
      </div>

      {/* FILTER & TOP ACTION STRIP */}
      <div className="bg-white p-4 rounded-3xl border border-[#D4AF37]/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-black text-[#064E3B] uppercase tracking-wider whitespace-nowrap">Select Staff Member:</label>
          <select
            value={selectedStaffId}
            onChange={(e) => {
              setSelectedStaffId(e.target.value);
              const found = staff.find((s) => s.id === e.target.value);
              if (found) setBaseSalary(found.monthlySalary || 15000);
            }}
            className="w-full sm:w-64 px-3.5 py-2 bg-[#FFF9EC] border border-[#D4AF37]/40 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-[#064E3B] cursor-pointer"
          >
            <option value="ALL">All Staff Members ({staff.length})</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.roleTitle})
              </option>
            ))}
          </select>
        </div>

        {!isViewer && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleOpenPayModal()}
              className="px-4 py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-money-bill-wave text-[#F4D06F]"></i> Record Payout
            </button>
            <button
              onClick={() => setShowStaffModal(true)}
              className="px-4 py-2.5 bg-white text-[#064E3B] border border-[#D4AF37] hover:bg-[#FFF9EC] font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fas fa-user-plus text-[#D4AF37]"></i> Add Staff
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: PAYROLL LEDGER */}
      {viewMode === 'LEDGER' && (
        <>
          {/* PROFILE SUMMARY BAR IF SINGLE STAFF SELECTED */}
          {selectedStaffId !== 'ALL' && activeStaff && (
            <div className="bg-white p-6 rounded-3xl border border-[#D4AF37]/30 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center font-black text-lg shadow-sm">
                    {activeStaff.name.slice(0, 3).toLowerCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">{activeStaff.name}</h2>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black rounded-md uppercase tracking-wider">
                        {activeStaff.roleTitle}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Base Monthly Salary: <strong className="text-[#064E3B]">₹{activeStaff.monthlySalary?.toLocaleString('en-IN')}</strong></p>
                  </div>
                </div>

                {!isViewer && (
                  <button
                    onClick={() => handleOpenPayModal(activeStaff)}
                    className="px-5 py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                  >
                    <i className="fas fa-plus text-[#F4D06F]"></i> Process Monthly Payout
                  </button>
                )}
              </div>

              {/* 4 SUMMARY STAT CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">ACTIVE TENURE</span>
                  <div className="text-xl font-black text-slate-900">{tenureMonths} Month(s)</div>
                </div>

                <div className="p-4 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">PAYROLLS ISSUED</span>
                  <div className="text-xl font-black text-[#064E3B]">{paidMonthsCount} Disbursed</div>
                </div>

                <div className="p-4 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">PENDING DISBURSEMENTS</span>
                  <div className="text-xl font-black text-amber-800">{pendingMonthsCount} Pending</div>
                </div>

                <div className="p-4 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">TOTAL SALARY PAID</span>
                  <div className="text-xl font-black text-[#064E3B]">₹{totalSalaryPaid.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE & PAYROLL LEDGER TABLE */}
          <div className="bg-white rounded-3xl border border-[#D4AF37]/30 shadow-sm overflow-hidden space-y-3 p-6">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Automated Payroll & Attendance Ledger</h3>
                <p className="text-xs text-slate-400">All calculated salary disbursements with per-day breakdowns, allowances, and deductions</p>
              </div>
              <span className="text-xs font-bold text-[#064E3B] bg-[#FFF9EC] px-3 py-1 rounded-full border border-[#D4AF37]/40">
                {staffPayrolls.length} Records
              </span>
            </div>

            {staffPayrolls.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-xs font-semibold">
                <i className="fas fa-file-invoice text-3xl mb-2 text-slate-300 block"></i>
                No payout records found for the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="masjid-table w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">STAFF & MONTH</th>
                      <th className="py-3 px-2 text-center">WORKING DAYS</th>
                      <th className="py-3 px-2 text-center text-emerald-700">PRESENT</th>
                      <th className="py-3 px-2 text-center text-rose-600">ABSENT</th>
                      <th className="py-3 px-3 text-right">PER-DAY</th>
                      <th className="py-3 px-3 text-right">EARNED SALARY</th>
                      <th className="py-3 px-3 text-right text-emerald-700">ALLOWANCE</th>
                      <th className="py-3 px-3 text-right text-rose-600">DEDUCTION</th>
                      <th className="py-3 px-3 text-right text-[#064E3B] font-black">NET SALARY</th>
                      <th className="py-3 px-3">DATE & MODE</th>
                      <th className="py-3 px-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffPayrolls.map((p) => {
                      const pWorking = p.workingDays ?? 30;
                      const pPresent = p.presentDays ?? pWorking;
                      const pAbsent = p.absentDays ?? Math.max(0, pWorking - pPresent);
                      const pBase = p.baseSalary ?? p.amount ?? 0;
                      const pPerDay = p.perDaySalary ?? (pWorking > 0 ? pBase / pWorking : 0);
                      const pEarned = p.earnedSalary ?? (pPerDay * pPresent);
                      const pAllow = p.allowance ?? 0;
                      const pDeduct = p.deduction ?? 0;
                      const pNet = p.netSalary ?? p.amount ?? (pEarned + pAllow - pDeduct);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-slate-900">{p.monthPaid}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{p.staffName}</div>
                          </td>

                          <td className="py-3 px-2 text-center font-bold text-slate-700 bg-slate-50/50">
                            {pWorking} Days
                          </td>

                          <td className="py-3 px-2 text-center font-black text-emerald-700 bg-emerald-50/40">
                            {pPresent}
                          </td>

                          <td className="py-3 px-2 text-center font-black text-rose-600 bg-rose-50/40">
                            {pAbsent}
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            ₹{pPerDay.toFixed(2)}
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-slate-800">
                            ₹{Math.round(pEarned).toLocaleString('en-IN')}
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-emerald-700">
                            {pAllow > 0 ? `+₹${pAllow.toLocaleString('en-IN')}` : '—'}
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-rose-600">
                            {pDeduct > 0 ? `-₹${pDeduct.toLocaleString('en-IN')}` : '—'}
                          </td>

                          <td className="py-3 px-3 text-right font-black text-[#064E3B] text-sm">
                            ₹{pNet.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3 px-3">
                            <div className="text-slate-600">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</div>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                              {p.paymentMethod}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedVoucher(p);
                                setShowVoucherModal(true);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#064E3B] border border-[#064E3B]/30 font-bold rounded-lg text-xs transition shadow-xs cursor-pointer inline-flex items-center"
                            >
                              <i className="fas fa-file-invoice mr-1"></i> Voucher
                            </button>

                            {!isViewer && (
                              <button
                                onClick={() => handleDeletePayroll(p.id)}
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition inline-flex items-center justify-center text-xs cursor-pointer"
                                title="Delete Payout Record"
                              >
                                <i className="fas fa-trash-can"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* STAFF PROFILES VIEW */}
      {viewMode === 'PROFILES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staff.map((s) => (
            <div key={s.id} className="masjid-card p-6 bg-white border border-[#D4AF37]/30 shadow-xs rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{s.name}</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-black rounded-md uppercase tracking-wider">
                    {s.roleTitle}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold">
                  <i className="fas fa-user-tie"></i>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Monthly Rate:</span>
                  <span className="font-extrabold text-[#064E3B]">₹{s.monthlySalary?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Contact Phone:</span>
                  <span className="font-mono text-slate-700">{s.phone || 'Not provided'}</span>
                </div>
              </div>

              {!isViewer && (
                <button
                  onClick={() => {
                    setSelectedStaffId(s.id);
                    handleOpenPayModal(s);
                  }}
                  className="w-full py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <i className="fas fa-money-bill-wave text-[#F4D06F]"></i> Record Payout
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* RECORD SALARY PAYMENT MODAL WITH STRICT DUPLICATE PREVENTION */}
      {showPayModal && activeStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-[#D4AF37]/30 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Record Salary Payment</h3>
                <p className="text-xs text-slate-500 font-medium">Recipient: <strong className="text-[#064E3B]">{activeStaff.name}</strong> ({activeStaff.roleTitle})</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            {/* DUPLICATE WARNING ALERT IF MONTH IS ALREADY PAID */}
            {isMonthAlreadyPaid && (
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs font-bold text-rose-900 flex items-start gap-2.5 shadow-xs">
                <i className="fas fa-circle-exclamation text-rose-600 text-base mt-0.5 shrink-0"></i>
                <div>
                  <span className="block font-black text-rose-950">Duplicate Salary Payment Blocked</span>
                  <span className="text-[11px] font-medium text-rose-800 leading-tight block mt-0.5">
                    Salary for <strong>{activeStaff.name}</strong> has already been disbursed for <strong>{monthPaid}</strong>. You cannot pay salary twice for the same month. Please select a different month.
                  </span>
                </div>
              </div>
            )}

            {payError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <i className="fas fa-triangle-exclamation text-rose-600"></i> {payError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Salary Month *</label>
                  <select
                    value={monthPaid}
                    onChange={(e) => {
                      setMonthPaid(e.target.value);
                      setPayError('');
                    }}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-extrabold text-slate-900 bg-[#FFF9EC] cursor-pointer"
                  >
                    {MONTH_OPTIONS.map((m) => {
                      const alreadyPaidThisMonth = payrolls.some(
                        (p) =>
                          p.staffId === activeStaff.id &&
                          ((p.monthPaid && p.monthPaid.trim().toLowerCase() === m.toLowerCase()) ||
                           (p.month && p.month.trim().toLowerCase() === m.toLowerCase()))
                      );

                      return (
                        <option key={m} value={m}>
                          {m} {alreadyPaidThisMonth ? '— (Already Paid ✓)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Base Monthly Salary (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-extrabold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* ATTENDANCE: WORKING DAYS, PRESENT DAYS, ABSENT DAYS */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Attendance & Working Days</span>
                  <span className="text-emerald-700 font-mono">Per Day Rate: ₹{perDaySalary.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Working Days</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="31"
                      value={workingDays}
                      onChange={(e) => {
                        const w = Number(e.target.value);
                        setWorkingDays(w);
                        if (presentDays > w) setPresentDays(w);
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800 text-center outline-none focus:border-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">Present Days</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={workingDays}
                      value={presentDays}
                      onChange={(e) => setPresentDays(Number(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-emerald-500 rounded-xl text-xs font-black text-emerald-800 text-center outline-none bg-emerald-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-700 mb-1">Absent Days</label>
                    <div className="w-full px-3 py-2 border border-rose-200 rounded-xl text-xs font-black text-rose-700 text-center bg-rose-50">
                      {absentDays}
                    </div>
                  </div>
                </div>
              </div>

              {/* ALLOWANCE & DEDUCTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">+ Allowance / Bonus (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={allowance}
                    onChange={(e) => setAllowance(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-700 font-bold text-emerald-800 bg-emerald-50/30"
                  />
                  <span className="text-[10px] text-slate-400">e.g. Overtime, Iftar bonus, travel</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-700 uppercase mb-1">- Deduction / Advance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={deduction}
                    onChange={(e) => setDeduction(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-rose-500 font-bold text-rose-700 bg-rose-50/30"
                  />
                  <span className="text-[10px] text-slate-400">e.g. Advance recovery, penalty</span>
                </div>
              </div>

              {/* REAL-TIME CALCULATION SUMMARY CARD */}
              <div className="p-4 bg-[#064E3B] text-white rounded-2xl shadow-inner space-y-2 border border-[#D4AF37]/40">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#F4D06F]">
                  Automated Calculation Breakdown
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs border-b border-emerald-800/80 pb-2">
                  <div>Earned Base: <strong className="text-[#FFF9EC]">₹{earnedSalary.toLocaleString('en-IN')}</strong> ({presentDays}/{workingDays} days)</div>
                  <div className="text-right">Allowances: <strong className="text-emerald-300">+₹{allowance.toLocaleString('en-IN')}</strong></div>
                  <div>Deductions: <strong className="text-rose-300">-₹{deduction.toLocaleString('en-IN')}</strong></div>
                  <div className="text-right">Rate/Day: <span className="font-mono text-xs">₹{perDaySalary.toFixed(2)}</span></div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-black uppercase tracking-wider text-[#F4D06F]">Final Net Salary:</span>
                  <span className="text-2xl font-black text-white">₹{netSalary.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* PAYMENT MODE & NOTES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-semibold bg-white cursor-pointer"
                  >
                    <option value="CASH">Cash Payment</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Remarks</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional reference..."
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isMonthAlreadyPaid}
                  className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Processing...
                    </>
                  ) : isMonthAlreadyPaid ? (
                    <>
                      <i className="fas fa-ban text-rose-300"></i> Already Paid for {monthPaid}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle text-[#F4D06F]"></i> Disburse Net ₹{netSalary.toLocaleString('en-IN')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#D4AF37]/30">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Add New Staff Member</h3>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Maulana Bilal Ahmed"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Designation / Role *</label>
                <select
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] bg-white cursor-pointer"
                >
                  <option value="Imam & Khateeb">Imam & Khateeb</option>
                  <option value="Second Imam">Second Imam</option>
                  <option value="Muazzin">Muazzin</option>
                  <option value="Madrasa Ustadh / Teacher">Madrasa Ustadh / Teacher</option>
                  <option value="Caretaker / Khadim">Caretaker / Khadim</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Cleaner / Maintenance">Cleaner / Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Salary Rate (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-extrabold text-[#064E3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9840123456"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#064E3B] hover:bg-[#102A25] text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALARY VOUCHER MODAL */}
      {showVoucherModal && selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-[#D4AF37]/40 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-1 border-b pb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#0F766E]">Official Payout Voucher</div>
              <h3 className="text-xl font-black text-slate-900">{selectedVoucher.staffName}</h3>
              <p className="text-xs text-slate-500 font-medium">Month: <strong className="text-[#064E3B]">{selectedVoucher.monthPaid}</strong> • Receipt: {selectedVoucher.receiptNo || 'PAY-OFFICIAL'}</p>
            </div>

            <div className="p-4 bg-[#FFF9EC] rounded-2xl border border-[#D4AF37]/30 space-y-2 text-xs text-slate-800">
              <div className="flex justify-between py-1 border-b border-[#e8dfc8]">
                <span className="text-slate-500 font-bold">Attendance:</span>
                <span className="font-extrabold text-slate-900">{selectedVoucher.presentDays ?? 30} Days Present / {selectedVoucher.workingDays ?? 30} Total</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e8dfc8]">
                <span className="text-slate-500 font-bold">Base Monthly Rate:</span>
                <span className="font-extrabold text-slate-900">₹{(selectedVoucher.baseSalary ?? selectedVoucher.amount ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e8dfc8]">
                <span className="text-slate-500 font-bold">Earned Salary:</span>
                <span className="font-extrabold text-slate-900">₹{(selectedVoucher.earnedSalary ?? selectedVoucher.amount ?? 0).toLocaleString('en-IN')}</span>
              </div>
              {selectedVoucher.allowance > 0 && (
                <div className="flex justify-between py-1 border-b border-[#e8dfc8] text-emerald-800">
                  <span className="font-bold">+ Allowance:</span>
                  <span className="font-extrabold">+₹{selectedVoucher.allowance.toLocaleString('en-IN')}</span>
                </div>
              )}
              {selectedVoucher.deduction > 0 && (
                <div className="flex justify-between py-1 border-b border-[#e8dfc8] text-rose-700">
                  <span className="font-bold">- Deductions:</span>
                  <span className="font-extrabold">-₹{selectedVoucher.deduction.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm">
                <span className="font-black text-slate-900">Net Salary Paid:</span>
                <span className="font-black text-[#064E3B] text-base">₹{(selectedVoucher.netSalary ?? selectedVoucher.amount ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 text-[11px] text-slate-500 border-t border-[#e8dfc8] pt-2">
                <span>Payment Mode: <strong>{selectedVoucher.paymentMethod}</strong></span>
                <span>Date: {new Date(selectedVoucher.paymentDate).toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowVoucherModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-extrabold rounded-xl text-xs transition cursor-pointer"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
