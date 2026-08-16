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

  // Staff Creation Form
  const [staffName, setStaffName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Muazzin');
  const [phone, setPhone] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('4000');

  // Pay Form
  const [payAmount, setPayAmount] = useState('4000');
  const [monthPaid, setMonthPaid] = useState('August 2026');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

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
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeStaff = staff.find((s) => s.id === selectedStaffId) || staff[0];
  const staffPayrolls = payrolls.filter((p) => p.staffId === activeStaff?.id);

  const totalSalaryPaid = staffPayrolls.reduce((sum, p) => sum + p.amount, 0);
  const paidMonthsCount = staffPayrolls.length;
  const tenureMonths = 1;
  const pendingMonthsCount = Math.max(0, tenureMonths - paidMonthsCount);

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
          amount: Number(payAmount || activeStaff.monthlySalary),
          monthPaid,
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
        <i className="fas fa-circle-notch fa-spin text-emerald-700 text-3xl mb-3"></i>
        <p className="text-sm font-semibold">Loading Staff Management & Payroll...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 font-sans">
      {/* TOP TITLE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">FINANCE</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Staff Management & Payroll</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Manage mosque staff members and record salary payouts</p>
        </div>

        {/* TOGGLE BUTTONS */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setViewMode('PROFILES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === 'PROFILES' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-user-group text-xs"></i> Staff Profiles
          </button>
          <button
            onClick={() => setViewMode('LEDGER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === 'LEDGER' ? 'bg-[#0F3D26] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-credit-card text-xs"></i> Payroll Ledger
          </button>
        </div>
      </div>

      {/* SELECT STAFF MEMBER DROPDOWN BAR */}
      <div className="masjid-card p-5 bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider shrink-0">SELECT STAFF MEMBER:</label>
        <select
          value={selectedStaffId}
          onChange={(e) => {
            setSelectedStaffId(e.target.value);
            const selected = staff.find((s) => s.id === e.target.value);
            if (selected) setPayAmount(String(selected.monthlySalary));
          }}
          className="w-full sm:w-80 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700"
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.roleTitle})
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowStaffModal(true)}
          className="ml-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-300"
        >
          <i className="fas fa-plus"></i> Add New Staff
        </button>
      </div>

      {activeStaff && (
        <>
          {/* SELECTED STAFF PROFILE CARD */}
          <div className="masjid-card p-6 bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-slate-900">{activeStaff.name}</h2>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md uppercase tracking-wider">
                    {activeStaff.roleTitle}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Monthly Salary Rate: <span className="font-extrabold text-slate-900">IN ₹{activeStaff.monthlySalary?.toLocaleString('en-IN')}</span>
                </p>
              </div>

              <button
                onClick={() => {
                  setPayAmount(String(activeStaff.monthlySalary));
                  setShowPayModal(true);
                }}
                className="px-5 py-3 bg-[#0F3D26] hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/20 transition flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> Record Salary Payment
              </button>
            </div>

            {/* 4 STAT METRICS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">TENURE MONTHS</span>
                <span className="text-2xl font-black text-slate-900 block mt-1">{tenureMonths}</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">PAID MONTHS</span>
                <span className="text-2xl font-black text-slate-900 block mt-1">{paidMonthsCount}</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest block">PENDING MONTHS</span>
                <span className="text-2xl font-black text-amber-900 block mt-1">{pendingMonthsCount}</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">TOTAL SALARY PAID</span>
                <span className="text-2xl font-black text-emerald-800 block mt-1">IN ₹{totalSalaryPaid.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* PAYMENT HISTORY TABLE */}
          <div className="masjid-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">Payment History</div>

            {staffPayrolls.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-xs font-semibold">
                No payout records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="masjid-table">
                  <thead>
                    <tr>
                      <th>MONTH</th>
                      <th>AMOUNT</th>
                      <th>DATE</th>
                      <th>MODE</th>
                      <th>TRANSACTION DETAILS</th>
                      <th className="text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffPayrolls.map((p) => (
                      <tr key={p.id}>
                        <td className="font-bold text-slate-900">{p.monthPaid}</td>
                        <td className="font-extrabold text-emerald-800 text-sm">IN ₹{p.amount?.toLocaleString('en-IN')}</td>
                        <td className="text-xs text-slate-500">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                        <td><span className="masjid-badge masjid-badge-info">{p.paymentMethod}</span></td>
                        <td className="text-xs text-slate-600">{p.receiptNo}</td>
                        <td className="text-right">
                          <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">
                            <i className="fas fa-file-invoice mr-1"></i> Voucher
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* RECORD SALARY PAYMENT MODAL */}
      {showPayModal && activeStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Record Salary Payment for {activeStaff.name}</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Salary Month</label>
                <select
                  value={monthPaid}
                  onChange={(e) => setMonthPaid(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-700 font-semibold"
                >
                  <option value="August 2026">August 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="October 2026">October 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-700 font-extrabold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-700 font-semibold"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#0F3D26] hover:bg-emerald-900 text-white rounded-xl text-xs font-extrabold shadow-md">
                  {submitting ? 'Saving...' : 'Confirm Salary Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Add New Staff Member</h3>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Ali Bhai"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role / Title *</label>
                <select
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-700 font-semibold"
                >
                  <option value="Muazzin">Muazzin</option>
                  <option value="Imam & Khateeb">Imam & Khateeb</option>
                  <option value="Cleaner / Caretaker">Cleaner / Caretaker</option>
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
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Salary Rate (₹) *</label>
                <input
                  type="number"
                  required
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  placeholder="4000"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-700 font-extrabold text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowStaffModal(false)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#0F3D26] text-white rounded-xl text-xs font-extrabold shadow-md">
                  {submitting ? 'Saving...' : 'Save Staff Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
