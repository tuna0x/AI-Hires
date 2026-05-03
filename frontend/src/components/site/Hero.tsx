import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Mic, CheckCircle2, Sparkles, FileText, MessageSquareQuote, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary-dark">
              <Sparkles className="h-3.5 w-3.5" />
              AI career coach · Built for serious candidates
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Improve your CV and{" "}
              <span className="text-gradient-primary">pass interviews</span> with AI
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Two focused tools, one outcome: an ATS-grade CV review and a structured AI mock interview tailored to your background and target role.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-elegant h-12 px-7 text-base font-semibold rounded-xl">
                <Link to="/cv-analysis">Upload CV <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base font-semibold rounded-xl border-2">
                <Link to="/interview"><Mic className="mr-2 h-4 w-4" /> Start interview practice</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              {["No sign-up required", "Private & secure", "Built on real ATS logic"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                </div>
              ))}
            </div>
          </motion.div>

          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="relative h-[480px] lg:h-[560px]"
    >
      {/* Main score card */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-4 right-0 lg:right-4 w-[280px] rounded-3xl bg-card shadow-elegant border border-border/60 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ATS Score</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary-dark">+12 this week</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-6xl font-bold text-gradient-primary">87</span>
          <span className="text-2xl text-muted-foreground mb-2">/100</span>
        </div>
        <div className="mt-4 space-y-2">
          {[
            { label: "Keywords", v: 82 },
            { label: "Formatting", v: 94 },
            { label: "Experience", v: 78 },
          ].map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{b.label}</span><span className="font-semibold">{b.v}%</span></div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${b.v}%` }} transition={{ duration: 1.2, delay: 0.4 }} className="h-full bg-gradient-primary" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Interview card */}
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute bottom-8 left-0 lg:left-8 w-[320px] rounded-3xl bg-card shadow-elegant border border-border/60 p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-primary-light grid place-items-center">
            <MessageSquareQuote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Question 3 of 8</div>
            <div className="text-sm font-semibold">System Design · Medium</div>
          </div>
        </div>
        <p className="text-sm leading-relaxed">"Walk me through how you'd design a real-time notification system for 1M users."</p>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-primary-light text-primary-dark font-semibold">Skill: Architecture</span>
          <span className="text-muted-foreground">• 2:14</span>
        </div>
      </motion.div>

      {/* Stat chip */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/2 left-4 hidden lg:flex items-center gap-3 rounded-2xl bg-card shadow-card border border-border/60 px-4 py-3"
      >
        <div className="h-10 w-10 rounded-xl bg-primary-light grid place-items-center">
          <Gauge className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Confidence</div>
          <div className="text-lg font-bold">+38%</div>
        </div>
      </motion.div>

      {/* CV chip */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        className="absolute top-2 left-2 hidden md:flex items-center gap-2 rounded-full bg-card shadow-soft border border-border/60 px-3 py-1.5"
      >
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">resume_v3.pdf · analyzed</span>
      </motion.div>
    </motion.div>
  );
}