'use client';

import { useState } from 'react';

export default function DataBackupPage() {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Checkbox State matching screenshot
  const [selectedTypes, setSelectedTypes] = useState({
    members: true,
    memberPayments: true,
    imams: true,
    monthlyCollection: true,
    imamPayouts: true,
    mosqueIncome: true,
    expenses: true,
    recycleBin: true,
    documents: true,
  });

  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');

  const allKeys = Object.keys(selectedTypes) as (keyof typeof selectedTypes)[];
  const isAllSelected = allKeys.every((k) => selectedTypes[k]);

  const handleToggleAll = () => {
    const nextVal = !isAllSelected;
    const updated = { ...selectedTypes };
    allKeys.forEach((k) => {
      updated[k] = nextVal;
    });
    setSelectedTypes(updated);
  };

  const handleToggleItem = (key: keyof typeof selectedTypes) => {
    setSelectedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadBackup = () => {
    const activeKeys = allKeys.filter((k) => selectedTypes[k]);
    if (activeKeys.length === 0) {
      setErrorMsg('Please select at least one data type to export.');
      return;
    }

    setDownloading(true);
    setErrorMsg('');
    setStatusMsg('');

    const typesParam = activeKeys.join(',');
    window.location.href = `/api/backup?masjidId=jama-masjid&types=${typesParam}`;

    setTimeout(() => {
      setDownloading(false);
      setStatusMsg('Data backup download initiated successfully!');
    }, 1500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a backup file (.json) to restore.');
      return;
    }

    setRestoring(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const fileText = await selectedFile.text();
      const payload = JSON.parse(fileText);

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masjidIdParam: 'jama-masjid',
          payload,
          restoreMode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg(data.message || 'Database restored successfully!');
        setSelectedFile(null);
      } else {
        setErrorMsg(data.error || 'Failed to restore backup file.');
      }
    } catch (err) {
      setErrorMsg('Invalid backup file format. Please upload a valid JSON backup file.');
    } finally {
      setRestoring(false);
    }
  };

  const dataCards = [
    { key: 'members', label: 'Members', icon: 'fa-users' },
    { key: 'memberPayments', label: 'Member Payments', icon: 'fa-credit-card' },
    { key: 'imams', label: 'Imams', icon: 'fa-mosque' },
    { key: 'monthlyCollection', label: 'Monthly Member Collection', icon: 'fa-[#0F3D26] fa-dollar-sign' },
    { key: 'imamPayouts', label: 'Imam Payouts', icon: 'fa-arrow-up-from-bracket' },
    { key: 'mosqueIncome', label: 'Mosque Income', icon: 'fa-chart-line' },
    { key: 'expenses', label: 'Expenses', icon: 'fa-chart-line-down' },
    { key: 'recycleBin', label: 'Recycle Bin Items', icon: 'fa-trash-can' },
    { key: 'documents', label: 'Documents', icon: 'fa-folder-closed' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-800">
      {/* HEADER MATCHING SCREENSHOT */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">SYSTEM</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Data Backup</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Export and import your mosque data for backup and recovery
        </p>
      </div>

      {/* TOP TABS MATCHING SCREENSHOT */}
      <div className="p-1.5 bg-[#eaf3ed] rounded-2xl flex items-center gap-2 border border-[#d2e6d7]">
        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
            activeTab === 'export'
              ? 'bg-white text-[#0F3D26] shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <i className="fas fa-upload text-xs"></i> Export Data
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
            activeTab === 'import'
              ? 'bg-white text-[#0F3D26] shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <i className="fas fa-download text-xs"></i> Import Data
        </button>
      </div>

      {/* ALERT MESSAGES */}
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

      {/* EXPORT TAB CONTENT MATCHING SCREENSHOT */}
      {activeTab === 'export' && (
        <div className="masjid-card bg-[#faf8f5] border border-slate-200/80 shadow-sm rounded-3xl overflow-hidden space-y-6">
          {/* SUB-HEADER */}
          <div className="p-6 border-b border-slate-200/60 bg-white/50">
            <h3 className="text-sm font-extrabold text-slate-900">Select Data to Export</h3>
            <p className="text-xs text-slate-500 mt-0.5">Choose which data types to include in your backup file</p>
          </div>

          <div className="p-6 pt-0 space-y-6">
            {/* SELECT ALL CHECKBOX */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleAll}
                  className="w-5 h-5 rounded text-[#0F3D26] accent-[#0F3D26] cursor-pointer"
                />
                <span className="text-xs font-extrabold text-slate-900">Select All</span>
              </label>
            </div>

            {/* 3 COLUMNS OF DATA TYPE CARDS MATCHING SCREENSHOT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {dataCards.map((item) => {
                const checked = selectedTypes[item.key as keyof typeof selectedTypes];
                return (
                  <div
                    key={item.key}
                    onClick={() => handleToggleItem(item.key as keyof typeof selectedTypes)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                      checked
                        ? 'bg-[#f4faf6] border-[#0F3D26] shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}} // Controlled by container onClick
                      className="w-4 h-4 rounded text-[#0F3D26] accent-[#0F3D26] cursor-pointer shrink-0"
                    />
                    <div className="flex items-center gap-2 text-slate-800 overflow-hidden">
                      <i className={`fas ${item.icon} text-xs text-emerald-800 shrink-0`}></i>
                      <span className="text-xs font-bold truncate">{item.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DOWNLOAD BACKUP BUTTON MATCHING SCREENSHOT */}
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={downloading}
                className="px-8 py-3.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-950/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                <i className="fas fa-upload text-xs"></i>
                {downloading ? 'Exporting Backup Data...' : 'Download Backup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT / RESTORE TAB CONTENT */}
      {activeTab === 'import' && (
        <div className="masjid-card bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-sm font-extrabold text-slate-900">Import & Restore Mosque Data</h3>
            <p className="text-xs text-slate-500 mt-0.5">Upload a previously generated .json database backup file to restore mosque records</p>
          </div>

          <div className="space-y-5">
            {/* FILE DROPZONE */}
            <div className="border-2 border-dashed border-slate-300 hover:border-[#0F3D26] rounded-3xl p-8 text-center bg-slate-50/50 transition">
              <i className="fas fa-file-arrow-up text-3xl text-emerald-800 mb-3 block"></i>
              <p className="text-xs font-bold text-slate-800 mb-1">
                {selectedFile ? selectedFile.name : 'Click to select or drop your Backup File (.json)'}
              </p>
              <p className="text-[11px] text-slate-400">Supports JSON backup snapshots up to 50MB</p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="mt-4 text-xs mx-auto text-slate-600"
              />
            </div>

            {/* RESTORE MODE OPTIONS */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider block">Restore Mode</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="merge"
                    checked={restoreMode === 'merge'}
                    onChange={() => setRestoreMode('merge')}
                    className="accent-[#0F3D26]"
                  />
                  <span>Merge with Existing Data (Safe)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="overwrite"
                    checked={restoreMode === 'overwrite'}
                    onChange={() => setRestoreMode('overwrite')}
                    className="accent-[#0F3D26]"
                  />
                  <span>Replace & Overwrite Existing Data</span>
                </label>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleRestoreBackup}
                disabled={restoring || !selectedFile}
                className="px-8 py-3.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                <i className="fas fa-download text-xs"></i>
                {restoring ? 'Restoring Database...' : 'Restore Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
