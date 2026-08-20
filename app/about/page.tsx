'use client';

import Link from 'next/link';

export default function AboutPage() {
  const beliefs = [
    {
      title: 'Amanah Comes First',
      desc: 'The wealth entrusted to a masjid is an amanah. We believe it should be managed responsibly, carefully, and with accountability.',
      icon: 'fa-shield-halved',
    },
    {
      title: 'Transparency Builds Trust',
      desc: 'A healthy mosque community is built on trust. Clear records and understandable reporting help strengthen the relationship between mosque leadership and the people they serve.',
      icon: 'fa-handshake',
    },
    {
      title: 'Technology Should Serve People',
      desc: 'Technology should reduce complexity, not create more of it. We build simple tools that save time and allow mosque teams to focus on serving their communities.',
      icon: 'fa-microchip',
    },
    {
      title: 'The Ummah Comes Together',
      desc: 'A masjid is a place where people worship, learn, give, connect, and serve. Our work is ultimately about helping strengthen that community.',
      icon: 'fa-users',
    },
  ];

  const values = [
    { name: 'Amanah', translation: 'Trust', desc: 'We honor the trust placed in us.' },
    { name: 'Sidq', translation: 'Truthfulness', desc: 'We value honesty and truthfulness.' },
    { name: 'Ihsan', translation: 'Excellence', desc: 'We strive for excellence in everything we build.' },
    { name: 'Adl', translation: 'Justice & Fairness', desc: 'We believe in fairness, responsibility, and accountability.' },
    { name: 'Khidmah', translation: 'Selfless Service', desc: 'We exist to serve mosques and their communities.' },
    { name: 'Ummah', translation: 'Global Community', desc: 'We build with the wider Muslim community in mind.' },
  ];

  const personas = [
    {
      role: 'Mosque Administrators',
      desc: "Gain a clearer view of your organization's finances and operations.",
      icon: 'fa-landmark',
    },
    {
      role: 'Treasurers',
      desc: 'Simplify financial tracking, records, and reporting.',
      icon: 'fa-chart-pie',
    },
    {
      role: 'Imams & Leadership',
      desc: 'Access the information needed to make responsible decisions.',
      icon: 'fa-user-tie',
    },
    {
      role: 'Volunteers',
      desc: 'Spend less time managing paperwork and more time serving the community.',
      icon: 'fa-hands-holding-child',
    },
    {
      role: 'Donors & Members',
      desc: 'Experience greater confidence through responsible and transparent financial management.',
      icon: 'fa-heart-circle-check',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9EC] text-[#1c2e28] font-sans selection:bg-[#D4AF37]/30">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF9EC]/95 border-b border-[#D4AF37]/25 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-[#064E3B] border border-[#D4AF37]/60 text-[#F4D06F] flex items-center justify-center shadow-md shadow-[#064E3B]/20 transition transform group-hover:scale-105">
              <i className="fas fa-mosque text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#102A25]">
                  Masjid<span className="text-[#064E3B]">Pay</span>
                </span>
                <span className="text-[#D4AF37] text-base font-black leading-none">✦</span>
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0F766E] block -mt-0.5">
                Modern Islamic Finance
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-700">
            <Link href="/" className="hover:text-[#064E3B] transition">Home</Link>
            <Link href="/about" className="text-[#064E3B] font-black border-b-2 border-[#064E3B] pb-1">About Us</Link>
            <Link href="/#faq" className="hover:text-[#064E3B] transition">FAQ</Link>
            <Link href="/#contact" className="hover:text-[#064E3B] transition">Contact Us</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-black text-slate-700 hover:text-[#064E3B] transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-[#064E3B] hover:bg-[#0B5A3E] text-white font-extrabold text-xs rounded-xl shadow-md transition"
            >
              Register Masjid
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-[#D4AF37]/25">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#064E3B_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EBF7F2] border border-[#2D8A68]/30 text-[#0F5A3E] text-xs font-black tracking-wider uppercase shadow-2xs">
            <span>✦</span>
            <span>About MasjidPay</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#102A25] tracking-tight leading-[1.15]">
            Building Trust.<br />
            <span className="text-[#0B6B4C]">Strengthening Communities.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-700 font-medium max-w-2xl mx-auto leading-relaxed">
            MasjidPay is a digital platform designed to help mosques manage their finances with simplicity, transparency, and amanah.
          </p>

          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-2xl mx-auto leading-relaxed italic">
            We believe that when mosque finances are organized and transparent, communities become stronger, leaders can serve more effectively, and donors can give with greater confidence.
          </p>
        </div>
      </section>

      {/* 3. OUR STORY & PURPOSE SECTION */}
      <section className="py-16 lg:py-24 bg-white border-b border-[#D4AF37]/25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* OUR STORY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
                The Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#102A25] tracking-tight">
                Our Story
              </h2>
              <div className="w-12 h-1 bg-[#D4AF37] rounded-full"></div>
            </div>

            <div className="lg:col-span-7 space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
              <p className="font-semibold text-[#102A25]">
                Every masjid carries an important responsibility.
              </p>
              <p>
                From collecting sadaqah and zakat to managing daily expenses, community programs, staff, projects, and charitable initiatives, mosque teams handle financial responsibilities that directly impact the lives of people in their communities.
              </p>
              <p>
                Yet many mosques still rely on spreadsheets, paperwork, and disconnected systems.
              </p>
              <p className="font-extrabold text-[#0B6B4C]">
                MasjidPay was created to change that.
              </p>
              <p>
                We combine modern technology with timeless Islamic values to make financial management easier for mosque leaders and more transparent for the communities they serve.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* OUR PURPOSE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
                Why We Exist
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-[#102A25] tracking-tight">
                Our Purpose
              </h2>
              <div className="w-12 h-1 bg-[#D4AF37] rounded-full"></div>
            </div>

            <div className="lg:col-span-7 space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
              <p className="font-semibold text-[#102A25]">
                Our purpose is not simply to digitize mosque finances.
              </p>
              <div className="p-4 bg-[#EBF7F2] border-l-4 border-[#0B6B4C] rounded-r-2xl">
                <p className="font-black text-lg text-[#0F5A3E]">
                  It is to help mosques protect their amanah.
                </p>
              </div>
              <p>
                Every donation represents someone&apos;s trust. Every expense carries a responsibility. Every financial decision should be made with integrity and accountability.
              </p>
              <p>
                MasjidPay provides the tools to help organizations manage these responsibilities with greater confidence and clarity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT WE BELIEVE (4 PILLARS) */}
      <section className="py-16 lg:py-24 bg-[#FFF9EC] border-b border-[#D4AF37]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
              Core Principles
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A25] tracking-tight">
              What We Believe
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Four fundamental convictions that guide our architecture and decisions every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {beliefs.map((b, idx) => (
              <div
                key={idx}
                className="p-7 sm:p-8 bg-white border border-[#D4AF37]/35 rounded-3xl space-y-4 shadow-xs hover:border-[#064E3B] transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-lg shadow-sm">
                  <i className={`fas ${b.icon}`}></i>
                </div>
                <h3 className="text-xl font-extrabold text-[#102A25]">{b.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. MISSION & VISION */}
      <section className="py-16 lg:py-24 bg-white border-b border-[#D4AF37]/25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* MISSION */}
            <div className="p-8 sm:p-10 bg-gradient-to-br from-[#064E3B] to-[#0A3023] rounded-3xl text-white space-y-5 shadow-lg border border-[#D4AF37]/40 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#F4D06F] flex items-center justify-center text-xl">
                <i className="fas fa-bullseye"></i>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Our Mission</h3>
              <p className="text-sm sm:text-base text-emerald-100 leading-relaxed font-semibold">
                To empower mosques with simple, trustworthy financial technology rooted in Islamic values.
              </p>
              <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                We want mosque leaders and volunteers to spend less time managing administrative tasks and more time creating meaningful impact in their communities.
              </p>
            </div>

            {/* VISION */}
            <div className="p-8 sm:p-10 bg-[#FFF9EC] rounded-3xl text-[#102A25] space-y-5 shadow-xs border-2 border-[#D4AF37]/60">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-xl shadow-xs">
                <i className="fas fa-eye"></i>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#102A25]">Our Vision</h3>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-semibold">
                We envision a future where every mosque — regardless of its size — can manage its finances with the same level of clarity, accountability, and professionalism.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-[#0B6B4C]"></i> A future where donors give with confidence.
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-[#0B6B4C]"></i> Where leaders have the information they need to make better decisions.
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-[#0B6B4C]"></i> Where volunteers have more time to serve.
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check text-[#0B6B4C]"></i> And where financial transparency becomes a natural part of mosque management.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. OUR VALUES (6 ISLAMIC ETHICAL PILLARS) */}
      <section className="py-16 lg:py-24 bg-[#FFF9EC] border-b border-[#D4AF37]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
              Ethical Foundation
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A25] tracking-tight">
              Our Values
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Timeless virtues drawn from Islamic tradition that shape our code, security, and culture.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, idx) => (
              <div
                key={idx}
                className="p-6 bg-white border border-[#D4AF37]/35 rounded-3xl space-y-2.5 shadow-xs hover:border-[#064E3B] transition"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-black text-[#102A25]">{v.name}</h3>
                  <span className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider">
                    {v.translation}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. MAKING MOSQUE MANAGEMENT SIMPLER */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#D4AF37]/25">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
            Streamlined Experience
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#102A25] tracking-tight">
            Making Mosque Management Simpler
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            Managing a mosque should not mean spending countless hours searching through spreadsheets, organizing receipts, or preparing reports.
          </p>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
            MasjidPay brings essential financial management into one streamlined experience — helping teams stay organized, understand their finances, and maintain better records.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-black text-[#0B6B4C]">
            <span className="px-4 py-2 bg-[#EBF7F2] rounded-xl">✓ Less administration</span>
            <span className="px-4 py-2 bg-[#EBF7F2] rounded-xl">✓ More transparency</span>
            <span className="px-4 py-2 bg-[#EBF7F2] rounded-xl">✓ More time for service</span>
          </div>
        </div>
      </section>

      {/* 8. FOR THE PEOPLE BEHIND EVERY MASJID */}
      <section className="py-16 lg:py-24 bg-[#FFF9EC] border-b border-[#D4AF37]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0F766E] block">
              Tailored For Every Role
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#102A25] tracking-tight">
              For the People Behind Every Masjid
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Designed to support everyone who contributes to the masjid&apos;s mission.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {personas.map((p, idx) => (
              <div
                key={idx}
                className="p-6 bg-white border border-[#D4AF37]/35 rounded-3xl space-y-3 text-center shadow-xs flex flex-col justify-between"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#F4D06F] flex items-center justify-center text-lg mx-auto shadow-xs">
                  <i className={`fas ${p.icon}`}></i>
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#102A25]">{p.role}</h3>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed font-medium">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAITH AT THE HEART OF TECHNOLOGY & QURAN AYAH */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-[#064E3B] via-[#083E30] to-[#042A20] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-[#D4AF37]/40 text-[#F4D06F] text-xs font-black uppercase tracking-wider">
            <span>✦</span>
            <span>Faith at the Heart of Technology</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            When technology helps us protect the amanah,<br />
            <span className="text-[#F4D06F]">it helps us serve the Ummah.</span>
          </h2>

          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            We believe the best technology does more than make things faster. It helps people fulfill their responsibilities better.
          </p>

          {/* QURAN AYAH CARD */}
          <div className="p-8 sm:p-10 bg-white/10 backdrop-blur-md rounded-3xl border border-[#D4AF37]/50 max-w-2xl mx-auto space-y-3 shadow-xl">
            <p className="text-base sm:text-lg font-serif italic text-[#FFF9EC] leading-relaxed">
              &ldquo;And whoever is mindful of Allah, He will make a way out for them and provide for them from where they do not expect.&rdquo;
            </p>
            <span className="text-xs font-extrabold text-[#F4D06F] uppercase tracking-widest block">
              — Qur&apos;an 65:2–3
            </span>
          </div>

          <div className="pt-4 space-y-2">
            <h3 className="text-2xl font-black text-white">MasjidPay</h3>
            <p className="text-xs sm:text-sm text-emerald-200 font-semibold tracking-wide">
              Technology for the Masjid. • Trust for the Community. • Amanah at the Heart of Everything.
            </p>
          </div>

          <div className="pt-6 flex justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-[#F4D06F] hover:bg-[#E8C25B] text-[#102A25] font-black rounded-xl text-xs transition shadow-xl"
            >
              Get Started Free for Your Masjid
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-[#05281E] text-[#FFF9EC] py-12 border-t border-[#D4AF37]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-[#FFF9EC]/60 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="font-bold text-white">MasjidPay</span>
            <span>•</span>
            <span>Modern Islamic Financial Management</span>
          </div>
          <p>© {new Date().getFullYear()} MasjidPay. All rights reserved. Free & Open for the Ummah.</p>
        </div>
      </footer>
    </div>
  );
}
