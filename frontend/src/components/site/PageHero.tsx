import { ReactNode } from "react";

export default function PageHero({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-24">
      <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {eyebrow && <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">{eyebrow}</span>}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">{subtitle}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3 justify-center">{children}</div>}
      </div>
    </section>
  );
}