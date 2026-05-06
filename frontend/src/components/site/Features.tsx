import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gauge, ListChecks, Lightbulb, MessageSquareQuote, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./HowItWorks";

const blocks = [
  {
    eyebrow: "01 — Phân tích CV",
    title: "Điểm ATS rõ ràng và biết chính xác cần sửa gì",
    desc: "Tải CV lên và nhận điểm ATS từ 0–100, phân tích chi tiết theo từng mục, cùng 3 vấn đề quan trọng nhất bạn cần khắc phục.",
    bullets: [
      { icon: Gauge, t: "Điểm ATS và phân tích chi tiết" },
      { icon: ListChecks, t: "Định dạng, từ khóa, kinh nghiệm, kỹ năng" },
      { icon: Lightbulb, t: "Gợi ý cụ thể đến từng dòng" },
    ],
    cta: { label: "Phân tích CV của tôi", to: "/cv-analysis" },
  },
  {
    eyebrow: "02 — Luyện phỏng vấn",
    title: "Phỏng vấn thực chiến được cá nhân hóa theo CV của bạn",
    desc: "Phiên phỏng vấn có cấu trúc — không phải chatbot. Câu hỏi được sinh từ CV và mô tả công việc, có câu hỏi phụ thích ứng và đánh giá theo từng kỹ năng.",
    bullets: [
      { icon: MessageSquareQuote, t: "Câu hỏi cá nhân hóa từ CV" },
      { icon: Sparkles, t: "Đánh giá theo kỹ năng cho mỗi câu trả lời" },
      { icon: RefreshCw, t: "Câu hỏi phụ thích ứng theo câu trả lời" },
    ],
    cta: { label: "Bắt đầu luyện", to: "/interview" },
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Hai công cụ. Một mục tiêu."
          title="Mọi thứ bạn cần để nhận được offer"
          subtitle="Quy trình tập trung: phân tích CV, sửa lỗi, sau đó luyện đúng buổi phỏng vấn bạn đang chuẩn bị."
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