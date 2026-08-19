'use client';

import { useEffect, useState } from 'react';

export default function RentalsPage() {
  const [activeTab, setActiveTab] = useState<'UNITS' | 'COLLECTION' | 'FINANCIALS'>('UNITS');
  const [shops, setShops] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showEndTenancyModal, setShowEndTenancyModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [selectedShop, setSelectedShop] = useState<any>(null);

  // Form State - Add / Edit Property
  const [unitName, setUnitName] = useState('MANDINA MEDICAL');
  const [unitType, setUnitType] = useState('Shop');
  const [address, setAddress] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('5000');
  const [securityDeposit, setSecurityDeposit] = useState('25000');
  const [dueDay, setDueDay] = useState('5');
  const [tenancyStartDate, setTenancyStartDate] = useState('2026-08-19');
  const [unitStatus, setUnitStatus] = useState('Occupied');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Rent Revisions
  const [revisionMonth, setRevisionMonth] = useState('August 2026');
  const [revisionRent, setRevisionRent] = useState('');

  // Form State - Collect Rent
  const [payAmount, setPayAmount] = useState('5000');
  const [forMonth, setForMonth] = useState('August 2026');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  // Form State - End Tenancy Settlement
  const [settlementType, setSettlementType] = useState<'FULLY_RETURNED' | 'PARTIALLY_RETURNED' | 'ADJUSTED_DUES' | 'RETAINED'>('FULLY_RETURNED');
  const [returnAmount, setReturnAmount] = useState('25000');
  const [deductionAmount, setDeductionAmount] = useState('0');
  const [duesAmount, setDuesAmount] = useState('0');
  const [settlementNotes, setSettlementNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [isViewer, setIsViewer] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    fetch('/api/rentals')
      .then((res) => res.json())
      .then((data) => {
        setShops(data.shops || []);
        setPayments(data.payments || []);
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

  // OPEN EDIT PROPERTY MODAL (Matching screenshot)
  const handleOpenEdit = (shop: any) => {
    setSelectedShop(shop);
    setUnitName(shop.shopNo || '');
    setUnitType(shop.unitType || 'Shop');
    setAddress(shop.address || 'HGJHGH');
    setMonthlyRent(String(shop.monthlyRent || 5000));
    setSecurityDeposit(String(shop.securityDeposit || 25000));
    setDueDay(String(shop.dueDay || 5));
    setTenancyStartDate(shop.tenancyStartDate ? String(shop.tenancyStartDate).slice(0, 10) : '2026-08-19');
    setUnitStatus(shop.status === 'VACANT' ? 'Vacant' : 'Occupied');
    setTenantName(shop.tenantName?.replace(/^Vacant \(Former: (.*)\)$/, '$1') || '');
    setTenantPhone(shop.tenantPhone || '');
    setInternalNotes(shop.internalNotes || '');
    setRevisionRent('');
    setErrorMsg('');
    setStatusMsg('');
    setShowEditModal(true);
  };

  // SAVE PROPERTY (ADD OR EDIT)
  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const isEditing = Boolean(selectedShop);
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEditing ? 'EDIT_SHOP' : 'ADD_SHOP',
          shopId: selectedShop?.id,
          shopNo: unitName,
          unitType,
          address,
          monthlyRent: Number(monthlyRent),
          securityDeposit: Number(securityDeposit),
          dueDay: Number(dueDay),
          tenancyStartDate,
          status: unitStatus === 'Vacant' ? 'VACANT' : 'OCCUPIED',
          tenantName: unitStatus === 'Vacant' ? '' : tenantName,
          tenantPhone,
          internalNotes,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowEditModal(false);
        setShowAddModal(false);
        setSelectedShop(null);
        loadData();
      } else {
        setErrorMsg(data.error || 'Failed to save property details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // COLLECT RENT
  const handleCollectRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COLLECT_RENT',
          shopId: selectedShop.id,
          amount: Number(payAmount || selectedShop.monthlyRent),
          forMonth,
          paymentMethod,
        }),
      });

      if (res.ok) {
        setShowPayModal(false);
        setSelectedShop(null);
        loadData();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to record rent payment.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // RECORD ADVANCE / SECURITY DEPOSIT
  const handleRecordAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_ADVANCE',
          shopId: selectedShop.id,
          amount: Number(securityDeposit || 25000),
          paymentMethod,
        }),
      });

      if (res.ok) {
        setShowAdvanceModal(false);
        setSelectedShop(null);
        loadData();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to record advance deposit.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // OPEN END TENANCY SETTLEMENT MODAL
  const handleOpenEndTenancy = () => {
    const deposit = Number(securityDeposit) || 25000;
    setSettlementType('FULLY_RETURNED');
    setReturnAmount(String(deposit));
    setDeductionAmount('0');
    setDuesAmount('0');
    setSettlementNotes('');
    setShowEndTenancyModal(true);
  };

  // CONFIRM END TENANCY & SETTLE DEPOSIT
  const handleConfirmEndTenancy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'END_TENANCY',
          shopId: selectedShop.id,
          settlementType,
          securityDeposit: Number(securityDeposit || 25000),
          returnAmount: Number(returnAmount || 0),
          deductionAmount: Number(deductionAmount || 0),
          duesAmount: Number(duesAmount || 0),
          checkoutNotes: settlementNotes,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowEndTenancyModal(false);
        setShowEditModal(false);
        setSelectedShop(null);
        loadData();
      } else {
        setErrorMsg(data.error || 'Failed to finalize tenancy checkout.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE UNIT OR PAYMENT
  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Are you sure you want to remove this rental property?')) return;
    try {
      const res = await fetch(`/api/rentals?shopId=${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this transaction record?')) return;
    try {
      const res = await fetch(`/api/rentals?paymentId=${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // FORMAT TRANSACTIONS FOR FINANCIAL STATEMENT WITH RUNNING BALANCE
  const parseTransactions = () => {
    const sorted = [...payments].sort(
      (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
    );

    let runningAdvanceBalance = 0;

    return sorted.map((p) => {
      const isAdvanceReceived =
        p.forMonth?.toLowerCase().includes('advance received') ||
        p.forMonth?.toLowerCase().includes('security deposit') && !p.forMonth?.toLowerCase().includes('return');

      const isAdvanceReturned =
        p.forMonth?.toLowerCase().includes('advance returned') ||
        p.forMonth?.toLowerCase().includes('deposit return') ||
        p.forMonth?.toLowerCase().includes('refund');

      const isAdvanceAdjusted = p.forMonth?.toLowerCase().includes('adjusted');

      let transactionType = 'Rent Received';
      let reference = p.forMonth || 'Monthly Rent';
      let received: number | null = null;
      let returned: number | null = null;

      if (isAdvanceReceived) {
        transactionType = 'Advance Received';
        reference = 'Security Deposit';
        received = Number(p.amount || 0);
        runningAdvanceBalance += received;
      } else if (isAdvanceReturned) {
        transactionType = 'Advance Returned';
        reference = p.forMonth?.includes('Partial') ? p.forMonth : 'Security Deposit Return';
        returned = Number(p.amount || 0);
        runningAdvanceBalance = Math.max(0, runningAdvanceBalance - returned);
      } else if (isAdvanceAdjusted) {
        transactionType = 'Advance Adjusted';
        reference = 'Adjusted Against Rent Dues';
        returned = Number(p.amount || 0);
        runningAdvanceBalance = Math.max(0, runningAdvanceBalance - returned);
      } else {
        transactionType = 'Rent Received';
        reference = p.forMonth?.replace(/^Rent • /, '') || 'Monthly Rent Payout';
        received = Number(p.amount || 0);
      }

      return {
        ...p,
        transactionType,
        reference,
        received,
        returned,
        runningBalance: runningAdvanceBalance,
      };
    }).reverse(); // Most recent first
  };

  const parsedLedger = parseTransactions();

  // Summary Metrics
  const totalAdvanceReceived = parsedLedger
    .filter((t) => t.transactionType === 'Advance Received')
    .reduce((sum, t) => sum + (t.received || 0), 0);

  const totalAdvanceReturned = parsedLedger
    .filter((t) => t.transactionType === 'Advance Returned' || t.transactionType === 'Advance Adjusted')
    .reduce((sum, t) => sum + (t.returned || 0), 0);

  const totalRentCollected = parsedLedger
    .filter((t) => t.transactionType === 'Rent Received')
    .reduce((sum, t) => sum + (t.received || 0), 0);

  const netAdvanceLiabilityHeld = Math.max(0, totalAdvanceReceived - totalAdvanceReturned);

  const filteredShops = shops.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.shopNo?.toLowerCase().includes(q) ||
      s.tenantName?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q) ||
      s.tenantPhone?.includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 font-sans pb-12">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">
            FINANCE & HUMAN RESOURCES
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Rental Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Manage mosque-owned rental units, tenants, and track monthly rent collection.
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={() => {
              setSelectedShop(null);
              setUnitName('');
              setUnitType('Shop');
              setAddress('');
              setMonthlyRent('5000');
              setSecurityDeposit('25000');
              setDueDay('5');
              setTenancyStartDate('2026-08-19');
              setUnitStatus('Occupied');
              setTenantName('');
              setTenantPhone('');
              setInternalNotes('');
              setErrorMsg('');
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-sm transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <i className="fas fa-store text-[#F4D06F]"></i> Register Rental Unit
          </button>
        )}
      </div>

      {/* 2. THREE TOP NAVIGATION TABS (MATCHING USER SCREENSHOT) */}
      <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs max-w-md">
        <button
          onClick={() => setActiveTab('UNITS')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer text-center ${
            activeTab === 'UNITS' ? 'bg-[#0F3D26] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Rental Units
        </button>

        <button
          onClick={() => setActiveTab('COLLECTION')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer text-center ${
            activeTab === 'COLLECTION' ? 'bg-[#0F3D26] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Rent Collection
        </button>

        <button
          onClick={() => setActiveTab('FINANCIALS')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer text-center ${
            activeTab === 'FINANCIALS' ? 'bg-[#0F3D26] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Financials
        </button>
      </div>

      {/* SEARCH BAR (FOR RENTAL UNITS TAB) */}
      {activeTab === 'UNITS' && (
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by property, tenant, address..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:border-emerald-700 shadow-xs"
          />
        </div>
      )}

      {/* TAB 1: RENTAL UNITS CARDS VIEW (MATCHING USER SCREENSHOT EXACTLY) */}
      {activeTab === 'UNITS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              <i className="fas fa-circle-notch fa-spin text-emerald-700 text-2xl mb-2"></i>
              <p>Loading rental properties...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold bg-white rounded-3xl border border-slate-200">
              No rental properties found matching your search.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredShops.map((s) => {
                const isOccupied = s.status !== 'VACANT';
                const tenantInitials = s.tenantName ? s.tenantName.slice(0, 2).toUpperCase() : 'VA';
                const depositHeld = Number(s.securityDeposit || 25000);
                const advanceBalance = isOccupied ? depositHeld : 0;

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5 hover:border-emerald-300 transition"
                  >
                    {/* TOP HEADER: AVATAR, TITLE, OCCUPIED BADGE */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center font-black text-sm uppercase shrink-0">
                          {tenantInitials}
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                            {s.shopNo}
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            {s.address || 'HGJHGH'} • <span className="text-emerald-800 font-bold">{s.unitType || 'Shop'}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border ${
                          isOccupied
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isOccupied ? 'Occupied' : 'Vacant'}
                      </span>
                    </div>

                    {/* METRICS ROW (MATCHING USER SCREENSHOT) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-slate-400 font-bold block text-[11px]">Monthly Rent</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          IN ₹ {Number(s.monthlyRent || 5000).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold block text-[11px]">Security Deposit</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          IN ₹ {depositHeld.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold block text-[11px]">Due Date</span>
                        <span className="font-extrabold text-slate-900 text-sm">Day {s.dueDay || 5}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold block text-[11px]">Tenant</span>
                        <span className="font-extrabold text-slate-900 text-sm">{s.tenantName || 'N/A'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold block text-[11px]">Phone</span>
                        <span className="font-mono text-slate-800 text-sm font-semibold">{s.tenantPhone || 'N/A'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold block text-[11px]">Advance Balance</span>
                        <span className="font-extrabold text-emerald-800 text-sm">
                          IN ₹ {advanceBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* ACTION BUTTONS (MATCHING USER SCREENSHOT) */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSelectedShop(s);
                          setActiveTab('FINANCIALS');
                        }}
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="fas fa-file-invoice text-emerald-800"></i> View Statement
                      </button>

                      {!isViewer && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedShop(s);
                              setPayAmount(String(s.monthlyRent || 5000));
                              setShowPayModal(true);
                            }}
                            className="px-4 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <i className="fas fa-hand-holding-dollar text-[#F4D06F]"></i> Collect Rent
                          </button>

                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xs transition cursor-pointer"
                            title="Edit Unit Details"
                          >
                            <i className="fas fa-pen-to-square"></i>
                          </button>

                          <button
                            onClick={() => handleDeleteUnit(s.id)}
                            className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center text-xs transition cursor-pointer"
                            title="Delete Property"
                          >
                            <i className="fas fa-trash-can"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RENT COLLECTION ROSTER */}
      {activeTab === 'COLLECTION' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Rent Collection Register</h3>
              <p className="text-xs text-slate-400">Monthly commercial tenant payout collections and receipts</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {shops.length} Units Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Property Unit</th>
                  <th className="py-3 px-4">Tenant Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Monthly Rate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shops.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.shopNo}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{s.tenantName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{s.tenantPhone || '—'}</td>
                    <td className="py-3 px-4 font-extrabold text-emerald-800">
                      IN ₹ {Number(s.monthlyRent || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold">
                        {s.status || 'OCCUPIED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {!isViewer && (
                        <button
                          onClick={() => {
                            setSelectedShop(s);
                            setPayAmount(String(s.monthlyRent || 5000));
                            setShowPayModal(true);
                          }}
                          className="px-3 py-1.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-lg text-xs transition cursor-pointer"
                        >
                          Collect Rent
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCIALS / FINANCE STATEMENT (EXACT USER FORMAT) */}
      {activeTab === 'FINANCIALS' && (
        <div className="space-y-6">
          {/* KPI SUMMARY CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">
                Total Advance Held
              </span>
              <div className="text-xl font-black text-slate-900">
                ₹{netAdvanceLiabilityHeld.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">Security deposit liability</span>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">
                Total Advance Received
              </span>
              <div className="text-xl font-black text-emerald-800">
                ₹{totalAdvanceReceived.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">Lifetime security deposits</span>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">
                Total Advance Returned
              </span>
              <div className="text-xl font-black text-rose-600">
                ₹{totalAdvanceReturned.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">Settled / refunded deposits</span>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">
                Total Rent Collected
              </span>
              <div className="text-xl font-black text-[#0F3D26]">
                ₹{totalRentCollected.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">Operational revenue</span>
            </div>
          </div>

          {/* FINANCE STATEMENT TABLE (MATCHING USER SPECIFICATION) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Rental Finance Statement & Ledger</h3>
                <p className="text-xs text-slate-400">
                  Detailed breakdown of Advances Received, Advances Returned, Rent Collections, and Security Balances
                </p>
              </div>
              <span className="text-xs font-bold text-[#0F3D26] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {parsedLedger.length} Transactions
              </span>
            </div>

            {parsedLedger.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-xs font-semibold">
                <i className="fas fa-file-invoice-dollar text-3xl mb-2 text-slate-300 block"></i>
                No rental transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-y border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Date</th>
                      <th className="py-3 px-4 whitespace-nowrap">Transaction</th>
                      <th className="py-3 px-4 whitespace-nowrap">Property & Tenant</th>
                      <th className="py-3 px-4 whitespace-nowrap">Reference</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap text-emerald-800">Received</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap text-rose-600">Returned</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap font-black">Balance</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedLedger.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700">
                          {new Date(t.paymentDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                              t.transactionType === 'Advance Received'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : t.transactionType === 'Advance Returned'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : t.transactionType === 'Advance Adjusted'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {t.transactionType}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 block text-xs">{t.shopNo}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{t.tenantName}</span>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-700 text-xs">{t.reference}</td>

                        <td className="py-3 px-4 text-right font-extrabold text-emerald-800 whitespace-nowrap text-xs">
                          {t.received !== null ? `₹${t.received.toLocaleString('en-IN')}` : '—'}
                        </td>

                        <td className="py-3 px-4 text-right font-extrabold text-rose-600 whitespace-nowrap text-xs">
                          {t.returned !== null ? `₹${t.returned.toLocaleString('en-IN')}` : '—'}
                        </td>

                        <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap text-xs">
                          ₹{t.runningBalance.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedVoucher(t);
                              setShowVoucherModal(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg text-[11px] transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <i className="fas fa-receipt text-emerald-800 text-[10px]"></i> Voucher
                          </button>

                          {!isViewer && (
                            <button
                              onClick={() => handleDeletePayment(t.id)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition inline-flex items-center justify-center text-xs cursor-pointer"
                              title="Delete Transaction"
                            >
                              <i className="fas fa-trash-can"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. EDIT RENTAL UNIT DETAILS MODAL (MATCHING SCREENSHOT EXACTLY) */}
      {(showEditModal || showAddModal) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-200 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {selectedShop ? 'Edit Rental Unit Details' : 'Register New Rental Unit'}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setShowAddModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <i className="fas fa-circle-exclamation text-rose-600"></i> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProperty} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    RENTAL UNIT NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="MANDINA MEDICAL"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    RENTAL UNIT TYPE *
                  </label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white cursor-pointer"
                  >
                    <option value="Shop">Shop</option>
                    <option value="Commercial Complex">Commercial Complex</option>
                    <option value="Marriage / Community Hall">Marriage / Community Hall</option>
                    <option value="Residential House / Flat">Residential House / Flat</option>
                    <option value="Office Space">Office Space</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    ADDRESS
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="HGJHGH"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    MONTHLY RENT (IN ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-emerald-800 outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    SECURITY DEPOSIT (IN ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    RENT DUE DAY OF MONTH (1-28)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    TENANCY START DATE *
                  </label>
                  <input
                    type="date"
                    required
                    value={tenancyStartDate}
                    onChange={(e) => setTenancyStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    RENTAL UNIT STATUS *
                  </label>
                  <select
                    value={unitStatus}
                    onChange={(e) => setUnitStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white cursor-pointer"
                  >
                    <option value="Occupied">Occupied</option>
                    <option value="Vacant">Vacant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    TENANT NAME
                  </label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="KAKA"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    TENANT PHONE (FOR WHATSAPP)
                  </label>
                  <input
                    type="tel"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="9894977003"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              {/* END CURRENT TENANCY SECTION (MATCHING USER SCREENSHOT) */}
              {selectedShop && unitStatus === 'Occupied' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider block">
                      END CURRENT TENANCY
                    </span>
                    <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                      Close this lease, calculate outstanding dues/security deposits, and archive tenant history.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenEndTenancy}
                    className="px-4 py-2 bg-[#B45309] hover:bg-amber-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition whitespace-nowrap cursor-pointer"
                  >
                    Close Tenancy & Checkout
                  </button>
                </div>
              )}

              {/* INTERNAL NOTES */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  INTERNAL NOTES
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Add property details, lease terms..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-700 focus:bg-white"
                />
              </div>

              {/* TENANT PHOTOS & DOCUMENTS UPLOAD PLACEHOLDERS (MATCHING SCREENSHOT) */}
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase block">
                      TENANT PHOTOS <span className="text-slate-400 font-normal">(optional, multiple)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Upload photos of tenant with zoom support</span>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-[#0F3D26] text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5"
                  >
                    <i className="fas fa-camera text-[10px]"></i> Add Photos
                  </button>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase block">
                      TENANT ID CARDS / DOCUMENTS <span className="text-slate-400 font-normal">(optional)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Upload ID proof (Aadhaar, Passport, Driving License)</span>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-[#0F3D26] text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5"
                  >
                    <i className="fas fa-id-card text-[10px]"></i> Add ID Cards
                  </button>
                </div>
              </div>

              {/* RENT REVISIONS & RATE UPDATES SECTION (MATCHING SCREENSHOT) */}
              <div className="pt-2">
                <span className="text-xs font-black text-slate-900 block mb-2">Rent Revisions & Rate Updates</span>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Effective Month</label>
                      <input
                        type="text"
                        value={revisionMonth}
                        onChange={(e) => setRevisionMonth(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">New Rent (IN ₹)</label>
                      <input
                        type="number"
                        value={revisionRent}
                        onChange={(e) => {
                          setRevisionRent(e.target.value);
                          if (e.target.value) setMonthlyRent(e.target.value);
                        }}
                        placeholder="e.g. 5500"
                        className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-emerald-800 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. END TENANCY & ADVANCE RETURN SETTLEMENT MODAL (REQUESTED SPECIFICALLY) */}
      {showEndTenancyModal && selectedShop && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">End Tenancy & Settle Advance Deposit</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Property: <strong className="text-emerald-800">{selectedShop.shopNo}</strong> • Tenant: {selectedShop.tenantName}
                </p>
              </div>
              <button onClick={() => setShowEndTenancyModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-emerald-900 font-bold">Total Security Deposit Held:</span>
              <span className="text-base font-black text-emerald-900">
                ₹{Number(securityDeposit || 25000).toLocaleString('en-IN')}
              </span>
            </div>

            <form onSubmit={handleConfirmEndTenancy} className="space-y-4">
              <div className="space-y-2.5">
                <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Select Security Deposit / Advance Action:
                </label>

                {/* OPTION 1: FULLY RETURNED */}
                <label
                  onClick={() => {
                    setSettlementType('FULLY_RETURNED');
                    setReturnAmount(String(securityDeposit || 25000));
                    setDeductionAmount('0');
                    setDuesAmount('0');
                  }}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                    settlementType === 'FULLY_RETURNED'
                      ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="settlement"
                    checked={settlementType === 'FULLY_RETURNED'}
                    onChange={() => {}}
                    className="mt-1 accent-emerald-700"
                  />
                  <div>
                    <span className="font-extrabold text-xs block">Fully Returned (100% Refund)</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Return the full deposit of ₹{Number(securityDeposit || 25000).toLocaleString('en-IN')} back to the tenant.
                    </span>
                  </div>
                </label>

                {/* OPTION 2: PARTIALLY RETURNED */}
                <label
                  onClick={() => {
                    setSettlementType('PARTIALLY_RETURNED');
                    setReturnAmount(String(Math.max(0, Number(securityDeposit || 25000) - 5000)));
                    setDeductionAmount('5000');
                  }}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                    settlementType === 'PARTIALLY_RETURNED'
                      ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="settlement"
                    checked={settlementType === 'PARTIALLY_RETURNED'}
                    onChange={() => {}}
                    className="mt-1 accent-emerald-700"
                  />
                  <div className="w-full">
                    <span className="font-extrabold text-xs block">Partially Returned</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Deduct damages/maintenance expenses and refund the remaining advance.
                    </span>

                    {settlementType === 'PARTIALLY_RETURNED' && (
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div>
                          <label className="text-[10px] font-bold text-rose-700 block">Deduction (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={deductionAmount}
                            onChange={(e) => {
                              const d = Number(e.target.value);
                              setDeductionAmount(e.target.value);
                              setReturnAmount(String(Math.max(0, Number(securityDeposit || 25000) - d)));
                            }}
                            className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold text-rose-700 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-emerald-800 block">Refund Amount (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={returnAmount}
                            onChange={(e) => setReturnAmount(e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg text-xs font-black text-emerald-800 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* OPTION 3: ADJUSTED AGAINST DUES */}
                <label
                  onClick={() => {
                    setSettlementType('ADJUSTED_DUES');
                    setDuesAmount(String(monthlyRent || 5000));
                    setReturnAmount(String(Math.max(0, Number(securityDeposit || 25000) - Number(monthlyRent || 5000))));
                  }}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                    settlementType === 'ADJUSTED_DUES'
                      ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="settlement"
                    checked={settlementType === 'ADJUSTED_DUES'}
                    onChange={() => {}}
                    className="mt-1 accent-emerald-700"
                  />
                  <div className="w-full">
                    <span className="font-extrabold text-xs block">Adjusted Against Dues</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Offset unpaid monthly rent dues directly from the security deposit.
                    </span>

                    {settlementType === 'ADJUSTED_DUES' && (
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div>
                          <label className="text-[10px] font-bold text-amber-800 block">Rent Dues Offset (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={duesAmount}
                            onChange={(e) => {
                              const dues = Number(e.target.value);
                              setDuesAmount(e.target.value);
                              setReturnAmount(String(Math.max(0, Number(securityDeposit || 25000) - dues)));
                            }}
                            className="w-full px-3 py-1.5 border rounded-lg text-xs font-bold text-amber-800 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-emerald-800 block">Remaining Refund (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={returnAmount}
                            onChange={(e) => setReturnAmount(e.target.value)}
                            className="w-full px-3 py-1.5 border rounded-lg text-xs font-black text-emerald-800 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                {/* OPTION 4: RETAINED */}
                <label
                  onClick={() => {
                    setSettlementType('RETAINED');
                    setReturnAmount('0');
                  }}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition ${
                    settlementType === 'RETAINED'
                      ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="settlement"
                    checked={settlementType === 'RETAINED'}
                    onChange={() => {}}
                    className="mt-1 accent-emerald-700"
                  />
                  <div>
                    <span className="font-extrabold text-xs block">Retained by Mosque</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Full security deposit forfeited/retained for major repairs or breach of lease.
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Method for Refund</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Checkout Remarks</label>
                <input
                  type="text"
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  placeholder="e.g. Keys handed over, shop painted..."
                  className="w-full px-3.5 py-2 border rounded-xl text-xs bg-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEndTenancyModal(false)}
                  className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Recording Settlement...' : 'Confirm & Record in Financials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. COLLECT RENT MODAL */}
      {showPayModal && selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Collect Monthly Rent</h3>
                <p className="text-xs text-slate-500 font-medium">Unit: {selectedShop.shopNo} ({selectedShop.tenantName})</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCollectRent} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Rent for Month *</label>
                <input
                  type="text"
                  required
                  value={forMonth}
                  onChange={(e) => setForMonth(e.target.value)}
                  placeholder="e.g. August 2026"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-black text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Recording...' : `Collect ₹${Number(payAmount || 0).toLocaleString('en-IN')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. VOUCHER MODAL */}
      {showVoucherModal && selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-1 border-b pb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                Masjid Rental Transaction Voucher
              </div>
              <h3 className="text-lg font-black text-slate-900">{selectedVoucher.shopNo}</h3>
              <p className="text-xs text-slate-500 font-medium">Tenant: {selectedVoucher.tenantName}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Transaction Type:</span>
                <span className="font-extrabold text-slate-900">{selectedVoucher.transactionType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Reference:</span>
                <span className="font-extrabold text-slate-900">{selectedVoucher.reference}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Receipt / Voucher No:</span>
                <span className="font-mono font-bold text-slate-800">{selectedVoucher.receiptNo || 'RNT-OFFICIAL'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-bold">Payment Method:</span>
                <span className="font-bold text-slate-800">{selectedVoucher.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="font-black text-slate-900">
                  {selectedVoucher.returned !== null ? 'Amount Returned:' : 'Amount Received:'}
                </span>
                <span className={`font-black text-base ${selectedVoucher.returned !== null ? 'text-rose-600' : 'text-emerald-800'}`}>
                  ₹{Number(selectedVoucher.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                <span>Running Advance Balance:</span>
                <span className="font-bold text-slate-900">₹{selectedVoucher.runningBalance?.toLocaleString('en-IN') || 0}</span>
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
