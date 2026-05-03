import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Mic, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { toast } from "sonner";

type Q = {
  id: number;
  text: string;
  skill: string;
  difficulty: "Easy" | "Medium" | "Hard";
  followUp: string;
  explanation: string;
};

const BANK: Q[] = [
  { id: 1, text: "Walk me through a project on your CV that you're most proud of and why.", skill: "Communication", difficulty: "Easy", followUp: "What specifically would you do differently if you started over?", explanation: "Interviewers want a clear narrative: context → action → measurable result." },
  { id: 2, text: "Describe a time you had to make a technical decision under uncertainty. How did you decide?", skill: "Decision making", difficulty: "Medium", followUp: "What would have changed your decision?", explanation: "Use STAR. Highlight the trade-offs you weighed and why you chose your path." },
  { id: 3, text: "How would you design a system to handle 1M concurrent users for the product on your CV?", skill: "System design", difficulty: "Hard", followUp: "Where does your design break first as scale grows 10×?", explanation: "Cover load balancing, caching, async processing, data partitioning, observability." },
  { id: 4, text: "Tell me about a conflict with a teammate and how you resolved it.", skill: "Collaboration", difficulty: "Medium", followUp: "What was the long-term outcome on the relationship?", explanation: "Show empathy first, structured approach second, owned outcome third." },
  { id: 5, text: "What's a weakness of yours, and how are you working on it?", skill: "Self-awareness", difficulty: "Easy", followUp: "Give a concrete example from the last 3 months.", explanation: "Pick a real, non-cosmetic weakness with a tangible improvement plan." },
];

export default function Interview() {
  const [setupDone, setSetupDone] = useState(false);
  const [jd, setJd] = useState("");
  const [role, setRole] = useState("");
  const [idx, setIdx] = useState(0);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const questions = useMemo(() => BANK, []);
  const q = questions[idx];
  const progress = ((idx + (answers[q?.id] ? 1 : 0)) / questions.length) * 100;

  const next = () => {
    setShowFollowUp(false);
    setShowExplain(false);
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <SiteLayout>
      <Seo
        title="Interview Practice — Structured AI Mock Interview"
        description="Practice a structured AI mock interview tailored to your CV and target role. Skill tags, difficulty, adaptive follow-ups."
        path="/interview"
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Interview Practice", path: "/interview" }])}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {!setupDone ? (
          <Setup onStart={(r, j) => { setRole(r); setJd(j); setSetupDone(true); }} />
        ) : done ? (
          <Summary answers={answers} questions={questions} onRestart={() => { setIdx(0); setAnswers({}); setDone(false); }} />
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <motion.section key={q.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl border border-border/60 p-8 lg:p-10 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question {idx + 1} of {questions.length}</div>
                <div className="text-xs text-muted-foreground">{Math.round(progress)}% complete</div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-8"><div className="h-full bg-gradient-primary transition-all" style={{ width: `${progress}%` }} /></div>

              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight">{q.text}</h2>
              <AnimatePresence>
                {showFollowUp && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 rounded-xl bg-primary-light border border-primary/20 p-4 text-sm">
                    <span className="font-semibold text-primary-dark">Follow-up:</span> {q.followUp}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-7">
                <Label htmlFor="answer" className="text-sm font-semibold">Your answer</Label>
                <Textarea
                  id="answer"
                  rows={9}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Structure your answer using STAR (Situation, Task, Action, Result)..."
                  className="mt-2 text-base leading-relaxed"
                />
                <div className="mt-2 text-xs text-muted-foreground">{(answers[q.id] ?? "").length} chars · aim for 600–1200 for senior roles</div>
              </div>

              <AnimatePresence>
                {showExplain && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 rounded-xl bg-secondary border border-border/60 p-4 text-sm">
                    <div className="flex items-center gap-2 font-semibold mb-1"><Lightbulb className="h-4 w-4 text-warning" /> What good looks like</div>
                    <p className="text-muted-foreground">{q.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-7 flex flex-wrap gap-3 justify-between">
                <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(Math.max(0, idx - 1))} className="rounded-xl border-2"><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-xl border-2" onClick={() => setShowExplain((v) => !v)}><Lightbulb className="mr-2 h-4 w-4" /> {showExplain ? "Hide" : "Show"} guidance</Button>
                  <Button variant="outline" className="rounded-xl border-2" onClick={() => { setShowFollowUp(true); toast.success("Follow-up generated based on your answer"); }}><RefreshCw className="mr-2 h-4 w-4" /> Adaptive follow-up</Button>
                  <Button onClick={next} className="bg-gradient-primary text-primary-foreground rounded-xl">{idx + 1 === questions.length ? "Finish" : "Next"} <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </div>
            </motion.section>

            <aside className="space-y-4">
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">This question</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Skill</span><Badge className="bg-primary-light text-primary-dark hover:bg-primary-light">{q.skill}</Badge></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Difficulty</span><Badge variant="outline" className={q.difficulty === "Hard" ? "border-destructive/40 text-destructive" : q.difficulty === "Medium" ? "border-warning/40 text-warning" : "border-primary/40 text-primary"}>{q.difficulty}</Badge></div>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Session</div>
                {role && <p className="text-sm"><span className="text-muted-foreground">Role:</span> <span className="font-semibold">{role}</span></p>}
                <p className="text-xs text-muted-foreground mt-2">Questions are generated from your CV{jd ? " and the pasted job description" : ""}.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function Setup({ onStart }: { onStart: (role: string, jd: string) => void }) {
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary-dark mb-3"><Sparkles className="h-3.5 w-3.5" /> Step 2 — Practice</span>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Set up your interview</h1>
        <p className="mt-3 text-muted-foreground">We'll generate a structured set of questions tailored to your CV and the role.</p>
      </div>
      <div className="mt-8 bg-card rounded-3xl border border-border/60 p-8 shadow-card space-y-5">
        <div>
          <Label htmlFor="role">Target role</Label>
          <Input id="role" placeholder="e.g. Senior Frontend Engineer" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="jd">Job description (optional)</Label>
          <Textarea id="jd" rows={6} placeholder="Paste the JD to tailor the questions..." value={jd} onChange={(e) => setJd(e.target.value)} className="mt-1.5" />
          <p className="mt-1 text-xs text-muted-foreground">Skip to use questions based only on your CV.</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-end">
          <Button asChild variant="outline" className="rounded-xl border-2"><Link to="/cv-analysis">Upload CV first</Link></Button>
          <Button onClick={() => onStart(role || "Generic role", jd)} className="bg-gradient-primary text-primary-foreground rounded-xl"><Mic className="mr-2 h-4 w-4" /> Start interview</Button>
        </div>
      </div>
    </div>
  );
}

function Summary({ answers, questions, onRestart }: { answers: Record<number, string>; questions: Q[]; onRestart: () => void }) {
  const answered = Object.values(answers).filter(Boolean).length;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow mb-4"><Trophy className="h-7 w-7" /></div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Session complete</h1>
        <p className="mt-2 text-muted-foreground">You answered {answered} of {questions.length} questions. Here's a per-skill snapshot.</p>
      </div>
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {questions.map((q) => {
          const a = answers[q.id] ?? "";
          const score = Math.min(100, 40 + Math.floor(a.length / 12));
          return (
            <div key={q.id} className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-primary-light text-primary-dark hover:bg-primary-light">{q.skill}</Badge>
                <span className="text-sm font-bold text-gradient-primary">{a ? score : 0}/100</span>
              </div>
              <p className="text-sm font-medium line-clamp-2">{q.text}</p>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-primary" style={{ width: `${a ? score : 0}%` }} /></div>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> {a ? `${a.length} chars answered` : "Skipped"}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex justify-center gap-3 flex-wrap">
        <Button onClick={onRestart} variant="outline" className="rounded-xl border-2"><RefreshCw className="mr-2 h-4 w-4" /> Practice again</Button>
        <Button asChild className="bg-gradient-primary text-primary-foreground rounded-xl"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    </div>
  );
}