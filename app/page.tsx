import Link from "next/link"
import { Zap, Chrome, BarChart2, Flame, Rocket, Moon, ArrowRight, Eye } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08080f] text-foreground">
      {/* ── Background glow ─────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[30%] w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[120px]" />
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Signal</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/demo"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            View demo
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-1.5 rounded-lg border border-border hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300 mb-7 font-medium">
          <Flame className="w-3 h-3" />
          Competitor ad intelligence
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          Know which ads your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            competitors are scaling
          </span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Signal captures every Meta ad your competitors run and shows you exactly which ones are
          winning, which just launched, and which quietly died — before you waste budget running
          the same creative they already tested.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-[0_0_30px_rgba(99,102,241,0.35)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/demo"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border hover:border-white/20 bg-white/3 hover:bg-white/5 text-sm font-medium transition-all"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
            View live demo
          </Link>
        </div>

        {/* Mock UI strip */}
        <div className="mt-16 rounded-2xl border border-white/8 bg-white/3 p-4 text-left overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <span className="ml-2 text-xs text-muted-foreground/60 font-mono">signal.app/ads</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Proven Performers", sub: "30+ days active", color: "emerald", count: "8" },
              { label: "Winning Right Now", sub: "14+ days active", color: "indigo", count: "12" },
              { label: "Creative Surge", sub: "3+ new this week", color: "violet", count: "5 brands" },
              { label: "Just Went Dark", sub: "Stopped recently", color: "rose", count: "6" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/6 bg-white/3 p-3">
                <div className={`text-xl font-bold tabular-nums text-${item.color}-400 mb-1`}>
                  {item.count}
                </div>
                <p className="text-xs font-medium text-foreground/80 leading-tight">{item.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3 overflow-hidden">
            {[
              { brand: "Mamaearth", days: "47d", status: "🔥 Proven" },
              { brand: "mCaffeine", days: "23d", status: "⚡ Winning" },
              { brand: "Minimalist", days: "8d", status: "🚀 Traction" },
              { brand: "Plum", days: "—", status: "💀 Dark" },
              { brand: "Dot & Key", days: "31d", status: "🔥 Proven" },
            ].map((item) => (
              <div key={item.brand} className="shrink-0 w-32 rounded-lg border border-white/6 bg-white/2 p-2.5">
                <div className="w-6 h-6 rounded bg-indigo-500/20 mb-2" />
                <p className="text-[11px] font-medium truncate">{item.brand}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground/60 font-medium mb-12">
          What Signal tells you
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: Flame,
              color: "text-orange-400",
              bg: "bg-orange-500/8 border-orange-500/15",
              title: "Which ads are actually working",
              desc: "Ads still running after 14 days aren't accidents. After 30 days, that's serious conviction. Signal surfaces these so you know exactly what's resonating with their audience.",
            },
            {
              icon: Rocket,
              color: "text-violet-400",
              bg: "bg-violet-500/8 border-violet-500/15",
              title: "When a brand floods the library",
              desc: "A competitor launching 5+ new creatives in a week means they're testing hard. Signal's Creative Surge catches this the moment it happens — before they find their winner.",
            },
            {
              icon: Moon,
              color: "text-rose-400",
              bg: "bg-rose-500/8 border-rose-500/15",
              title: "What they quietly stopped running",
              desc: "Ads that go dark after a long run are signals too. Either they found something better — or that angle stopped working. Either way, you want to know.",
            },
          ].map((f) => (
            <div key={f.title} className={`rounded-2xl border p-6 ${f.bg}`}>
              <div className={`w-9 h-9 rounded-lg ${f.bg} border flex items-center justify-center mb-5`}>
                <f.icon className={`w-4.5 h-4.5 ${f.color}`} />
              </div>
              <h3 className="font-semibold text-sm mb-2 leading-snug">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground/60 font-medium mb-12">
          How it works
        </p>
        <div className="space-y-8">
          {[
            {
              icon: Chrome,
              step: "01",
              title: "Install the Chrome extension",
              desc: "One click install. No configuration. Signal sits silently in the background.",
            },
            {
              icon: BarChart2,
              step: "02",
              title: "Browse Meta Ad Library normally",
              desc: "Search any brand on facebook.com/ads/library. Signal automatically captures every ad — images, copy, dates — as you scroll.",
            },
            {
              icon: Zap,
              step: "03",
              title: "Open Signal and see the intelligence",
              desc: "Your feed shows which ads are proven, which brands are surging, and which creatives just went dark. Updated every time you browse.",
            },
          ].map((s, i) => (
            <div key={s.step} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center shrink-0">
                  <s.icon className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                {i < 2 && <div className="w-px flex-1 bg-border/40 my-2" />}
              </div>
              <div className="pb-8">
                <p className="text-[10px] font-mono text-muted-foreground/50 mb-1">{s.step}</p>
                <h3 className="font-semibold text-sm mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Stop finding out too late
        </h2>
        <p className="text-muted-foreground mb-8">
          Your competitors are running split tests right now. Signal tells you what they kept.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-[0_0_30px_rgba(99,102,241,0.35)]"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/demo"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Or view live demo →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border/30 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-600/80 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-white fill-white" />
            </div>
            <span>Signal</span>
          </div>
          <span>Built for D2C brands who run on Meta</span>
        </div>
      </footer>
    </div>
  )
}
