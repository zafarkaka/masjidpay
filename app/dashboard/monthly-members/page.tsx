'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MemberSoaModal from '@/components/MemberSoaModal';
import { generateMemberStatusWhatsAppUrl } from '@/lib/whatsapp';
import { getAllPaidMonthsForMember, getPendingMonthsUpToCurrent, MONTH_NAMES } from '@/lib/memberMonths';

export default function MonthlyMembersPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'directory' ? 'directory' : 'add';

  const [activeTab, setActiveTab] = useState<'add' | 'directory' | 'import'>(initialTab);
  const [members, setMembers] = useState<any[]>([]);
  const [masjidSlug, setMasjidSlug] = useState('jama-masjid');
  const [masjidName, setMasjidName] = useState('Newtown Masjid');
  const [loading, setLoading] = useState(false);
  const [soaModalMember, setSoaModalMember] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'PARTIALLY_PAID'>('ALL');

  // Expanded Member State (For Details / Hide)
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  // Add Member Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('100');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    monthlyAmount: '100',
    email: '',
    address: '',
  });

  // Delete Member Modal State
  const [deletingMember, setDeletingMember] = useState<any>(null);

  // Bulk Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isViewer, setIsViewer] = useState(false);

  const loadMembers = () => {
    setLoading(true);
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => {
        setMembers(data.members || []);
        if (data.masjidSlug) setMasjidSlug(data.masjidSlug);
        if (data.masjidName) setMasjidName(data.masjidName);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        const role = d?.user?.role;
        const viewer = role === 'VIEWER' || role === 'COMMUNITY_VIEWER';
        setIsViewer(viewer);
        if (viewer) {
          setActiveTab('directory');
        }
      })
      .catch(() => {});
    loadMembers();
  }, []);

  // REGISTER SINGLE MEMBER
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setErrorMsg('Full Name and Phone Number are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          address,
          monthlyAmount: Number(monthlyAmount),
          joiningDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Member ${name} registered successfully!`);
        setName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setMonthlyAmount('100');
        loadMembers();
      } else {
        setErrorMsg(data.error || 'Failed to register member.');
      }
    } catch (err) {
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // OPEN EDIT MODAL
  const handleOpenEdit = (mbr: any) => {
    setEditingMember(mbr);
    setEditForm({
      name: mbr.name || '',
      phone: mbr.phone || '',
      monthlyAmount: String(mbr.monthlyAmount || 100),
      email: mbr.email || '',
      address: mbr.address || '',
    });
    setErrorMsg('');
  };

  // SUBMIT EDIT
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: editingMember.id,
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email,
          address: editForm.address,
          monthlyAmount: Number(editForm.monthlyAmount),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEditingMember(null);
        loadMembers();
      } else {
        setErrorMsg(data.error || 'Failed to update member.');
      }
    } catch (err) {
      setErrorMsg('Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE MEMBER
  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/members?memberId=${deletingMember.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeletingMember(null);
        if (expandedMemberId === deletingMember.id) setExpandedMemberId(null);
        loadMembers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE SINGLE COLLECTION PAYOUT RECORD
  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to remove this collection payout record?')) return;
    try {
      const res = await fetch(`/api/member-collections?id=${collectionId}`, { method: 'DELETE' });
      if (res.ok) {
        loadMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // PARSE CSV / EXCEL FILE
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setErrorMsg('');
    setImportMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        setErrorMsg('Uploaded file is empty or only contains headers.');
        return;
      }

      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        if (values.length >= 2) {
          const rowObj: any = {
            name: values[0] || '',
            phone: values[1] || '',
            monthlyAmount: Number(values[2] || 100),
            address: values[3] || '',
            email: values[4] || '',
          };
          if (rowObj.name && rowObj.phone) {
            rows.push(rowObj);
          }
        }
      }

      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  // SUBMIT BULK IMPORT
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setErrorMsg('');
    setImportMsg('');

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkMembers: parsedRows }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportMsg(`🎉 Successfully imported ${data.count || parsedRows.length} members!`);
        setParsedRows([]);
        setImportFile(null);
        loadMembers();
      } else {
        setErrorMsg(data.error || 'Failed to import members.');
      }
    } catch (err) {
      setErrorMsg('Failed to process bulk member import.');
    } finally {
      setSubmitting(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const searchSuggestions = members
    .filter((m) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.name?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.memberNo?.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  // COMPUTE LIVE MONTHLY STATS, ADVANCE, PENDING & WHATSAPP URL FOR A MEMBER
  const getMemberMetrics = (mbr: any) => {
    const monthlyRate = Number(mbr.monthlyAmount || 100);
    const collections: any[] = mbr.memberCollections || [];

    const totalPaid = collections.reduce((acc, c) => acc + Number(c.amount || 0), 0);

    // List of months paid using robust parser
    const paidMonths = getAllPaidMonthsForMember(collections);

    const now = new Date();
    const currentMonthIdx = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    const { pendingMonths: pendingMonthsList, isFullyPaid, currentMonthStr } = getPendingMonthsUpToCurrent(
      mbr,
      collections
    );

    const expectedMonthsCount = Math.max(1, currentMonthIdx + 1);
    const requiredAmountUpToNow = expectedMonthsCount * monthlyRate;

    let statusType: 'ADVANCE' | 'FULLY_PAID' | 'PENDING' = 'FULLY_PAID';
    let statusText = 'Fully Paid (Up to date)';
    let advanceAmount = 0;
    let pendingAmount = 0;

    if (isFullyPaid) {
      statusType = 'FULLY_PAID';
      statusText = 'Fully Paid (Up to date)';
    } else {
      statusType = 'PENDING';
      pendingAmount = pendingMonthsList.length * monthlyRate;
      const monthsPendingCount = pendingMonthsList.length;
      statusText =
        monthsPendingCount === 1
          ? `1 Month Pending (Due: IN ₹${pendingAmount})`
          : `${monthsPendingCount} Months Pending (Due: IN ₹${pendingAmount})`;
    }

    const latestPaidMonth = paidMonths.length > 0 ? paidMonths[paidMonths.length - 1] : currentMonthStr;
    const totalMonthsPaidCount = Math.max(paidMonths.length, Math.floor(totalPaid / (monthlyRate || 1)));
    const progressPercent = Math.min(100, Math.round((totalMonthsPaidCount / expectedMonthsCount) * 100));

    const whatsappUrl = generateMemberStatusWhatsAppUrl({
      phone: mbr.phone,
      memberName: mbr.name,
      memberNo: mbr.memberNo || 'MBR',
      monthlyRate,
      totalPaid,
      pendingAmount,
      statusText,
      statusType,
      advanceAmount,
      paidTillMonth: latestPaidMonth,
      pendingMonthsList,
      masjidName,
    });

    return {
      monthlyRate,
      totalPaid,
      pendingAmount,
      advanceAmount,
      statusType,
      statusText,
      isFullyPaid,
      paidMonths,
      pendingMonthsList,
      expectedMonthsCount,
      totalMonthsPaidCount,
      progressPercent,
      latestPaidMonth,
      collections,
      whatsappUrl,
    };
  };

  // Pre-calculate member metrics map for filtering & summary statistics
  const memberMetricsMap = new Map<string, any>();
  let totalOverallMonthlyTarget = 0;
  let totalOverallPaid = 0;
  let totalOverallPending = 0;
  let countFullyPaid = 0;
  let countPending = 0;
  let countPartiallyPaid = 0;

  members.forEach((m) => {
    const met = getMemberMetrics(m);
    memberMetricsMap.set(m.id, met);
    totalOverallMonthlyTarget += Number(m.monthlyAmount || 100);
    totalOverallPaid += met.totalPaid;
    totalOverallPending += met.pendingAmount;

    if (met.isFullyPaid || met.pendingMonthsList.length === 0) {
      countFullyPaid++;
    } else if (met.totalPaid > 0) {
      countPartiallyPaid++;
    } else {
      countPending++;
    }
  });

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone?.includes(searchQuery) ||
      m.memberNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.address?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    const met = memberMetricsMap.get(m.id);
    if (!met) return true;

    if (statusFilter === 'PAID') return met.isFullyPaid || met.pendingMonthsList.length === 0;
    if (statusFilter === 'PENDING') return !met.isFullyPaid && met.totalPaid === 0;
    if (statusFilter === 'PARTIALLY_PAID') return !met.isFullyPaid && met.totalPaid > 0;
    return true;
  });

  return (
    <div className="space-y-5 max-w-6xl mx-auto text-slate-800 font-sans pb-10">
      {/* 1. HEADER WITH TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
            MEMBERS MANAGEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Monthly Members & Fee Ledger
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Track monthly member registrations, payment status, advance contributions, and WhatsApp statements
          </p>
        </div>

        {/* TABS BUTTONS */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          {!isViewer && (
            <button
              onClick={() => setActiveTab('add')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'add'
                  ? 'bg-[#0F3D26] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-user-plus text-[11px]"></i> Add Member
            </button>
          )}

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-[#0F3D26] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <i className="fas fa-address-book text-[11px]"></i> Member Directory ({members.length})
          </button>

          {!isViewer && (
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'import'
                  ? 'bg-[#0F3D26] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className="fas fa-file-excel text-[11px]"></i> Import CSV
            </button>
          )}
        </div>
      </div>

      {/* 2. ADD MEMBER TAB VIEW */}
      {activeTab === 'add' && !isViewer && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900">Register New Monthly Member</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add a new family head or monthly contributor with assigned monthly fee rate
            </p>
          </div>

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <i className="fas fa-circle-check text-emerald-600 text-sm"></i> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-900 flex items-center gap-2">
              <i className="fas fa-circle-exclamation text-rose-600 text-sm"></i> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Haji Mohammed Farooq"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number (WhatsApp) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9840123456"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Monthly Rate (₹) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="100"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-emerald-800 outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Joining Date
                </label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Optional email"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Residential Street Address / Door No
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 224/29 Hajee Street, Vaniyambadi"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-emerald-700 focus:bg-white transition"
              />
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i> Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-check text-[#F4D06F]"></i> Register Member
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. DIRECTORY TAB VIEW (WITH SHOW DETAILS & HIDE TRANSITION) */}
      {activeTab === 'directory' && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden space-y-4">
          
          {/* SUMMARY STATISTICS CARDS */}
          <div className="p-5 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">Registered Monthly Members</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black">
                    {members.length} MEMBERS
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track monthly member dues, statements of accounts (SOA), and instant PDF/WhatsApp receipts
                </p>
              </div>

              <span className="text-xs font-bold text-slate-500">
                Showing: {filteredMembers.length} of {members.length} Members
              </span>
            </div>

            {/* 4-METRICS STATS BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Total Members
                </span>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {members.length}
                </span>
                <span className="text-[9px] text-slate-400 block">Registered Donors</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Monthly Expected
                </span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  IN ₹{totalOverallMonthlyTarget.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-400 block">Per Month Target</span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-[9.5px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  Total Collected
                </span>
                <span className="text-lg font-black text-emerald-950 font-mono">
                  IN ₹{totalOverallPaid.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-emerald-700 block">{countFullyPaid} Fully Settled</span>
              </div>

              <div className={`p-3 rounded-2xl border ${totalOverallPending > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className={`text-[9.5px] font-extrabold uppercase tracking-wider block ${totalOverallPending > 0 ? 'text-amber-900' : 'text-emerald-800'}`}>
                  Pending Dues
                </span>
                <span className={`text-lg font-black font-mono ${totalOverallPending > 0 ? 'text-rose-700' : 'text-emerald-950'}`}>
                  IN ₹{totalOverallPending.toLocaleString('en-IN')}
                </span>
                <span className={`text-[9px] font-bold block ${totalOverallPending > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                  {countPending + countPartiallyPaid} Members Pending
                </span>
              </div>
            </div>

            {/* STATUS FILTER TABS */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#0F3D26] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({members.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PAID')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'PAID'
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                ✓ Fully Paid ({countFullyPaid})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'PENDING'
                    ? 'bg-rose-700 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                ⚠️ Pending ({countPending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PARTIALLY_PAID')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'PARTIALLY_PAID'
                    ? 'bg-amber-700 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                ⚡ Partially Paid ({countPartiallyPaid})
              </button>
            </div>
          </div>

          {/* SEARCH BOX */}
          <div className="px-5 relative">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                placeholder="Search member name, phone or address..."
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              <i className="fas fa-circle-notch fa-spin text-emerald-700 text-2xl mb-2"></i>
              <p>Loading members directory...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              No matching members found for the selected filter.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredMembers.map((mbr) => {
                const metrics = getMemberMetrics(mbr);
                const isExpanded = expandedMemberId === mbr.id;

                return (
                  <div key={mbr.id} className="transition">
                    {/* MEMBER ROW */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition">
                      {/* MEMBER AVATAR & INFO */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-900 flex items-center justify-center font-black text-sm shrink-0 uppercase">
                          {mbr.name?.charAt(0) || 'M'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm truncate">{mbr.name}</span>
                            <span className="px-2 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                              Active
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 font-semibold">
                              ({mbr.memberNo || 'MBR'})
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            <span className="font-mono text-slate-700">{mbr.phone}</span>
                            {mbr.address && <span> • {mbr.address}</span>}
                          </p>
                        </div>
                      </div>

                      {/* STATS & ACTIONS (RIGHT SIDE) */}
                      <div className="flex flex-wrap items-center gap-2 self-end md:self-auto shrink-0">
                        {/* MONTHLY RATE PILL */}
                        <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800">
                          IN ₹{metrics.monthlyRate} <span className="text-[10px] font-medium text-slate-400">/mo</span>
                        </div>

                        {/* STATUS BADGE (FULLY PAID / PENDING) */}
                        <div
                          className={`px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                            metrics.statusType === 'FULLY_PAID'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                        >
                          {metrics.statusText}
                        </div>

                        {/* VIEW FULL SOA BUTTON */}
                        <button
                          type="button"
                          onClick={() => setSoaModalMember(mbr)}
                          className="px-2.5 py-1.5 bg-[#0F3D26] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title="View Full Statement of Account (SOA)"
                        >
                          <i className="fas fa-file-invoice text-[#F4D06F] text-[11px]"></i>
                          <span className="hidden xs:inline">View Full SOA</span>
                        </button>

                        {/* DETAILS / HIDE TOGGLE BUTTON */}
                        <button
                          type="button"
                          onClick={() => setExpandedMemberId(isExpanded ? null : mbr.id)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-2xs"
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>

                        {/* DOWNLOAD STATEMENT BUTTON */}
                        <Link
                          href={`/dashboard/monthly-members/soa?memberId=${mbr.id}`}
                          target="_blank"
                          className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xs transition cursor-pointer"
                          title="Open Printable Statement Page"
                        >
                          <i className="fas fa-download"></i>
                        </Link>

                        {/* WHATSAPP BUTTON (AUTO SYNC STATUS & SEND) */}
                        <a
                          href={metrics.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xs transition cursor-pointer"
                          title={`Send WhatsApp Status to ${mbr.phone}`}
                        >
                          <i className="fab fa-whatsapp text-sm text-[#25D366]"></i>
                        </a>

                        {/* EDIT BUTTON */}
                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(mbr)}
                            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xs transition cursor-pointer"
                            title="Edit Member"
                          >
                            <i className="fas fa-pen-to-square"></i>
                          </button>
                        )}

                        {/* DELETE BUTTON */}
                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => setDeletingMember(mbr)}
                            className="w-8 h-8 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center text-xs transition cursor-pointer"
                            title="Delete Member"
                          >
                            <i className="fas fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* EXPANDED MEMBER SUMMARY & RECORDS (EXACTLY MATCHING USER SCREENSHOT) */}
                    {isExpanded && (
                      <div className="p-6 bg-slate-50/70 border-t border-slate-200 space-y-5 animate-in fade-in duration-150">
                        {/* SUMMARY HEADER & CLOSE */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <i className="fas fa-chart-pie text-emerald-800"></i> Member Summary & Records
                          </h3>
                          <button
                            type="button"
                            onClick={() => setExpandedMemberId(null)}
                            className="text-slate-400 hover:text-slate-700 text-base cursor-pointer p-1"
                          >
                            ✕
                          </button>
                        </div>

                        {/* 4 SUMMARY METRIC BOXES */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              Contribution
                            </span>
                            <div className="text-base font-extrabold text-slate-900">
                              IN ₹{metrics.monthlyRate}<span className="text-xs text-slate-400 font-normal">/mo</span>
                            </div>
                          </div>

                          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              Total Paid
                            </span>
                            <div className="text-base font-extrabold text-emerald-800">
                              IN ₹{metrics.totalPaid.toLocaleString('en-IN')}
                            </div>
                          </div>

                          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              Pending Amount
                            </span>
                            <div
                              className={`text-base font-extrabold ${
                                metrics.pendingAmount > 0 ? 'text-rose-600' : 'text-slate-700'
                              }`}
                            >
                              IN ₹{metrics.pendingAmount.toLocaleString('en-IN')}
                            </div>
                          </div>

                          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              Status
                            </span>
                            <div className="text-xs font-black text-emerald-800 leading-tight">
                              {metrics.statusText}
                            </div>
                          </div>
                        </div>

                        {/* PAYMENT PROGRESS BAR */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold text-slate-600">
                            <span>Payment Progress</span>
                            <span>
                              {metrics.totalMonthsPaidCount} / {metrics.expectedMonthsCount} months ({metrics.progressPercent}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-800 rounded-full transition-all duration-500"
                              style={{ width: `${metrics.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* 2 SUB-COLUMNS: GENERAL PAYMENTS & MONTHLY COLLECTION PAYOUTS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          {/* LEFT COLUMN: GENERAL MEMBER PAYMENTS */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                              General Member Payments (0)
                            </h4>
                            <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
                              No general payments recorded
                            </div>
                          </div>

                          {/* RIGHT COLUMN: MONTHLY COLLECTION PAYOUTS */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                Monthly Collection Payouts ({metrics.collections.length})
                              </h4>
                              {!isViewer && (
                                <Link
                                  href={`/dashboard/member-collections`}
                                  className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                                >
                                  <i className="fas fa-plus text-[10px]"></i> Record New
                                </Link>
                              )}
                            </div>

                            {/* IF THERE ARE PENDING MONTHS */}
                            {metrics.pendingMonthsList.length > 0 && (
                              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                                <span className="text-[11px] font-extrabold text-rose-800 flex items-center gap-1.5">
                                  <i className="fas fa-circle-exclamation text-rose-600"></i> Pending Dues Detected:
                                </span>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {metrics.pendingMonthsList.map((m, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-[10px] font-bold"
                                    >
                                      ❌ {m}: Due IN ₹{metrics.monthlyRate}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* LIST OF RECORDED PAYOUT MONTHS */}
                            {metrics.collections.length === 0 ? (
                              <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-medium">
                                No monthly payouts recorded yet.
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {metrics.collections.map((col) => (
                                  <div
                                    key={col.id}
                                    className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs shadow-2xs hover:border-emerald-300 transition"
                                  >
                                    <div>
                                      <span className="font-extrabold text-slate-900 block text-xs">
                                        {col.forMonths || 'Monthly Contribution'}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {col.receiptNo || 'REC'} • {new Date(col.paymentDate).toLocaleDateString('en-IN')} • {col.paymentMethod}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className="font-black text-emerald-800 text-xs">
                                        IN ₹{Number(col.amount).toLocaleString('en-IN')}
                                      </span>

                                      {!isViewer && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCollection(col.id)}
                                          className="text-slate-300 hover:text-rose-600 text-xs p-1 transition cursor-pointer"
                                          title="Remove Payout Record"
                                        >
                                          <i className="fas fa-trash-can"></i>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. IMPORT CSV TAB VIEW */}
      {activeTab === 'import' && !isViewer && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Bulk Import Members from CSV / Excel</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload hundreds of members at once using a standard CSV spreadsheet format
              </p>
            </div>
          </div>

          {importMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <i className="fas fa-circle-check text-emerald-600 text-sm"></i> {importMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-900 flex items-center gap-2">
              <i className="fas fa-circle-exclamation text-rose-600 text-sm"></i> {errorMsg}
            </div>
          )}

          <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60 transition rounded-3xl p-8 text-center cursor-pointer relative">
            <input
              type="file"
              accept=".csv, .xlsx, .xls, text/csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mb-3 shadow-xs">
              <i className="fas fa-cloud-arrow-up"></i>
            </div>
            <h4 className="text-xs font-extrabold text-slate-900">
              {importFile ? importFile.name : 'Click to select or drag CSV file here'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Columns: <code className="bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800 font-mono text-[10px]">Name, Phone, MonthlyAmount, Address, Email</code>
            </p>
          </div>

          {/* PREVIEW PARSED ROWS */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">
                  Preview: {parsedRows.length} members found
                </span>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="px-5 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <i className="fas fa-check-double text-[#F4D06F]"></i> {importing ? 'Importing...' : `Import ${parsedRows.length} Members`}
                </button>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Monthly Rate (₹)</th>
                      <th className="py-2.5 px-3">Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{r.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{r.phone}</td>
                        <td className="py-2.5 px-3 font-extrabold text-emerald-800">₹{r.monthlyAmount}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">{r.address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. EDIT MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Edit Member Details</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {editingMember.memberNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-700 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Monthly Rate (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={editForm.monthlyAmount}
                    onChange={(e) => setEditForm({ ...editForm, monthlyAmount: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-emerald-800 outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-700 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl mx-auto">
              <i className="fas fa-trash-can"></i>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Delete Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>{deletingMember.name}</strong> from monthly directory?
              </p>
            </div>
            <div className="flex justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. STATEMENT OF ACCOUNT (SOA) MODAL */}
      <MemberSoaModal
        member={soaModalMember}
        collections={soaModalMember?.memberCollections || []}
        masjidName={masjidName}
        isOpen={!!soaModalMember}
        onClose={() => setSoaModalMember(null)}
      />
    </div>
  );
}
