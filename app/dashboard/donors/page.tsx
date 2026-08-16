'use client';

import { useEffect, useState } from 'react';

export default function DonorsPage() {
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const masjidId = 'jama-masjid';

  const loadDonors = () => {
    setLoading(true);
    fetch(`/api/donors?masjidId=${masjidId}&q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        setDonors(data.donors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadDonors();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Donor Directory</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage donor profiles, contact information, and contribution history</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search donor name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadDonors()}
            className="px-3.5 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 w-64"
          />
          <button onClick={loadDonors} className="px-3 py-2 bg-slate-100 font-semibold rounded-xl text-xs">
            Search
          </button>
        </div>
      </div>

      <div className="masjid-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mr-2"></i> Loading donor directory...
          </div>
        ) : donors.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <i className="fas fa-users text-3xl mb-2 text-slate-300 block"></i>
            <p className="text-sm font-semibold">No donor records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="masjid-table">
              <thead>
                <tr>
                  <th>Donor Name</th>
                  <th>Contact Info</th>
                  <th>Total Lifetime Donated</th>
                  <th>Total Donations</th>
                  <th>Recurring Status</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <span className="font-bold text-slate-900 block">{d.name}</span>
                      <span className="text-[10px] text-slate-400 block">{d.address || 'Address N/A'}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-700 font-semibold block">{d.phone || 'Phone N/A'}</span>
                      <span className="text-[10px] text-slate-400 block">{d.email || 'Email N/A'}</span>
                    </td>
                    <td className="font-extrabold text-emerald-800 text-sm">
                      ₹{d.totalDonated.toLocaleString('en-IN')}
                    </td>
                    <td className="text-xs text-slate-600 font-semibold">
                      {d._count?.donations || 0} contributions
                    </td>
                    <td>
                      {d._count?.recurringDonations > 0 ? (
                        <span className="masjid-badge masjid-badge-success">Subscribed ({d._count.recurringDonations})</span>
                      ) : (
                        <span className="masjid-badge masjid-badge-info">One-time Donor</span>
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
