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
  const [submitting, setSubmitting] = useState(false);
  const [isViewer, setIsViewer] = useState(false);

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

  const handleOpenPayModal = (staffMember?: any) => {
    const target = staffMember || activeStaff;
    if (target) {
      setBaseSalary(target.monthlySalary || 15000);
      setWorkingDays(30);
      setPresentDays(30);
      setAllowance(0);
      setDeduction(0);
      setNotes('');
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
    setSubmitting(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PAY_SALARY',
          staffId: activeStaff.id,
          monthPaid,
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
      if (res.ok) {
        setShowPayModal(false);
        setNotes('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === 'LEDGER' ? 'bg-[#064E3B] text-[#FFF9EC] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-receipt text-xs text-[#F4D06F]"></i> Payroll Ledger
          </button>
          <button
            onClick={() => setViewMode('PROFILES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === 'PROFILES' ? 'bg-[#064E3B] text-[#FFF9EC] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-user-group text-xs text-[#F4D06F]"></i> Staff Profiles
          </button>
        </div>
      </div>

      {/* SELECT STAFF MEMBER DROPDOWN BAR */}
      <div className="masjid-card p-5 bg-white border border-[#D4AF37]/30 shadow-xs flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl">
        <label className="text-xs font-black text-[#064E3B] uppercase tracking-wider shrink-0">SELECT STAFF MEMBER:</label>
        <select
          value={selectedStaffId}
          onChange={(e) => {
            setSelectedStaffId(e.target.value);
            const selected = staff.find((s) => s.id === e.target.value);
            if (selected) setBaseSalary(selected.monthlySalary || 15000);
          }}
          className="w-full sm:w-80 px-4 py-2.5 bg-[#FFF9EC] border border-[#D4AF37]/40 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#064E3B]"
        >
          <option value="ALL">All Staff Members ({staff.length})</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.roleTitle}) — ₹{s.monthlySalary?.toLocaleString('en-IN')}/mo
            </option>
          ))}
        </select>

        {!isViewer && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => handleOpenPayModal()}
              className="px-4 py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <i className="fas fa-money-bill-wave text-[#F4D06F]"></i> Record Payout
            </button>
            <button
              onClick={() => setShowStaffModal(true)}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-300 shadow-xs"
            >
              <i className="fas fa-user-plus text-[#064E3B]"></i> Add Staff
            </button>
          </div>
        )}
      </div>

      {activeStaff && viewMode === 'LEDGER' && (
        <>
          {/* SELECTED STAFF PROFILE / KPI CARD */}
          <div className="masjid-card p-6 bg-white border border-[#D4AF37]/30 shadow-sm space-y-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-[#102A25]">{activeStaff.name}</h2>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md uppercase tracking-wider">
                    {activeStaff.roleTitle}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Base Monthly Salary: <span className="font-extrabold text-[#064E3B]">₹{activeStaff.monthlySalary?.toLocaleString('en-IN')}</span>
                  {activeStaff.phone && <span className="ml-3 text-slate-400">📞 {activeStaff.phone}</span>}
                </p>
              </div>

              {!isViewer && (
                <button
                  onClick={() => handleOpenPayModal(activeStaff)}
                  className="px-5 py-3 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                >
                  <i className="fas fa-plus text-[#F4D06F]"></i> Process Monthly Payout
                </button>
              )}
            </div>

            {/* 4 STAT METRICS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="bg-[#FFF9EC] p-3.5 rounded-xl border border-[#D4AF37]/20">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">ACTIVE TENURE</span>
                <span className="text-xl font-black text-slate-900 block mt-1">{tenureMonths} Month(s)</span>
              </div>

              <div className="bg-[#FFF9EC] p-3.5 rounded-xl border border-[#D4AF37]/20">
                <span className="text-[10px] font-extrabold text-[#0F766E] uppercase tracking-widest block">PAYROLLS ISSUED</span>
                <span className="text-xl font-black text-slate-900 block mt-1">{paidMonthsCount} Disbursed</span>
              </div>

              <div className="bg-[#FFF9EC] p-3.5 rounded-xl border border-[#D4AF37]/20">
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest block">PENDING DISBURSEMENTS</span>
                <span className="text-xl font-black text-amber-900 block mt-1">{pendingMonthsCount} Pending</span>
              </div>

              <div className="bg-[#FFF9EC] p-3.5 rounded-xl border border-[#D4AF37]/20">
                <span className="text-[10px] font-extrabold text-[#064E3B] uppercase tracking-widest block">TOTAL SALARY PAID</span>
                <span className="text-xl font-black text-[#064E3B] block mt-1">₹{totalSalaryPaid.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* COMPREHENSIVE PAYROLL LEDGER TABLE */}
          <div className="masjid-card overflow-hidden bg-white border border-[#D4AF37]/30 rounded-2xl shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Automated Payroll & Attendance Ledger</h3>
                <p className="text-[11px] text-slate-400">All calculated salary disbursements with per-day breakdowns, allowances, and deductions</p>
              </div>
              <span className="masjid-badge masjid-badge-success">{staffPayrolls.length} Records</span>
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

                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedVoucher(p);
                                setShowVoucherModal(true);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#064E3B] border border-[#064E3B]/30 font-bold rounded-lg text-xs transition shadow-xs"
                            >
                              <i className="fas fa-file-invoice mr-1"></i> Voucher
                            </button>
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
                  className="w-full py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <i className="fas fa-money-bill-wave text-[#F4D06F]"></i> Record Payout
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* RECORD SALARY PAYMENT MODAL WITH AUTOMATED CALCULATIONS */}
      {showPayModal && activeStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-[#D4AF37]/30 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Record Salary Payment</h3>
                <p className="text-xs text-slate-500 font-medium">Recipient: <strong className="text-[#064E3B]">{activeStaff.name}</strong> ({activeStaff.roleTitle})</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Salary Month *</label>
                  <input
                    type="text"
                    required
                    value={monthPaid}
                    onChange={(e) => setMonthPaid(e.target.value)}
                    placeholder="e.g. August 2026"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-bold text-slate-900 bg-[#FFF9EC]"
                  />
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
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-semibold bg-white"
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
                  className="px-4 py-2.5 bg-slate-100 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Processing...
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
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600">
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
                  placeholder="e.g. Moulana Abdul Kareem"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role / Title *</label>
                <select
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-semibold"
                >
                  <option value="Muazzin">Muazzin</option>
                  <option value="Imam & Khateeb">Imam & Khateeb</option>
                  <option value="Ustadh / Teacher">Ustadh / Teacher</option>
                  <option value="Cleaner / Caretaker">Cleaner / Caretaker</option>
                  <option value="Security Guard">Security Guard</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 12345"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Salary Rate (₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  placeholder="15000"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-extrabold text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowStaffModal(false)} className="px-4 py-2.5 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-extrabold shadow-md">
                  {submitting ? 'Saving...' : 'Save Staff Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALARY VOUCHER MODAL */}
      {showVoucherModal && selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-[#D4AF37]/30">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center font-bold">
                  <i className="fas fa-file-invoice"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Official Salary Voucher</h3>
                  <p className="text-[11px] font-mono text-slate-400">{selectedVoucher.receiptNo || 'PAY-VOUCHER'}</p>
                </div>
              </div>
              <button onClick={() => setShowVoucherModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="space-y-3 bg-[#FFF9EC] p-5 rounded-2xl border border-[#D4AF37]/30 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Staff Member:</span>
                <span className="font-black text-slate-900">{selectedVoucher.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Salary Month:</span>
                <span className="font-black text-slate-900">{selectedVoucher.monthPaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Attendance:</span>
                <span className="font-bold text-slate-800">
                  {selectedVoucher.presentDays ?? 30} Present / {selectedVoucher.workingDays ?? 30} Working ({selectedVoucher.absentDays ?? 0} Absent)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Earned Salary:</span>
                <span className="font-bold text-slate-900">₹{(selectedVoucher.earnedSalary ?? selectedVoucher.amount).toLocaleString('en-IN')}</span>
              </div>
              {selectedVoucher.allowance > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span className="font-bold">+ Allowance:</span>
                  <span className="font-black">+₹{selectedVoucher.allowance.toLocaleString('en-IN')}</span>
                </div>
              )}
              {selectedVoucher.deduction > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span className="font-bold">- Deduction:</span>
                  <span className="font-black">-₹{selectedVoucher.deduction.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-[#D4AF37]/30 pt-2 flex justify-between items-center">
                <span className="font-black text-slate-900 uppercase">Net Salary Disbursed:</span>
                <span className="text-lg font-black text-[#064E3B]">₹{(selectedVoucher.netSalary ?? selectedVoucher.amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                <span>Payment Mode: {selectedVoucher.paymentMethod}</span>
                <span>Date: {new Date(selectedVoucher.paymentDate).toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[#064E3B] text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2"
              >
                <i className="fas fa-print"></i> Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
