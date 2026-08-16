'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicDonationPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [masjid, setMasjid] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Donor form
  const [amount, setAmount] = useState('1000');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Checkout state
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    // Load Masjid & options
    fetch(`/api/dashboard/stats?masjidId=jama-masjid`)
      .then((res) => res.json())
      .then((data) => {
        setMasjid({
          name: 'Jama Masjid Vaniyambadi',
          city: 'Vaniyambadi',
          state: 'Tamil Nadu',
          upiId: 'jamamasjid@sbi',
          bankName: 'State Bank of India',
          accNo: '30492817405',
          ifsc: 'SBIN0000921',
        });
        setCategories(data.charts?.donationCategories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/campaigns?masjidId=jama-masjid&status=ACTIVE`)
      .then((res) => res.json())
      .then((cData) => setCampaigns(cData.campaigns || []));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simulate real checkout & generate receipt record via API
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masjidId: 'jama-masjid',
          donorName: isAnonymous ? 'Anonymous Donor' : donorName,
          donorEmail,
          donorPhone,
          amount: Number(amount),
          categoryId: 'default-cat',
          fundId: 'default-fund',
          campaignId: selectedCampaign || undefined,
          paymentMethod,
          isAnonymous,
          referenceNo: `pay_online_${Math.random().toString(36).substring(2, 10)}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessData(data.donation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6faf6]">
        <div className="text-center text-slate-500">
          <i className="fas fa-mosque fa-spin text-3xl text-emerald-700 mb-3"></i>
          <p className="text-sm font-semibold">Loading Masjid Public Donation Portal...</p>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6faf6] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl text-center space-y-4 border border-emerald-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl mx-auto">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">JazakAllah Khair!</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your generous contribution of <strong className="text-emerald-900 text-sm">₹{successData.amount.toLocaleString('en-IN')}</strong> has been received successfully.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-left space-y-1">
            <div className="flex justify-between"><span className="text-slate-400">Receipt No:</span><span className="font-bold text-slate-900">{successData.receiptNo}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Date:</span><span className="text-slate-800">{new Date(successData.date).toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Payment:</span><span className="text-emerald-800 font-bold">{successData.paymentMethod}</span></div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={`/dashboard/receipts/${successData.id}`}
              target="_blank"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition"
            >
              Download Official Tax Receipt
            </Link>
            <button
              onClick={() => setSuccessData(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
            >
              Make Another Donation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6faf6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* MASJID BRANDING CARD */}
        <div className="masjid-card p-6 text-center bg-white border border-emerald-100 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-3xl mx-auto mb-3 shadow-md shadow-emerald-700/20">
            <i className="fas fa-mosque"></i>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{masjid?.name}</h1>
          <p className="text-xs text-slate-500 mt-1">{masjid?.city}, {masjid?.state} • Official Donation Portal</p>
        </div>

        {/* DONATION FORM */}
        <div className="masjid-card p-6 sm:p-8 bg-white shadow-xl space-y-6">
          <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
            <i className="fas fa-heart text-emerald-700"></i> Support Your Masjid
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* AMOUNT PRESETS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Donation Amount (₹)</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {['500', '1000', '2500', '5000'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`py-2.5 font-extrabold text-xs rounded-xl border transition ${
                      amount === preset
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Custom Amount"
                  className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:border-emerald-600 font-bold text-slate-900"
                />
              </div>
            </div>

            {/* CAMPAIGN PICKER */}
            {campaigns.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Campaign (Optional)</label>
                <select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="">General Support & Maintenance</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Goal: ₹{c.targetAmount.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DONOR INFORMATION */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Your Information</label>
              <input
                type="text"
                required={!isAnonymous}
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600"
                />
                <input
                  type="text"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anonPublic"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <label htmlFor="anonPublic" className="text-xs text-slate-700 font-semibold">
                  Make donation anonymous on public records
                </label>
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Option</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: 'fa-qrcode' },
                  { id: 'RAZORPAY', label: 'Card / Netbanking', icon: 'fa-credit-card' },
                  { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'fa-university' },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`p-3 text-center rounded-xl border transition ${
                      paymentMethod === pm.id
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <i className={`fas ${pm.icon} text-lg mb-1 block`}></i>
                    <span className="text-[11px] block">{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CHECKOUT SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-700/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i> Processing Payment...
                </>
              ) : (
                <>
                  <i className="fas fa-lock"></i> Complete Donation (₹{Number(amount || 0).toLocaleString('en-IN')})
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
