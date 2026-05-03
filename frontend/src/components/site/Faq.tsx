import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeading } from "./HowItWorks";

export const faqs = [
  { q: "Is CV analysis really free?", a: "Yes — your ATS score and detailed section analysis are free. Pro unlocks unlimited analyses, history, and longer interview practice sessions." },
  { q: "How does the ATS score work?", a: "We benchmark your CV against the parsing logic used by major ATS platforms (Workday, Greenhouse, Lever, Taleo). Each section earns points for formatting, keyword density, and clarity." },
  { q: "Is my CV private and secure?", a: "Your file never leaves our analysis pipeline. We don't share, sell, or train models on your CV. You can delete it at any time." },
  { q: "What file formats do you support?", a: "PDF (recommended) and DOCX, up to 5MB. Image-based PDFs are auto-flagged because ATS systems can't read them." },
  { q: "How does interview practice work?", a: "Paste a target job description (optional) and we generate a structured set of questions from your CV — with skill tags, difficulty, and adaptive follow-ups based on your answers." },
  { q: "Is this a chatbot?", a: "No. Interview practice is a structured experience: one question at a time, a focused answer area, and a clear evaluation per skill — not an open-ended chat." },
];

export default function Faq() {
  return (
    <section className="py-20 lg:py-28 bg-secondary/40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" subtitle="Everything you need to know before you upload." />
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`f${i}`} className="bg-card border border-border/60 rounded-2xl px-5 shadow-soft">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}