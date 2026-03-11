import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Repeat, BarChart3, ShieldCheck, Hexagon, Triangle, Circle, Square, Infinity as InfinityIcon } from "lucide-react";

export default function LandingPage() {
  // Warna kustom dari desain HTML Anda (diubah ke format arbitrary Tailwind agar langsung jalan)
  const brandColor = "#0f2ab3";
  const bgLight = "#fcfcfd";

  return (
    <div className="min-h-screen text-slate-900 selection:bg-[#0f2ab3]/10 selection:text-[#0f2ab3]" style={{ backgroundColor: bgLight }}>
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#0f2ab3]/5" style={{ background: "rgba(252, 252, 253, 0.8)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: brandColor }}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: brandColor }}>NEXUSFLOW</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors" href="#features">Features</a>
            <a className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors" href="#pricing">Pricing</a>
            <a className="text-sm font-medium text-slate-600 hover:text-[#0f2ab3] transition-colors" href="#about">About</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-5 py-2.5 text-sm font-semibold hover:bg-[#0f2ab3]/5 rounded-lg transition-all" style={{ color: brandColor }}>
              Sign In
            </Link>
            <Link to="/login" className="text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5" style={{ backgroundColor: brandColor, boxShadow: "0 10px 15px -3px rgba(15, 42, 179, 0.2)" }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-48 pb-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f2ab3]/5 text-[#0f2ab3] text-xs font-bold tracking-wider uppercase mb-8 border border-[#0f2ab3]/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0f2ab3] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0f2ab3]"></span>
            </span>
            New: AI Workflow Automation is here
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-5xl md:text-7xl font-black leading-[1.1] tracking-[-0.035em] mb-8" style={{ color: brandColor }}>
            Scale your operations with <br className="hidden md:block" /> intelligent precision.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            The all-in-one platform for modern teams to automate workflows, analyze performance, and drive measurable growth.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 text-white rounded-xl text-lg font-bold shadow-xl transition-all hover:scale-[1.02]" style={{ backgroundColor: brandColor, boxShadow: "0 20px 25px -5px rgba(15, 42, 179, 0.2)" }}>
              Get Started Free
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white rounded-xl text-lg font-bold transition-all hover:bg-slate-50" style={{ color: brandColor, border: "1px solid rgba(15, 42, 179, 0.1)", boxShadow: "0 10px 15px -3px rgba(15, 42, 179, 0.05)" }}>
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* --- DASHBOARD PREVIEW --- */}
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }} className="max-w-6xl mx-auto px-6 mb-32">
        <div className="relative rounded-2xl overflow-hidden border border-[#0f2ab3]/10 shadow-2xl bg-white aspect-[16/9] w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Ganti div ini dengan tag <img> asli jika Anda sudah punya screenshot aplikasinya */}
          <div className="text-center opacity-40">
             <BarChart3 className="w-20 h-20 mx-auto mb-4" style={{ color: brandColor }} />
             <p className="text-2xl font-bold text-slate-400">Dashboard UI Preview</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#fcfcfd]/80 to-transparent"></div>
        </div>
      </motion.div>

      {/* --- SOCIAL PROOF --- */}
      <section className="py-20 border-y border-[#0f2ab3]/5" style={{ backgroundColor: "rgba(15, 42, 179, 0.02)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-12">Trusted by industry leaders worldwide</p>
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 text-slate-600">
             {/* Menggunakan Lucide Icons sebagai placeholder logo perusahaan */}
             <Hexagon className="w-10 h-10" />
             <Triangle className="w-10 h-10" />
             <Circle className="w-10 h-10" />
             <Square className="w-10 h-10" />
             <InfinityIcon className="w-12 h-12" />
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4" style={{ color: brandColor }}>Engineered for Excellence</h2>
            <p className="text-slate-500 text-lg max-w-2xl font-medium">Discover the tools designed to propel your business forward with unmatched efficiency and enterprise-grade reliability.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Repeat, title: "Seamless Integration", desc: "Connect your entire tech stack with our one-click native integrations and robust developer-first API." },
              { icon: BarChart3, title: "Advanced Analytics", desc: "Gain actionable insights with real-time data visualization, AI-driven summaries, and predictive modeling." },
              { icon: ShieldCheck, title: "Automated Security", desc: "Enterprise-grade protection with automated threat detection, end-to-end encryption, and compliance monitoring." }
            ].map((feat, i) => (
              <motion.div key={i} whileHover={{ y: -8 }} className="group p-8 bg-white border border-[#0f2ab3]/5 rounded-xl transition-all duration-300" style={{ boxShadow: "0 10px 15px -3px rgba(15, 42, 179, 0.05)" }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-colors duration-300 bg-[#0f2ab3]/10 group-hover:bg-[#0f2ab3] group-hover:text-white" style={{ color: brandColor }}>
                  <feat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: brandColor }}>{feat.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-[#0f2ab3]/5 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1 rounded-lg" style={{ backgroundColor: brandColor }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path>
                  </svg>
                </div>
                <span className="text-xl font-bold tracking-tight" style={{ color: brandColor }}>NEXUSFLOW</span>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs mb-8">
                The modern standard for operational intelligence. Built for teams that value speed, security, and growth.
              </p>
            </div>
            
            {/* Footer Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: brandColor }}>Product</h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Integrations", "Changelog"].map(link => (
                  <li key={link}><a className="text-slate-500 hover:text-[#0f2ab3] transition-colors text-sm font-medium" href="#">{link}</a></li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: brandColor }}>Company</h4>
              <ul className="space-y-3">
                {["About Us", "Careers", "Blog", "Press"].map(link => (
                  <li key={link}><a className="text-slate-500 hover:text-[#0f2ab3] transition-colors text-sm font-medium" href="#">{link}</a></li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest" style={{ color: brandColor }}>Legal</h4>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(link => (
                  <li key={link}><a className="text-slate-500 hover:text-[#0f2ab3] transition-colors text-sm font-medium" href="#">{link}</a></li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[#0f2ab3]/5">
            <p className="text-slate-400 text-sm font-medium mb-4 md:mb-0">© 2024 NexusFlow Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}