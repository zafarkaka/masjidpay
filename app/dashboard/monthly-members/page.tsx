'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function MonthlyMembersPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'directory' ? 'directory' : 'add';

  const [activeTab, setActiveTab] = useState<'add' | 'directory'>(initialTab);
  const [members, setMembers] = useState<any[]>([]);
  const [masjidSlug, setMasjidSlug] = useState('jama-masjid');
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('100');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [canViewReports, setCanViewReports] = useState(true);

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
        setSuccessMsg(`Member ${name} registered successfully with Transparency Report Access granted!`);
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

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const searchSuggestions = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      m.memberNo?.toLowerCase().includes(q)
    );
  }).slice(0, 6);

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
    <div className="space-y-6 max-w-5xl mx-auto text-slate-800 font-sans">
      {/* NAVIGATION HEADER & TAB TOGGLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">
            COMMUNITY DIRECTORY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A25] tracking-tight">
            Monthly Members
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Register community members, manage subscriptions, and grant financial transparency report access
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center p-1.5 bg-slate-200/80 rounded-2xl gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'add'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-user-plus mr-1.5 text-emerald-700"></i> Add Member
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'directory'
                ? 'bg-[#0F3D26] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <i className="fas fa-address-book mr-1.5"></i> Directory ({members.length})
          </button>
        </div>
      </div>

      {activeTab === 'add' && (
        <div className="space-y-6">
          {/* SAGE GREEN INFO CALLOUT BOX */}
          <div className="p-4 bg-[#f0f7f2] border border-[#d3e9d7] rounded-2xl flex items-start gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 border border-emerald-200 text-emerald-800 flex items-center justify-center text-lg shrink-0">
              <i className="fas fa-user-plus"></i>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium pt-1">
              Registering a New Monthly members are community members who donate a fixed monthly contribution to support the Masjid&apos;s running expenses.
            </p>
          </div>

          {/* SUCCESS & ERROR ALERTS */}
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

          {/* FORM CARD MATCHING SCREENSHOT */}
          <div className="masjid-card p-6 sm:p-8 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* FULL NAME */}
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

                {/* PHONE NUMBER */}
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

                {/* MONTHLY DONATION */}
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

                {/* JOINING DATE */}
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

              {/* EMAIL ADDRESS */}
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

              {/* ADDRESS */}
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

              {/* ADMIN TICK OPTION FOR MEMBER REPORT ACCESS */}
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
                <p className="text-[11px] text-slate-500 pl-7">
                  Ticking this box grants this member access to view mosque collections and financial transparency audit statements.
                </p>
              </div>

              {/* FORM ACTION BUTTONS */}
              <div className="flex items-center justify-start gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setName('');
                    setPhone('');
                    setEmail('');
                    setAddress('');
                  }}
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-300 rounded-2xl text-xs transition flex items-center gap-2"
                >
                  <i className="fas fa-times"></i> Cancel
                </button>

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

      {/* DIRECTORY TAB VIEW WITH TICK CHECKBOX PERMISSIONS */}
      {activeTab === 'directory' && (
        <div className="masjid-card bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 font-bold text-slate-900 text-sm">
            <div>
              <span>Registered Monthly Members</span>
              <p className="text-xs text-slate-500 font-normal">Use the tick option to grant or revoke report and collection view access per member</p>
            </div>
            <span className="text-xs text-slate-500 font-normal">Total: {filteredMembers.length} of {members.length} members</span>
          </div>

          {/* SEARCH BOX WITH AUTO-SUGGESTION DROPDOWN */}
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
                  <span>✨ Matching Member Names (Click to select)</span>
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
              No registered members matching &quot;{searchQuery}&quot;.
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
                    <th>REPORT & COLLECTION ACCESS (TICK OPTION)</th>
                    <th className="text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((mbr) => (
                    <tr key={mbr.id}>
                      <td className="font-mono font-bold text-emerald-800">{mbr.memberNo || 'MBR-001'}</td>
                      <td>
                        <span className="font-bold text-slate-900 block">{mbr.name}</span>
                        <span className="text-[10px] text-slate-400 block">{mbr.address || 'Address N/A'}</span>
                      </td>
                      <td className="font-mono text-xs text-slate-600">{mbr.phone}</td>
                      <td className="font-extrabold text-slate-900 text-sm">IN ₹{mbr.monthlyAmount?.toLocaleString('en-IN')}</td>
                      
                      {/* ADMIN TICK CHECKBOX OPTION */}
                      <td>
                        <label className="inline-flex items-center gap-2 cursor-pointer p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 transition">
                          <input
                            type="checkbox"
                            checked={mbr.canViewReports !== false}
                            onChange={() => handleToggleAccess(mbr.id, mbr.canViewReports !== false)}
                            className="w-4 h-4 rounded text-emerald-700 accent-emerald-800 cursor-pointer"
                          />
                          <span className={`text-xs font-bold ${mbr.canViewReports !== false ? 'text-emerald-800' : 'text-slate-400'}`}>
                            {mbr.canViewReports !== false ? '☑ Granted Access' : '☐ Restricted'}
                          </span>
                        </label>
                      </td>

                      <td className="text-right space-x-2">
                        <button
                          onClick={() => handleCopyLink(mbr)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                        >
                          {copiedId === mbr.id ? '✓ Link Copied!' : '🔗 Copy Report Link'}
                        </button>
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
    </div>
  );
}
