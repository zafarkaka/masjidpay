'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SuperAdminMasjidsPage() {
  const [masjids, setMasjids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMasjid, setSelectedMasjid] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // EDIT ADMIN & RESET PASSWORD MODAL STATE
  const [manageMasjid, setManageMasjid] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'PASSWORD' | 'WELCOME_EMAIL' | 'DOCUMENTS' | 'PAYMENT'>('DETAILS');
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPhone, setEditAdminPhone] = useState('');
  const [editMasjidName, setEditMasjidName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // SUPER ADMIN PAYMENT GATEWAY CONFIGURATION STATE
  const [editUpiId, setEditUpiId] = useState('');
  const [editUpiPayeeName, setEditUpiPayeeName] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editBankAccNo, setEditBankAccNo] = useState('');
  const [editBankIfsc, setEditBankIfsc] = useState('');
  const [editEnableUpi, setEditEnableUpi] = useState(true);
  const [editEnableRazorpay, setEditEnableRazorpay] = useState(false);
  const [editRazorpayKeyId, setEditRazorpayKeyId] = useState('');
  const [editRazorpayKeySecret, setEditRazorpayKeySecret] = useState('');
  const [editRazorpayWebhookSecret, setEditRazorpayWebhookSecret] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [sendEmailNotice, setSendEmailNotice] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState('');
  const [manageSuccess, setManageSuccess] = useState('');
  const [manageError, setManageError] = useState('');

  const fetchMasjids = () => {
    setLoading(true);
    const url = `/api/super-admin/masjids?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setMasjids(data.masjids || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    setMounted(true);
    fetchMasjids();
  }, [statusFilter]);

  const handleAction = async (masjidId: string, action: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/super-admin/masjids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masjidId, action, rejectionReason }),
      });
      if (res.ok) {
        setSelectedMasjid(null);
        setRejectionReason('');
        fetchMasjids();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const openManageModal = (masjid: any) => {
    const adminUser = masjid?.masjidUsers?.[0]?.user;
    const settingsMap: Record<string, string> = {};
    if (masjid?.settings && Array.isArray(masjid.settings)) {
      masjid.settings.forEach((s: any) => {
        settingsMap[s.key] = s.value;
      });
    }

    setManageMasjid(masjid);
    setActiveTab('DETAILS');
    setEditAdminName(adminUser?.name || '');
    setEditAdminEmail(adminUser?.email || masjid?.email || '');
    setEditAdminPhone(adminUser?.phone || masjid?.phone || '');
    setEditMasjidName(masjid?.name || '');
    setEditCity(masjid?.city || '');
    setEditState(masjid?.state || '');
    setEditAddress(masjid?.address || '');
    setEditPhone(masjid?.phone || '');

    // Initialize payment state
    setEditUpiId(masjid?.upiId || settingsMap['upiId'] || '');
    setEditUpiPayeeName(settingsMap['upiPayeeName'] || masjid?.name || '');
    setEditBankName(masjid?.bankName || settingsMap['bankName'] || '');
    setEditBankAccNo(masjid?.bankAccNo || settingsMap['bankAccNo'] || '');
    setEditBankIfsc(masjid?.bankIfsc || settingsMap['bankIfsc'] || '');
    setEditEnableUpi(settingsMap['enableUpi'] !== 'false');
    setEditEnableRazorpay(settingsMap['enableRazorpay'] === 'true');
    setEditRazorpayKeyId(settingsMap['razorpayKeyId'] || '');
    setEditRazorpayKeySecret(settingsMap['razorpayKeySecret'] || '');
    setEditRazorpayWebhookSecret(settingsMap['razorpayWebhookSecret'] || '');

    setNewPassword('');
    setManageSuccess('');
    setManageError('');
  };

  const handleSavePaymentGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageMasjid) return;

    setActionLoading(true);
    setManageSuccess('');
    setManageError('');

    try {
      const res = await fetch('/api/super-admin/masjids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masjidId: manageMasjid.id,
          action: 'UPDATE_PAYMENT_GATEWAY',
          upiId: editUpiId,
          upiPayeeName: editUpiPayeeName,
          bankName: editBankName,
          bankAccNo: editBankAccNo,
          bankIfsc: editBankIfsc,
          enableUpi: editEnableUpi,
          enableRazorpay: editEnableRazorpay,
          razorpayKeyId: editRazorpayKeyId,
          razorpayKeySecret: editRazorpayKeySecret,
          razorpayWebhookSecret: editRazorpayWebhookSecret,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setManageSuccess('Payment Gateway (UPI & Razorpay) settings successfully configured by Super Admin!');
        fetchMasjids();
        setTimeout(() => setManageSuccess(''), 4000);
      } else {
        setManageError(data.error || 'Failed to save payment settings');
      }
    } catch (err: any) {
      setManageError(err.message || 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageMasjid) return;

    setActionLoading(true);
    setManageSuccess('');
    setManageError('');

    try {
      const res = await fetch('/api/super-admin/masjids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masjidId: manageMasjid.id,
          userId: manageMasjid?.masjidUsers?.[0]?.userId,
          action: 'UPDATE_ADMIN_DETAILS',
          adminName: editAdminName,
          adminEmail: editAdminEmail,
          adminPhone: editAdminPhone,
          masjidName: editMasjidName,
          city: editCity,
          state: editState,
          address: editAddress,
          phone: editPhone,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setManageSuccess('Masjid & Admin details updated successfully!');
        fetchMasjids();
        setTimeout(() => setManageSuccess(''), 4000);
      } else {
        setManageError(data.error || 'Failed to update details');
      }
    } catch (err: any) {
      setManageError(err.message || 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageMasjid || !newPassword) {
      setManageError('Please enter a new password (min 6 characters).');
      return;
    }

    setActionLoading(true);
    setManageSuccess('');
    setManageError('');

    try {
      const res = await fetch('/api/super-admin/masjids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masjidId: manageMasjid.id,
          userId: manageMasjid?.masjidUsers?.[0]?.userId,
          action: 'RESET_ADMIN_PASSWORD',
          newPassword,
          sendEmailNotification: sendEmailNotice,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setManageSuccess(data.message || 'Password successfully updated!');
        setNewPassword('');
        fetchMasjids();
        setTimeout(() => setManageSuccess(''), 5000);
      } else {
        setManageError(data.error || 'Failed to update password');
      }
    } catch (err: any) {
      setManageError(err.message || 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWelcomeEmail = async () => {
    if (!manageMasjid) return;
    setSendingEmail(true);
    setEmailSentStatus('');

    try {
      const res = await fetch('/api/super-admin/masjids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masjidId: manageMasjid.id,
          action: 'SEND_WELCOME_EMAIL',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmailSentStatus(data.message || 'Welcome email dispatched successfully!');
      } else {
        setEmailSentStatus(`Error: ${data.error || 'Failed to send welcome email'}`);
      }
    } catch (e: any) {
      setEmailSentStatus(`Error: ${e.message || 'Network error'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Masjid Approvals & Management</h1>
          <p className="text-slate-400 text-xs mt-1">Review onboarding applications, activate accounts, and manage mosque settings</p>
        </div>

        <Link
          href="/super-admin/payment-requests"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0 self-start sm:self-auto"
        >
          <i className="fas fa-file-invoice-dollar text-[#F4D06F]"></i>
          <span>Payment Onboarding Requests →</span>
        </Link>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search mosque name, city, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMasjids()}
            className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 w-60"
          />
          <button
            type="button"
            onClick={fetchMasjids}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* MASJIDS LIST TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {!mounted || loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-400 mr-2"></i> Loading masjids...
          </div>
        ) : masjids.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-mosque text-3xl mb-3 block text-slate-600"></i>
            <p className="text-sm font-semibold">No masjids match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Masjid Name</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Administrator</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Reg. Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {masjids.map((masjid) => {
                  const adminUser = masjid?.masjidUsers?.[0]?.user;
                  return (
                    <tr key={masjid.id} className="hover:bg-slate-800/40">
                      <td className="p-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold">
                            <i className="fas fa-mosque"></i>
                          </div>
                          <div>
                            <span className="block">{masjid.name}</span>
                            <span className="text-[11px] text-slate-400 font-normal">/{masjid.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">
                        {masjid.city ? `${masjid.city}, ${masjid.state || ''}` : 'Location N/A'}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-200 block">{adminUser?.name || 'N/A'}</span>
                        <span className="text-[11px] text-slate-400 block">{adminUser?.email || ''}</span>
                      </td>
                      <td className="p-4">
                        {masjid.status === 'APPROVED' && (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase text-[10px]">
                            Approved
                          </span>
                        )}
                        {masjid.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-md bg-amber-950 text-amber-400 border border-amber-800 font-bold uppercase text-[10px]">
                            Pending Review
                          </span>
                        )}
                        {masjid.status === 'REJECTED' && (
                          <span className="px-2.5 py-1 rounded-md bg-red-950 text-red-400 border border-red-800 font-bold uppercase text-[10px]">
                            Rejected
                          </span>
                        )}
                        {masjid.status === 'SUSPENDED' && (
                          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase text-[10px]">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(masjid.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {/* MANAGE ADMIN & RESET PASSWORD BUTTON */}
                        <button
                          onClick={() => openManageModal(masjid)}
                          className="px-3 py-1.5 bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/80 font-bold rounded-lg text-xs transition inline-flex items-center gap-1.5"
                          title="Edit Admin Details & Reset Password"
                        >
                          <i className="fas fa-user-pen"></i> Manage Admin
                        </button>

                        {masjid.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAction(masjid.id, 'APPROVE')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setSelectedMasjid(masjid)}
                              className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-200 font-bold rounded-lg text-xs transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {masjid.status === 'APPROVED' && (
                          <button
                            onClick={() => handleAction(masjid.id, 'SUSPEND')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition"
                          >
                            Suspend
                          </button>
                        )}
                        {masjid.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleAction(masjid.id, 'REACTIVATE')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition"
                          >
                            Reactivate
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

      {/* SUPER ADMIN MANAGE ADMIN & RESET PASSWORD MODAL */}
      {manageMasjid && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-slate-100 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-lg">
                  <i className="fas fa-user-shield"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Manage Mosque Administrator</h3>
                  <p className="text-xs text-slate-400">{manageMasjid.name}</p>
                </div>
              </div>
              <button onClick={() => setManageMasjid(null)} className="text-slate-400 hover:text-white text-lg">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex flex-wrap bg-slate-950 p-1.5 rounded-2xl gap-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('DETAILS')}
                className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'DETAILS'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <i className="fas fa-id-card"></i> 1. Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PASSWORD')}
                className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'PASSWORD'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <i className="fas fa-key"></i> 2. Password
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('WELCOME_EMAIL')}
                className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'WELCOME_EMAIL'
                    ? 'bg-[#064E3B] text-[#F4D06F] border border-[#D4AF37]/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <i className="fas fa-paper-plane"></i> 3. Welcome Mail
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('DOCUMENTS')}
                className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'DOCUMENTS'
                    ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <i className="fas fa-file-shield"></i> 4. Documents
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PAYMENT')}
                className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'PAYMENT'
                    ? 'bg-emerald-800 text-white border border-emerald-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <i className="fas fa-lock"></i> 5. Payments & UPI
              </button>
            </div>

            {manageSuccess && (
              <div className="p-3.5 bg-emerald-950 border border-emerald-800 rounded-2xl text-xs font-bold text-emerald-300 flex items-center gap-2">
                <i className="fas fa-check-circle text-emerald-400"></i> {manageSuccess}
              </div>
            )}

            {manageError && (
              <div className="p-3.5 bg-rose-950 border border-rose-800 rounded-2xl text-xs font-bold text-rose-300 flex items-center gap-2">
                <i className="fas fa-circle-exclamation text-rose-400"></i> {manageError}
              </div>
            )}

            {/* TAB 1: EDIT DETAILS FORM */}
            {activeTab === 'DETAILS' && (
              <form onSubmit={handleUpdateDetails} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Admin Representative Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editAdminName}
                      onChange={(e) => setEditAdminName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Admin Email (Login ID)
                    </label>
                    <input
                      type="email"
                      required
                      value={editAdminEmail}
                      onChange={(e) => setEditAdminEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Admin Phone / Mobile
                    </label>
                    <input
                      type="text"
                      value={editAdminPhone}
                      onChange={(e) => setEditAdminPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Mosque Official Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editMasjidName}
                      onChange={(e) => setEditMasjidName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Mosque Street Address
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="e.g. Fort Main Road"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setManageMasjid(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <i className="fas fa-floppy-disk"></i> Save Admin Details
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: RESET PASSWORD FORM */}
            {activeTab === 'PASSWORD' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-white block">Target Admin Account:</span>
                  <p className="text-emerald-400 font-semibold">{manageMasjid?.masjidUsers?.[0]?.user?.email || manageMasjid?.email}</p>
                  <p className="text-[11px] text-slate-500">Reset the login password on behalf of this mosque administrator.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      New Password *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                    >
                      <i className="fas fa-dice"></i> Generate Strong Password
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sendEmailNotice"
                    checked={sendEmailNotice}
                    onChange={(e) => setSendEmailNotice(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-emerald-500 bg-slate-950 border-slate-800"
                  />
                  <label htmlFor="sendEmailNotice" className="text-xs text-slate-300 cursor-pointer">
                    Send password update email notification to administrator via <strong className="text-emerald-400">masjidpay.org</strong>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setManageMasjid(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !newPassword}
                    className="px-5 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2 border border-emerald-700/60"
                  >
                    <i className="fas fa-key"></i> Update & Set New Password
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: SEND WELCOME & ACTIVATION EMAIL */}
            {activeTab === 'WELCOME_EMAIL' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="font-extrabold text-white text-sm">Recipient Admin:</span>
                    <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg font-mono font-bold text-xs">
                      {manageMasjid?.masjidUsers?.[0]?.user?.email || manageMasjid?.email}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    Dispatches the official <strong>MasjidPay Welcome & Portal Activation Email</strong> with live production links (<code className="text-emerald-400 font-mono">https://masjidpay.org</code>).
                  </p>

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                    <div className="text-slate-300">
                      <strong className="text-white">Admin Dashboard Login:</strong> <span className="text-emerald-400 font-mono font-bold">https://masjidpay.org/login</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setManageMasjid(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWelcomeEmail}
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-[#064E3B] hover:bg-emerald-900 text-[#F4D06F] font-extrabold rounded-xl text-xs shadow-lg transition disabled:opacity-50 flex items-center gap-2 border border-[#D4AF37]/50"
                  >
                    <i className="fas fa-paper-plane"></i> {actionLoading ? 'Dispatching...' : 'Send Official Welcome Email'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: VERIFY DOCUMENTS & REGISTRATION CREDENTIALS */}
            {activeTab === 'DOCUMENTS' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="font-extrabold text-amber-300 text-xs flex items-center gap-2">
                      <i className="fas fa-shield-halved"></i> Verification & Compliance Dossier
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase border ${
                      manageMasjid.status === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : manageMasjid.status === 'PENDING'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-red-950 text-red-400 border-red-800'
                    }`}>
                      {manageMasjid.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Waqf Board Property / Reg ID:</span>
                      <span className="text-white font-mono font-bold">{manageMasjid.waqfId || 'Not Submitted / Pending'}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Trust / Society Registration No:</span>
                      <span className="text-white font-mono font-bold">{manageMasjid.regNumber || 'Not Submitted / Pending'}</span>
                    </div>
                  </div>

                  {/* SUBMITTED DOCUMENT ATTACHMENTS */}
                  <div>
                    <span className="text-slate-400 block text-[11px] font-bold uppercase mb-2">
                      Uploaded Verification Documents ({manageMasjid.documents?.length || 0})
                    </span>

                    {(!manageMasjid.documents || manageMasjid.documents.length === 0) ? (
                      <div className="p-6 bg-slate-900/60 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                        <i className="fas fa-folder-open text-2xl mb-1.5 block text-slate-600"></i>
                        No uploaded PDF files or scans attached yet. Admin can upload via Mosque Documents Portal.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {manageMasjid.documents.map((doc: any) => (
                          <div key={doc.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-file-pdf text-amber-400 text-base"></i>
                              <div>
                                <span className="font-bold text-white block">{doc.title}</span>
                                <span className="text-[10px] text-slate-400">{doc.category} • {doc.fileSize || 'PDF'}</span>
                              </div>
                            </div>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] flex items-center gap-1"
                            >
                              <i className="fas fa-external-link-alt"></i> View File
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    Audit Status: <strong className="text-emerald-400">Super Admin Verified</strong>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setManageMasjid(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Close
                    </button>
                    {manageMasjid.status !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => {
                          handleAction(manageMasjid.id, 'APPROVE');
                          setManageMasjid(null);
                        }}
                        disabled={actionLoading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <i className="fas fa-check-circle"></i> Approve & Verify Mosque
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SUPER ADMIN EXCLUSIVE PAYMENT & UPI CONFIGURATION */}
            {activeTab === 'PAYMENT' && (
              <form onSubmit={handleSavePaymentGateway} className="space-y-4">
                <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-[11px] text-emerald-300 flex items-start gap-2.5">
                  <i className="fas fa-shield-halved text-emerald-400 text-sm mt-0.5"></i>
                  <div>
                    <strong className="text-white block font-bold">Super Admin Exclusive Payment Control:</strong>
                    Mosque administrators cannot modify UPI or Razorpay payment details themselves. Only verified Super Admin changes are applied to protect donors and eliminate fraud.
                  </div>
                </div>

                {/* DIRECT UPI CONFIGURATION */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-qrcode text-emerald-400"></i>
                      <span className="font-extrabold text-white text-xs">Direct UPI QR Code Details</span>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editEnableUpi}
                        onChange={(e) => setEditEnableUpi(e.target.checked)}
                        className="w-4 h-4 rounded accent-emerald-500"
                      />
                      <span className={`text-[11px] font-bold ${editEnableUpi ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {editEnableUpi ? 'UPI Enabled' : 'UPI Disabled'}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                        Mosque UPI VPA ID <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={editUpiId}
                        onChange={(e) => setEditUpiId(e.target.value)}
                        placeholder="e.g. mosque@sbi or 9894977003@okaxis"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                        UPI Payee / Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={editUpiPayeeName}
                        onChange={(e) => setEditUpiPayeeName(e.target.value)}
                        placeholder="e.g. Juma Masjid Trust"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* BANK ACCOUNT DETAILS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-900">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={editBankName}
                        onChange={(e) => setEditBankName(e.target.value)}
                        placeholder="State Bank of India"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Account No</label>
                      <input
                        type="text"
                        value={editBankAccNo}
                        onChange={(e) => setEditBankAccNo(e.target.value)}
                        placeholder="38920194821"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={editBankIfsc}
                        onChange={(e) => setEditBankIfsc(e.target.value)}
                        placeholder="SBIN0001234"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono uppercase text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* RAZORPAY GATEWAY CREDENTIALS */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-credit-card text-sky-400"></i>
                      <span className="font-extrabold text-white text-xs">Razorpay Online Payment Gateway</span>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editEnableRazorpay}
                        onChange={(e) => setEditEnableRazorpay(e.target.checked)}
                        className="w-4 h-4 rounded accent-sky-500"
                      />
                      <span className={`text-[11px] font-bold ${editEnableRazorpay ? 'text-sky-400' : 'text-slate-500'}`}>
                        {editEnableRazorpay ? 'Razorpay Active' : 'Razorpay Disabled'}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Razorpay Key ID</label>
                      <input
                        type="text"
                        value={editRazorpayKeyId}
                        onChange={(e) => setEditRazorpayKeyId(e.target.value)}
                        placeholder="rzp_live_..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Razorpay Key Secret</label>
                      <input
                        type="password"
                        value={editRazorpayKeySecret}
                        onChange={(e) => setEditRazorpayKeySecret(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setManageMasjid(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <i className="fas fa-lock"></i> {actionLoading ? 'Saving...' : 'Save & Lock Payment Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {selectedMasjid && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Reject Account Request</h3>
            <p className="text-xs text-slate-400 mb-4">
              Rejecting request for <strong className="text-white">{selectedMasjid.name}</strong>. Provide a clear reason for the applicant.
            </p>

            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid organization documentation or incomplete registration details."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:border-red-500 mb-4 text-white"
            ></textarea>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedMasjid(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(selectedMasjid.id, 'REJECT')}
                disabled={actionLoading || !rejectionReason}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
