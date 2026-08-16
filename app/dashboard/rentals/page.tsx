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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rental Property Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Track Mosque shops, tenant rents, and collection vouchers</p>
        </div>

        <button
          onClick={() => setShowShopModal(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md text-xs transition flex items-center gap-2"
        >
          <i className="fas fa-store"></i> Register New Shop
        </button>
      </div>

      {/* SHOPS ROSTER */}
      <div className="masjid-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900">Rental Properties & Tenants</div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mr-2"></i> Loading rental properties...
          </div>
        ) : shops.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No registered shops or rental units.</div>
        ) : (
          <table className="masjid-table">
            <thead>
              <tr>
                <th>Shop No</th>
                <th>Tenant Name</th>
                <th>Tenant Phone</th>
                <th>Monthly Rent</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id}>
                  <td className="font-extrabold text-emerald-800">{s.shopNo}</td>
                  <td className="font-bold text-slate-900">{s.tenantName}</td>
                  <td className="text-xs font-mono">{s.tenantPhone}</td>
                  <td className="font-extrabold text-slate-900">₹{s.monthlyRent.toLocaleString('en-IN')}</td>
                  <td><span className="masjid-badge masjid-badge-success">{s.status}</span></td>
                  <td className="text-right">
                    <button
                      onClick={() => {
                        setSelectedShop(s);
                        setPayAmount(String(s.monthlyRent));
                        setShowPayModal(true);
                      }}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs transition"
                    >
                      Collect Rent
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* RENTAL PAYMENTS HISTORY */}
      <div className="masjid-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900">Rent Receipts History</div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No rent receipts recorded.</div>
        ) : (
          <table className="masjid-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Date</th>
                <th>Shop & Tenant</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono font-bold text-emerald-800 text-xs">{p.receiptNo}</td>
                  <td className="text-xs text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td className="font-bold text-slate-900">{p.shopNo} - {p.tenantName}</td>
                  <td className="text-xs font-semibold">{p.forMonth}</td>
                  <td className="font-extrabold text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td><span className="masjid-badge masjid-badge-info">{p.paymentMethod}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD SHOP MODAL */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Register Rental Shop / Property</h3>
            <form onSubmit={handleAddShop} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shop No / Title</label>
                <input
                  type="text"
                  required
                  value={shopNo}
                  onChange={(e) => setShopNo(e.target.value)}
                  placeholder="Shop #1"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tenant Full Name</label>
                <input
                  type="text"
                  required
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Abdul Rahman (Book Store)"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tenant Phone Number</label>
                <input
                  type="text"
                  required
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  placeholder="+91 98456 78901"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Rent (₹)</label>
                <input
                  type="number"
                  required
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowShopModal(false)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl">Save Property</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT RENT MODAL */}
      {showPayModal && selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Record Rent for {selectedShop.shopNo}</h3>
            <form onSubmit={handleCollectRent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">For Month</label>
                <select
                  value={forMonth}
                  onChange={(e) => setForMonth(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="August 2026">August 2026</option>
                  <option value="September 2026">September 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rent Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl">Save & Issue Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
