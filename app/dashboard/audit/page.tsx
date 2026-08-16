'use client';

import { useEffect, useState } from 'react';

export default function TenantAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const masjidId = 'jama-masjid';

  useEffect(() => {
    fetch(`/api/super-admin/audit`)
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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit Trail & Security Log</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Immutable track record of user actions, financial creations, and modifications</p>
      </div>

      <div className="masjid-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mr-2"></i> Loading security audit log...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-clock-rotate-left text-3xl mb-2 text-slate-300 block"></i>
            <p className="text-sm font-semibold">No audit activity logged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="masjid-table font-mono text-xs">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Modifications</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="font-bold text-slate-900">{log.userEmail || 'System'}</td>
                    <td>
                      <span className="masjid-badge masjid-badge-info">{log.action}</span>
                    </td>
                    <td className="text-slate-700 font-semibold">{log.entity}</td>
                    <td className="text-slate-500 truncate max-w-xs">{log.afterState || '—'}</td>
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
