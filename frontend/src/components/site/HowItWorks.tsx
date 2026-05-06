import { motion } from "framer-motion";
import { Upload, Wand2, Mic, Trophy } from "lucide-react";

const steps = [
  { icon: Upload, title: "Phân tích CV", desc: "Tải lên file PDF hoặc DOCX. Nhận điểm ATS tức thì kèm nhận xét theo từng mục." },
  { icon: Wand2, title: "Khắc phục điểm yếu", desc: "Áp dụng các đề xuất cụ thể về định dạng, từ khóa và mức độ tác động." },
  { icon: Mic, title: "Luyện phỏng vấn", desc: "Bắt đầu phiên phỏng vấn mô phỏng theo CV và vị trí bạn nhắm tới." },
  { icon: Trophy, title: "Đạt kết quả tốt hơn", desc: "Bước vào buổi phỏng vấn thật với sự chuẩn bị kỹ và tự tin." },
];

export default function HowItWorks() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Cách hoạt động"
          title="Bốn bước để có CV tốt hơn"
          subtitle="Không cần đăng ký, không rườm rà. Từ tải lên đến phân tích chỉ trong vài giây."
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