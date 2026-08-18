'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

    const memberPaidMonths: string[] = [];
    allCols.forEach((c) => {
      if (
        (member.phone && c.memberPhone && c.memberPhone.replace(/[^0-9]/g, '') === member.phone.replace(/[^0-9]/g, '')) ||
        (member.name && c.memberName?.toLowerCase().trim() === member.name?.toLowerCase().trim())
      ) {
        if (c.forMonths) {
          AVAILABLE_MONTHS.forEach((m) => {
            if (c.forMonths.includes(m)) {
              memberPaidMonths.push(m);
            }
          });
        }
      }
    });

    const curMonthIdx = new Date().getMonth();
    const monthsUpToCurrent = MONTH_NAMES.slice(0, curMonthIdx + 1).map((m) => `${m} ${CURRENT_YEAR}`);
    const unPaidMonths = monthsUpToCurrent.filter((m) => !memberPaidMonths.includes(m));
    setPendingMonthsDetected(unPaidMonths);

    if (unPaidMonths.length > 0) {
      setSelectedMonthsList(unPaidMonths);
      setAmount(String(unPaidMonths.length * memberMonthlyRate));
      setForMonths(unPaidMonths.length === 1 ? unPaidMonths[0] : `${unPaidMonths.join(', ')} (${unPaidMonths.length} Months Pending)`);
      setBulkPresetCount(unPaidMonths.length);
    } else {
      const currentMonthStr = `${MONTH_NAMES[curMonthIdx]} ${CURRENT_YEAR}`;
      setSelectedMonthsList([currentMonthStr]);
      setAmount(String(memberMonthlyRate));
      setForMonths(currentMonthStr);
      setBulkPresetCount(1);
    }
  };

  const handleToggleMonthSelection = (mStr: string) => {
    let updated: string[];
    if (selectedMonthsList.includes(mStr)) {
      updated = selectedMonthsList.filter((x) => x !== mStr);
    } else {
      updated = [...selectedMonthsList, mStr];
    }
    updated.sort((a, b) => AVAILABLE_MONTHS.indexOf(a) - AVAILABLE_MONTHS.indexOf(b));
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
      setForMonths(`${updated.join(', ')} (${count} Months Bulk)`);
      setBulkPresetCount(count);
    }
  };

  const handleApplyPresetCount = (count: number) => {
    setBulkPresetCount(count);
    const curIdx = new Date().getMonth();
    const startIdx = pendingMonthsDetected.length > 0 ? AVAILABLE_MONTHS.indexOf(pendingMonthsDetected[0]) : curIdx;
    const safeStart = startIdx >= 0 ? startIdx : curIdx;
    const newMonths = AVAILABLE_MONTHS.slice(safeStart, safeStart + count);

    setSelectedMonthsList(newMonths);
    const rate = baseMonthlyRate || 100;
    const newAmt = count * rate;
    setAmount(String(newAmt));

    if (count === 1) {
      setForMonths(newMonths[0] || `${MONTH_NAMES[curIdx]} ${CURRENT_YEAR}`);
    } else if (count === 12) {
      setForMonths(`${newMonths[0]} - ${newMonths[newMonths.length - 1]} (1 Year Full Bulk)`);
    } else {
      setForMonths(`${newMonths[0]} - ${newMonths[newMonths.length - 1]} (${count} Months Bulk)`);
    }
  };

  const handleClearAllPending = () => {
    if (pendingMonthsDetected.length === 0) return;
    setSelectedMonthsList(pendingMonthsDetected);
    const count = pendingMonthsDetected.length;
    const rate = baseMonthlyRate || 100;
    const newAmt = count * rate;
    setAmount(String(newAmt));
    setForMonths(`${pendingMonthsDetected.join(', ')} (${count} Months Pending Cleared)`);
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Record New Member Collection</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              {/* SMART AUTO-SUGGEST MEMBER SEARCH */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase">
                    Select / Search Member <span className="text-rose-500">*</span>
                  </label>
                  {selectedMemberId && (
                    <button
                      type="button"
                      onClick={handleClearSelectedMember}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                    >
                      <i className="fas fa-arrows-rotate text-[10px]"></i> Change Member
                    </button>
                  )}
                </div>

                {/* SELECTED MEMBER SUMMARY CARD */}
                {selectedMemberId ? (
                  <div className="p-3.5 bg-emerald-50/90 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0F3D26] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                        {memberName?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{memberName}</span>
                          <span className="px-1.5 py-0.5 bg-emerald-200/80 text-emerald-900 font-mono font-bold text-[10px] rounded-md">
                            {members.find((m) => m.id === selectedMemberId)?.memberNo || 'MBR'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                          📞 {memberPhone} • <span className="font-bold text-emerald-800">IN ₹{baseMonthlyRate}/month</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearSelectedMember}
                      className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold transition shadow-2xs"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <i className="fas fa-magnifying-glass absolute left-3.5 top-3.5 text-slate-400 text-xs"></i>
                      <input
                        type="text"
                        value={modalMemberSearch}
                        onFocus={() => setShowModalSuggestions(true)}
                        onChange={(e) => {
                          setModalMemberSearch(e.target.value);
                          setShowModalSuggestions(true);
                          setMemberName(e.target.value);
                        }}
                        placeholder="Search member by name, phone or ID (e.g. MBR-101)..."
                        className="w-full pl-9 pr-8 py-2.5 bg-[#FFF9EC] border border-[#D4AF37]/60 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                      />
                      {modalMemberSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalMemberSearch('');
                            setSelectedMemberId('');
                          }}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs p-1"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>

                    {/* MODAL AUTOCOMPLETE SUGGESTIONS POPUP */}
                    {showModalSuggestions && (
                      <div
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-emerald-300 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto animate-in fade-in duration-100"
                        onMouseLeave={() => setShowModalSuggestions(false)}
                      >
                        <div className="p-2 bg-emerald-50/90 text-[10px] font-extrabold uppercase text-emerald-800 flex justify-between items-center sticky top-0 z-10 border-b border-emerald-200">
                          <span>
                            🔍 {modalMemberSearch ? `Found ${modalSuggestions.length} Matching Members` : `Select from ${members.length} Registered Members`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowModalSuggestions(false)}
                            className="text-slate-400 hover:text-slate-700 px-1 font-bold"
                          >
                            ✕ Close
                          </button>
                        </div>

                        {modalSuggestions.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 font-medium">
                            <p>No registered members found matching &quot;{modalMemberSearch}&quot;.</p>
                            <p className="text-[11px] text-slate-400 mt-1">You can fill in custom Name and Phone manually below.</p>
                          </div>
                        ) : (
                          modalSuggestions.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSelectModalMember(m)}
                              className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50 transition flex items-center justify-between text-xs group"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-[#0F3D26] text-white flex items-center justify-center font-black text-xs shrink-0">
                                  {m.name?.charAt(0) || 'M'}
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 group-hover:text-emerald-800 block text-xs">
                                    {m.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {m.memberNo || 'MBR'} • 📞 {m.phone}
                                    {m.address ? ` • ${m.address}` : ''}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Name *</label>
                  <input type="text" required value={memberName} onChange={(e) => setMemberName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-2xl text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Phone *</label>
                  <input type="text" required value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-2xl text-xs font-mono font-semibold" />
                </div>
              </div>

              {/* SEVERAL MONTHS PENDING ALERT BANNER */}
              {pendingMonthsDetected.length > 0 && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-300/80 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-amber-900">
                      <i className="fas fa-triangle-exclamation text-amber-600"></i>
                      <span>{pendingMonthsDetected.length} Unpaid / Pending Months Detected</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 font-extrabold rounded-lg text-[10px]">
                      Total Due: IN ₹{(pendingMonthsDetected.length * (baseMonthlyRate || 100)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {pendingMonthsDetected.map((pm) => (
                      <span key={pm} className="px-2 py-0.5 bg-white border border-amber-300 text-amber-900 rounded-md text-[10px] font-bold">
                        {pm}
                      </span>
                    ))}
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-amber-800">Clear all pending dues at once:</span>
                    <button
                      type="button"
                      onClick={handleClearAllPending}
                      className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-extrabold rounded-xl text-[11px] transition shadow-xs flex items-center gap-1.5"
                    >
                      <i className="fas fa-bolt"></i> ⚡ Clear All Pending ({pendingMonthsDetected.length} Months)
                    </button>
                  </div>
                </div>
              )}

              {/* BULK PAYMENT PRESETS */}
              <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    ⚡ Quick Bulk Amount Presets:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMonthGrid(!showMonthGrid)}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                  >
                    <i className={`fas ${showMonthGrid ? 'fa-chevron-up' : 'fa-calendar-days'}`}></i>
                    {showMonthGrid ? 'Hide Month Picker' : 'Select Specific Months'}
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: '1 Mo', count: 1 },
                    { label: '2 Mo', count: 2 },
                    { label: '3 Mo (Qtr)', count: 3 },
                    { label: '6 Mo (Half)', count: 6 },
                    { label: '12 Mo (1 Yr)', count: 12 },
                  ].map((preset) => {
                    const isSelected = bulkPresetCount === preset.count && !showMonthGrid;
                    const calculatedCost = preset.count * (baseMonthlyRate || 100);
                    return (
                      <button
                        key={preset.count}
                        type="button"
                        onClick={() => {
                          handleApplyPresetCount(preset.count);
                          setShowMonthGrid(false);
                        }}
                        className={`py-2 px-1 rounded-xl text-center transition border ${
                          isSelected
                            ? 'bg-[#064E3B] text-[#F4D06F] border-[#D4AF37] shadow-sm font-extrabold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 font-bold'
                        }`}
                      >
                        <span className="block text-[11px] leading-tight">{preset.label}</span>
                        <span className="block text-[9px] opacity-80 font-mono mt-0.5">₹{calculatedCost}</span>
                      </button>
                    );
                  })}
                </div>

                {/* INTERACTIVE MULTI-MONTH CHECKBOX GRID */}
                {showMonthGrid && (
                  <div className="pt-2 border-t border-slate-200 mt-2 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                      Select Custom Months (Click to Toggle):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                      {AVAILABLE_MONTHS.map((mStr) => {
                        const isChecked = selectedMonthsList.includes(mStr);
                        const isPending = pendingMonthsDetected.includes(mStr);
                        return (
                          <button
                            key={mStr}
                            type="button"
                            onClick={() => handleToggleMonthSelection(mStr)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold text-left transition flex items-center justify-between border ${
                              isChecked
                                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                                : isPending
                                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{mStr}</span>
                            {isChecked && <i className="fas fa-check text-[9px] shrink-0 ml-1"></i>}
                            {!isChecked && isPending && <span className="text-[8px] bg-amber-200 px-1 rounded text-amber-900 font-extrabold shrink-0 ml-0.5">DUE</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Selected: <strong className="text-emerald-800">{selectedMonthsList.length} Months</strong></span>
                      <span>Rate: <strong className="text-slate-800">₹{baseMonthlyRate}/mo</strong></span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase">Amount (IN ₹) *</label>
                  <span className="text-[10px] font-bold text-emerald-800 font-mono">
                    ({selectedMonthsList.length} Month{selectedMonthsList.length > 1 ? 's' : ''} × ₹{baseMonthlyRate})
                  </span>
                </div>
                <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-2xl text-xs font-extrabold" />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Period / Month(s)</label>
                <input type="text" value={forMonths} onChange={(e) => setForMonths(e.target.value)} placeholder="e.g. August 2026, September 2026 (2 Months Bulk)" className="w-full p-3 bg-slate-50 border rounded-2xl text-xs font-semibold" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-[#0F3D26] text-white font-extrabold rounded-xl text-xs">Save & Send WhatsApp</button>
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
