'use client';

import { useEffect, useState } from 'react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isViewer, setIsViewer] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    targetAmount: '',
    status: 'ACTIVE',
  });

  const masjidId = 'jama-masjid';

  const loadCampaigns = () => {
    setLoading(true);
    fetch(`/api/campaigns?masjidId=${masjidId}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data.campaigns || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        const role = d?.user?.role;
        setIsViewer(role === 'VIEWER' || role === 'COMMUNITY_VIEWER');
      })
      .catch(() => {});
    loadCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, masjidId }),
      });

      if (res.ok) {
        setShowModal(false);
        setForm({ name: '', description: '', targetAmount: '', status: 'ACTIVE' });
        loadCampaigns();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fundraising Campaigns</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Goal-oriented renovation drives and targeted collection projects</p>
        </div>

        {!isViewer && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 text-xs transition flex items-center gap-2"
          >
            <i className="fas fa-bullhorn"></i> Launch New Campaign
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center text-slate-400 py-8 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 mr-2"></i> Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-2 masjid-card p-12 text-center text-slate-500">
            <i className="fas fa-bullhorn text-3xl mb-2 text-slate-300 block"></i>
            <p className="text-sm font-semibold">No active campaigns currently.</p>
          </div>
        ) : (
          campaigns.map((c) => {
            const pct = Math.min(100, Math.round((c.collectedAmount / c.targetAmount) * 100));

            return (
              <div key={c.id} className="masjid-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-900">{c.name}</h3>
                  <span className="masjid-badge masjid-badge-success">{c.status}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>

                {/* PROGRESS BAR */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-500">Progress: {pct}%</span>
                    <span className="text-emerald-800">
                      ₹{c.collectedAmount.toLocaleString('en-IN')} of ₹{c.targetAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-700 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>{c._count?.donations || 0} Total Contributors</span>
                  <span>Started {new Date(c.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Launch New Campaign</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Masjid Dome Restoration"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Amount Goal (₹) *</label>
                <input
                  type="number"
                  required
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  placeholder="1000000"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain campaign purpose to potential donors..."
                  className="w-full p-3 border rounded-xl text-xs outline-none focus:border-emerald-600"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
