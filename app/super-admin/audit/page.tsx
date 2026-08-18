'use client';

import { useEffect, useState } from 'react';

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/super-admin/audit')
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.auditLogs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Platform Master Audit Log</h1>
        <p className="text-slate-400 text-sm mt-1">Immutable track record of system authentication, approvals, and financial modifications</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {!mounted || loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-400 mr-2"></i> Loading audit history...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-history text-3xl mb-3 block text-slate-600"></i>
            <p className="text-sm">No audit records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Masjid Tenant</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">State Modifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-4 text-slate-400 whitespace-nowrap font-sans">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-sans font-semibold text-white">
                      {log.userEmail || 'System'}
                      {log.userRole && (
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          {log.userRole}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-sans text-slate-300">
                      {log.masjid?.name || 'Global / Platform'}
                    </td>
                    <td className="p-4 font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-bold uppercase text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-sans text-slate-400">{log.entity}</td>
                    <td className="p-4 text-slate-400 max-w-xs truncate">
                      {log.afterState ? (
                        <code className="text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 block truncate">
                          {log.afterState}
                        </code>
                      ) : (
                        '—'
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
  );
}
