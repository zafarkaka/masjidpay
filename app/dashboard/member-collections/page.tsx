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
    loadData();
  }, []);

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mId = e.target.value;
    setSelectedMemberId(mId);
    if (!mId) return;

    const member = members.find((m) => m.id === mId);
    if (member) {
      setMemberName(member.name);
      setMemberPhone(member.phone);
      setMemberAddress(member.address || '');
      setAmount(String(member.monthlyAmount || 100));
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
          masjidId: 'jama-masjid',
          memberName,
          memberPhone,
          memberAddress,
          amount: Number(amount),
          paymentType,
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

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> Record New Payment
        </button>
      </div>

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
          <div className="md:col-span-3">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">SEARCH</label>
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-3.5 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by source, name or phone.."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 transition"
              />
            </div>
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

      {/* INCOME RECORDS LIST HEADER MATCHING SCREENSHOT */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-slate-900">Income Records</h2>
          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
            {filteredCollections.length}
          </span>
        </div>
      </div>

      {/* COLLECTION CARDS MATCHING SCREENSHOT */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold">
          <i className="fas fa-circle-notch fa-spin text-emerald-700 text-2xl mb-2"></i>
          <p>Loading collection records...</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold masjid-card bg-white border border-slate-200 rounded-3xl">
          No collection records found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCollections.map((col) => (
            <div key={col.id} className="masjid-card bg-white border border-slate-200/90 shadow-sm rounded-3xl p-5 space-y-4">
              {/* TOP HEADER ROW: NAME, PHONE, AMOUNT, DATE */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{col.memberName}</h3>
                  <span className="text-xs font-mono font-semibold text-slate-500">{col.memberPhone}</span>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-sm font-black rounded-xl inline-block">
                    IN ₹{col.amount?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                    {new Date(col.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* BODY CALLOUT ROW: SHOP / DETAILS & CATEGORY BADGE */}
              <div className="p-3 bg-[#faf8f5] border border-slate-200/60 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{col.forMonths || 'Monthly Fee'}</span>
                  <span className="text-[11px] text-slate-400 truncate max-w-md block">{col.memberAddress || 'Address N/A'}</span>
                </div>

                <span className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 text-[10px] font-bold rounded-lg uppercase">
                  {col.paymentType || 'General Rent'}
                </span>
              </div>

              {/* 4 ACTION BUTTONS ROW MATCHING SCREENSHOT */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {/* 1. EDIT BUTTON */}
                <button
                  type="button"
                  onClick={() => handleStartEdit(col)}
                  className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  title="Edit Record"
                >
                  <i className="fas fa-pen-to-square text-[#0F3D26]"></i>
                </button>

                {/* 2. DOWNLOAD PDF BUTTON */}
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(col)}
                  className="py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  title="Download PDF Receipt"
                >
                  <i className="fas fa-file-pdf text-emerald-800"></i>
                </button>

                {/* 3. WHATSAPP BUTTON */}
                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(col)}
                  className="py-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  title="Share WhatsApp Receipt"
                >
                  <i className="fab fa-whatsapp text-emerald-600 text-sm"></i>
                </button>

                {/* 4. DELETE BUTTON */}
                <button
                  type="button"
                  onClick={() => setDeletingId(col.id)}
                  className="py-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-xl text-rose-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  title="Delete Record"
                >
                  <i className="fas fa-trash-can text-rose-600"></i>
                </button>
              </div>
            </div>
          ))}
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
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Select Member (Auto-Fill)</label>
                <select onChange={handleMemberSelect} value={selectedMemberId} className="w-full p-3 bg-slate-50 border rounded-2xl text-xs font-semibold">
                  <option value="">-- Choose Member or Type Below --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone}) - IN ₹{m.monthlyAmount}</option>
                  ))}
                </select>
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

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Amount (IN ₹) *</label>
                <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-2xl text-xs font-extrabold" />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Period / Month</label>
                <input type="text" value={forMonths} onChange={(e) => setForMonths(e.target.value)} placeholder="e.g. August 2026" className="w-full p-3 bg-slate-50 border rounded-2xl text-xs font-semibold" />
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
