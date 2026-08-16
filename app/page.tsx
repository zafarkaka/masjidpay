import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6faf6]">
      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-emerald-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-700/20">
              <i className="fas fa-mosque text-xl"></i>
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">Masjid<span className="text-emerald-700">Pay</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Financial SaaS</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/donate/jama-masjid"
              className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition"
            >
              <i className="fas fa-heart text-emerald-600"></i> Public Donation Demo
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center gap-2"
            >
              Register Masjid <i className="fas fa-arrow-right text-xs"></i>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100/70 text-emerald-800 text-xs sm:text-sm font-semibold border border-emerald-200 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Multi-Tenant Financial Management Built Specifically for Masjids
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Simple, Transparent Financial Management for <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy decoration-2">Your Masjid</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate manual registers. Manage donations, recurring commitments, expenses, fund allocations, Razorpay UPI payments, and generate instant tax-compliant receipts with complete audit integrity.
          </p>

          {/* QUICK DEMO SHORTCUT BUTTONS */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-xl shadow-emerald-700/25 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-3 text-base"
            >
              <i className="fas fa-[#164e31] fa-sign-in-alt"></i> Login to Dashboard
            </Link>

            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border border-slate-200 shadow-sm transition flex items-center justify-center gap-3 text-base"
            >
              <i className="fas fa-mosque text-emerald-700"></i> Register New Masjid
            </Link>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Purpose-Built Financial Capabilities</h2>
            <p className="mt-3 text-slate-600 text-base">Everything your committee needs to maintain 100% financial transparency and operational ease.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#f6faf6] border border-emerald-100 hover:border-emerald-300 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl mb-6 shadow-md shadow-emerald-700/20">
                <i className="fas fa-hand-holding-dollar"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Donation Tracking</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Record manual cash, cheque, and bank donations. Categorize under Zakat, Sadaqah, Construction, or General funds with automated receipt sequence numbers.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#f6faf6] border border-emerald-100 hover:border-emerald-300 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl mb-6 shadow-md shadow-emerald-700/20">
                <i className="fas fa-rotate"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Recurring Donations</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Set up automated monthly or weekly donor subscription commitments with payment schedules, cycle counts, and recurring projection insights.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#f6faf6] border border-emerald-100 hover:border-emerald-300 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl mb-6 shadow-md shadow-emerald-700/20">
                <i className="fas fa-receipt"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Expense Overhead Control</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Manage utility bills, Imam salaries, maintenance, and event expenses. Track category budget targets and receive over-budget warnings.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#f6faf6] border border-emerald-100 hover:border-emerald-300 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl mb-6 shadow-md shadow-emerald-700/20">
                <i className="fas fa-qrcode"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Razorpay & UPI Payments</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Generate instant Razorpay Payment Links and shareable QR codes for online contributions with automated webhook verification.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#f6faf6] border border-emerald-100 hover:border-emerald-300 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl mb-6 shadow-md shadow-emerald-700/20">
                <i className="fas fa-vault"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-Fund Management</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Isolate restricted funds (Zakat, Construction, Emergency) from general operational cash. Perform verified internal transfers with audit logging.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#f6faf6] border border-emerald-100 hover:border-emerald-300 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl mb-6 shadow-md shadow-emerald-700/20">
                <i className="fas fa-eye"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Public Financial Transparency</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Publish anonymized financial summaries and campaign progress to your congregation to build unwavering trust and community accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs sm:text-sm">
          <div className="flex items-center justify-center gap-3 text-white font-bold text-lg mb-4">
            <i className="fas fa-mosque text-emerald-500"></i> MasjidPay SaaS
          </div>
          <p>© 2026 MasjidPay Financial SaaS Platform. All financial records secured with multi-tenant tenant isolation.</p>
          <div className="mt-4 flex items-center justify-center gap-6 text-slate-400">
            <Link href="/login" className="hover:text-white transition">Super Admin Login</Link>
            <span>•</span>
            <Link href="/register" className="hover:text-white transition">Register Mosque</Link>
            <span>•</span>
            <Link href="/donate/jama-masjid" className="hover:text-white transition">Public Donor Portal</Link>
            <span>•</span>
            <Link href="/masjid/jama-masjid/transparency" className="hover:text-white transition">Public Transparency</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
