export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-6 md:p-24 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
        {/* Logo and Subtitle */}
        <div className="space-y-4">
          <div className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-black text-blue-400 uppercase tracking-widest mb-2 animate-pulse">
            Hackathon Round 1 Submission
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-sm">
            Exam<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Guard</span> AI
          </h1>
          <p className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Rebuilding global credential trust infrastructure for the age of AI.
          </p>
        </div>

        {/* Strategic Pillars Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Pillar 1 */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-6 rounded-xl space-y-3 hover:border-blue-500/30 transition-all duration-300 group">
            <span className="text-2xl">🧬</span>
            <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors">Question Mutation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every student receives a unique exam variant. Sharing or reusing answers is structurally impossible.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-6 rounded-xl space-y-3 hover:border-blue-500/30 transition-all duration-300 group">
            <span className="text-2xl">🔍</span>
            <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors">Comprehension Probing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI follow-up probes verify conceptual alignment and detect copied content dynamically.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-6 rounded-xl space-y-3 hover:border-blue-500/30 transition-all duration-300 group">
            <span className="text-2xl">⚡</span>
            <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors">Behavioral Telemetry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Passive timing, speed, and paste event audit trails without invasive camera or biometric proctoring.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <a
            href="/educator"
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
          >
            Launch Educator Panel
          </a>
          <a
            href="https://github.com"
            target="_blank"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold text-base transition-all duration-200"
          >
            Explore Repository
          </a>
        </div>
      </div>
    </main>
  )
}
