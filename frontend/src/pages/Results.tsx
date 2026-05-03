import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Gauge, ListChecks, Wand2, Mic, Crown,
  Download, CheckCircle2, AlertTriangle, XCircle, Copy, ArrowRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { cvStore, useCvResult, generateMockResult } from "@/lib/store";
import ScoreCircle from "@/components/results/ScoreCircle";
import { toast } from "sonner";

const NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "ats", label: "ATS Score", icon: Gauge },
  { id: "sections", label: "Section Analysis", icon: ListChecks },
  { id: "improve", label: "Improve CV", icon: Wand2 },
  { id: "practice", label: "Practice Interview", icon: Mic },
  { id: "upgrade", label: "Upgrade", icon: Crown },
];

export default function Results() {
  const result = useCvResult();
  const [active, setActive] = useState("overview");

  useEffect(() => {
    cvStore.hydrate();
    if (!cvStore.getResult()) {
      cvStore.setResult(generateMockResult("demo_resume.pdf"));
    }
  }, []);

  if (!result) return null;

  return (
    <SiteLayout>
      <Seo
        title="Your Resume Results — ATS Score & AI Suggestions"
        description="Your personalized CV analysis: ATS score breakdown, section feedback, AI rewrites, and matched jobs."
        path="/results"
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Results", path: "/results" }])}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="bg-card rounded-3xl border border-border/60 p-3 shadow-soft">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  onClick={() => setActive(n.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${active === n.id ? "bg-primary-light text-primary-dark" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <n.icon className="h-4 w-4" /> {n.label}
                </a>
              ))}
            </div>
          </aside>

          <div className="space-y-10">
            <Overview result={result} />
            <AtsBreakdown result={result} />
            <SectionAnalysis result={result} />
            <Improve result={result} />
            <PracticeCta />
            <Upgrade />
          </div>
        </motion.div>
      </div>
    </SiteLayout>
  );
}

function Overview({ result }: { result: ReturnType<typeof generateMockResult> }) {
  return (
    <section id="overview" className="relative overflow-hidden rounded-3xl bg-gradient-primary text-primary-foreground p-8 lg:p-10 shadow-elegant scroll-mt-24">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Analysis complete
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{result.status}</h1>
          <p className="mt-2 text-lg opacity-90">We analyzed <span className="font-semibold">{result.fileName}</span> across 6 dimensions.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button className="bg-background text-foreground hover:bg-background/90 rounded-xl h-11 px-5 font-semibold"><Download className="mr-2 h-4 w-4" /> Download Report</Button>
            <Button variant="outline" className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground rounded-xl h-11 px-5 font-semibold" asChild>
              <Link to="/cv-analysis">Re-upload <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground rounded-xl h-11 px-5 font-semibold" asChild>
              <Link to="/interview"><Mic className="mr-2 h-4 w-4" /> Practice Interview</Link>
            </Button>
          </div>
        </div>
        <div className="grid place-items-center bg-background/15 backdrop-blur rounded-3xl p-6">
          <ScoreCircle score={result.score} />
        </div>
      </div>
    </section>
  );
}

function AtsBreakdown({ result }: { result: ReturnType<typeof generateMockResult> }) {
  const items = [
    { key: "Formatting", v: result.breakdown.formatting },
    { key: "Keywords", v: result.breakdown.keywords },
    { key: "Experience", v: result.breakdown.experience },
    { key: "Education", v: result.breakdown.education },
    { key: "Skills", v: result.breakdown.skills },
    { key: "Readability", v: result.breakdown.readability },
  ];
  return (
    <section id="ats" className="scroll-mt-24">
      <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">ATS Score Breakdown</h2>
      <p className="text-muted-foreground mt-1">How each part of your CV scored.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((it, i) => (
          <motion.div
            key={it.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">{it.key}</span>
              <span className="text-2xl font-bold text-gradient-primary">{it.v}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${it.v}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.1 + i * 0.05 }} className="h-full bg-gradient-primary" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SectionAnalysis({ result }: { result: ReturnType<typeof generateMockResult> }) {
  const map = {
    good: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary-light", label: "Good" },
    warn: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", label: "Improve" },
    bad: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Fix" },
  } as const;
  return (
    <section id="sections" className="scroll-mt-24">
      <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">CV Section Analysis</h2>
      <p className="text-muted-foreground mt-1">Targeted feedback for every section of your resume.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {result.sections.map((s, i) => {
          const m = map[s.status];
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${m.bg}`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{s.title}</h3>
                    <Badge variant="secondary" className={`${m.bg} ${m.color} border-0`}>{m.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{s.note}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function Improve({ result }: { result: ReturnType<typeof generateMockResult> }) {
  const [applied, setApplied] = useState<number[]>([]);
  return (
    <section id="improve" className="scroll-mt-24">
      <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">AI Improvement Suggestions</h2>
      <p className="text-muted-foreground mt-1">Replace weak bullets with sharper, metric-backed alternatives.</p>
      <div className="mt-6 space-y-4">
        {result.suggestions.map((s, i) => {
          const isApplied = applied.includes(i);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/60 p-6 shadow-soft">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Before</div>
                  <p className="text-sm">{s.before}</p>
                </div>
                <div className="rounded-xl bg-primary-light p-4 border border-primary/20">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary-dark mb-2">After</div>
                  <p className="text-sm font-medium text-foreground">{s.after}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">💡 {s.reason}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className={isApplied ? "bg-success text-primary-foreground" : "bg-gradient-primary text-primary-foreground"}
                  onClick={() => { setApplied([...applied, i]); toast.success("Suggestion applied"); }}
                >
                  {isApplied ? <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Applied</> : "Apply Suggestion"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(s.after); toast.success("Copied to clipboard"); }}>
                  <Copy className="mr-1.5 h-4 w-4" /> Copy Text
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function PracticeCta() {
  return (
    <section id="practice" className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/60 p-8 lg:p-10 shadow-card">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
          <div>
            <Mic className="h-7 w-7 text-primary mb-3" />
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Now practice the interview</h2>
            <p className="mt-2 text-muted-foreground max-w-xl">We'll generate a structured interview from your CV — with skill tags, difficulty, and adaptive follow-ups. No chat. Just focused practice.</p>
          </div>
          <div className="flex lg:justify-end">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground rounded-xl h-12 px-7 font-semibold shadow-glow">
              <Link to="/interview">Start practice <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Upgrade() {
  return (
    <section id="upgrade" className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-card border border-primary/30 p-8 lg:p-10 shadow-elegant">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
          <div>
            <Crown className="h-7 w-7 text-primary mb-3" />
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Unlock unlimited analyses + full interview practice</h2>
            <p className="mt-2 text-muted-foreground max-w-xl">Pro users get unlimited CV analyses, longer interview sessions, version history, and detailed per-skill scoring.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground rounded-xl h-12 px-7 font-semibold shadow-glow">
              <Link to="/pricing">Upgrade Pro</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl h-12 px-7 font-semibold border-2">
              <Link to="/pricing">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}