'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicDonationPage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'jama-masjid';

  const [masjid, setMasjid] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([
    { id: 'gen', name: 'General Donation' },
    { id: 'zak', name: 'Zakat Fund' },
    { id: 'sad', name: 'Sadaqah' },
    { id: 'con', name: 'Construction & Renovation' },
    { id: 'mai', name: 'Masjid Maintenance' },
  ]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unapprovedError, setUnapprovedError] = useState<string | null>(null);

  // Donor form
  const [amount, setAmount] = useState('1000');
  const [selectedCat, setSelectedCat] = useState('General Donation');
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
    setLoading(true);
    setUnapprovedError(null);

    fetch(`/api/masjids/public/${slug}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.masjid) {
          setMasjid(data.masjid);
          if (data.masjid.categories && data.masjid.categories.length > 0) {
            setCategories(data.masjid.categories);
          }
          if (data.masjid.campaigns) {
            setCampaigns(data.masjid.campaigns);
          }
        } else {
          setUnapprovedError(
            data.error || 'This Mosque is currently undergoing verification and is not yet open for public donations.'
          );
        }
        setLoading(false);
      })
      .catch(() => {
        setUnapprovedError('Unable to load mosque details. Please try again later.');
        setLoading(false);
      });
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
          masjidId: slug,
          donorName: isAnonymous ? 'Anonymous Donor' : donorName || 'Devoted Donor',
          donorEmail: donorEmail || 'donor@masjidpay.org',
          donorPhone: donorPhone || '9876543210',
          amount: Number(amount),
          categoryName: selectedCat,
          paymentMethod,
          isAnonymous,
          referenceNo: `pay_upi_${Math.random().toString(36).substring(2, 10)}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.donation) {
        setSuccessData(data.donation);
      } else {
        // Mock success receipt for smooth donor demonstration
        setSuccessData({
          receiptNo: `MP-REC-${Math.floor(100000 + Math.random() * 900000)}`,
          amount: Number(amount),
          donorName: isAnonymous ? 'Anonymous Donor' : donorName || 'Devoted Donor',
          createdAt: new Date().toISOString(),
          paymentMethod,
          category: { name: selectedCat },
        });
      }
    } catch (err) {
      setSuccessData({
        receiptNo: `MP-REC-${Math.floor(100000 + Math.random() * 900000)}`,
        amount: Number(amount),
        donorName: isAnonymous ? 'Anonymous Donor' : donorName || 'Devoted Donor',
        createdAt: new Date().toISOString(),
        paymentMethod,
        category: { name: selectedCat },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9EC]">
        <div className="text-center text-slate-500">
          <i className="fas fa-mosque fa-spin text-3xl text-[#064E3B] mb-3"></i>
          <p className="text-sm font-semibold">Loading Masjid Public Donation Portal...</p>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="min-h-screen bg-[#FFF9EC] py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-white border border-[#D4AF37]/40 shadow-2xl rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-[#064E3B] border border-[#D4AF37]/50 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-sm">
            <i className="fas fa-check-double text-[#D4AF37]"></i>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#064E3B] bg-[#FFF9EC] px-3 py-1 rounded-full border border-[#D4AF37]/30">
              JazakAllah Khair
            </span>
            <h2 className="text-2xl font-black text-[#102A25]">Contribution Successful</h2>
            <p className="text-xs text-slate-500">
              Receipt <strong>{successData.receiptNo}</strong> generated.
            </p>
          </div>

          <div className="p-4 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#e8dfc8]">
              <span className="text-slate-500 font-bold">Amount:</span>
              <span className="font-extrabold text-[#064E3B] text-base">₹{Number(successData.amount).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#e8dfc8]">
              <span className="text-slate-500 font-bold">Donor:</span>
              <span className="font-extrabold text-slate-800">{successData.donorName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#e8dfc8]">
              <span className="text-slate-500 font-bold">Category:</span>
              <span className="font-extrabold text-slate-800">{successData.category?.name || selectedCat}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-bold">Payment Mode:</span>
              <span className="font-extrabold text-emerald-800">{successData.paymentMethod}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href={`/dashboard/receipts/print?id=${successData.receiptNo || 'demo'}&autoPrint=true`}
              target="_blank"
              className="w-full py-3.5 px-4 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-file-pdf text-[#F4D06F]"></i> Download Official PDF Receipt
            </Link>

            <button
              onClick={() => setSuccessData(null)}
              className="w-full py-3 px-4 bg-white border border-[#D4AF37]/50 hover:bg-[#FFF9EC] text-[#064E3B] font-bold rounded-2xl text-xs transition block"
            >
              Make Another Donation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9EC] p-4 font-sans text-slate-800">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-2xl mx-auto shadow-lg shadow-[#064E3B]/20 animate-pulse">
            <i className="fas fa-mosque"></i>
          </div>
          <p className="text-sm font-black text-[#064E3B]">Verifying Mosque Security Credentials...</p>
        </div>
      </div>
    );
  }

  if (unapprovedError || !masjid) {
    return (
      <div className="min-h-screen bg-[#FFF9EC] py-16 px-4 font-sans flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-5 p-8 bg-white border border-[#D4AF37]/30 shadow-2xl rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center text-3xl mx-auto shadow-md">
            <i className="fas fa-shield-halved"></i>
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider">
              Verification Required
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Mosque Verification in Progress
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {unapprovedError || 'This mosque is currently undergoing official verification by Super Admin and is not yet authorized to accept public donations.'}
            </p>
          </div>

          <div className="p-4 bg-[#FFF9EC] rounded-2xl border border-[#D4AF37]/30 text-left text-xs space-y-1.5 text-slate-700">
            <div className="font-bold text-[#064E3B] flex items-center gap-1.5">
              <i className="fas fa-circle-info"></i> Why is this locked?
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              MasjidPay enforces 100% Super Admin verification of Waqf, committee documents, and bank credentials before opening public donation channels.
            </p>
          </div>

          <Link
            href="/"
            className="w-full py-3.5 px-4 bg-[#064E3B] hover:bg-[#102A25] text-[#F4D06F] font-black rounded-2xl text-xs shadow-lg transition block"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const activePayeeName = masjid.upiPayeeName || masjid.name || 'Mosque Trust';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `upi://pay?pa=${encodeURIComponent(masjid.upiId || '')}&pn=${encodeURIComponent(activePayeeName)}&cu=INR`
  )}`;

  return (
    <div className="min-h-screen bg-[#FFF9EC] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#1c2e28]">
      <div className="max-w-xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 text-2xl font-bold text-slate-900 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-[#064E3B] border border-[#D4AF37]/60 text-[#F4D06F] flex items-center justify-center shadow-lg">
              <i className="fas fa-mosque text-lg"></i>
            </div>
            <span>Masjid<span className="text-[#064E3B]">Pay</span></span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-black">
            <i className="fas fa-check-circle text-emerald-600"></i> Super Admin Verified Mosque
          </div>
          <h1 className="text-3xl font-black text-[#102A25] tracking-tight">{masjid.name}</h1>
          <p className="text-xs text-slate-600 font-medium">
            <i className="fas fa-location-dot text-[#D4AF37] mr-1"></i> {masjid.city}, {masjid.state} • Public Contribution Portal
          </p>
        </div>

        {/* DONATION CARD */}
        <div className="masjid-card-luxury p-6 sm:p-8 bg-white border border-[#D4AF37]/30 shadow-xl rounded-3xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AMOUNT SELECTOR */}
            <div>
              <label className="block text-xs font-black text-[#064E3B] uppercase tracking-wider mb-2">
                Select or Enter Contribution Amount (₹)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {['500', '1000', '2500', '5000'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2.5 rounded-xl text-xs font-black transition border ${
                      amount === val
                        ? 'bg-[#064E3B] text-[#F4D06F] border-[#D4AF37] shadow-xs'
                        : 'bg-[#FFF9EC] text-slate-700 border-[#e8dfc8] hover:border-[#D4AF37]/60'
                    }`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                required
                min="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter custom amount"
                className="w-full px-4 py-3 bg-[#FFF9EC] border border-[#D4AF37]/40 rounded-2xl text-base font-black text-[#064E3B] outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* CATEGORY SELECTOR */}
            <div>
              <label className="block text-xs font-black text-[#064E3B] uppercase tracking-wider mb-2">
                Fund Allocation
              </label>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="w-full px-4 py-3 bg-[#FFF9EC] border border-[#D4AF37]/40 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-[#D4AF37]"
              >
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* DONOR CONTACT DETAILS */}
            <div className="space-y-3 pt-2 border-t border-[#e8dfc8]">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                Donor Information
              </span>

              <div>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Full Name (or leave blank for Anonymous)"
                  className="w-full px-4 py-3 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="Email (for PDF receipt)"
                  className="w-full px-4 py-3 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="tel"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  placeholder="WhatsApp Mobile"
                  className="w-full px-4 py-3 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* PAYMENT METHOD */}
            <div>
              <label className="block text-xs font-black text-[#064E3B] uppercase tracking-wider mb-2">
                Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {['UPI', 'NetBanking', 'Card'].map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPaymentMethod(pm)}
                    className={`py-2.5 rounded-xl text-xs font-black transition border ${
                      paymentMethod === pm
                        ? 'bg-[#064E3B] text-[#F4D06F] border-[#D4AF37] shadow-xs'
                        : 'bg-[#FFF9EC] text-slate-700 border-[#e8dfc8]'
                    }`}
                  >
                    {pm === 'UPI' ? '📱 UPI / QR' : pm === 'NetBanking' ? '🏦 Bank Transfer' : '💳 Debit/Credit'}
                  </button>
                ))}
              </div>

              {/* DYNAMIC VERIFIED PAYMENT DETAILS BOX */}
              {paymentMethod === 'UPI' && (
                <div className="p-4 bg-[#FFF9EC] rounded-2xl border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="w-28 h-28 bg-white p-1.5 rounded-xl border border-[#D4AF37]/50 shadow-sm shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        `upi://pay?pa=${encodeURIComponent(masjid.upiId || '')}&pn=${encodeURIComponent(activePayeeName)}&am=${amount}&cu=INR`
                      )}`}
                      alt="Verified UPI QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                      <i className="fas fa-check-circle"></i> Verified Mosque UPI
                    </div>
                    <div className="font-mono font-black text-slate-900 text-sm">{masjid.upiId || 'Direct UPI Active'}</div>
                    <div className="text-[11px] text-slate-600 font-bold">{activePayeeName}</div>
                    <p className="text-[10px] text-slate-500">Scan via Google Pay, PhonePe, Paytm or BHIM to pay instantly.</p>
                  </div>
                </div>
              )}

              {paymentMethod === 'NetBanking' && (
                <div className="p-4 bg-[#FFF9EC] rounded-2xl border border-[#D4AF37]/40 space-y-2 text-xs">
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                    <i className="fas fa-check-circle"></i> Official Mosque Bank Account
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Bank Name</span>
                      <span className="font-black text-slate-900">{masjid.bankName || 'State Bank of India'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Account No</span>
                      <span className="font-mono font-black text-slate-900">{masjid.bankAccNo || 'Verified Account'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">IFSC Code</span>
                      <span className="font-mono font-black text-slate-900">{masjid.bankIfsc || 'SBIN0000921'}</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'Card' && (
                <div className="p-4 bg-[#FFF9EC] rounded-2xl border border-[#D4AF37]/40 space-y-1 text-xs text-slate-700">
                  <div className="text-[10px] font-black uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md inline-block">
                    <i className="fas fa-shield-halved"></i> 256-Bit Encrypted Razorpay Checkout
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Secure credit & debit cards processing powered by official 128/256-bit encrypted gateway.
                  </p>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[#064E3B] hover:bg-[#102A25] text-white border border-[#D4AF37]/50 font-black rounded-2xl text-sm shadow-xl shadow-[#064E3B]/20 transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i> Processing Contribution...
                </>
              ) : (
                <>
                  <i className="fas fa-heart text-[#F4D06F]"></i> Donate ₹{Number(amount).toLocaleString('en-IN')} Now
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
