'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  extractPaidMonths,
  getAllPaidMonthsForMember,
  getPendingMonthsUpToCurrent,
  MONTH_NAMES,
  generateMonthList,
} from '@/lib/memberMonths';

export default function AllCollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [masjidName, setMasjidName] = useState('Newtown Masjid');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [selectedYear, setSelectedYear] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Form State for Recording New Collection
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberAddress, setMemberAddress] = useState('');
  const [amount, setAmount] = useState('100');
  const [paymentType, setPaymentType] = useState('MONTHLY');
  const [forMonths, setForMonths] = useState('August 2026');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // BULK & SEVERAL MONTHS PENDING STATE
  const [baseMonthlyRate, setBaseMonthlyRate] = useState<number>(100);
  const [selectedMonthsList, setSelectedMonthsList] = useState<string[]>(['August 2026']);
  const [pendingMonthsDetected, setPendingMonthsDetected] = useState<string[]>([]);
  const [bulkPresetCount, setBulkPresetCount] = useState<number | null>(1);
  const [showMonthGrid, setShowMonthGrid] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editForMonths, setEditForMonths] = useState('');
  const [editMethod, setEditMethod] = useState('');

  // Delete Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isViewer, setIsViewer] = useState(false);

  const CURRENT_YEAR = new Date().getFullYear();
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const AVAILABLE_MONTHS = [
    ...MONTH_NAMES.map((m) => `${m} ${CURRENT_YEAR}`),
    ...MONTH_NAMES.slice(0, 6).map((m) => `${m} ${CURRENT_YEAR + 1}`),
  ];

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/member-collections').then((res) => res.json()),
      fetch('/api/members').then((res) => res.json()),
    ])
      .then(([colData, mbrData]) => {
        setCollections(colData.collections || []);
        if (colData.masjidName) setMasjidName(colData.masjidName);
        setMembers(mbrData.members || []);
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

  // AUTO-DETECT PENDING MONTHS FOR A MEMBER
  const detectPendingMonths = (member: any, allCols: any[]) => {
    const memberMonthlyRate = Number(member.monthlyAmount || 100);
    setBaseMonthlyRate(memberMonthlyRate);

    // Filter collections belonging to this member
    const memberCols = allCols.filter((c) => {
      const phoneMatch = member.phone && c.memberPhone && c.memberPhone.replace(/[^0-9]/g, '') === member.phone.replace(/[^0-9]/g, '');
      const nameMatch = member.name && c.memberName?.toLowerCase().trim() === member.name?.toLowerCase().trim();
      const idMatch = c.memberId && c.memberId === member.id;
      return idMatch || phoneMatch || nameMatch;
    });

    const { pendingMonths, isFullyPaid, currentMonthStr } = getPendingMonthsUpToCurrent(member, memberCols);
    setPendingMonthsDetected(pendingMonths);

    if (pendingMonths.length > 0) {
      setSelectedMonthsList(pendingMonths);
      setAmount(String(pendingMonths.length * memberMonthlyRate));
      setForMonths(
        pendingMonths.length === 1
          ? pendingMonths[0]
          : `${pendingMonths.join(', ')} (${pendingMonths.length} Months Pending)`
      );
      setBulkPresetCount(pendingMonths.length);
    } else {
      setSelectedMonthsList([]);
      setAmount('0');
      setForMonths('');
      setBulkPresetCount(null);
    }
  };

  const handleToggleMonthSelection = (mStr: string) => {
    let updated: string[];
    if (selectedMonthsList.includes(mStr)) {
      updated = selectedMonthsList.filter((x) => x !== mStr);
    } else {
      updated = [...selectedMonthsList, mStr];
    }
    // Filter to only allowed pending months
    updated = updated.filter((m) => pendingMonthsDetected.includes(m));
    updated.sort((a, b) => pendingMonthsDetected.indexOf(a) - pendingMonthsDetected.indexOf(b));
    setSelectedMonthsList(updated);

    const count = updated.length;
    const rate = baseMonthlyRate || 100;
    const newAmt = count * rate;
    setAmount(String(newAmt));

    if (count === 0) {
      setForMonths('');
      setBulkPresetCount(null);
    } else if (count === 1) {
      setForMonths(updated[0]);
      setBulkPresetCount(1);
    } else {
      setForMonths(`${updated.join(', ')} (${count} Months Pending)`);
      setBulkPresetCount(count);
    }
  };

  const handleApplyPresetCount = (count: number) => {
    if (pendingMonthsDetected.length === 0) return;
    const cappedCount = Math.min(count, pendingMonthsDetected.length);
    setBulkPresetCount(cappedCount);
    const newMonths = pendingMonthsDetected.slice(0, cappedCount);

    setSelectedMonthsList(newMonths);
    const rate = baseMonthlyRate || 100;
    const newAmt = cappedCount * rate;
    setAmount(String(newAmt));

    if (cappedCount === 1) {
      setForMonths(newMonths[0]);
    } else {
      setForMonths(`${newMonths.join(', ')} (${cappedCount} Months Pending)`);
    }
  };

  const handleClearAllPending = () => {
    if (pendingMonthsDetected.length === 0) return;
    setSelectedMonthsList(pendingMonthsDetected);
    const count = pendingMonthsDetected.length;
    const rate = baseMonthlyRate || 100;
    const newAmt = count * rate;
    setAmount(String(newAmt));
    setForMonths(
      count === 1 ? pendingMonthsDetected[0] : `${pendingMonthsDetected.join(', ')} (${count} Months Pending Cleared)`
    );
    setBulkPresetCount(count);
  };

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mId = e.target.value;
    setSelectedMemberId(mId);
    if (!mId) return;

    const member = members.find((m) => m.id === mId);
    if (member) {
      setMemberName(member.name);
      setMemberPhone(member.phone);
      setMemberAddress(member.address || '');
      detectPendingMonths(member, collections);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName || !memberPhone || !amount) {
      setErrorMsg('Name, Phone, and Amount are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = await fetch('/api/member-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId || undefined,
          memberName,
          memberPhone,
          memberAddress,
          amount: Number(amount),
          monthsCount: selectedMonthsList.length || 1,
          paymentType: selectedMonthsList.length > 1 ? 'BULK' : paymentType,
          forMonths,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg(`Collection recorded for ${memberName} (IN ₹${Number(amount).toLocaleString('en-IN')})!`);
        setShowAddModal(false);
        setMemberName('');
        setMemberPhone('');
        setMemberAddress('');
        setSelectedMonthsList(['August 2026']);
        setPendingMonthsDetected([]);
        loadData();
        if (data.whatsappUrl) {
          window.open(data.whatsappUrl, '_blank');
        }
      } else {
        setErrorMsg(data.error || 'Failed to record collection.');
      }
    } catch (err) {
      setErrorMsg('An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  // EDIT ACTION
  const handleStartEdit = (col: any) => {
    setEditingItem(col);
    setEditName(col.memberName);
    setEditPhone(col.memberPhone);
    setEditAmount(String(col.amount));
    setEditForMonths(col.forMonths || '');
    setEditMethod(col.paymentMethod || 'CASH');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/member-collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          memberName: editName,
          memberPhone: editPhone,
          amount: Number(editAmount),
          forMonths: editForMonths,
          paymentMethod: editMethod,
        }),
      });

      if (res.ok) {
        setStatusMsg('Collection record updated successfully!');
        setEditingItem(null);
        loadData();
      }
    } catch (err) {
      setErrorMsg('Failed to update collection.');
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE ACTION
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/member-collections?id=${deletingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStatusMsg('Collection record deleted successfully!');
        setDeletingId(null);
        loadData();
      }
    } catch (err) {
      setErrorMsg('Failed to delete record.');
    }
  };

  // DOWNLOAD INSTANT PRINTABLE PDF RECEIPT ACTION FOR INDIVIDUAL MEMBER
  const handleDownloadPDF = (col: any) => {
    window.open(
      `/dashboard/receipts/print?id=${col.id}&type=collection&name=${encodeURIComponent(col.memberName)}&phone=${encodeURIComponent(
        col.memberPhone
      )}&amount=${col.amount}&period=${encodeURIComponent(col.forMonths || 'August 2026')}&autoPrint=true`,
      '_blank'
    );
  };

  // WHATSAPP ACTION (Matches exact user submitted WhatsApp format)
  const handleWhatsAppShare = (col: any) => {
    const text = `━━━━━━━━━━━━━━━━━━━━━
🕌 *${masjidName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━━

📝 *PAYMENT STATUS*

Assalamu Alaikum ${col.memberName},

*Your Details:*
Name: ${col.memberName}
Phone: ${col.memberPhone}
Joining Date: ${new Date(col.paymentDate).toLocaleDateString('en-IN')}
Monthly Amount: IN ₹ ${col.amount}

*Status:* ✅ Fully Paid
You have no pending payments. JazakAllah Khair for your contributions!

━━━━━━━━━━━━━━━━━━━━━
May Allah accept your donations.

JazakAllah Khair!
━━━━━━━━━━━━━━━━━━━━━`;

    const encoded = encodeURIComponent(text);
    const cleanPhone = col.memberPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, '_blank');
  };

  // Autocomplete state
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [modalMemberSearch, setModalMemberSearch] = useState('');
  const [showModalSuggestions, setShowModalSuggestions] = useState(false);

  // Suggestions filtered for the main search box
  const searchSuggestions = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.memberNo?.toLowerCase().includes(q) ||
      m.address?.toLowerCase().includes(q)
    );
  }).slice(0, 30);

  // Suggestions for modal search - comprehensive search by name, phone, memberNo, address
  const modalSuggestions = members.filter((m) => {
    if (!modalMemberSearch) return true;
    const q = modalMemberSearch.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.memberNo?.toLowerCase().includes(q) ||
      m.address?.toLowerCase().includes(q)
    );
  }).slice(0, 50);

  const handleSelectSearchSuggestion = (member: any) => {
    setSearchQuery(member.name);
    setShowSearchSuggestions(false);
  };

  const handleSelectModalMember = (member: any) => {
    setSelectedMemberId(member.id);
    setMemberName(member.name);
    setMemberPhone(member.phone);
    setMemberAddress(member.address || '');
    setModalMemberSearch(member.name);
    setShowModalSuggestions(false);
    detectPendingMonths(member, collections);
  };

  const handleClearSelectedMember = () => {
    setSelectedMemberId('');
    setModalMemberSearch('');
    setMemberName('');
    setMemberPhone('');
    setMemberAddress('');
    setPendingMonthsDetected([]);
    setShowModalSuggestions(false);
  };

  // FILTERED COLLECTIONS
  const filteredCollections = collections.filter((col) => {
    const matchesSearch =
      !searchQuery ||
      col.memberName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.memberPhone?.includes(searchQuery) ||
      col.forMonths?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-800">
      {/* HEADER & ACTION SHORTCUT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Collection Records</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Manage member donations, rental receipts, and download PDF slips & reports for donors & management
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={() => {
              setModalMemberSearch('');
              setShowAddModal(true);
            }}
            className="px-5 py-3 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> Record New Payment
          </button>
        )}
      </div>

      {/* VIEWER CALLOUT */}
      {isViewer && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900 flex items-center gap-2">
          <i className="fas fa-eye text-amber-600"></i> Guest View-Only Mode: You are viewing transparency collection records. Payment creation, editing, and deletion are disabled.
        </div>
      )}

      {/* ALERTS */}
      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <i className="fas fa-check-circle text-emerald-600"></i> {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <i className="fas fa-circle-exclamation text-rose-600"></i> {errorMsg}
        </div>
      )}

      {/* FILTER SECTION MATCHING SCREENSHOT */}
      <div className="masjid-card p-6 bg-[#faf8f5] border border-slate-200/80 shadow-sm rounded-3xl space-y-4">
        {/* ROW 1: SEARCH & CATEGORY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 relative">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              SEARCH MEMBER NAME (AUTO-SUGGEST)
            </label>
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-3.5 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                placeholder="Type member name, phone or number to auto-suggest..."
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 text-xs"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* AUTOCOMPLETE DROPDOWN */}
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-emerald-200 rounded-2xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100"
                onMouseLeave={() => setShowSearchSuggestions(false)}
              >
                <div className="p-2 bg-emerald-50/70 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
                  <span>✨ Registered Members (Click to select)</span>
                  <button
                    type="button"
                    onClick={() => setShowSearchSuggestions(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                {searchSuggestions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectSearchSuggestion(m)}
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 transition flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                        {m.name?.charAt(0)}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 group-hover:text-emerald-800 block">
                          {m.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {m.memberNo || 'MBR'} • 📞 {m.phone}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                        IN ₹{m.monthlyAmount || 100}/mo
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">SELECT CATEGORY</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-700"
            >
              <option value="ALL">All Categories</option>
              <option value="Monthly Collection">Monthly Collection</option>
              <option value="General Rent">General Rent</option>
              <option value="Donation">Donation</option>
              <option value="Zakat">Zakat</option>
            </select>
          </div>
        </div>

        {/* ROW 2: MONTH & PDF ACTION BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">SELECT MONTH</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-700"
            >
              <option value="August 2026">August 2026</option>
              <option value="July 2026">July 2026</option>
              <option value="June 2026">June 2026</option>
            </select>
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedMonth('August 2026');
              }}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-2xl text-xs font-bold text-slate-700 transition"
            >
              Clear
            </button>

            {/* DOWNLOAD MONTHLY SLIP PDF */}
            <button
              onClick={() => window.open('/dashboard/reports/print?reportType=member_collections&autoPrint=true', '_blank')}
              className="px-4 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-sm transition flex items-center gap-1.5"
            >
              <i className="fas fa-file-pdf text-xs"></i> Download Monthly Slip (PDF)
            </button>

            {/* DOWNLOAD ALL RECORDS PDF */}
            <button
              onClick={() => window.open('/dashboard/reports/print?reportType=daily&autoPrint=true', '_blank')}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 transition flex items-center gap-1.5"
            >
              <i className="fas fa-file-pdf text-xs text-emerald-800"></i> Download All Records (PDF)
            </button>
          </div>
        </div>

        {/* ROW 3: SELECT YEAR */}
        <div>
          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">SELECT YEAR</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none"
          >
            <option value="">Select Year</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        {/* ROW 4: GENERATE CATEGORY RECEIPT PDF */}
        <div className="pt-2 border-t border-slate-200/60 space-y-3">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">GENERATE CATEGORY RECEIPT</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">CATEGORY</label>
              <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800">
                <option>All Categories</option>
                <option>Rentals</option>
                <option>Monthly Member</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">FROM DATE</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">TO DATE</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800" />
            </div>
          </div>

          <button
            onClick={() => window.open('/dashboard/reports/print?reportType=member_collections&autoPrint=true', '_blank')}
            className="w-full py-3 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-file-pdf"></i> Download Category / Date Range Receipt (PDF)
          </button>
        </div>
      </div>

      {/* INCOME RECORDS LIST HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F3D26] text-white flex items-center justify-center text-xs">
            <i className="fas fa-list-check"></i>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 leading-tight">Collection Transactions</h2>
            <p className="text-[11px] text-slate-500">
              Showing {filteredCollections.length} records • Total: <strong className="text-emerald-800 font-bold font-mono">IN ₹{filteredCollections.reduce((sum, c) => sum + (Number(c.amount) || 0), 0).toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold font-mono">
            {filteredCollections.length} Transactions
          </span>
        </div>
      </div>

      {/* COMPACT CLASSIC TABLE / SLIM TRANSACTION LIST */}
      {loading ? (
        <div className="p-10 text-center text-slate-400 text-xs font-semibold bg-white border border-slate-200 rounded-2xl">
          <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mb-2"></i>
          <p>Loading collection records...</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-xs font-semibold bg-white border border-slate-200 rounded-2xl">
          No collection records found. Use &quot;Record New Payment&quot; to add transactions.
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden">
          {/* DESKTOP & TABLET CLASSIC SLIM TABLE */}
          <div className="overflow-x-auto hidden sm:block">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Date</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Member / Contributor</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Period / Month(s)</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Category</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">Amount</th>
                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCollections.map((col) => (
                  <tr key={col.id} className="hover:bg-emerald-50/30 transition group">
                    {/* DATE */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {new Date(col.paymentDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* MEMBER */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs block leading-tight">
                          {col.memberName}
                        </span>
                        {col.memberPhone && (
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            ({col.memberPhone})
                          </span>
                        )}
                      </div>
                      {col.memberAddress && (
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs leading-tight mt-0.5">
                          {col.memberAddress}
                        </span>
                      )}
                    </td>

                    {/* PERIOD / MONTH */}
                    <td className="py-2.5 px-3.5 text-slate-700 font-semibold text-xs whitespace-nowrap">
                      <span className="truncate max-w-xs block font-medium" title={col.forMonths}>
                        {col.forMonths || 'Monthly Fee'}
                      </span>
                    </td>

                    {/* CATEGORY BADGE */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/80 text-slate-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {col.paymentType || 'Monthly'}
                      </span>
                    </td>

                    {/* AMOUNT */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 font-black font-mono text-xs rounded-md border border-emerald-200/60 inline-block">
                        IN ₹{col.amount?.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap space-x-1">
                      {/* PDF SLIP BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(col)}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                        title="Print / Download PDF Receipt"
                      >
                        <i className="fas fa-file-pdf text-emerald-800 text-[10px]"></i>
                        <span className="text-[10px]">PDF</span>
                      </button>

                      {/* WHATSAPP BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleWhatsAppShare(col)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                        title="Send WhatsApp Receipt"
                      >
                        <i className="fab fa-whatsapp text-emerald-600 text-[11px]"></i>
                        <span className="text-[10px]">Share</span>
                      </button>

                      {/* EDIT BUTTON */}
                      {!isViewer && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(col)}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/70 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                          title="Edit transaction"
                        >
                          <i className="fas fa-pen text-[10px]"></i>
                        </button>
                      )}

                      {/* DELETE BUTTON */}
                      {!isViewer && (
                        <button
                          type="button"
                          onClick={() => setDeletingId(col.id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                          title="Delete transaction"
                        >
                          <i className="fas fa-trash-can text-[10px]"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE SLIM CARD VIEW */}
          <div className="sm:hidden divide-y divide-slate-100">
            {filteredCollections.map((col) => (
              <div key={col.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block leading-tight">
                      {col.memberName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                      {col.memberPhone || '-'} • {new Date(col.paymentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-900 font-extrabold font-mono text-xs rounded border border-emerald-200">
                    IN ₹{col.amount?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                  <span className="font-medium truncate max-w-[180px]">{col.forMonths || 'Monthly'}</span>
                  <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">
                    {col.paymentType || 'Monthly'}
                  </span>
                </div>

                {/* COMPACT ACTIONS */}
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(col)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold flex items-center gap-1"
                  >
                    <i className="fas fa-file-pdf text-emerald-800"></i> PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppShare(col)}
                    className="px-2 py-1 bg-emerald-100/70 hover:bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold flex items-center gap-1"
                  >
                    <i className="fab fa-whatsapp text-emerald-700"></i> WhatsApp
                  </button>

                  {!isViewer && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(col)}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[10px] font-bold"
                      >
                        <i className="fas fa-pen"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(col.id)}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold"
                      >
                        <i className="fas fa-trash-can"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECORD NEW PAYMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0F3D26] text-white flex items-center justify-center text-xs">
                  <i className="fas fa-hand-holding-dollar"></i>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Record Member Collection</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base rounded-lg"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-3.5 overflow-y-auto flex-1 pr-0.5">
              {/* MEMBER SELECTION */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Select Member <span className="text-rose-500">*</span>
                </label>

                {selectedMemberId ? (
                  <div className="p-2.5 bg-emerald-50/90 border border-emerald-400/50 rounded-xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-[#0F3D26] text-white flex items-center justify-center font-black text-xs shrink-0">
                        {memberName?.charAt(0) || 'M'}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 truncate">{memberName}</span>
                          <span className="px-1.5 py-0.2 bg-emerald-200/80 text-emerald-900 font-mono font-bold text-[9px] rounded">
                            {members.find((m) => m.id === selectedMemberId)?.memberNo || 'MBR'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 font-mono mt-0.5 truncate">
                          📞 {memberPhone} • <strong className="text-emerald-800 font-bold">IN ₹{baseMonthlyRate}/mo</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearSelectedMember}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-[11px] font-bold transition shrink-0 ml-2"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <i className="fas fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                      <input
                        type="text"
                        value={modalMemberSearch}
                        onFocus={() => setShowModalSuggestions(true)}
                        onChange={(e) => {
                          setModalMemberSearch(e.target.value);
                          setShowModalSuggestions(true);
                          setMemberName(e.target.value);
                        }}
                        placeholder="Type member name, phone or ID (e.g. MBR-101)..."
                        className="w-full pl-8 pr-8 py-2 bg-[#FFF9EC] border border-[#D4AF37]/60 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                      />
                      {modalMemberSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalMemberSearch('');
                            setSelectedMemberId('');
                          }}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* MODAL AUTOCOMPLETE SUGGESTIONS */}
                    {showModalSuggestions && (
                      <div
                        className="absolute left-0 right-0 top-full mt-1 bg-white border border-emerald-300 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto"
                        onMouseLeave={() => setShowModalSuggestions(false)}
                      >
                        <div className="p-1.5 bg-emerald-50 text-[10px] font-extrabold uppercase text-emerald-800 flex justify-between items-center sticky top-0 z-10 border-b border-emerald-200">
                          <span>
                            🔍 {modalMemberSearch ? `Found ${modalSuggestions.length} Members` : `Select Registered Member (${members.length})`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowModalSuggestions(false)}
                            className="text-slate-400 hover:text-slate-700 px-1 font-bold text-[10px]"
                          >
                            ✕ Close
                          </button>
                        </div>

                        {modalSuggestions.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500 font-medium">
                            <p>No registered members found.</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Fill Name and Phone below manually.</p>
                          </div>
                        ) : (
                          modalSuggestions.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectModalMember(m)}
                              className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition flex items-center justify-between text-xs group"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-6 h-6 rounded-md bg-[#0F3D26] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                                  {m.name?.charAt(0) || 'M'}
                                </div>
                                <div className="truncate">
                                  <span className="font-extrabold text-slate-900 group-hover:text-emerald-800 block text-xs truncate">
                                    {m.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    {m.memberNo || 'MBR'} • 📞 {m.phone}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                IN ₹{m.monthlyAmount || 100}/mo
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* MANUAL NAME & PHONE (ONLY IF NO REGISTERED MEMBER CHOSEN) */}
              {!selectedMemberId && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Donor Name *</label>
                    <input
                      type="text"
                      required
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Phone *</label>
                    <input
                      type="text"
                      required
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* LIVE PAYMENT & REST OF BALANCE BREAKDOWN */}
              {selectedMemberId && (
                <div className="p-3 bg-slate-50/90 border border-slate-200/80 rounded-2xl space-y-2.5">
                  {/* DUES SUMMARY BAR */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <i className="fas fa-calculator text-emerald-700"></i> Payment & Balance Status
                    </span>
                    {pendingMonthsDetected.length > 0 ? (
                      <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                        {pendingMonthsDetected.length} Months Due (IN ₹{(pendingMonthsDetected.length * (baseMonthlyRate || 100)).toLocaleString('en-IN')})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        ✓ Fully Paid Up to Current Month
                      </span>
                    )}
                  </div>

                  {pendingMonthsDetected.length === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-0.5">
                      <div className="text-xs font-black text-emerald-900 flex items-center justify-center gap-1.5">
                        <i className="fas fa-circle-check text-emerald-600"></i> No Pending Dues
                      </div>
                      <p className="text-[10.5px] text-emerald-700 font-medium">
                        This member has paid all monthly fees up to current month. No extra or duplicate payment accepted.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* 2-CARD LIVE STATUS: PAYING NOW VS REST OF BALANCE */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* PAYING NOW */}
                        <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] uppercase font-extrabold text-emerald-800">Paying Now</span>
                            <span className="text-[9.5px] font-bold text-emerald-700">
                              {selectedMonthsList.length} Month{selectedMonthsList.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <span className="text-sm font-black text-emerald-950 font-mono block mt-0.5">
                            IN ₹{Number(amount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* REST OF BALANCE */}
                        {(() => {
                          const remainingPendingMonths = pendingMonthsDetected.filter((m) => !selectedMonthsList.includes(m));
                          const remainingBalAmt = remainingPendingMonths.length * (baseMonthlyRate || 100);
                          const hasRemaining = remainingPendingMonths.length > 0;

                          return (
                            <div
                              className={`p-2.5 rounded-xl border transition ${
                                hasRemaining
                                  ? 'bg-amber-50/90 border-amber-300'
                                  : 'bg-emerald-100/70 border-emerald-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[9.5px] uppercase font-extrabold ${
                                    hasRemaining ? 'text-amber-900' : 'text-emerald-900'
                                  }`}
                                >
                                  Rest of Balance
                                </span>
                                <span
                                  className={`text-[9.5px] font-bold ${
                                    hasRemaining ? 'text-amber-700' : 'text-emerald-700'
                                  }`}
                                >
                                  {hasRemaining ? `${remainingPendingMonths.length} Mo Due` : 'Cleared'}
                                </span>
                              </div>
                              <span
                                className={`text-sm font-black font-mono block mt-0.5 ${
                                  hasRemaining ? 'text-amber-950' : 'text-emerald-950'
                                }`}
                              >
                                {hasRemaining ? `IN ₹${remainingBalAmt.toLocaleString('en-IN')}` : '₹0 Due ✓'}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* SHOW REST OF BALANCE UNPAID MONTHS LIST */}
                      {(() => {
                        const remainingPendingMonths = pendingMonthsDetected.filter((m) => !selectedMonthsList.includes(m));
                        if (remainingPendingMonths.length === 0) return null;

                        return (
                          <div className="pt-0.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold">
                              <span>Rest of unpaid months remaining:</span>
                              <span className="font-mono">{remainingPendingMonths.length} Months</span>
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                              {remainingPendingMonths.map((m) => (
                                <span
                                  key={m}
                                  className="px-1.5 py-0.5 bg-white border border-amber-300/80 text-amber-900 rounded text-[9.5px] font-bold font-mono"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )}

              {/* DIRECT MONTHLY SELECTION (KEEP ONLY PENDING MONTHS) */}
              {pendingMonthsDetected.length > 0 && (
                <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <i className="fas fa-calendar-check text-emerald-700 text-xs"></i> Select Months to Pay:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMonthsList.length === pendingMonthsDetected.length) {
                          setSelectedMonthsList([]);
                          setAmount('0');
                          setForMonths('');
                        } else {
                          handleClearAllPending();
                        }
                      }}
                      className="text-[10.5px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                    >
                      {selectedMonthsList.length === pendingMonthsDetected.length
                        ? 'Clear Selection'
                        : `Select All (${pendingMonthsDetected.length} Months)`}
                    </button>
                  </div>

                  {/* DIRECT MONTHLY SELECTION GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                    {pendingMonthsDetected.map((mStr) => {
                      const isChecked = selectedMonthsList.includes(mStr);
                      return (
                        <button
                          key={mStr}
                          type="button"
                          onClick={() => handleToggleMonthSelection(mStr)}
                          className={`p-2 rounded-xl text-[10px] font-bold text-left transition flex items-center justify-between border cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                              : 'bg-amber-50/70 text-amber-950 border-amber-200 hover:bg-amber-100/80'
                          }`}
                        >
                          <span className="truncate">{mStr}</span>
                          {isChecked ? (
                            <i className="fas fa-check text-[9px] shrink-0 ml-1 text-emerald-200"></i>
                          ) : (
                            <span className="text-[8px] bg-amber-200 px-1 py-0.2 rounded text-amber-900 font-extrabold shrink-0 ml-0.5">
                              DUE
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AMOUNT & PERIOD (INLINE 2-COLUMN GRID) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                    Amount (IN ₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    disabled={selectedMemberId ? pendingMonthsDetected.length === 0 : false}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-emerald-700 focus:bg-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase mb-1">
                    Period Description
                  </label>
                  <input
                    type="text"
                    disabled={selectedMemberId ? pendingMonthsDetected.length === 0 : false}
                    value={forMonths}
                    onChange={(e) => setForMonths(e.target.value)}
                    placeholder="e.g. August 2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-emerald-700 focus:bg-white truncate disabled:opacity-50"
                  />
                </div>
              </div>

              {/* MODAL FOOTER BUTTONS */}
              <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (selectedMemberId ? pendingMonthsDetected.length === 0 : false)}
                  className="px-4 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fab fa-whatsapp text-emerald-400"></i>
                  <span>
                    {submitting
                      ? 'Recording...'
                      : selectedMemberId && pendingMonthsDetected.length === 0
                      ? 'All Settled — No Extra Payment Accepted'
                      : `Collect ₹${Number(amount || 0).toLocaleString('en-IN')}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 border-b pb-3">Edit Collection Record</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Member Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone</label>
                <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-mono font-semibold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount (IN ₹)</label>
                <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-extrabold" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Period / Month</label>
                <input type="text" value={editForMonths} onChange={(e) => setEditForMonths(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-semibold" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setEditingItem(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">Cancel</button>
              <button onClick={handleSaveEdit} disabled={submitting} className="px-4 py-2 bg-[#0F3D26] text-white font-extrabold rounded-xl text-xs">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl mx-auto">
              <i className="fas fa-trash-can"></i>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Delete Collection Record?</h3>
              <p className="text-xs text-slate-500 mt-1">This action will remove the collection entry from financial reports.</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">Cancel</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-rose-600 text-white font-extrabold rounded-xl text-xs">Delete Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
