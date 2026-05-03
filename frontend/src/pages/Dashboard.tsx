import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Mic, Wand2, Lightbulb, TrendingUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteLayout from "@/components/site/SiteLayout";
import ScoreCircle from "@/components/results/ScoreCircle";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { cvStore, useCvResult, generateMockResult } from "@/lib/store";

export default function Dashboard() {
  const result = useCvResult();

  useEffect(() => {
    cvStore.hydrate();
  }, []);

  return (
    <SiteLayout>
      <Seo
        title="Dashboard — Your CareerAI Action Hub"
        description="Your CV score, key insights, and the next best action to improve your CV or practice your interview."
        path="/dashboard"
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Dashboard", path: "/dashboard" }])}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Dashboard</span>
            <h1 className="mt-1 text-3xl lg:text-4xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">Here's where your CV stands and what to do next.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl border-2"><Link to="/cv-analysis"><Upload className="mr-2 h-4 w-4" /> Re-analyze</Link></Button>
            <Button asChild className="bg-gradient-primary text-primary-foreground rounded-xl"><Link to="/interview"><Mic className="mr-2 h-4 w-4" /> Practice interview</Link></Button>
          </div>
        </header>

        {result ? <Hub /> : <Empty />}
      </div>
    </SiteLayout>
  );

  function Hub() {
    if (!result) return null;
    const insights = result.topIssues.slice(0, 3);
    return (
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl border border-border/60 p-8 shadow-card">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current ATS Score</span>
              <h2 className="mt-1 text-2xl font-bold">{result.status}</h2>
              <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5"><FileText className="h-4 w-4" /> {result.fileName}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild className="bg-gradient-primary text-primary-foreground rounded-xl"><Link to="/results"><Wand2 className="mr-2 h-4 w-4" /> Improve CV</Link></Button>
                <Button asChild variant="outline" className="rounded-xl border-2"><Link to="/interview">Start interview <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              </div>
            </div>
            <ScoreCircle score={result.score} />
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-3xl border border-border/60 p-8 shadow-card">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Top insights</h3>
          </div>
          <ul className="space-y-4">
            {insights.map((it, i) => (
              <li key={i} className="flex gap-3">
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${it.severity === "high" ? "bg-destructive/10 text-destructive" : it.severity === "medium" ? "bg-warning/10 text-warning" : "bg-primary-light text-primary"}`}>{i + 1}</span>
                <div>
                  <p className="font-semibold text-sm">{it.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{it.fix}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button asChild variant="link" className="mt-4 px-0 text-primary"><Link to="/results">See full report <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 grid sm:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: "ATS Score", value: `${result.score}/100` },
            { icon: Wand2, label: "AI Suggestions", value: `${result.suggestions.length}` },
            { icon: Mic, label: "Interview ready", value: "Tap to start" },
          ].map((c) => (
            <div key={c.label} className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-light text-primary"><c.icon className="h-5 w-5" /></span>
              <div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="font-bold">{c.value}</div>
              </div>
            </div>
          ))}
        </motion.section>
      </div>
    );
  }

  function Empty() {
    return (
      <div className="mt-12 text-center bg-card border border-border/60 rounded-3xl p-12 shadow-soft">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow mb-4">
          <Upload className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold">No CV analyzed yet</h2>
        <p className="mt-2 text-muted-foreground">Upload your CV to unlock your ATS score, insights, and interview practice.</p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Button asChild className="bg-gradient-primary text-primary-foreground rounded-xl h-11 px-6"><Link to="/cv-analysis"><Upload className="mr-2 h-4 w-4" /> Upload CV</Link></Button>
          <Button asChild variant="outline" className="rounded-xl h-11 px-6 border-2" onClick={() => cvStore.setResult(generateMockResult("demo_resume.pdf"))}><Link to="/dashboard">Try with demo</Link></Button>
        </div>
      </div>
    );
  }
}