'use client';

import { useEffect, useState } from 'react';

export default function RentalsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showShopModal, setShowShopModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<any>(null);

  // Form State
  const [shopNo, setShopNo] = useState('Shop #1');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('5000');
  const [payAmount, setPayAmount] = useState('');
  const [forMonth, setForMonth] = useState('August 2026');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');

  const [submitting, setSubmitting] = useState(false);
  const [isViewer, setIsViewer] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetch('/api/rentals')
      .then((res) => res.json())
      .then((data) => {
        setShops(data.shops || []);
        setPayments(data.payments || []);
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
    loadData();
  }, []);

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_SHOP',
          shopNo,
          tenantName,
          tenantPhone,
          monthlyRent: Number(monthlyRent),
        }),
      });
      if (res.ok) {
        setShowShopModal(false);
        setTenantName('');
        setTenantPhone('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollectRent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COLLECT_RENT',
          shopId: selectedShop.id,
          amount: Number(payAmount || selectedShop.monthlyRent),
          forMonth,
          paymentMethod,
        }),
      });
      if (res.ok) {
        setShowPayModal(false);
        setSelectedShop(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalMonthlyRentExpected = shops.reduce((sum, s) => sum + (Number(s.monthlyRent) || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rental Property Management</h1>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold rounded-full">
              {shops.length} Shops (₹{totalMonthlyRentExpected.toLocaleString('en-IN')}/mo)
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Track Mosque commercial shops, tenant agreements, and rent collection vouchers</p>
        </div>

        {!isViewer && (
          <button
            onClick={() => setShowShopModal(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl shadow-xs text-xs transition flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <i className="fas fa-store text-emerald-300"></i> Register New Shop
          </button>
        )}
      </div>

      {/* SHOPS ROSTER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Registered Properties & Tenants</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-xs font-medium">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-lg mr-2"></i> Loading rental properties...
          </div>
        ) : shops.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <i className="fas fa-store-slash text-3xl text-slate-300 block"></i>
            <p className="text-sm font-bold text-slate-700">No rental properties registered</p>
            <p className="text-xs text-slate-400">Click &quot;Register New Shop&quot; above to add your first commercial tenant.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 whitespace-nowrap">Shop Unit</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Tenant Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Phone Number</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Monthly Rent</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                  {!isViewer && <th className="px-5 py-3.5 whitespace-nowrap text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {shops.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-emerald-800 whitespace-nowrap text-xs">{s.shopNo}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">{s.tenantName}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{s.tenantPhone || 'N/A'}</td>
                    <td className="px-4 py-3.5 font-black text-slate-900 text-xs whitespace-nowrap">
                      ₹{Number(s.monthlyRent || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {s.status || 'OCCUPIED'}
                      </span>
                    </td>
                    {!isViewer && (
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <button
                          onClick={() => {
                            setSelectedShop(s);
                            setPayAmount(String(s.monthlyRent));
                            setShowPayModal(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-[11px] transition shadow-xs cursor-pointer"
                        >
                          Collect Rent
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RENTAL PAYMENTS HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Rent Collection Receipts</h2>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">No rent receipts recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 whitespace-nowrap">Voucher No</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Shop & Tenant</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Month Period</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Amount</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Payment Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-emerald-800 text-xs whitespace-nowrap">{p.receiptNo || 'REC-RENT'}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 block text-xs">{p.shopNo}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{p.tenantName}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-800 whitespace-nowrap">{p.forMonth}</td>
                    <td className="px-4 py-3.5 font-black text-slate-900 text-xs whitespace-nowrap">
                      ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {p.paymentMethod || 'BANK_TRANSFER'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD SHOP MODAL */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Register Rental Shop</h3>
              <button onClick={() => setShowShopModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddShop} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Shop / Unit Number *</label>
                <input
                  type="text"
                  required
                  value={shopNo}
                  onChange={(e) => setShopNo(e.target.value)}
                  placeholder="e.g. Shop #1, Complex Ground Floor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Tenant Full Name *</label>
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="e.g. Imran Basha"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Tenant Phone *</label>
                  <input
                    type="tel"
                    required
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Monthly Rent Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShopModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Register Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT RENT MODAL */}
      {showPayModal && selectedShop && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Collect Rent Voucher</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedShop.shopNo} &bull; {selectedShop.tenantName}
                </p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCollectRent} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Collection Month *</label>
                  <input
                    type="text"
                    required
                    value={forMonth}
                    onChange={(e) => setForMonth(e.target.value)}
                    placeholder="e.g. August 2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
