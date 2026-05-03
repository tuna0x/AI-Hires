import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Sliders, ListChecks, Layers, ScrollText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { toast } from "sonner";

const TABS = [
  { id: "scoring", label: "CV scoring rules", icon: Sliders },
  { id: "questions", label: "Question generation", icon: ListChecks },
  { id: "skills", label: "Skill taxonomy", icon: Layers },
  { id: "logs", label: "Logs", icon: ScrollText },
] as const;

type TabId = typeof TABS[number]["id"];

export default function Admin() {
  const [tab, setTab] = useState<TabId>("scoring");
  return (
    <SiteLayout>
      <Seo
        title="Admin Panel — CareerAI"
        description="Manage CV scoring rules, question generation logic, skill taxonomy, and audit logs."
        path="/admin"
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Admin", path: "/admin" }])}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <header className="flex items-center gap-3 mb-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-light text-primary"><Settings className="h-6 w-6" /></span>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Configure how CV analysis and interview questions are generated.</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <aside>
            <div className="bg-card rounded-2xl border border-border/60 p-2 shadow-soft">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? "bg-primary-light text-primary-dark" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>
          </aside>
          <motion.section key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl border border-border/60 p-8 shadow-card">
            {tab === "scoring" && <ScoringRules />}
            {tab === "questions" && <Questions />}
            {tab === "skills" && <SkillTaxonomy />}
            {tab === "logs" && <Logs />}
          </motion.section>
        </div>
      </div>
    </SiteLayout>
  );
}

function ScoringRules() {
  const [w, setW] = useState({ formatting: 20, keywords: 25, experience: 25, skills: 15, readability: 15 });
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  return (
    <div>
      <h2 className="text-xl font-bold">CV scoring rules</h2>
      <p className="text-sm text-muted-foreground mt-1">Tune how each dimension contributes to the final ATS score.</p>
      <div className="mt-6 space-y-5">
        {(Object.keys(w) as (keyof typeof w)[]).map((k) => (
          <div key={k}>
            <div className="flex items-center justify-between text-sm font-medium mb-2 capitalize"><span>{k}</span><span className="text-muted-foreground">{w[k]}%</span></div>
            <Slider value={[w[k]]} max={50} step={1} onValueChange={(v) => setW({ ...w, [k]: v[0] })} />
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 p-4">
          <span className="text-sm font-semibold">Total weight</span>
          <Badge className={total === 100 ? "bg-primary-light text-primary-dark" : "bg-destructive/10 text-destructive"}>{total}%</Badge>
        </div>
        <Button onClick={() => toast.success("Scoring rules saved")} className="bg-gradient-primary text-primary-foreground rounded-xl">Save changes</Button>
      </div>
    </div>
  );
}

function Questions() {
  const [easy, setEasy] = useState(2);
  const [med, setMed] = useState(4);
  const [hard, setHard] = useState(2);
  const [prompt, setPrompt] = useState("Generate {count} interview questions tailored to the candidate's CV and the provided JD. Each question must include: text, skill tag, difficulty, and one adaptive follow-up.");
  return (
    <div>
      <h2 className="text-xl font-bold">Question generation logic</h2>
      <p className="text-sm text-muted-foreground mt-1">Control the question mix and the system prompt used by the generator.</p>
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {[
          ["Easy", easy, setEasy],
          ["Medium", med, setMed],
          ["Hard", hard, setHard],
        ].map(([label, val, set]) => (
          <div key={label as string}>
            <Label>{label as string}</Label>
            <Input type="number" value={val as number} onChange={(e) => (set as (n: number) => void)(parseInt(e.target.value) || 0)} className="mt-1.5" />
          </div>
        ))}
      </div>
      <div className="mt-5">
        <Label>System prompt</Label>
        <Textarea rows={6} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mt-1.5 font-mono text-xs" />
      </div>
      <Button onClick={() => toast.success("Question logic saved")} className="mt-5 bg-gradient-primary text-primary-foreground rounded-xl">Save changes</Button>
    </div>
  );
}

function SkillTaxonomy() {
  const [skills, setSkills] = useState(["Communication", "System design", "Decision making", "Collaboration", "Problem solving", "Self-awareness", "Architecture", "Leadership"]);
  const [draft, setDraft] = useState("");
  return (
    <div>
      <h2 className="text-xl font-bold">Skill taxonomy</h2>
      <p className="text-sm text-muted-foreground mt-1">Skills used to tag interview questions and evaluate answers.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {skills.map((s) => (
          <Badge key={s} className="bg-primary-light text-primary-dark hover:bg-primary-light pl-3 pr-1.5 py-1 gap-2">
            {s}
            <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="rounded-full hover:bg-primary/20 p-0.5"><Trash2 className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a skill" />
        <Button onClick={() => { if (draft.trim()) { setSkills([...skills, draft.trim()]); setDraft(""); toast.success("Skill added"); } }} className="bg-gradient-primary text-primary-foreground rounded-xl"><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
    </div>
  );
}

function Logs() {
  const rows = [
    { t: "12:42", evt: "CV analyzed", meta: "user_8821 · score 87" },
    { t: "12:39", evt: "Interview started", meta: "user_8821 · 8 questions" },
    { t: "12:31", evt: "Scoring rules updated", meta: "admin · keywords 22→25" },
    { t: "12:18", evt: "CV analyzed", meta: "user_2117 · score 72" },
    { t: "12:10", evt: "Question logic updated", meta: "admin · medium 3→4" },
  ];
  return (
    <div>
      <h2 className="text-xl font-bold">Audit logs</h2>
      <p className="text-sm text-muted-foreground mt-1">Recent system and admin activity.</p>
      <div className="mt-6 divide-y divide-border rounded-2xl border border-border/60 overflow-hidden">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-5 py-3 text-sm">
            <span className="text-muted-foreground tabular-nums">{r.t}</span>
            <span className="font-medium">{r.evt}</span>
            <span className="text-muted-foreground text-xs">{r.meta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}