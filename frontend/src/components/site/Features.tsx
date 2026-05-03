import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gauge, ListChecks, Lightbulb, MessageSquareQuote, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./HowItWorks";

const blocks = [
  {
    eyebrow: "01 — CV Analysis",
    title: "Get a clear ATS score and know exactly what to fix",
    desc: "Upload your CV and receive an honest 0–100 ATS score, a section-by-section breakdown, and the top three critical issues holding you back.",
    bullets: [
      { icon: Gauge, t: "ATS score & detailed breakdown" },
      { icon: ListChecks, t: "Formatting, keywords, experience, skills" },
      { icon: Lightbulb, t: "Actionable, line-level feedback" },
    ],
    cta: { label: "Analyze my CV", to: "/cv-analysis" },
  },
  {
    eyebrow: "02 — Interview Practice",
    title: "Practice real interviews tailored to your CV",
    desc: "A structured mock interview — not a chatbot. Personalized questions are generated from your CV and the job description, with adaptive follow-ups and skill-level evaluation.",
    bullets: [
      { icon: MessageSquareQuote, t: "Personalized questions from your CV" },
      { icon: Sparkles, t: "Skill-based evaluation per answer" },
      { icon: RefreshCw, t: "Adaptive follow-up questions" },
    ],
    cta: { label: "Start practice", to: "/interview" },
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Two tools. One outcome."
          title="Everything you need to land the offer"
          subtitle="A focused workflow: analyze your CV, fix the gaps, then practice the exact interview you're preparing for."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {blocks.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-3xl p-8 lg:p-10 border border-border/60 shadow-soft hover:shadow-card transition-shadow"
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">{b.eyebrow}</span>
              <h3 className="text-2xl lg:text-3xl font-bold tracking-tight">{b.title}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{b.desc}</p>
              <ul className="mt-6 space-y-3">
                {b.bullets.map((x) => (
                  <li key={x.t} className="flex items-center gap-3 text-sm">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-light text-primary"><x.icon className="h-4 w-4" /></span>
                    {x.t}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-7 bg-gradient-primary text-primary-foreground rounded-xl h-11 px-6 font-semibold">
                <Link to={b.cta.to}>{b.cta.label} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}