import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteLayout from "@/components/site/SiteLayout";
import PageHero from "@/components/site/PageHero";
import Faq, { faqs } from "@/components/site/Faq";
import { Seo, breadcrumbLd, faqLd } from "@/lib/seo";

const tiers = [
  {
    name: "Free",
    price: "$0",
    sub: "forever",
    highlight: false,
    features: ["1 CV analysis per day", "Full ATS score & breakdown", "Top 3 critical issues", "5 interview questions per session", "3 AI rewrites"],
    cta: "Start free",
  },
  {
    name: "Pro",
    price: "$12",
    sub: "/ month",
    highlight: true,
    features: ["Unlimited CV analyses", "Unlimited AI rewrites", "Long interview sessions (up to 20 Qs)", "Adaptive follow-ups", "Per-skill scoring", "Version history"],
    cta: "Start 7-day free trial",
  },
  {
    name: "Teams",
    price: "$39",
    sub: "/ month",
    highlight: false,
    features: ["Everything in Pro", "Team workspaces (5 seats)", "Shared rubrics", "Custom skill taxonomy", "Priority support"],
    cta: "Contact sales",
  },
];

export default function Pricing() {
  return (
    <SiteLayout>
      <Seo
        title="Pricing — Free CV Analysis & Pro Interview Practice"
        description="Start free with a full ATS score and a 5-question mock interview. Upgrade to Pro for unlimited analyses and longer sessions."
        path="/pricing"
        jsonLd={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]), faqLd(faqs)]}
      />
      <PageHero eyebrow="Pricing" title="Simple, honest pricing" subtitle="Free for the score. Pro if you want every advantage. Cancel anytime." />

      <section className="pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-5">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={`relative rounded-3xl p-8 border shadow-card ${t.highlight ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow scale-[1.02]" : "bg-card border-border/60"}`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-background text-primary px-3 py-1 text-xs font-bold border border-primary/30 shadow-soft">
                  <Sparkles className="h-3 w-3" /> Most popular
                </span>
              )}
              <div className="flex items-center gap-2">
                {t.name === "Pro" && <Crown className="h-5 w-5" />}
                <h3 className="text-xl font-bold">{t.name}</h3>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight">{t.price}</span>
                <span className={t.highlight ? "opacity-80" : "text-muted-foreground"}>{t.sub}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm">
                    <Check className={`h-5 w-5 shrink-0 ${t.highlight ? "" : "text-primary"}`} />
                    <span className={t.highlight ? "" : "text-foreground"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-7 w-full h-11 rounded-xl font-semibold ${t.highlight ? "bg-background text-foreground hover:bg-background/90" : "bg-gradient-primary text-primary-foreground"}`}
              >
              <Link to={t.name === "Teams" ? "/contact" : "/cv-analysis"}>{t.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </section>
      <Faq />
    </SiteLayout>
  );
}