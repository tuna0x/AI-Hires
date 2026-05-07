import { useSyncExternalStore } from "react";
import { GeminiParsedData } from "@/types/cv";

export type AnalysisResult = {
  fileName: string;
  score: number;
  status: string;
  breakdown: {
    formatting: number;
    keywords: number;
    experience: number;
    education: number;
    skills: number;
    readability: number;
  };
  sections: { id: string; title: string; status: "good" | "warn" | "bad"; note: string }[];
  suggestions: { before: string; after: string; reason: string }[];
  topIssues: { title: string; severity: "high" | "medium" | "low"; fix: string }[];
  rawGeminiData?: GeminiParsedData;
  createdAt: number;
};

let state: { result: AnalysisResult | null } = { result: null };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const cvStore = {
  getResult: () => state.result,
  setResult(r: AnalysisResult | null) {
    state = { result: r };
    try {
      if (r) localStorage.setItem("cv:last", JSON.stringify(r));
      else localStorage.removeItem("cv:last");
    } catch {}
    emit();
  },
  hydrate() {
    if (state.result) return;
    try {
      const raw = localStorage.getItem("cv:last");
      if (raw) {
        state = { result: JSON.parse(raw) };
        emit();
      }
    } catch {}
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useCvResult() {
  return useSyncExternalStore(
    (cb) => cvStore.subscribe(cb),
    () => state.result,
    () => state.result,
  );
}

export function generateMockResult(fileName: string): AnalysisResult {
  const score = 77;
  return {
    fileName,
    score,
    status: score >= 85 ? "CV Xuất Sắc" : score >= 70 ? "CV Tốt — Có Thể Cải Thiện" : "CV Cần Cải Thiện Nhiều",
    breakdown: {
      formatting: 90,
      keywords: 65,
      experience: 73,
      education: 71,
      skills: 75,
      readability: 85,
    },
    sections: [
      { id: "contact", title: "Thông tin liên hệ", status: "warn", note: "Thiếu liên kết trang cá nhân LinkedIn và portfolio sản phẩm." },
      { id: "summary", title: "Tóm tắt chuyên môn", status: "warn", note: "Còn khá chung chung — cần bổ sung tuyên ngôn giá trị độc bản và vị trí mục tiêu cụ thể." },
      { id: "experience", title: "Kinh nghiệm làm việc", status: "bad", note: "Các gạch đầu dòng mới chỉ liệt kê nhiệm vụ; hãy bổ sung các thành tích đo lường được bằng con số." },
      { id: "skills", title: "Kỹ năng chuyên môn", status: "bad", note: "Thiếu một số từ khóa cốt lõi cần thiết cho vị trí: React, Node.js, SQL, TypeScript." },
      { id: "education", title: "Học vấn", status: "good", note: "Thông tin trình bày đầy đủ, định dạng sạch sẽ và có mốc thời gian rõ ràng." },
    ],
    topIssues: [
      { title: "Thiếu kết quả định lượng trong phần Kinh nghiệm", severity: "high", fix: "Thêm các con số (doanh thu, phần trăm, quy mô, thời gian) cho ít nhất 60% các mô tả công việc." },
      { title: "Thiếu từ khóa chuyên môn cốt lõi", severity: "high", fix: "Đưa thêm các thuật ngữ chuyên ngành khớp chính xác với bản mô tả công việc vào phần Kỹ năng & Tóm tắt." },
      { title: "Tóm tắt chuyên môn còn chung chung", severity: "medium", fix: "Mở đầu bằng một tuyên ngôn giá trị ngắn gọn dài 1-2 câu thể hiện rõ thế mạnh cho vị trí bạn nhắm tới." },
    ],
    suggestions: [
      {
        before: "Quản lý đội ngũ kinh doanh",
        after: "Dẫn dắt đội ngũ kinh doanh gồm 8 thành viên và tăng doanh số hàng quý lên 28% nhờ tái cấu trúc quy trình bán hàng",
        reason: "Bổ sung quy mô nhóm quản lý, số liệu tăng trưởng và phương pháp hành động cụ thể thúc đẩy hiệu quả.",
      },
      {
        before: "Chịu trách nhiệm cho các chiến dịch marketing",
        after: "Triển khai 12 chiến dịch đa kênh tạo ra 1.4 triệu USD trong phễu cơ hội kinh doanh với tỷ lệ ROAS đạt 3.8x",
        reason: "Định lượng rõ ràng quy mô chiến dịch, giá trị doanh thu mang lại và hiệu suất chi phí đầu tư.",
      },
      {
        before: "Hỗ trợ cải thiện giao diện website công ty",
        after: "Thiết kế lại toàn bộ các trang đích chính, giúp nâng tỷ lệ chuyển đổi từ 2.1% lên 4.7% trong vòng 90 ngày",
        reason: "Thể hiện kết quả cụ thể với số liệu đối chiếu trước/sau và khung thời gian thực hiện rõ ràng.",
      },
    ],
    rawGeminiData: {
      total_score: score,
      stage1_detection: {
        name: "Nguyễn Văn Sơn",
        level: "Junior-Middle",
        industry: "Kỹ sư Phần mềm (Java / Spring Boot)",
      },
      stage2_core: {
        score: 48,
        ats_format: {
          score: 18,
          details: [
            "File Technical: +5/5 (Định dạng PDF chuẩn, cấu trúc dễ parse)",
            "ATS Parsability: +7/8 (Sử dụng tiêu đề chuẩn như Education, Experience)",
            "Typography: +3/4 (Font chữ thống nhất, giãn dòng hợp lý)",
            "Length: +3/3 (Độ dài 1 trang hoàn hảo cho cấp độ Junior/Middle)"
          ],
        },
        professional_foundation: {
          score: 17,
          details: [
            "Contact: +4/4 (Đầy đủ Email, Số điện thoại, GitHub, LinkedIn)",
            "Summary: +3/5 (Mục tiêu nghề nghiệp còn hơi chung chung, cần cá nhân hóa)",
            "Sections: +5/6 (Thiếu phần chứng chỉ ngoại ngữ hoặc kỹ năng mềm)",
            "Organization: +5/5 (Thứ tự thời gian đảo ngược chuẩn tuyển dụng)"
          ],
        },
        content_quality: {
          score: 13,
          details: [
            "Language: +4/5 (Sử dụng động từ hành động mạnh mẽ, ngữ pháp tốt)",
            "Quantification: +3/8 (Ít số liệu định lượng, mới chỉ liệt kê công việc)",
            "Keywords: +3/4 (Đã có một số từ khóa chính như Java, Spring, SQL)",
            "Consistency: +3/3 (Thống nhất định dạng ngày tháng và dấu câu)"
          ],
        },
      },
      stage3_in_depth: {
        score: 21,
        experience_eval: {
          score: 11,
          details: [
            "Progression: +3/3 (Thể hiện rõ sự thăng tiến qua các vị trí)",
            "Bullet Quality: +4/6 (Mô tả công việc tốt nhưng chưa nêu bật giải pháp)",
            "Scope & Impact: +4/6 (Quy mô dự án vừa phải, chưa rõ tầm ảnh hưởng)"
          ],
        },
        technical_evidence: {
          score: 6,
          details: [
            "Chi tiết bằng chứng kỹ năng: +6/8 (Nêu rõ các framework nhưng thiếu thư viện nâng cao)"
          ],
        },
        projects: {
          score: 4,
          details: [
            "Đánh giá chất lượng dự án: +4/5 (Dự án thực tế có link GitHub đính kèm)"
          ],
        },
        certs: {
          score: 1,
          details: [
            "Bằng cấp, chứng chỉ liên quan: +1/2 (Có bằng đại học chuyên ngành, chưa có chứng chỉ hãng)"
          ],
        },
      },
      stage4_bonus: {
        score: 4,
        details: [
          "Leadership: +1/2 (Có kinh nghiệm mentor cho intern)",
          "International: +1/2 (Khả năng đọc hiểu tài liệu tiếng Anh tốt)",
          "Learning: +2/2 (Tinh thần tự học hỏi công nghệ mới rất cao)"
        ],
      },
      strengths: [
        "Kỹ năng lập trình Java Core & Spring Boot vững vàng, có hiểu biết về Microservices.",
        "Thông tin liên hệ đầy đủ, trình bày CV rõ ràng, chuẩn cấu trúc ATS một cột.",
        "Dự án cá nhân phong phú, có mã nguồn thực tế trên GitHub để kiểm chứng."
      ],
      priority_actions: [
        { action: "Bổ sung thêm các số liệu định lượng (%, doanh số, lượng user) vào phần kinh nghiệm làm việc để làm nổi bật kết quả thực tế đạt được.", priority: "Cao" },
        { action: "Cá nhân hóa phần tóm tắt chuyên môn bằng cách đưa thêm tuyên ngôn giá trị đặc biệt phù hợp trực tiếp với JD tuyển dụng.", priority: "Trung bình" },
        { action: "Cập nhật thêm chứng chỉ chuyên môn (AWS, Oracle Java) hoặc ngoại ngữ (IELTS/TOEIC) nếu có.", priority: "Thấp" }
      ],
    },
    createdAt: Date.now(),
  };
}