'use client';

import { useEffect, useState } from 'react';

interface PermissionModule {
  key: string;
  name: string;
  icon: string;
  description: string;
  actions: {
    view: string;
    add?: string;
    edit?: string;
    delete?: string;
    report?: string;
  };
}

const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: 'donations',
    name: 'Donations & Sadaqah Vaults',
    icon: 'fa-heart',
    description: 'Track donor donations, Zakat contributions, and issue PDF receipts',
    actions: {
      view: 'viewDonations',
      add: 'addDonations',
      edit: 'editDonations',
      delete: 'voidDonations',
      report: 'exportDonations',
    },
  },
  {
    key: 'members',
    name: 'Monthly Members & Collections',
    icon: 'fa-users',
    description: 'Manage registered mosque members and record monthly subscription fees',
    actions: {
      view: 'viewMembers',
      add: 'addMembers',
      edit: 'editMembers',
      delete: 'deleteMembers',
      report: 'recordCollections',
    },
  },
  {
    key: 'expenses',
    name: 'Expenses & Maintenance Outflows',
    icon: 'fa-receipt',
    description: 'Record utility bills, repair expenses, and track category budgets',
    actions: {
      view: 'viewExpenses',
      add: 'addExpenses',
      edit: 'editExpenses',
      delete: 'voidExpenses',
      report: 'exportExpenses',
    },
  },
  {
    key: 'income',
    name: 'Mosque Income & Rental Shops',
    icon: 'fa-building',
    description: 'Track shop rentals, hall bookings, and auxiliary mosque revenues',
    actions: {
      view: 'viewIncome',
      add: 'addIncome',
      edit: 'editIncome',
      delete: 'deleteIncome',
    },
  },
  {
    key: 'payroll',
    name: 'Staff & Imam Payroll',
    icon: 'fa-id-card',
    description: 'Manage staff profiles, attendance, allowances, and salary disbursement',
    actions: {
      view: 'viewPayroll',
      add: 'addStaff',
      edit: 'processPayroll',
      delete: 'deleteStaff',
    },
  },
  {
    key: 'funds',
    name: 'Fund Vaults & Bank Transfers',
    icon: 'fa-vault',
    description: 'Inter-fund transfers (General to Construction) and restricted Zakat vaults',
    actions: {
      view: 'viewFunds',
      add: 'transferFunds',
      edit: 'manageFunds',
    },
  },
  {
    key: 'reports',
    name: 'Financial Reports & Audit Trail',
    icon: 'fa-file-invoice-dollar',
    description: 'Monthly balance sheets, income/expense reports, and audit logs',
    actions: {
      view: 'viewReports',
      add: 'exportReports',
      edit: 'viewAuditLogs',
    },
  },
  {
    key: 'admin',
    name: 'Administration & System Settings',
    icon: 'fa-shield-halved',
    description: 'Manage committee user accounts, permissions, and mosque configuration',
    actions: {
      view: 'manageUsers',
      edit: 'manageSettings',
    },
  },
];

export default function UsersPermissionsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [rolePresets, setRolePresets] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Add User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TREASURER');
  const [customTitle, setCustomTitle] = useState('Treasurer');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Access PIN Modal State
  const [userPin, setUserPin] = useState('');
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinError, setPinError] = useState('');

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/masjid/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setRolePresets(data.rolePresets || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle Preset Selection for Add Form
  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    if (rolePresets[newRole]) {
      setPermissions({ ...rolePresets[newRole] });
    }
    if (newRole === 'MASJID_ADMIN') setCustomTitle('Mosque Administrator');
    else if (newRole === 'TREASURER') setCustomTitle('Treasurer / Accountant');
    else if (newRole === 'COLLECTOR') setCustomTitle('Collection In-charge');
    else if (newRole === 'AUDITOR') setCustomTitle('Committee Auditor');
  };

  const handleOpenAddModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('TREASURER');
    setCustomTitle('Treasurer / Accountant');
    setPermissions(rolePresets.TREASURER || {});
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setRole(user.role);
    setCustomTitle(user.customTitle || '');
    setPermissions({ ...user.permissions });
    setShowEditModal(true);
  };

  const handleTogglePermission = (key: string) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleModuleAll = (module: PermissionModule, enable: boolean) => {
    const updated = { ...permissions };
    Object.values(module.actions).forEach((actionKey) => {
      if (actionKey) updated[actionKey] = enable;
    });
    setPermissions(updated);
  };

  // Submit Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/masjid/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role,
          customTitle,
          permissions,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        loadUsers();
      } else {
        alert(data.error || 'Failed to add user');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Permissions
  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/masjid/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masjidUserId: selectedUser.id,
          role,
          customTitle,
          permissions,
        }),
      });
      if (res.ok) {
        setShowEditModal(false);
        loadUsers();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/masjid/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masjidUserId: selectedUser.id,
          newPassword,
        }),
      });
      if (res.ok) {
        alert(`Password for ${selectedUser.name} has been updated successfully.`);
        setShowPasswordModal(false);
        setNewPassword('');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open PIN Modal
  const handleOpenPinModal = (user: any) => {
    setSelectedUser(user);
    setUserPin('');
    setPinError('');
    setPinSuccess('');
    setShowPinModal(true);
  };

  // Save / Update User Access PIN
  const handleSaveUserPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !userPin.trim()) return;
    setPinSubmitting(true);
    setPinError('');
    setPinSuccess('');

    try {
      const res = await fetch(`/api/masjid/users/${selectedUser.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessPin: userPin.trim(),
          enable: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || 'Failed to update access PIN');
      } else {
        setPinSuccess(`✓ Access PIN successfully set for ${selectedUser.name}!`);
        setUserPin('');
        loadUsers();
      }
    } catch (err: any) {
      setPinError(err.message || 'An error occurred');
    } finally {
      setPinSubmitting(false);
    }
  };

  // Revoke / Disable User Access PIN
  const handleRevokeUserPin = async () => {
    if (!selectedUser) return;
    if (!confirm(`Are you sure you want to revoke and disable the Access PIN for ${selectedUser.name}? Standard password login will apply.`)) return;

    setPinSubmitting(true);
    setPinError('');
    setPinSuccess('');

    try {
      const res = await fetch(`/api/masjid/users/${selectedUser.id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: false }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || 'Failed to revoke access PIN');
      } else {
        setPinSuccess(`✓ Access PIN disabled for ${selectedUser.name}`);
        loadUsers();
      }
    } catch (err: any) {
      setPinError(err.message || 'An error occurred');
    } finally {
      setPinSubmitting(false);
    }
  };

  // Toggle User Active/Suspended
  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (confirm(`Are you sure you want to ${nextStatus === 'SUSPENDED' ? 'suspend' : 'activate'} ${user.name}?`)) {
      await fetch('/api/masjid/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masjidUserId: user.id, status: nextStatus }),
      });
      loadUsers();
    }
  };

  // Delete User
  const handleDeleteUser = async (user: any) => {
    if (confirm(`Are you sure you want to remove ${user.name} (${user.email}) from mosque committee access?`)) {
      await fetch(`/api/masjid/users?id=${user.id}`, { method: 'DELETE' });
      loadUsers();
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <i className="fas fa-circle-notch fa-spin text-[#064E3B] text-3xl mb-3"></i>
        <p className="text-sm font-semibold">Loading Committee Users & Permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 font-sans pb-16">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E] block">
            ACCESS CONTROL & SECURITY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A25] tracking-tight">
            User Permissions & Committee Roles
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Manage committee members, collectors, auditors, and assign granular View, Add, Edit, Delete, and Report permissions
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-950/20 transition flex items-center gap-2 shrink-0 border border-[#D4AF37]/50"
        >
          <i className="fas fa-user-plus text-[#F4D06F]"></i>
          <span>Add Committee Member</span>
        </button>
      </div>

      {/* 4 ROLE PRESET CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#D4AF37]/30 rounded-2xl shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center font-bold text-xs">
            <i className="fas fa-crown"></i>
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Mosque Admin</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Full root authority. Complete control over all financial records, member collections, payroll, settings, and user permissions.
          </p>
          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md">
            All 30 Permissions Active
          </span>
        </div>

        <div className="p-4 bg-white border border-[#D4AF37]/30 rounded-2xl shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
            <i className="fas fa-wallet"></i>
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Treasurer / Accountant</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Manage all day-to-day finances, record expenses, verify member amounts, process payroll, and export official reports.
          </p>
          <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-bold rounded-md">
            Full Financial Access
          </span>
        </div>

        <div className="p-4 bg-white border border-[#D4AF37]/30 rounded-2xl shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
            <i className="fas fa-hand-holding-dollar"></i>
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Collection In-Charge</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Restricted operator role for recording Friday donations, door-to-door member fees, and sending instant WhatsApp receipts.
          </p>
          <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-900 text-[10px] font-bold rounded-md">
            Add/Record Only
          </span>
        </div>

        <div className="p-4 bg-white border border-[#D4AF37]/30 rounded-2xl shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
            <i className="fas fa-magnifying-glass-chart"></i>
          </div>
          <h3 className="font-extrabold text-slate-900 text-sm">Auditor / Viewer</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Read-only audit access to view monthly statements, vouchers, donation ledgers, and system audit logs with zero edit/delete rights.
          </p>
          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
            Read-Only & Export
          </span>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="masjid-card overflow-hidden bg-white border border-[#D4AF37]/30 rounded-2xl shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Committee Members & Authorized Operators</h3>
            <p className="text-[11px] text-slate-400">All registered users with active authentication credentials for this mosque</p>
          </div>
          <span className="masjid-badge masjid-badge-success">{users.length} Authorized Users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="masjid-table w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">USER & CONTACT</th>
                <th className="py-3 px-3">DESIGNATED ROLE</th>
                <th className="py-3 px-3">PERMISSIONS GRANTED</th>
                <th className="py-3 px-3 text-center">2FA ACCESS PIN</th>
                <th className="py-3 px-3 text-center">ACCOUNT STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const grantedCount = Object.values(u.permissions || {}).filter(Boolean).length;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-black text-xs">
                          {u.name?.charAt(0)}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{u.email}</div>
                          {u.phone && <div className="text-[10px] text-slate-400 font-mono">📞 {u.phone}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-[11px] font-extrabold rounded-lg inline-block border border-slate-200">
                        {u.customTitle || u.role}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-md border border-emerald-200">
                          {grantedCount} Permissions
                        </span>
                        <div className="flex gap-1 text-[10px] text-slate-400">
                          {u.permissions?.viewDonations && <span title="Donations">❤️</span>}
                          {u.permissions?.viewMembers && <span title="Members">👥</span>}
                          {u.permissions?.viewExpenses && <span title="Expenses">🧾</span>}
                          {u.permissions?.viewPayroll && <span title="Payroll">👔</span>}
                          {u.permissions?.viewReports && <span title="Reports">📊</span>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {u.accessPinEnabled ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <i className="fas fa-shield-halved text-emerald-700"></i> PIN Active
                          </span>
                          {u.lastPinUsedAt && (
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              Used {new Date(u.lastPinUsedAt).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200">
                          Password Only
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPinModal(u)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-1"
                          title="Configure Access PIN"
                        >
                          <i className="fas fa-shield-halved text-[10px] text-emerald-700"></i> Access PIN
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#064E3B] border border-[#064E3B]/30 font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-1"
                          title="Configure Permissions"
                        >
                          <i className="fas fa-sliders text-[10px]"></i> Permissions
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowPasswordModal(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-1"
                          title="Reset Password"
                        >
                          <i className="fas fa-key text-[10px]"></i> Reset
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-xs ${
                            u.status === 'ACTIVE'
                              ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                          title={u.status === 'ACTIVE' ? 'Suspend Access' : 'Activate Access'}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          title="Remove User"
                        >
                          <i className="fas fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD NEW COMMITTEE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-[#D4AF37]/30 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Add New Committee Member</h3>
                <p className="text-xs text-slate-500 font-medium">Create credentials and assign granular module permissions</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Janab Farooq Ahmed"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farooq@jamamasjid.org"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Login Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role Preset</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-bold text-slate-900 bg-[#FFF9EC]"
                  >
                    <option value="MASJID_ADMIN">Mosque Administrator (Full Access)</option>
                    <option value="TREASURER">Treasurer / Accountant</option>
                    <option value="COLLECTOR">Collection In-Charge / Staff</option>
                    <option value="AUDITOR">Auditor / Committee Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Custom Title / Designation</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Joint Secretary / Trustee"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-semibold"
                  />
                </div>
              </div>

              {/* GRANULAR PERMISSION MATRIX */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Granular Module Permissions
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Tick permissions granted to this user</span>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {PERMISSION_MODULES.map((mod) => (
                    <div key={mod.key} className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <i className={`fas ${mod.icon} text-[#064E3B] text-xs`}></i>
                          <span className="font-extrabold text-slate-900 text-xs">{mod.name}</span>
                        </div>
                        <div className="flex gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(mod, true)}
                            className="text-[#064E3B] font-bold hover:underline"
                          >
                            All
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(mod, false)}
                            className="text-slate-400 font-bold hover:underline"
                          >
                            None
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                        {mod.actions.view && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={!!permissions[mod.actions.view]}
                              onChange={() => handleTogglePermission(mod.actions.view)}
                              className="rounded text-[#064E3B] focus:ring-0"
                            />
                            <span>View</span>
                          </label>
                        )}
                        {mod.actions.add && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={!!permissions[mod.actions.add]}
                              onChange={() => handleTogglePermission(mod.actions.add!)}
                              className="rounded text-[#064E3B] focus:ring-0"
                            />
                            <span>Add / Create</span>
                          </label>
                        )}
                        {mod.actions.edit && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={!!permissions[mod.actions.edit]}
                              onChange={() => handleTogglePermission(mod.actions.edit!)}
                              className="rounded text-[#064E3B] focus:ring-0"
                            />
                            <span>Edit</span>
                          </label>
                        )}
                        {mod.actions.delete && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-rose-700">
                            <input
                              type="checkbox"
                              checked={!!permissions[mod.actions.delete]}
                              onChange={() => handleTogglePermission(mod.actions.delete!)}
                              className="rounded text-rose-600 focus:ring-0"
                            />
                            <span>Delete / Void</span>
                          </label>
                        )}
                        {mod.actions.report && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-teal-800">
                            <input
                              type="checkbox"
                              checked={!!permissions[mod.actions.report]}
                              onChange={() => handleTogglePermission(mod.actions.report!)}
                              className="rounded text-teal-700 focus:ring-0"
                            />
                            <span>Reports</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : 'Authorize Committee Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER PERMISSIONS MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-[#D4AF37]/30 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Configure Permissions for {selectedUser.name}</h3>
                <p className="text-xs text-slate-500 font-medium">Email: <strong>{selectedUser.email}</strong></p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSavePermissions} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Role Preset</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-bold text-slate-900 bg-[#FFF9EC]"
                  >
                    <option value="MASJID_ADMIN">Mosque Administrator (Full Access)</option>
                    <option value="TREASURER">Treasurer / Accountant</option>
                    <option value="COLLECTOR">Collection In-Charge / Staff</option>
                    <option value="AUDITOR">Auditor / Committee Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Custom Title / Designation</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Vice President / Trustee"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-semibold"
                  />
                </div>
              </div>

              {/* GRANULAR PERMISSION MATRIX */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Granular Access Controls
                  </span>
                  <span className="text-[11px] text-emerald-800 font-bold">
                    {Object.values(permissions).filter(Boolean).length} Active Rights
                  </span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {PERMISSION_MODULES.map((mod) => (
                    <div key={mod.key} className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <i className={`fas ${mod.icon} text-[#064E3B] text-xs`}></i>
                          <span className="font-extrabold text-slate-900 text-xs">{mod.name}</span>
                        </div>
                        <div className="flex gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(mod, true)}
                            className="text-[#064E3B] font-bold hover:underline"
                          >
                            All
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(mod, false)}
                            className="text-slate-400 font-bold hover:underline"
                          >
                            None
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                        {mod.actions.view && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={!!permissions[mod.actions.view]}
                              onChange={() => handleTogglePermission(mod.actions.view)}
                              className="rounded text-[#064E3B] focus:ring-0"
                            />
                            <span>View</span>
                          </label>
                        )}
                        {mod.actions.add && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={!!permissions[mod.actions.add]}
                              onChange={() => handleTogglePermission(mod.actions.add!)}
                              className="rounded text-[#064E3B] focus:ring-0"
                            />
                            <span>Add / Create</span>
                          </label>
                        )}
                        {mod.actions.edit && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={!!permissions[mod.actions.edit]}
                              onChange={() => handleTogglePermission(mod.actions.edit!)}
                              className="rounded text-[#064E3B] focus:ring-0"
                            />
                            <span>Edit</span>
                          </label>
                        )}
                        {mod.actions.delete && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-rose-700">
                            <input
                              type="checkbox"
                              checked={!!permissions[mod.actions.delete]}
                              onChange={() => handleTogglePermission(mod.actions.delete!)}
                              className="rounded text-rose-600 focus:ring-0"
                            />
                            <span>Delete / Void</span>
                          </label>
                        )}
                        {mod.actions.report && (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-teal-800">
                            <input
                              type="checkbox"
                              checked={!!permissions[mod.actions.report]}
                              onChange={() => handleTogglePermission(mod.actions.report!)}
                              className="rounded text-teal-700 focus:ring-0"
                            />
                            <span>Reports</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-xs font-bold rounded-xl text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#D4AF37]/30">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Reset User Password</h3>
                <p className="text-xs text-slate-500 font-medium">User: <strong>{selectedUser.name}</strong> ({selectedUser.email})</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Secure Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-[#064E3B] font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#064E3B] text-white rounded-xl text-xs font-extrabold shadow-md"
                >
                  {submitting ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCESS PIN / SECURITY CODE MANAGEMENT MODAL */}
      {showPinModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 border border-emerald-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  <i className="fas fa-shield-halved"></i>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Security Access PIN</h3>
                  <p className="text-xs text-slate-500 font-medium">User: <strong>{selectedUser.name}</strong> ({selectedUser.email})</p>
                </div>
              </div>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base"
              >
                ✕
              </button>
            </div>

            {pinError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {pinError}
              </div>
            )}
            {pinSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                {pinSuccess}
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700">Current 2FA Status</span>
                {selectedUser.accessPinEnabled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Active PIN Protection
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-slate-500 bg-slate-200">
                    Disabled (Password Only)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When enabled, this user will be required to enter this custom Access Code after verifying their password to enter the dashboard.
              </p>
            </div>

            <form onSubmit={handleSaveUserPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {selectedUser.accessPinEnabled ? 'Rotate / Update Access PIN' : 'Assign New Access PIN'}
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={12}
                  value={userPin}
                  onChange={(e) => setUserPin(e.target.value)}
                  placeholder="e.g. 8492 or SECURE99"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono font-black text-center tracking-widest outline-none focus:border-emerald-700 bg-[#FFF9EC]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Must be at least 4 characters. It is securely hashed before saving in the database.
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={pinSubmitting || !userPin.trim()}
                  className="w-full py-2.5 bg-[#064E3B] hover:bg-[#102A25] text-white rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <i className="fas fa-check"></i> {pinSubmitting ? 'Saving...' : 'Set / Update Access PIN'}
                </button>

                {selectedUser.accessPinEnabled && (
                  <button
                    type="button"
                    onClick={handleRevokeUserPin}
                    disabled={pinSubmitting}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold transition disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <i className="fas fa-ban"></i> Revoke & Disable Access PIN
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-full py-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
