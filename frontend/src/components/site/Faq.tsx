import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionHeading } from "./HowItWorks";

export const faqs = [
  { q: "Phân tích CV có thực sự miễn phí?", a: "Có — điểm ATS và phân tích chi tiết theo mục đều miễn phí. Bản Pro mở khóa số lần phân tích không giới hạn, lưu lịch sử và phiên luyện phỏng vấn dài hơn." },
  { q: "Điểm ATS được tính như thế nào?", a: "Chúng tôi so sánh CV của bạn với cách phân tích của các nền tảng ATS lớn (Workday, Greenhouse, Lever, Taleo). Mỗi mục được chấm điểm theo định dạng, mật độ từ khóa và độ rõ ràng." },
  { q: "CV của tôi có được bảo mật không?", a: "File CV không bao giờ rời khỏi hệ thống phân tích. Chúng tôi không chia sẻ, không bán, không dùng để huấn luyện mô hình. Bạn có thể xóa bất cứ lúc nào." },
  { q: "Hỗ trợ định dạng file nào?", a: "PDF (khuyến nghị) và DOCX, tối đa 5MB. PDF dạng ảnh sẽ được cảnh báo vì ATS không đọc được." },
  { q: "Luyện phỏng vấn hoạt động ra sao?", a: "Dán mô tả công việc (không bắt buộc) — chúng tôi sẽ sinh bộ câu hỏi có cấu trúc từ CV của bạn, kèm nhãn kỹ năng, độ khó và câu hỏi phụ thích ứng theo câu trả lời." },
  { q: "Đây có phải là chatbot không?", a: "Không. Luyện phỏng vấn là trải nghiệm có cấu trúc: từng câu hỏi một, khu vực trả lời rõ ràng và đánh giá theo từng kỹ năng — không phải hội thoại tự do." },
];

export default function Faq() {
  return (
    <section className="py-20 lg:py-28 bg-secondary/40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Hỏi & Đáp" title="Những điều bạn cần biết" subtitle="Tất cả thông tin quan trọng trước khi bạn tải CV lên." />
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