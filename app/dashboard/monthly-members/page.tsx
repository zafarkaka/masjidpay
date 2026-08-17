'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function MonthlyMembersPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'directory' ? 'directory' : 'add';

  const [activeTab, setActiveTab] = useState<'add' | 'directory' | 'import'>(initialTab);
  const [members, setMembers] = useState<any[]>([]);
  const [masjidSlug, setMasjidSlug] = useState('jama-masjid');
  const [loading, setLoading] = useState(false);

  // Add Member Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('100');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [canViewReports, setCanViewReports] = useState(true);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    monthlyAmount: '100',
    email: '',
    address: '',
    canViewReports: true,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadMembers = () => {
    setLoading(true);
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => {
        setMembers(data.members || []);
        if (data.masjidSlug) setMasjidSlug(data.masjidSlug);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // TOGGLE MEMBER REPORT & COLLECTION ACCESS TICK OPTION
  const handleToggleAccess = async (memberId: string, currentVal: boolean) => {
    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, canViewReports: !currentVal }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, canViewReports: !currentVal } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = (member: any) => {
    const portalUrl = `${window.location.origin}/masjid/${masjidSlug}/transparency`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

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
          canViewReports,
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
        setCanViewReports(true);
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
      canViewReports: mbr.canViewReports !== false,
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
          canViewReports: editForm.canViewReports,
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
        loadMembers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // DOWNLOAD CSV TEMPLATE
  const handleDownloadTemplate = () => {
    const csvContent = `Name,Phone,MonthlyAmount,Address,Email\nMohammed Irfan,9840123456,500,Fort Street Vaniyambadi,irfan@example.com\nHaji Farooq Ahmed,9840234567,1000,Main Bazaar Road Vaniyambadi,farooq@example.com\nSyed Bilal,9876500001,250,Khadir Nagar Vaniyambadi,bilal@example.com`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'MasjidPay-Members-Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
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
      setImporting(false);
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

  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.memberNo?.toLowerCase().includes(q) ||
      m.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-800 font-sans pb-12">
      {/* NAVIGATION HEADER & TAB TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">
              COMMUNITY DIRECTORY
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
              {members.length} Members Total
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A25] tracking-tight">
            Monthly Members
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Register community members, manage subscriptions, upload Excel lists, and edit records
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center p-1.5 bg-slate-200/80 rounded-2xl gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-user-plus text-emerald-700"></i> Add Member
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-file-excel text-emerald-600"></i> Import Excel / CSV
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-[#0F3D26] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-address-book"></i> Directory ({members.length})
          </button>
        </div>
      </div>

      {/* 1. ADD MEMBER TAB */}
      {activeTab === 'add' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#f0f7f2] border border-[#d3e9d7] rounded-2xl flex items-start gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-user-plus"></i>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium pt-1">
              Monthly members donate a fixed monthly contribution to support the Masjid&apos;s running expenses.
            </p>
          </div>

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <i className="fas fa-check-circle text-emerald-600"></i> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
              <i className="fas fa-circle-exclamation text-rose-600"></i> {errorMsg}
            </div>
          )}

          <div className="masjid-card p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    FULL NAME <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Yusuf Ali"
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    PHONE NUMBER <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    MONTHLY DONATION (IN ₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-xs font-bold text-slate-500">IN ₹</span>
                    <input
                      type="number"
                      required
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(e.target.value)}
                      placeholder="100"
                      className="w-full pl-14 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    JOINING DATE
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  EMAIL ADDRESS <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yusuf@example.com"
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  ADDRESS
                </label>
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full address..."
                  className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                ></textarea>
              </div>

              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canViewReports}
                    onChange={(e) => setCanViewReports(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 accent-emerald-800"
                  />
                  <span className="text-xs font-extrabold text-slate-900">
                    ☑ Allow Member Transparency Access (View Collections & Financial Reports)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-start gap-3 pt-3 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-emerald-950/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <i className="fas fa-check"></i> {submitting ? 'Registering...' : 'Register Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EXCEL / CSV BULK IMPORT TAB */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="masjid-card p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Bulk Upload Existing Members</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload an Excel (.xlsx/.xls) or CSV file with your mosque&apos;s member directory.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs transition flex items-center gap-2 shrink-0"
              >
                <i className="fas fa-download"></i> Download CSV Template
              </button>
            </div>

            {importMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <i className="fas fa-check-circle text-emerald-600"></i> {importMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <i className="fas fa-circle-exclamation text-rose-600"></i> {errorMsg}
              </div>
            )}

            <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70 transition rounded-3xl p-8 text-center cursor-pointer relative">
              <input
                type="file"
                accept=".csv, .xlsx, .xls, text/csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mb-3 shadow-inner">
                <i className="fas fa-cloud-arrow-up"></i>
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                {importFile ? importFile.name : 'Click to select or drag CSV / Excel file here'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Supported format: CSV with headers <code className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-800 font-bold">Name, Phone, MonthlyAmount, Address, Email</code>
              </p>
            </div>

            {/* PREVIEW PARSED ROWS */}
            {parsedRows.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                    Preview Members to Import ({parsedRows.length} rows found)
                  </h4>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importing}
                    className="px-6 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <i className="fas fa-check-double"></i> {importing ? 'Importing...' : `Confirm & Save ${parsedRows.length} Members`}
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="masjid-table w-full text-xs">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>NAME</th>
                        <th>PHONE</th>
                        <th>MONTHLY (₹)</th>
                        <th>ADDRESS</th>
                        <th>EMAIL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((r, idx) => (
                        <tr key={idx}>
                          <td className="font-bold text-slate-400">{idx + 1}</td>
                          <td className="font-bold text-slate-900">{r.name}</td>
                          <td className="font-mono text-slate-700">{r.phone}</td>
                          <td className="font-bold text-emerald-800">₹{r.monthlyAmount}</td>
                          <td className="text-slate-500">{r.address || '-'}</td>
                          <td className="text-slate-500">{r.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. DIRECTORY TAB VIEW */}
      {activeTab === 'directory' && (
        <div className="masjid-card bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 font-bold text-slate-900 text-sm">
            <div>
              <div className="flex items-center gap-2">
                <span>Registered Monthly Members</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold">
                  {filteredMembers.length} active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Edit phone/address, delete members, or toggle report transparency permissions
              </p>
            </div>
            <span className="text-xs text-slate-500 font-normal">
              Showing {filteredMembers.length} of {members.length} members
            </span>
          </div>

          {/* SEARCH BOX WITH AUTO-SUGGESTIONS */}
          <div className="px-5 pt-1 relative">
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
                placeholder="Search by member name, phone or ID (auto-suggests as you type)..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#064E3B] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs p-1"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            {/* AUTOCOMPLETE SUGGESTIONS POPUP */}
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div
                className="absolute left-5 right-5 top-full mt-1 bg-white border border-emerald-300 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-100"
                onMouseLeave={() => setShowSearchSuggestions(false)}
              >
                <div className="p-2 bg-emerald-50 text-[10px] font-extrabold uppercase text-emerald-800 flex justify-between items-center">
                  <span>✨ Matching Member Names</span>
                  <button
                    type="button"
                    onClick={() => setShowSearchSuggestions(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                {searchSuggestions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(m.name);
                      setShowSearchSuggestions(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 transition flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#064E3B] text-white flex items-center justify-center font-bold text-xs">
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
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                      IN ₹{m.monthlyAmount || 100}/mo
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              <i className="fas fa-circle-notch fa-spin text-emerald-700 text-2xl mb-2"></i>
              <p>Loading members directory...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              No registered members found. Use &quot;Add Member&quot; or &quot;Import Excel&quot; to add members.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="masjid-table w-full">
                <thead>
                  <tr>
                    <th>MEMBER NO</th>
                    <th>FULL NAME</th>
                    <th>PHONE NUMBER</th>
                    <th>MONTHLY RATE</th>
                    <th>REPORT ACCESS</th>
                    <th className="text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((mbr) => (
                    <tr key={mbr.id} className="hover:bg-slate-50/70 transition">
                      <td className="font-mono font-bold text-emerald-800">{mbr.memberNo || 'MBR-001'}</td>
                      <td>
                        <span className="font-bold text-slate-900 block">{mbr.name}</span>
                        <span className="text-[11px] text-slate-500 block">
                          {mbr.address ? `📍 ${mbr.address}` : 'Address N/A'}
                          {mbr.email ? ` • ✉️ ${mbr.email}` : ''}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-700 font-bold">{mbr.phone}</td>
                      <td className="font-extrabold text-slate-900 text-sm">
                        IN ₹{mbr.monthlyAmount?.toLocaleString('en-IN')}
                      </td>

                      {/* ADMIN TICK CHECKBOX OPTION */}
                      <td>
                        <label className="inline-flex items-center gap-2 cursor-pointer p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 transition">
                          <input
                            type="checkbox"
                            checked={mbr.canViewReports !== false}
                            onChange={() => handleToggleAccess(mbr.id, mbr.canViewReports !== false)}
                            className="w-4 h-4 rounded text-emerald-700 accent-emerald-800 cursor-pointer"
                          />
                          <span
                            className={`text-xs font-bold ${
                              mbr.canViewReports !== false ? 'text-emerald-800' : 'text-slate-400'
                            }`}
                          >
                            {mbr.canViewReports !== false ? '☑ Granted Access' : '☐ Restricted'}
                          </span>
                        </label>
                      </td>

                      <td className="text-right space-x-1.5">
                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => handleOpenEdit(mbr)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-xl text-xs transition inline-flex items-center gap-1"
                          title="Edit member details"
                        >
                          <i className="fas fa-pen-to-square"></i> Edit
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => setDeletingMember(mbr)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs transition inline-flex items-center gap-1"
                          title="Delete member"
                        >
                          <i className="fas fa-trash-can"></i> Delete
                        </button>

                        {/* COPY LINK */}
                        <button
                          onClick={() => handleCopyLink(mbr)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition inline-flex items-center gap-1"
                        >
                          {copiedId === mbr.id ? '✓ Copied' : '🔗 Link'}
                        </button>

                        {/* COLLECT FEE */}
                        <Link
                          href={`/dashboard/member-collections`}
                          className="px-3 py-1.5 bg-[#0F3D26] hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1"
                        >
                          <i className="fas fa-hand-holding-dollar"></i> Collect Fee
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. EDIT MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Edit Member Details</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {editingMember.memberNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Monthly Contribution (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editForm.monthlyAmount}
                    onChange={(e) => setEditForm({ ...editForm, monthlyAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-emerald-600"
                ></textarea>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.canViewReports}
                    onChange={(e) => setEditForm({ ...editForm, canViewReports: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-700 accent-emerald-800"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Allow Transparency Portal & Report Access
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE MEMBER CONFIRMATION MODAL */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl shadow-inner">
              <i className="fas fa-triangle-exclamation"></i>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Delete Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong className="text-slate-900">{deletingMember.name}</strong> ({deletingMember.phone})? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
