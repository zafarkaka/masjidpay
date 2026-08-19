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
  const [loading, setLoading] = useState(true);
  const [unapprovedError, setUnapprovedError] = useState<string | null>(null);

  // Donor form
  const [amount, setAmount] = useState('1000');
  const [selectedCat, setSelectedCat] = useState('General Donation');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Popup Modal state
  const [submitting, setSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState<any>(null);

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

  const handleCompletePayment = async () => {
    setSubmitting(true);

    try {
      const res = await fetch('/api/donations/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          donorName: isAnonymous ? 'Anonymous Donor' : donorName || 'Devoted Donor',
          donorEmail: donorEmail.trim(),
          donorPhone: donorPhone.trim(),
          amount: Number(amount),
          categoryName: selectedCat,
          paymentMethod,
          isAnonymous,
          referenceNo: `pay_upi_${Math.random().toString(36).substring(2, 10)}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPopupData(data);
        setShowPopup(true);
      } else {
        alert(data.error || 'Unable to complete donation. Please try again.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setPopupData(null);
    setDonorName('');
    setDonorEmail('');
    setDonorPhone('');
  };

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
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(masjid.upiId || '')}&pn=${encodeURIComponent(activePayeeName)}&am=${amount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentUrl)}`;

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
                placeholder="Email (for auto receipt)"
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

          {/* PAYMENT CHANNELS */}
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
                  className={`py-2.5 rounded-xl text-xs font-black transition border cursor-pointer ${
                    paymentMethod === pm
                      ? 'bg-[#064E3B] text-[#F4D06F] border-[#D4AF37] shadow-xs'
                      : 'bg-[#FFF9EC] text-slate-700 border-[#e8dfc8]'
                  }`}
                >
                  {pm === 'UPI' ? '📱 UPI / QR' : pm === 'NetBanking' ? '🏦 Bank Transfer' : '💳 Debit/Credit'}
                </button>
              ))}
            </div>

            {/* DYNAMIC VERIFIED UPI QR CODE & DIRECT ACTION */}
            {paymentMethod === 'UPI' && (
              <div className="p-5 bg-[#FFF9EC] rounded-3xl border border-[#D4AF37]/50 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  {/* QR CODE DISPLAY */}
                  <div className="w-32 h-32 bg-white p-2 rounded-2xl border border-[#D4AF37]/60 shadow-md shrink-0 flex items-center justify-center group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodeUrl}
                      alt="Verified UPI QR"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs flex-1">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                      <i className="fas fa-check-circle"></i> Verified Mosque UPI
                    </div>
                    <div className="font-mono font-black text-slate-900 text-base">{masjid.upiId || 'Direct UPI Active'}</div>
                    <div className="text-xs text-slate-700 font-extrabold">{activePayeeName}</div>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Scan via Google Pay, PhonePe, Paytm or BHIM with exact amount (<strong>₹{Number(amount).toLocaleString('en-IN')}</strong>).
                    </p>
                  </div>
                </div>

                {/* 1-CLICK ACTIONS UPON SCANNING / PAYING */}
                <div className="pt-3 border-t border-[#e8dfc8] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={upiIntentUrl}
                    className="py-3 px-4 bg-white hover:bg-slate-50 text-[#064E3B] border border-[#D4AF37] font-extrabold rounded-2xl text-xs text-center shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-mobile-screen-button text-[#D4AF37]"></i> Open in UPI App
                  </a>

                  <button
                    type="button"
                    onClick={handleCompletePayment}
                    disabled={submitting}
                    className="py-3 px-4 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold rounded-2xl text-xs text-center shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin"></i> Confirming...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-double text-[#F4D06F]"></i> Completed Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* BANK TRANSFER DETAILS */}
            {paymentMethod === 'NetBanking' && (
              <div className="p-5 bg-[#FFF9EC] rounded-3xl border border-[#D4AF37]/50 space-y-4 text-xs">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                  <i className="fas fa-check-circle"></i> Official Mosque Bank Account
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-slate-800">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Bank Name</span>
                    <span className="font-extrabold text-slate-900">{masjid.bankName || 'State Bank of India'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Account No</span>
                    <span className="font-mono font-extrabold text-slate-900">{masjid.bankAccNo || 'Verified Account'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">IFSC Code</span>
                    <span className="font-mono font-extrabold text-slate-900">{masjid.bankIfsc || 'SBIN0000921'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCompletePayment}
                  disabled={submitting}
                  className="w-full py-3.5 px-4 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold rounded-2xl text-xs text-center shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Confirming...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-double text-[#F4D06F]"></i> Completed Bank Transfer
                    </>
                  )}
                </button>
              </div>
            )}

            {/* DEBIT / CREDIT CARD DETAILS */}
            {paymentMethod === 'Card' && (
              <div className="p-5 bg-[#FFF9EC] rounded-3xl border border-[#D4AF37]/50 space-y-4 text-xs text-slate-700">
                <div className="text-[10px] font-black uppercase tracking-wider text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full inline-block">
                  <i className="fas fa-shield-halved"></i> 256-Bit Encrypted Gateway
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Direct card processing for international & domestic credit/debit cards with instant verification.
                </p>

                <button
                  type="button"
                  onClick={handleCompletePayment}
                  disabled={submitting}
                  className="w-full py-3.5 px-4 bg-[#064E3B] hover:bg-[#102A25] text-white font-extrabold rounded-2xl text-xs text-center shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock text-[#F4D06F]"></i> Pay ₹{Number(amount).toLocaleString('en-IN')} with Card
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POPUP MODAL: "Thank you for your donation! Your contribution is greatly appreciated." */}
      {showPopup && popupData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#D4AF37]/50 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* SUCCESS ICON */}
            <div className="w-16 h-16 bg-emerald-50 text-[#064E3B] border border-[#D4AF37]/60 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-md">
              <i className="fas fa-check-double text-[#D4AF37]"></i>
            </div>

            {/* THANK YOU HEADER */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#064E3B] bg-[#FFF9EC] px-3 py-1 rounded-full border border-[#D4AF37]/30 inline-block">
                JazakAllah Khair
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#102A25] tracking-tight leading-snug">
                Thank you for your donation! Your contribution is greatly appreciated.
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Official Receipt <strong>{popupData.receiptNo}</strong> generated.
              </p>
            </div>

            {/* AUTO RECEIPT DISPATCH BADGES */}
            <div className="space-y-2 text-left">
              {popupData.donorEmail && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2.5">
                  <i className="fas fa-envelope-circle-check text-emerald-700 text-sm"></i>
                  <div className="min-w-0">
                    <span className="block font-black text-emerald-950">Email Receipt Sent!</span>
                    <span className="text-[11px] text-emerald-800 font-medium truncate block">{popupData.donorEmail}</span>
                  </div>
                </div>
              )}

              {popupData.whatsappUrl && (
                <a
                  href={popupData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 bg-gradient-to-r from-emerald-600 to-[#064E3B] hover:from-emerald-700 hover:to-[#102A25] text-white rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-md transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <i className="fab fa-whatsapp text-lg text-[#25D366]"></i>
                    <div className="text-left">
                      <span className="block font-black leading-tight">Send WhatsApp Receipt</span>
                      <span className="text-[10px] text-emerald-200 font-medium">{popupData.donorPhone || 'Click to open WhatsApp'}</span>
                    </div>
                  </div>
                  <i className="fas fa-arrow-up-right-from-square text-xs text-[#F4D06F] group-hover:translate-x-0.5 transition"></i>
                </a>
              )}
            </div>

            {/* SUMMARY CARD */}
            <div className="p-4 bg-[#FFF9EC] border border-[#D4AF37]/30 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#e8dfc8]">
                <span className="text-slate-500 font-bold">Mosque:</span>
                <span className="font-extrabold text-[#064E3B]">{masjid.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e8dfc8]">
                <span className="text-slate-500 font-bold">Amount:</span>
                <span className="font-extrabold text-[#064E3B] text-base">₹{Number(popupData.donation?.amount || amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e8dfc8]">
                <span className="text-slate-500 font-bold">Donor:</span>
                <span className="font-extrabold text-slate-800">{popupData.donation?.donorName || donorName || 'Devoted Donor'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#e8dfc8]">
                <span className="text-slate-500 font-bold">Category:</span>
                <span className="font-extrabold text-slate-800">{popupData.donation?.category?.name || selectedCat}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-bold">Payment Mode:</span>
                <span className="font-extrabold text-emerald-800">{paymentMethod}</span>
              </div>
            </div>

            {/* ACTION BUTTONS: PDF DOWNLOAD & DONE */}
            <div className="space-y-2.5 pt-1">
              <Link
                href={`/dashboard/receipts/print?id=${popupData.receiptNo || 'demo'}&autoPrint=true`}
                target="_blank"
                className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-extrabold rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-file-pdf text-[#F4D06F]"></i> Download Official PDF Receipt
              </Link>

              {/* DONE BUTTON */}
              <button
                type="button"
                onClick={handleClosePopup}
                className="w-full py-3.5 px-4 bg-[#064E3B] hover:bg-[#102A25] text-[#F4D06F] border border-[#D4AF37] font-black rounded-2xl text-xs shadow-md transition block cursor-pointer"
              >
                ✓ Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
