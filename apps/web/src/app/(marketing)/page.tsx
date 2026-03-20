import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-display text-slate-100 overflow-hidden relative">
      {/* Ambient Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-lg">school</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Tadriss</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200">
            Login
          </Link>
          <Link href="/signup" className="text-sm font-medium bg-white text-slate-900 px-4 py-2 rounded-full hover:bg-slate-100 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Primary Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center max-w-5xl mx-auto w-full py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-md mb-8 animate-fade-in-up">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Tadriss 2.0 is live</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-6 drop-shadow-sm leading-tight">
          The Operating System <br className="hidden md:block" /> for Modern Schools
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 font-light leading-relaxed">
          Unify your entire institution in one beautiful platform. From seamless attendance tracking and homework distribution, to automated financial billing and custom role-based dashboards.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link href="/signup" className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full font-semibold text-base transition-all duration-300 shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] hover:-translate-y-1">
            Get Started for Free
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
          <a href="#features" className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-full font-medium text-base backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
            <span className="material-symbols-outlined text-lg opacity-70 group-hover:opacity-100">play_circle</span>
            See how it works
          </a>
        </div>
      </main>

      {/* Feature Grid (Below Fold) */}
      <section id="features" className="relative z-10 bg-slate-900/50 border-t border-slate-800 py-24 px-6 mt-12 w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "admin_panel_settings", title: "Institutional Control", desc: "Granular administrative views over revenue streams, total enrollments, and global academic health." },
            { icon: "groups", title: "Teacher Workspaces", desc: "Dedicated fast-action portals for educators to mark attendance drops and publish homework instantly." },
            { icon: "schedule", title: "Student Portals", desc: "Personalized academic feeds delivering realtime attendance trajectories and deadline-critical alerts." }
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-colors group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-blue-400 text-2xl">{f.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-slate-400 font-light leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compact Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-8 text-center bg-slate-950">
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          © {new Date().getFullYear()} Tadriss. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
