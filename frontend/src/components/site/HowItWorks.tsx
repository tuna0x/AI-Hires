import { motion } from "framer-motion";
import { Upload, Wand2, Mic, Trophy } from "lucide-react";

const steps = [
  { icon: Upload, title: "Analyze your CV", desc: "Upload a PDF or DOCX. Get an instant ATS score with section-level feedback." },
  { icon: Wand2, title: "Fix the gaps", desc: "Apply targeted, actionable suggestions for formatting, keywords, and impact." },
  { icon: Mic, title: "Practice interviews", desc: "Run a structured mock interview tailored to your CV and target role." },
  { icon: Trophy, title: "Get better results", desc: "Walk into real interviews calibrated, confident, and prepared." },
];

export default function HowItWorks() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps to a better resume"
          subtitle="No sign-up. No friction. From upload to insights in under ten seconds."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative">
          <div className="absolute hidden lg:block top-12 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative bg-card rounded-3xl p-7 border border-border/60 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <s.icon className="h-6 w-6" />
              </div>
              <div className="absolute top-6 right-6 text-5xl font-black text-primary/10">0{i + 1}</div>
              <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, center = true }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div className={center ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}>
      {eyebrow && <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">{eyebrow}</span>}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{subtitle}</p>}
    </div>
  );
}