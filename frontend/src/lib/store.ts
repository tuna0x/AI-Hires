import { useSyncExternalStore } from "react";

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
  // Deterministic-ish but feels fresh
  const seed = (fileName.length * 13) % 18;
  const score = 74 + seed;
  return {
    fileName,
    score,
    status: score >= 85 ? "CV Xuất Sắc" : score >= 70 ? "CV Tốt — Có Thể Cải Thiện" : "CV Cần Cải Thiện Nhiều",
    breakdown: {
      formatting: 88,
      keywords: 72,
      experience: 81,
      education: 92,
      skills: 68,
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
    createdAt: Date.now(),
  };
}