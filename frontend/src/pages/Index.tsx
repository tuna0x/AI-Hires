import SiteLayout from "@/components/site/SiteLayout";
import Hero from "@/components/site/Hero";
import HowItWorks from "@/components/site/HowItWorks";
import Features from "@/components/site/Features";
import Faq, { faqs } from "@/components/site/Faq";
import CtaBand from "@/components/site/CtaBand";
import { Seo, orgJsonLd, faqLd } from "@/lib/seo";

export default function Index() {
  return (
    <SiteLayout>
      <Seo
        title="CareerAI — Improve Your CV & Pass Interviews with AI"
        description="A focused AI career tool: get an ATS-grade CV analysis and practice structured mock interviews tailored to your CV and target role."
        path="/"
        jsonLd={[orgJsonLd, faqLd(faqs)]}
      />
      <Hero />
      <Features />
      <HowItWorks />
      <Faq />
      <CtaBand />
    </SiteLayout>
  );
}
