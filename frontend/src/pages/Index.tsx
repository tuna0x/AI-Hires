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
        title="NextStep AI — Đánh giá CV chuẩn ATS & Luyện phỏng vấn AI"
        description="Công cụ phát triển sự nghiệp bằng AI: phân tích và chấm điểm CV chuẩn ATS, luyện phỏng vấn thử cá nhân hóa theo đúng hồ sơ và vị trí mục tiêu của bạn."
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
