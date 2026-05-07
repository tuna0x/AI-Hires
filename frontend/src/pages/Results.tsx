import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Gauge, ListChecks, Wand2, Mic, Crown,
  Download, CheckCircle2, AlertTriangle, XCircle, Copy, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Info, User, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { cvStore, useCvResult, generateMockResult, AnalysisResult } from "@/lib/store";
import ScoreCircle from "@/components/results/ScoreCircle";
import { toast } from "sonner";

const NAV = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "ats", label: "Điểm ATS chi tiết", icon: Gauge },
  { id: "sections", label: "Phân tích từng mục", icon: ListChecks },
  { id: "improve", label: "Cải thiện CV", icon: Wand2 },
  { id: "practice", label: "Luyện phỏng vấn", icon: Mic },
];

// Helper to distribute targetScore mathematically among items with their respective max scores
function distributeScore(targetScore: number, itemsMax: number[]): number[] {
  const totalMax = itemsMax.reduce((a, b) => a + b, 0);
  const clampedTarget = Math.min(totalMax, Math.max(0, targetScore));
  const results = itemsMax.map(max => Math.floor((max / totalMax) * clampedTarget));
  let currentSum = results.reduce((a, b) => a + b, 0);
  let remaining = clampedTarget - currentSum;
  let attempts = 0;
  while (remaining > 0 && attempts < 100) {
    attempts++;
    for (let i = 0; i < itemsMax.length && remaining > 0; i++) {
      if (results[i] < itemsMax[i]) {
        results[i]++;
        remaining--;
      }
    }
  }
  return results;
}

// Reconstruct a rich, structured fallback matching the result scores in case rawGeminiData is missing (e.g., cached in local storage)
function getRawGeminiDataWithFallback(result: AnalysisResult) {
  if (result.rawGeminiData && result.rawGeminiData.stage2_core) {
    const data = { ...result.rawGeminiData };
    
    // Inject sub_tips if missing
    if (!data.sub_tips) {
      const getScoreVal = (str: string) => {
        const match = str.match(/\+(\d+)\/(\d+)/);
        return match ? { score: parseInt(match[1]), max: parseInt(match[2]) } : { score: 10, max: 10 };
      };

      const atsParse = getScoreVal(data.stage2_core.ats_format?.details?.[1] || "");
      const typography = getScoreVal(data.stage2_core.ats_format?.details?.[2] || "");
      const length = getScoreVal(data.stage2_core.ats_format?.details?.[3] || "");

      const contact = getScoreVal(data.stage2_core.professional_foundation?.details?.[0] || "");
      const summary = getScoreVal(data.stage2_core.professional_foundation?.details?.[1] || "");
      const sections = getScoreVal(data.stage2_core.professional_foundation?.details?.[2] || "");
      const org = getScoreVal(data.stage2_core.professional_foundation?.details?.[3] || "");

      const lang = getScoreVal(data.stage2_core.content_quality?.details?.[0] || "");
      const quant = getScoreVal(data.stage2_core.content_quality?.details?.[1] || "");
      const kw = getScoreVal(data.stage2_core.content_quality?.details?.[2] || "");
      const consistency = getScoreVal(data.stage2_core.content_quality?.details?.[3] || "");

      const prog = getScoreVal(data.stage3_in_depth?.experience_eval?.details?.[0] || "");
      const bullet = getScoreVal(data.stage3_in_depth?.experience_eval?.details?.[1] || "");
      const scope = getScoreVal(data.stage3_in_depth?.experience_eval?.details?.[2] || "");

      const techEv = getScoreVal(data.stage3_in_depth?.technical_evidence?.details?.[0] || "");
      const proj = getScoreVal(data.stage3_in_depth?.projects?.details?.[0] || "");
      const certs = getScoreVal(data.stage3_in_depth?.certs?.details?.[0] || "");

      data.sub_tips = {
        file_technical: null,
        ats_parsability: atsParse.score < atsParse.max ? "Thêm header chuẩn: 'Work Experience', 'Education', 'Skills' để máy đọc nhận diện tốt hơn." : null,
        typography: typography.score < typography.max ? "Dùng 1 font duy nhất (Arial/Calibri), căn lề trái, cỡ chữ 10–12pt." : null,
        length: length.score < length.max ? "Rút gọn CV xuống còn 1 trang — bỏ thông tin không liên quan." : null,
        contact: contact.score < contact.max ? "Bổ sung đầy đủ LinkedIn, GitHub, Email và Số điện thoại chuyên nghiệp." : null,
        summary: summary.score < summary.max ? "Viết lại mục tiêu nghề nghiệp: nêu rõ vị trí ứng tuyển, số năm kinh nghiệm và giá trị mang lại." : null,
        sections: sections.score < sections.max ? "Bổ sung đầy đủ các phần chính: Kinh nghiệm, Kỹ năng, Học vấn." : null,
        organization: org.score < org.max ? "Trình bày thông tin theo dòng thời gian đảo ngược chuẩn tuyển dụng." : null,
        language: lang.score < lang.max ? "Sử dụng nhiều động từ mạnh ở đầu gạch đầu dòng, tránh mô tả chung chung." : null,
        quantification: quant.score < quant.max ? "Đưa thêm con số %, $, tỷ lệ tăng trưởng vào mô tả kết quả công việc." : null,
        keywords: kw.score < kw.max ? "Cập nhật các kỹ năng và từ khóa chuyên môn sát với JD của nhà tuyển dụng." : null,
        action_verbs_tone: kw.score < kw.max ? "Hành văn với giọng điệu chủ động, tự tin và dùng thuật ngữ chuẩn ngành." : null,
        consistency: consistency.score < consistency.max ? "Đảm bảo mốc thời gian, dấu chấm câu và cách giãn dòng đồng nhất." : null,
        progression: prog.score < prog.max ? "Làm rõ lộ trình thăng tiến, mở rộng trách nhiệm qua các năm làm việc." : null,
        bullet_quality: bullet.score < bullet.max ? "Viết lại gạch đầu dòng theo mô hình STAR (Tình huống, Nhiệm vụ, Hành động, Kết quả)." : null,
        scope_impact: scope.score < scope.max ? "Nêu rõ quy mô dự án và mức độ ảnh hưởng của kết quả bạn làm ra." : null,
        technical_evidence: techEv.score < techEv.max ? "Liệt kê các kỹ năng theo nhóm và cung cấp dẫn chứng cụ thể trong dự án." : null,
        projects: proj.score < proj.max ? "Mô tả dự án nổi bật: vai trò của bạn, các công nghệ sử dụng và kết quả thực tiễn." : null,
        certs: certs.score < certs.max ? "Bổ sung các chứng chỉ chuyên môn quốc tế hoặc ngoại ngữ (IELTS/TOEIC)." : null,
      };
    }

    if (!data.score_gaps) {
      const getScoreVal = (str: string) => {
        const match = str.match(/\+(\d+)\/(\d+)/);
        return match ? { score: parseInt(match[1]), max: parseInt(match[2]) } : { score: 10, max: 10 };
      };
      
      const atsParse = getScoreVal(data.stage2_core.ats_format?.details?.[1] || "");
      const summary = getScoreVal(data.stage2_core.professional_foundation?.details?.[1] || "");
      const quant = getScoreVal(data.stage2_core.content_quality?.details?.[1] || "");
      const bullet = getScoreVal(data.stage3_in_depth?.experience_eval?.details?.[1] || "");
      const proj = getScoreVal(data.stage3_in_depth?.projects?.details?.[0] || "");

      data.score_gaps = [
        {
          section: "Quantification",
          current: quant.score,
          max: 8,
          lost: 8 - quant.score,
          tip: "Đưa thêm con số %, $, tỷ lệ tăng trưởng vào mô tả kết quả công việc."
        },
        {
          section: "ATS Parsability",
          current: atsParse.score,
          max: 8,
          lost: 8 - atsParse.score,
          tip: "Thêm header chuẩn: 'Work Experience', 'Education', 'Skills' để máy đọc nhận diện tốt hơn."
        },
        {
          section: "Bullet Quality",
          current: bullet.score,
          max: 6,
          lost: 6 - bullet.score,
          tip: "Viết lại gạch đầu dòng theo mô hình STAR (Tình huống, Nhiệm vụ, Hành động, Kết quả)."
        },
        {
          section: "Summary",
          current: summary.score,
          max: 5,
          lost: 5 - summary.score,
          tip: "Viết lại mục tiêu nghề nghiệp: nêu rõ vị trí ứng tuyển, số năm kinh nghiệm và giá trị mang lại."
        },
        {
          section: "Projects",
          current: proj.score,
          max: 5,
          lost: 5 - proj.score,
          tip: "Mô tả dự án nổi bật: vai trò của bạn, các công nghệ sử dụng và kết quả thực tiễn."
        }
      ].filter(gap => gap.lost > 0).sort((a, b) => b.lost - a.lost).slice(0, 5);
    }

    return data;
  }
  
  const score = result.score;
  const formattingScore = Math.round(result.breakdown.formatting / 5);
  const keywordsScore = Math.round(result.breakdown.keywords / 5);
  const experienceScore = Math.round((result.breakdown.experience / 100) * 15);
  const skillsScore = Math.round((result.breakdown.skills / 100) * 8);
  const educationScore = Math.round((result.breakdown.education / 100) * 7); // Certs (2) + Projects (5) = 7
  const readabilityScore = Math.round(result.breakdown.readability / 5);

  // Distribute scores mathematically to match category scores exactly
  const formattingDist = distributeScore(formattingScore, [5, 8, 4, 3]);
  const readabilityDist = distributeScore(readabilityScore, [4, 5, 6, 5]);
  const keywordsDist = distributeScore(keywordsScore, [5, 8, 4, 3]);
  const experienceDist = distributeScore(experienceScore, [3, 6, 6]);
  const educationDist = distributeScore(educationScore, [2, 5]);
  const bonusDist = distributeScore(6, [2, 2, 2, 2, 2]);

  return {
    total_score: score,
    stage1_detection: {
      name: "Ứng viên AI-Hires",
      level: score >= 85 ? "Middle-Senior" : score >= 70 ? "Junior-Middle" : "Intern-Fresher",
      industry: "Công nghệ thông tin / Kỹ thuật Phần mềm",
    },
    stage2_core: {
      score: Math.min(60, (result.breakdown.formatting + result.breakdown.readability + result.breakdown.keywords) / 5),
      ats_format: {
        score: formattingScore,
        details: [
          `File Technical: +${formattingDist[0]}/5 (Định dạng file PDF chuẩn hóa, cấu trúc dễ parse)`,
          `ATS Parsability: +${formattingDist[1]}/8 (Sử dụng các đề mục chuẩn như Education, Work Experience)`,
          `Typography: +${formattingDist[2]}/4 (Phông chữ rõ ràng, đồng nhất, kích thước chữ phù hợp)`,
          `Length: +${formattingDist[3]}/3 (Độ dài CV tối ưu cho cấp độ và số năm kinh nghiệm)`
        ],
      },
      professional_foundation: {
        score: readabilityScore,
        details: [
          `Contact: +${readabilityDist[0]}/4 (Có đầy đủ liên kết LinkedIn, GitHub và thông tin cơ bản)`,
          `Summary: +${readabilityDist[1]}/5 (Tóm tắt chuyên môn trình bày tốt, nêu bật định hướng nghề nghiệp)`,
          `Sections: +${readabilityDist[2]}/6 (Đầy đủ cấu trúc các phần chính chuẩn quốc tế)`,
          `Organization: +${readabilityDist[3]}/5 (Trình bày khoa học, dễ theo dõi cho nhà tuyển dụng)`
        ],
      },
      content_quality: {
        score: keywordsScore,
        details: [
          `Language: +${keywordsDist[0]}/5 (Hành văn chuyên nghiệp, hạn chế các từ ngữ chung chung)`,
          `Quantification: +${keywordsDist[1]}/8 (Mức độ sử dụng số liệu định lượng để chứng minh hiệu quả)`,
          `Keywords: +${keywordsDist[2]}/4 (Sự khớp nối từ khóa chuyên môn cốt lõi với tin tuyển dụng)`,
          `Consistency: +${keywordsDist[3]}/3 (Mốc thời gian và định dạng trình bày đồng nhất)`
        ],
      },
    },
    stage3_in_depth: {
      score: experienceScore + skillsScore + educationScore,
      experience_eval: {
        score: experienceScore,
        details: [
          `Progression: +${experienceDist[0]}/3 (Mô tả công việc thể hiện rõ sự thăng tiến qua từng năm)`,
          `Bullet Quality: +${experienceDist[1]}/6 (Gạch đầu dòng rõ ràng, hành động đi liền kết quả)`,
          `Scope & Impact: +${experienceDist[2]}/6 (Phạm vi công việc và giá trị đóng góp cho tổ chức)`
        ],
      },
      technical_evidence: {
        score: skillsScore,
        details: [
          `Chi tiết bằng chứng kỹ năng: +${skillsScore}/8 (Mức độ cung cấp minh chứng cụ thể cho các kỹ năng cốt lõi)`
        ],
      },
      projects: {
        score: educationDist[1],
        details: [
          `Đánh giá chất lượng dự án: +${educationDist[1]}/5 (Dự án thực tế, có ứng dụng thực tiễn cao)`
        ],
      },
      certs: {
        score: educationDist[0],
        details: [
          `Bằng cấp, chứng chỉ liên quan: +${educationDist[0]}/2 (Sở hữu các chứng chỉ chuyên môn hỗ trợ tốt cho vị trí ứng tuyển)`
        ],
      },
    },
    stage4_bonus: {
      score: 6,
      details: [
        `Leadership: +${bonusDist[0]}/2 (Có kinh nghiệm điều phối dự án hoặc dẫn dắt đội nhóm)`,
        `International: +${bonusDist[1]}/2 (Có khả năng ngoại ngữ, làm việc trong môi trường đa văn hóa)`,
        `Awards: +${bonusDist[2]}/2 (Đạt giải thưởng hoặc thành tích học thuật/chuyên môn)`,
        `Learning: +${bonusDist[3]}/2 (Có định hướng tự học các công nghệ mới liên tục)`,
        `Category-Specific: +${bonusDist[4]}/2 (Có các khía cạnh đặc thù phù hợp tính chất công việc)`
      ],
    },
    strengths: result.sections.filter(s => s.status === "good").map(s => `${s.title}: ${s.note}`) || [
      "Bố cục CV khoa học, dễ nhìn và tối ưu hóa tốt cho máy quét ATS.",
      "Thông tin liên hệ đầy đủ, rõ ràng và có đính kèm liên kết LinkedIn/GitHub.",
      "Có định lượng kết quả công việc bằng con số trong một số mô tả."
    ],
    priority_actions: result.topIssues.map(i => ({ action: i.title, priority: i.severity === "high" ? "Cao" : "Trung bình" })) || [
      { action: "Bổ sung thêm số liệu định lượng vào phần mô tả kinh nghiệm làm việc.", priority: "Cao" },
      { action: "Đưa thêm từ khóa chuyên ngành sát với bản mô tả công việc (JD).", priority: "Trung bình" }
    ],
    sub_tips: {
      file_technical: null,
      ats_parsability: formattingDist[1] < 8 ? "Thêm header chuẩn: 'Work Experience', 'Education', 'Skills' để máy đọc nhận diện tốt hơn." : null,
      typography: formattingDist[2] < 4 ? "Dùng 1 font duy nhất (Arial/Calibri), căn lề trái, cỡ chữ 10–12pt." : null,
      length: formattingDist[3] < 3 ? "Rút gọn CV xuống còn 1 trang — bỏ thông tin không liên quan." : null,
      contact: readabilityDist[0] < 4 ? "Bổ sung đầy đủ LinkedIn, GitHub, Email và Số điện thoại chuyên nghiệp." : null,
      summary: readabilityDist[1] < 5 ? "Viết lại mục tiêu nghề nghiệp: nêu rõ vị trí ứng tuyển, số năm kinh nghiệm và giá trị mang lại." : null,
      sections: readabilityDist[2] < 6 ? "Bổ sung đầy đủ các phần chính: Kinh nghiệm, Kỹ năng, Học vấn." : null,
      organization: readabilityDist[3] < 5 ? "Trình bày thông tin theo dòng thời gian đảo ngược chuẩn tuyển dụng." : null,
      language: keywordsDist[0] < 5 ? "Sử dụng nhiều động từ mạnh ở đầu gạch đầu dòng, tránh mô tả chung chung." : null,
      quantification: keywordsDist[1] < 8 ? "Đưa thêm con số %, $, tỷ lệ tăng trưởng vào mô tả kết quả công việc." : null,
      keywords: keywordsDist[2] < 4 ? "Cập nhật các kỹ năng và từ khóa chuyên môn sát với JD của nhà tuyển dụng." : null,
      action_verbs_tone: keywordsDist[2] < 4 ? "Hành văn với giọng điệu chủ động, tự tin và dùng thuật ngữ chuẩn ngành." : null,
      consistency: keywordsDist[3] < 3 ? "Đảm bảo mốc thời gian, dấu chấm câu và cách giãn dòng đồng nhất." : null,
      progression: experienceDist[0] < 3 ? "Làm rõ lộ trình thăng tiến, mở rộng trách nhiệm qua các năm làm việc." : null,
      bullet_quality: experienceDist[1] < 6 ? "Viết lại gạch đầu dòng theo mô hình STAR (Tình huống, Nhiệm vụ, Hành động, Kết quả)." : null,
      scope_impact: experienceDist[2] < 6 ? "Nêu rõ quy mô dự án và mức độ ảnh hưởng của kết quả bạn làm ra." : null,
      technical_evidence: skillsScore < 8 ? "Liệt kê các kỹ năng theo nhóm và cung cấp dẫn chứng cụ thể trong dự án." : null,
      projects: educationDist[1] < 5 ? "Mô tả dự án nổi bật: vai trò của bạn, các công nghệ sử dụng và kết quả thực tiễn." : null,
      certs: educationDist[0] < 2 ? "Bổ sung các chứng chỉ chuyên môn quốc tế hoặc ngoại ngữ (IELTS/TOEIC)." : null,
      leadership: bonusDist[0] < 2 ? "Chia sẻ thêm kinh nghiệm hướng dẫn người mới hoặc quản lý nhóm nhỏ." : null,
      international: bonusDist[1] < 2 ? "Nhấn mạnh kỹ năng ngoại ngữ và kinh nghiệm làm việc đa quốc gia." : null,
      awards: bonusDist[2] < 2 ? "Liệt kê các giải thưởng, học bổng hoặc thành tích xuất sắc đạt được." : null,
      learning: bonusDist[3] < 2 ? "Nêu rõ các khóa học online hoặc kỹ năng mới bạn đang tự học nâng cao." : null,
      category_specific: bonusDist[4] < 2 ? "Thêm liên kết danh mục sản phẩm (Portfolio/Behance/GitHub) phù hợp với nhóm ngành." : null
    },
    score_gaps: [
      {
        section: "Quantification",
        current: keywordsDist[1],
        max: 8,
        lost: 8 - keywordsDist[1],
        tip: "Đưa thêm con số %, $, tỷ lệ tăng trưởng vào mô tả kết quả công việc."
      },
      {
        section: "ATS Parsability",
        current: formattingDist[1],
        max: 8,
        lost: 8 - formattingDist[1],
        tip: "Thêm header chuẩn: 'Work Experience', 'Education', 'Skills' để máy đọc nhận diện tốt hơn."
      },
      {
        section: "Bullet Quality",
        current: experienceDist[1],
        max: 6,
        lost: 6 - experienceDist[1],
        tip: "Viết lại gạch đầu dòng theo mô hình STAR (Tình huống, Nhiệm vụ, Hành động, Kết quả)."
      }
    ].filter(gap => gap.lost > 0).sort((a, b) => b.lost - a.lost).slice(0, 5)
  };
}

// Helper to parse "Criteria Name: +X/Y (Description)"
function parseSubDetail(detailStr: string) {
  const regex = /^([^:]+):\s*\+(\d+)\/(\d+)\s*(?:\(([^)]+)\))?/;
  const match = detailStr.match(regex);
  if (match) {
    return {
      name: match[1].trim(),
      score: parseInt(match[2], 10),
      max: parseInt(match[3], 10),
      desc: match[4] ? match[4].trim() : ""
    };
  }

  const scoreRegex = /:\s*\+(\d+)\/(\d+)/;
  const scoreMatch = detailStr.match(scoreRegex);
  if (scoreMatch) {
    const parts = detailStr.split(":");
    return {
      name: parts[0]?.trim() || "Tiêu chí",
      score: parseInt(scoreMatch[1], 10),
      max: parseInt(scoreMatch[2], 10),
      desc: parts[1] ? parts[1].replace(/^\s*\+\d+\/\d+/, "").replace(/[()]/g, "").trim() : ""
    };
  }

  return {
    name: detailStr,
    score: null,
    max: null,
    desc: ""
  };
}

const FALLBACK_TIPS: Record<string, string> = {
  file_technical: "Cung cấp file định dạng PDF chuẩn, không dùng file ảnh hoặc định dạng quét quét scan.",
  ats_parsability: "Thêm header chuẩn: 'Work Experience', 'Education', 'Skills' để máy đọc nhận diện tốt hơn.",
  typography: "Dùng 1 font duy nhất (Arial/Calibri), căn lề trái, cỡ chữ 10–12pt.",
  length: "Rút gọn CV xuống còn 1 trang — bỏ thông tin không liên quan.",
  contact: "Bổ sung đầy đủ LinkedIn, GitHub, Email và Số điện thoại chuyên nghiệp.",
  summary: "Viết lại mục tiêu nghề nghiệp: nêu rõ vị trí ứng tuyển, số năm kinh nghiệm và giá trị mang lại.",
  sections: "Bổ sung đầy đủ các phần chính: Kinh nghiệm, Kỹ năng, Học vấn.",
  organization: "Trình bày thông tin theo dòng thời gian đảo ngược chuẩn tuyển dụng.",
  language: "Sử dụng nhiều động từ mạnh ở đầu gạch đầu dòng, tránh mô tả chung chung.",
  quantification: "Đưa thêm con số %, $, tỷ lệ tăng trưởng vào mô tả kết quả công việc.",
  keywords: "Cập nhật các kỹ năng và từ khóa chuyên môn sát với JD của nhà tuyển dụng.",
  action_verbs_tone: "Hành văn với giọng điệu chủ động, tự tin và dùng thuật ngữ chuẩn ngành.",
  consistency: "Đảm bảo mốc thời gian, dấu chấm câu và cách giãn dòng đồng nhất.",
  progression: "Làm rõ lộ trình thăng tiến, mở rộng trách nhiệm qua các năm làm việc.",
  bullet_quality: "Viết lại gạch đầu dòng theo mô hình STAR (Tình huống, Nhiệm vụ, Hành động, Kết quả).",
  scope_impact: "Nêu rõ quy mô dự án và mức độ ảnh hưởng của kết quả bạn làm ra.",
  technical_evidence: "Liệt kê các kỹ năng theo nhóm và cung cấp dẫn chứng cụ thể trong dự án.",
  projects: "Mô tả dự án nổi bật: vai trò của bạn, các công nghệ sử dụng và kết quả thực tiễn.",
  certs: "Bổ sung các chứng chỉ chuyên môn quốc tế hoặc ngoại ngữ (IELTS/TOEIC).",
  leadership: "Chia sẻ thêm kinh nghiệm hướng dẫn người mới hoặc quản lý nhóm nhỏ.",
  international: "Nhấn mạnh kỹ năng ngoại ngữ và kinh nghiệm làm việc đa quốc gia.",
  awards: "Liệt kê các giải thưởng, học bổng hoặc thành tích xuất sắc đạt được.",
  learning: "Nêu rõ các khóa học online hoặc kỹ năng mới bạn đang tự học nâng cao.",
  category_specific: "Thêm liên kết danh mục sản phẩm (Portfolio/Behance/GitHub) phù hợp với nhóm ngành."
};

function getTipKeyForName(name: string): string {
  const normalized = name.toLowerCase().trim();
  if (normalized.includes("file technical")) return "file_technical";
  if (normalized.includes("ats parsability")) return "ats_parsability";
  if (normalized.includes("typography")) return "typography";
  if (normalized.includes("length")) return "length";
  if (normalized.includes("contact")) return "contact";
  if (normalized.includes("summary")) return "summary";
  if (normalized.includes("sections")) return "sections";
  if (normalized.includes("organization")) return "organization";
  if (normalized.includes("language")) return "language";
  if (normalized.includes("quantification")) return "quantification";
  if (normalized.includes("keywords")) return "keywords";
  if (normalized.includes("action verbs")) return "action_verbs_tone";
  if (normalized.includes("consistency")) return "consistency";
  if (normalized.includes("progression")) return "progression";
  if (normalized.includes("bullet quality")) return "bullet_quality";
  if (normalized.includes("scope & impact")) return "scope_impact";
  if (normalized.includes("bằng chứng kỹ năng")) return "technical_evidence";
  if (normalized.includes("chất lượng dự án")) return "projects";
  if (normalized.includes("chứng chỉ liên quan")) return "certs";
  if (normalized.includes("leadership")) return "leadership";
  if (normalized.includes("international")) return "international";
  if (normalized.includes("awards")) return "awards";
  if (normalized.includes("learning")) return "learning";
  if (normalized.includes("category-specific")) return "category_specific";
  return "";
}

export default function Results() {
  const result = useCvResult();
  const [active, setActive] = useState("overview");

  useEffect(() => {
    cvStore.hydrate();
    if (!cvStore.getResult()) {
      cvStore.setResult(generateMockResult("demo_resume.pdf"));
    }
  }, []);

  if (!result) return null;

  return (
    <SiteLayout>
      <Seo
        title="Kết quả phân tích CV — Điểm ATS & Gợi ý cải thiện từ AI"
        description="Kết quả đánh giá CV cá nhân hóa của bạn: phân tích chi tiết điểm ATS, nhận xét từng mục và gợi ý viết lại từ AI."
        path="/results"
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Kết quả phân tích CV", path: "/results" }])}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="bg-card rounded-3xl border border-border/60 p-3 shadow-soft space-y-1">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  onClick={() => setActive(n.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${active === n.id ? "bg-primary-light text-primary-dark shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <n.icon className="h-4 w-4" /> {n.label}
                </a>
              ))}
            </div>
          </aside>

          {/* Main content stream */}
          <div className="space-y-10">
            <Overview result={result} />
            <StrengthsSection result={result} />
            <PriorityActions result={result} />
            <ScoreGapsSection result={result} />
            <AtsBreakdown result={result} />
            <SectionAnalysis result={result} />
            <Improve result={result} />
            <PracticeCta />
          </div>
        </motion.div>
      </div>
    </SiteLayout>
  );
}

function Overview({ result }: { result: AnalysisResult }) {
  const geminiData = getRawGeminiDataWithFallback(result);
  const detect = geminiData.stage1_detection;
  
  return (
    <section id="overview" className="relative overflow-hidden rounded-3xl bg-card border border-border/60 p-8 lg:p-10 shadow-card scroll-mt-24">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-semibold border border-primary/30">
            <Sparkles className="h-3.5 w-3.5" /> Báo cáo phân tích AI hoàn tất
          </div>
          
          {detect && (
            <div className="flex flex-col gap-1 border-b border-border/60 pb-5">
              <span className="text-xs font-bold text-primary tracking-wider uppercase">Thông tin hồ sơ</span>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                {detect.name || "Hồ sơ ứng tuyển"}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-primary/15 text-primary border-0 rounded-lg px-2.5 py-1 text-xs font-semibold">
                  Trình độ: {detect.level}
                </Badge>
                <Badge variant="secondary" className="bg-secondary/30 text-foreground border-0 rounded-lg px-2.5 py-1 text-xs font-semibold">
                  Chuyên ngành: {detect.industry}
                </Badge>
              </div>
            </div>
          )}

          <h1 className="text-3xl font-bold tracking-tight text-foreground">{result.status}</h1>
          <p className="text-md text-secondary-foreground/90">
            Hệ thống đã phân tích thành công file <span className="font-semibold text-foreground">{result.fileName}</span> theo các tiêu chí kiểm tra máy quét ATS chuyên sâu.
          </p>
          
          <div className="pt-2 flex flex-wrap gap-3">
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-95 rounded-xl h-11 px-5 font-semibold shadow-glow">
              <Download className="mr-2 h-4 w-4" /> Tải báo cáo đầy đủ
            </Button>
            <Button variant="outline" className="rounded-xl h-11 px-5 font-semibold border-2" asChild>
              <Link to="/cv-analysis">Tải lại CV khác <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
        
        <div className="grid place-items-center rounded-3xl p-6 bg-primary/10 border border-primary/20 min-w-[200px] text-center shadow-inner">
          <ScoreCircle score={result.score} />
          <span className="text-xs font-bold text-muted-foreground mt-3 tracking-wide uppercase">Điểm tổng quan ATS</span>
        </div>
      </div>
    </section>
  );
}

function StrengthsSection({ result }: { result: AnalysisResult }) {
  const geminiData = getRawGeminiDataWithFallback(result);
  const strengths = geminiData.strengths || [];
  if (strengths.length === 0) return null;

  return (
    <section id="strengths" className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
        <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-5.5 w-5.5" />
        </span>
        <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">Điểm mạnh nổi bật từ AI</h2>
      </div>
      <p className="text-muted-foreground text-sm">Các khía cạnh ưu thế và ấn tượng nhất được AI đánh giá rất cao trong CV của bạn.</p>
      
      <div className="grid gap-4 md:grid-cols-3 mt-4">
        {strengths.map((str, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5 shadow-soft hover:shadow-md transition-all duration-300 group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-extrabold">
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-foreground/90 leading-relaxed">
                {str}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PriorityActions({ result }: { result: AnalysisResult }) {
  const issues = result.topIssues || [];
  if (issues.length === 0) return null;

  const severityMap = {
    high: {
      color: "border-destructive/20 bg-destructive/5 text-destructive",
      badge: "bg-destructive/15 text-destructive-foreground dark:text-destructive",
      label: "Độ ưu tiên: Cao",
      icon: XCircle
    },
    medium: {
      color: "border-amber-500/20 bg-amber-500/5 text-amber-500",
      badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      label: "Độ ưu tiên: Trung bình",
      icon: AlertTriangle
    },
    low: {
      color: "border-blue-500/20 bg-blue-500/5 text-blue-500",
      badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      label: "Độ ưu tiên: Thấp",
      icon: Info
    }
  };

  return (
    <section id="issues" className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
        <span className="p-1.5 rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5.5 w-5.5" />
        </span>
        <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">Vấn đề cần ưu tiên cải thiện</h2>
      </div>
      <p className="text-muted-foreground text-sm">Những lỗi cốt lõi khiến bạn mất điểm nhiều nhất trong thang đo ATS. Hãy xử lý các vấn đề này trước.</p>
      
      <div className="mt-4 space-y-3">
        {issues.map((iss, i) => {
          const sev = severityMap[iss.severity] || severityMap.low;
          const Icon = sev.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border ${sev.color} transition-all duration-300 hover:scale-[1.002]`}
            >
              <div className="flex gap-3.5 items-start">
                <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-foreground text-sm sm:text-base leading-tight">{iss.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed font-medium">{iss.fix}</p>
                </div>
              </div>
              <Badge className={`rounded-xl px-3 py-1 text-xs font-bold shrink-0 border-0 self-start sm:self-center ${sev.badge}`}>
                {sev.label}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function ScoreGapsSection({ result }: { result: AnalysisResult }) {
  const geminiData = getRawGeminiDataWithFallback(result);
  const gaps = geminiData.score_gaps || [];
  if (gaps.length === 0) return null;

  const totalLost = gaps.reduce((acc, g) => acc + g.lost, 0);
  if (totalLost === 0) return null;

  return (
    <section id="gaps" className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
        <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
          <Sparkles className="h-5.5 w-5.5" />
        </span>
        <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">Khoảng cách điểm số (Score Gaps)</h2>
      </div>
      <p className="text-muted-foreground text-sm">
        Báo cáo chi tiết về các lỗ hổng điểm số lớn nhất trong CV của bạn và chiến lược lấy lại điểm tối đa.
      </p>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 to-primary/5 border border-amber-500/20 p-5 shadow-soft flex items-start gap-3.5">
        <Sparkles className="h-5 w-5 mt-0.5 text-amber-500 shrink-0 animate-pulse" />
        <p className="text-sm font-semibold text-foreground/90 leading-relaxed">
          Bạn có thể nâng tổng điểm CV của mình thêm tối đa <span className="text-amber-500 text-base font-extrabold">+{totalLost} điểm</span> bằng cách thực hiện các cải tiến bên dưới!
        </p>
      </div>

      <div className="grid gap-4 mt-5">
        {gaps.map((gap, i) => {
          const percent = Math.round((gap.current / gap.max) * 100);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-amber-500/30"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 font-extrabold text-[11px] px-2 rounded-lg border border-amber-500/10">
                    Thiếu: -{gap.lost} điểm
                  </Badge>
                  <h3 className="font-extrabold text-foreground text-sm sm:text-base">{gap.section}</h3>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                  {gap.tip}
                </p>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border/40">
                <div className="space-y-1 w-full md:w-36">
                  <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                    <span>Điểm: {gap.current}/{gap.max}</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden relative">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                <Badge className="bg-gradient-primary text-primary-foreground font-extrabold text-xs px-2.5 py-1.5 rounded-xl border-0 shadow-sm shrink-0">
                  +{gap.lost}đ có thể nhận lại
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function AtsBreakdown({ result }: { result: AnalysisResult }) {
  const [expanded, setExpanded] = useState<string | null>("formatting");
  const geminiData = getRawGeminiDataWithFallback(result);

  const getPointsFromDetails = (details: string[]) => {
    let sum = 0;
    let max = 0;
    details.forEach(d => {
      const parsed = parseSubDetail(d);
      if (parsed.score !== null) sum += parsed.score;
      if (parsed.max !== null) max += parsed.max;
    });
    return { sum, max };
  };

  const rawItems = [
    {
      id: "formatting",
      key: "Định dạng & Bố cục",
      desc: "Cách trình bày cấu trúc file, tiêu đề và căn chỉnh đạt chuẩn máy đọc ATS.",
      details: geminiData.stage2_core?.ats_format?.details || [],
      score: geminiData.stage2_core?.ats_format?.score,
      max: 20
    },
    {
      id: "readability",
      key: "Khả năng đọc & Cấu trúc",
      desc: "Sắp xếp bố cục logic, đầy đủ thông tin liên hệ và định hướng tóm tắt rõ ràng.",
      details: geminiData.stage2_core?.professional_foundation?.details || [],
      score: geminiData.stage2_core?.professional_foundation?.score,
      max: 20
    },
    {
      id: "keywords",
      key: "Từ khóa & Chất lượng",
      desc: "Sự khớp nối từ khóa kỹ năng với JD, hành văn chuyên nghiệp và nhất quán ngày tháng.",
      details: geminiData.stage2_core?.content_quality?.details || [],
      score: geminiData.stage2_core?.content_quality?.score,
      max: 20
    },
    {
      id: "experience",
      key: "Kinh nghiệm làm việc",
      desc: "Mức độ chi tiết gạch đầu dòng, chất lượng giải pháp và độ thăng tiến chuyên môn.",
      details: geminiData.stage3_in_depth?.experience_eval?.details || [],
      score: geminiData.stage3_in_depth?.experience_eval?.score,
      max: 15
    },
    {
      id: "skills",
      key: "Kỹ năng chuyên môn",
      desc: "Mức độ trình bày đầy đủ các công nghệ cốt lõi và framework bổ trợ.",
      details: geminiData.stage3_in_depth?.technical_evidence?.details || [],
      score: geminiData.stage3_in_depth?.technical_evidence?.score,
      max: 8
    },
    {
      id: "education",
      key: "Học vấn & Dự án",
      desc: "Chứng chỉ quốc tế, chất lượng dự án thực chiến và trình độ học vấn đạt chuẩn.",
      details: [
        ...(geminiData.stage3_in_depth?.certs?.details || []),
        ...(geminiData.stage3_in_depth?.projects?.details || [])
      ],
      score: (geminiData.stage3_in_depth?.certs?.score || 0) + (geminiData.stage3_in_depth?.projects?.score || 0),
      max: 7
    },
    {
      id: "bonus",
      key: "Điểm cộng & Hoạt động khác",
      desc: "Khả năng lãnh đạo, ngoại ngữ toàn cầu và tinh thần tự học hỏi công nghệ mới.",
      details: geminiData.stage4_bonus?.details || [],
      score: geminiData.stage4_bonus?.score,
      max: 10
    }
  ];

  const items = rawItems.map(item => {
    const actualPoints = item.score !== undefined && item.score !== null ? item.score : 0;
    const maxPoints = item.max;
    const v = Math.round((actualPoints / maxPoints) * 100);
    return { ...item, actualPoints, maxPoints, v };
  });

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <section id="ats" className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
        <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
          <Gauge className="h-5.5 w-5.5" />
        </span>
        <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">Chi tiết điểm ATS</h2>
      </div>
      <p className="text-muted-foreground text-sm">Bấm vào từng mục lớn bên dưới để xem cụ thể điểm đánh giá cho các tiêu chí nhỏ.</p>
      
      <div className="mt-5 space-y-3">
        {items.map((it, i) => {
          const isExpanded = expanded === it.id;
          return (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-soft hover:border-primary/20 transition-all duration-300"
            >
              {/* Card Header Clickable */}
              <div
                onClick={() => toggleExpand(it.id)}
                className="p-5 lg:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-foreground text-base sm:text-lg">{it.key}</span>
                    <Badge variant="outline" className="border-primary/20 text-primary bg-primary/10 font-extrabold rounded-lg">
                      {it.actualPoints} / {it.maxPoints}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">{it.desc}</p>
                </div>
                
                <div className="flex items-center gap-5 justify-between md:justify-end shrink-0">
                  <div className="w-32 sm:w-44 h-2 rounded-full bg-muted overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${it.v}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full bg-gradient-primary rounded-full"
                    />
                  </div>
                  <button className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary-dark flex items-center justify-center transition-all">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-foreground" /> : <ChevronDown className="h-4 w-4 text-foreground" />}
                  </button>
                </div>
              </div>

              {/* Sub criteria accordion details list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="border-t border-border/50 bg-secondary/15"
                  >
                    <div className="p-5 lg:p-6 space-y-3">
                      {it.details.length === 0 ? (
                        <p className="text-xs sm:text-sm text-muted-foreground italic">Không có nhận xét chi tiết cho phần này.</p>
                      ) : (
                        <div className="grid gap-3">
                          {it.details.map((detail, index) => {
                            const sub = parseSubDetail(detail);
                            const percent = sub.score !== null && sub.max !== null ? (sub.score / sub.max) * 100 : 100;
                            const isExcellent = percent >= 85;
                            const isAverage = percent >= 60;
                            
                            const scoreBadgeColor = isExcellent 
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                              : isAverage 
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                                : "bg-destructive/10 text-destructive border-destructive/20";

                            const tipKey = getTipKeyForName(sub.name);
                            let tip = geminiData.sub_tips?.[tipKey];
                            if (!tip && sub.score !== null && sub.max !== null && sub.score < sub.max) {
                              tip = FALLBACK_TIPS[tipKey];
                            }

                            return (
                              <div key={index} className="flex flex-col gap-3 p-4 rounded-xl border border-border/40 bg-card/70 hover:bg-card transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-foreground text-sm">{sub.name}</span>
                                      {sub.score !== null && (
                                        <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[11px] font-extrabold border ${scoreBadgeColor}`}>
                                          +{sub.score}/{sub.max}
                                        </Badge>
                                      )}
                                    </div>
                                    {sub.desc && (
                                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">{sub.desc}</p>
                                    )}
                                  </div>

                                  {sub.score !== null && sub.max !== null && (
                                    <div className="w-24 sm:w-28 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                                      <div 
                                        className={`h-full rounded-full ${isExcellent ? "bg-emerald-500" : isAverage ? "bg-amber-500" : "bg-destructive"}`} 
                                        style={{ width: `${percent}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                                {tip && (
                                  <div className="flex items-start gap-1.5 text-xs text-amber-500 font-semibold bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5">
                                    <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                                    <span>Gợi ý: {tip}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function SectionAnalysis({ result }: { result: AnalysisResult }) {
  const map = {
    good: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/15", label: "Tốt" },
    warn: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/15", label: "Cần cải thiện" },
    bad: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/15", label: "Cần sửa gấp" },
  } as const;
  
  return (
    <section id="sections" className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
        <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
          <ListChecks className="h-5.5 w-5.5" />
        </span>
        <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">Phân tích từng mục CV</h2>
      </div>
      <p className="text-muted-foreground text-sm">Tổng quan mức độ chuẩn hóa của các cấu phần cơ bản cấu thành nên CV của bạn.</p>
      
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {result.sections.map((s, i) => {
          const m = map[s.status] || map.good;
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
              <div className="flex items-center gap-3.5">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${m.bg}`}>
                  <m.icon className={`h-5.5 w-5.5 ${m.color}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm sm:text-base leading-none">{s.title}</h3>
                    <Badge variant="secondary" className={`${m.bg} ${m.color} border-0 font-bold text-[10px] px-2 rounded-lg`}>{m.label}</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed font-medium">{s.note}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function Improve({ result }: { result: AnalysisResult }) {
  const [applied, setApplied] = useState<number[]>([]);
  return (
    <section id="improve" className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
        <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
          <Wand2 className="h-5.5 w-5.5" />
        </span>
        <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">Đề xuất cải thiện từ AI</h2>
      </div>
      <p className="text-muted-foreground text-sm">Hệ thống AI viết lại giúp bạn những phần mô tả yếu bằng phiên bản chuyên nghiệp, bổ sung số liệu cụ thể.</p>
      
      <div className="mt-5 space-y-4">
        {result.suggestions.map((s, i) => {
          const isApplied = applied.includes(i);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/60 p-6 shadow-soft space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-muted/50 p-4 border border-border/30">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Phiên bản gốc (Trước)</div>
                  <p className="text-sm font-medium text-secondary-foreground leading-relaxed">{s.before}</p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-4 border border-primary/20">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Phiên bản tối ưu (Sau)</div>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">{s.after}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-xs text-muted-foreground font-medium leading-relaxed bg-secondary/25 p-3 rounded-xl border border-border/30">
                <span className="shrink-0">💡</span>
                <p>Gợi ý: {s.reason}</p>
              </div>
              
              <div className="flex gap-2.5 pt-1">
                <Button
                  size="sm"
                  className={`rounded-xl font-bold ${isApplied ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-gradient-primary text-primary-foreground shadow-sm hover:opacity-95"}`}
                  onClick={() => { setApplied([...applied, i]); toast.success("Đã áp dụng đề xuất cải thiện vào CV!"); }}
                >
                  {isApplied ? <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Đã áp dụng</> : "Áp dụng đề xuất"}
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl border-2 font-bold" onClick={() => { navigator.clipboard.writeText(s.after); toast.success("Đã sao chép phiên bản tối ưu!"); }}>
                  <Copy className="mr-1.5 h-4 w-4" /> Sao chép văn bản
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function PracticeCta() {
  return (
    <section id="practice" className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/60 p-8 lg:p-10 shadow-card">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
          <div>
            <Mic className="h-7 w-7 text-primary mb-3" />
            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">Sẵn sàng luyện tập phỏng vấn thử?</h2>
            <p className="mt-2 text-secondary-foreground/90 max-w-xl font-medium leading-relaxed">
              Dựa vào các thiếu sót và đặc thù trong CV của bạn, AI sẽ tự động tạo một phiên phỏng vấn tương tác thông minh bám sát vị trí ứng tuyển để tăng sự tự tin.
            </p>
          </div>
          <div className="flex lg:justify-end">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground rounded-xl h-12 px-7 font-bold shadow-glow">
              <Link to="/interview">Bắt đầu luyện tập phỏng vấn <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}