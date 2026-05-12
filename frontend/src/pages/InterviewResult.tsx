import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Trophy, Award, BookOpen, User, Cpu, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, XCircle, RefreshCw, Loader2, ArrowRight, ShieldAlert, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { toast } from "sonner";
import { interviewApi } from "@/api/interviewApi";
import {
  InterviewSession,
  InterviewQuestion,
  InterviewReport,
} from "@/types/interview";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const getAnswerStatus = (score: number) => {
  if (score >= 8) {
    return {
      label: "Đạt (Correct / Good)",
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
      desc: "Câu trả lời xuất sắc, trình bày mạch lạc, bám sát yêu cầu chuyên môn và thể hiện kiến thức sâu rộng."
    };
  } else if (score >= 5) {
    return {
      label: "Cần cải thiện (Needs Improvement)",
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      icon: <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />,
      desc: "Câu trả lời đúng hướng nhưng còn sơ sài, thiếu ví dụ thực tế hoặc cần cấu trúc chặt chẽ hơn."
    };
  } else {
    return {
      label: "Chưa đạt / Sai lệch kiến thức (Poor)",
      color: "bg-destructive/10 text-destructive border-destructive/20",
      icon: <XCircle className="h-4 w-4 text-destructive shrink-0" />,
      desc: "Câu trả lời chưa đúng trọng tâm, sai lệch kiến thức hoặc bỏ qua câu hỏi. Cần ôn tập kỹ lại chủ đề này."
    };
  }
};

export default function InterviewResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const id = Number(sessionId);

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [pollingAttempt, setPollingAttempt] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (isNaN(id)) {
        toast.error("Mã phiên phỏng vấn không hợp lệ");
        setIsLoading(false);
        return;
      }
      try {
        const [sessionData, questionData] = await Promise.all([
          interviewApi.getSession(id),
          interviewApi.getQuestions(id)
        ]);
        setSession(sessionData);
        setQuestions(questionData);

        try {
          const reportData = await interviewApi.getReport(id);
          if (reportData && reportData.status === "COMPLETED" && reportData.report) {
            setReport(reportData.report);
          } else {
            console.log("Report is still processing, starting polling...");
          }
        } catch (reportErr) {
          console.log("Failed to load report initially:", reportErr);
        }
      } catch (err: any) {
        console.error("Error loading interview result data:", err);
        toast.error(err.response?.data?.message || "Không thể tải báo cáo kết quả phỏng vấn.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Polling for final report if session is loaded but report is missing
  useEffect(() => {
    if (!session || report) return;

    let intervalId: NodeJS.Timeout;

    const pollReport = async () => {
      try {
        const reportData = await interviewApi.getReport(id);
        if (reportData && reportData.status === "COMPLETED" && reportData.report) {
          setReport(reportData.report);
          toast.success("🎉 Báo cáo đánh giá của bạn đã sẵn sàng!");
          // Fetch updated session
          const updatedSession = await interviewApi.getSession(id);
          setSession(updatedSession);
        } else {
          setPollingAttempt(prev => prev + 1);
        }
      } catch (err) {
        setPollingAttempt(prev => prev + 1);
      }
    };

    intervalId = setInterval(pollReport, 3000);
    return () => clearInterval(intervalId);
  }, [session?.id, !!report, id]);

  const handleRestart = () => {
    navigate("/interview");
  };

  // Safe checks and calculations
  const radarData = useMemo(() => {
    if (questions.length === 0) return [];
    
    const getCriteriaScore = (criteria: string) => {
      let total = 0;
      let count = 0;
      questions.forEach(q => {
        const scoreObj = q.interviewAnswer?.answerScores?.find(s => s.criteria === criteria);
        if (scoreObj) {
          total += scoreObj.score;
          count++;
        }
      });
      return count > 0 ? Math.round((total / count) * 10) / 10 : 5;
    };

    return [
      { criteria: "Độ liên quan (Relevance)", score: getCriteriaScore("RELEVANCE") },
      { criteria: "Chiều sâu (Depth)", score: getCriteriaScore("DEPTH") },
      { criteria: "Diễn đạt (Communication)", score: getCriteriaScore("COMMUNICATION") },
      { criteria: "Cấu trúc (Structure)", score: getCriteriaScore("STRUCTURE") },
    ];
  }, [questions]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            <Cpu className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="font-semibold text-lg text-foreground animate-pulse">
            Đang tải báo cáo đánh giá từ AI...
          </p>
          <p className="text-sm text-muted-foreground">Vui lòng chờ trong giây lát</p>
        </div>
      </SiteLayout>
    );
  }

  if (!session) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-20 text-center space-y-6">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-foreground">Không tìm thấy phiên</h1>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Phiên phỏng vấn #{id} không tồn tại hoặc bạn không có quyền truy cập.
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button asChild variant="outline" className="rounded-xl border-2">
              <Link to="/profile"><ArrowLeft className="mr-2 h-4 w-4" /> Về trang cá nhân</Link>
            </Button>
            <Button asChild className="bg-gradient-primary text-primary-foreground rounded-xl">
              <Link to="/interview">Bắt đầu phỏng vấn mới</Link>
            </Button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (session && !report) {
    // Dynamic text rotation for premium loading feeling
    const loadingSteps = [
      "Đang đọc cấu trúc cuộc phỏng vấn...",
      "Đang phân tích các câu trả lời của bạn...",
      "Đang đối chiếu với mô tả công việc (JD) & CV...",
      "Đang tính toán điểm số tổng hợp và phân rã các tiêu chí...",
      "Đang tổng hợp điểm mạnh nổi bật...",
      "Đang biên soạn đề xuất nâng cao kỹ năng ứng viên...",
      "Hoàn thiện báo cáo phân tích năng lực..."
    ];
    const currentStepIdx = Math.min(Math.floor(pollingAttempt / 2), loadingSteps.length - 1);

    return (
      <SiteLayout>
        <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-card rounded-3xl border border-border/60 p-8 shadow-card text-center space-y-6 relative overflow-hidden"
          >
            {/* Glowing blur background inside card */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl" />

            {/* Premium CPU/Sparkles animation */}
            <div className="relative flex h-24 w-24 mx-auto items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border-2 border-t-violet-500 border-r-transparent animate-[spin_3s_linear_infinite]" />
              <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-glow">
                <Cpu className="h-8 w-8 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-[10px] font-extrabold text-primary uppercase tracking-wider">
                <Loader2 className="h-3 w-3 animate-spin" /> Trợ lý AI đang chấm điểm
              </span>
              <h2 className="text-xl font-extrabold text-foreground">Đang biên soạn báo cáo...</h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
                Vui lòng đợi giây lát. AI đang phân tích sâu chuỗi câu hỏi để xây dựng biểu đồ mạng nhện & đề xuất tối ưu.
              </p>
            </div>

            {/* Steps tracker card */}
            <div className="bg-secondary/40 border border-border/40 rounded-2xl p-4.5 text-left space-y-3.5 relative">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between">
                <span>Tiến trình xử lý</span>
                <span>{Math.round((currentStepIdx + 1) / loadingSteps.length * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((currentStepIdx + 1) / loadingSteps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStepIdx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 text-xs font-semibold text-foreground/90"
                >
                  <Sparkles className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                  <span>{loadingSteps[currentStepIdx]}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="text-[10px] text-muted-foreground font-semibold">
              Phiên ID: #{id} • Trình độ: {session.difficultyLevel}
            </div>
          </motion.div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <Seo
        title={`Kết quả phỏng vấn #${session.id} — Báo cáo năng lực AI`}
        description={`Xem điểm số và nhận xét chi tiết của cuộc phỏng vấn vị trí ${session.jobTitle || "Luyện tập tự do"}`}
        path={`/interview/results/${session.id}`}
        jsonLd={breadcrumbLd([
          { name: "Trang chủ", path: "/" },
          { name: "Lịch sử phỏng vấn", path: "/profile" },
          { name: `Kết quả #${session.id}`, path: `/interview/results/${session.id}` },
        ])}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-10">
        
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="rounded-xl text-muted-foreground hover:text-foreground">
            <Link to="/profile">
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại lịch sử
            </Link>
          </Button>
          <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-semibold py-1 px-3 rounded-lg text-xs">
            Phiên ID: #{session.id}
          </Badge>
        </div>

        {/* Header Title */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Trophy className="h-7 w-7" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            Báo cáo Đánh giá Phỏng vấn AI
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed font-medium">
            Phiên phỏng vấn vị trí <span className="font-bold text-foreground">{session.jobTitle || "Luyện tập phỏng vấn tự do"}</span> trình độ <span className="font-bold text-foreground">{session.difficultyLevel === "EASY" ? "Intern/Fresher" : session.difficultyLevel === "MEDIUM" ? "Junior/Middle" : "Senior/Lead"}</span> đã hoàn thành đánh giá.
          </p>
        </motion.div>

        {/* Score Summary Circular Gauge Card & Radar chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-[1.3fr_1fr] gap-6"
        >
          {/* Radar Chart Card */}
          <div className="bg-card rounded-3xl border border-border/60 p-6 lg:p-8 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Phân tích đa tiêu chí (Radar Chart)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 mb-4 font-medium">
                Biểu đồ mạng nhện biểu đạt năng lực ứng viên trên 4 khía cạnh trọng tâm.
              </p>
            </div>

            <div className="h-[240px] w-full flex items-center justify-center">
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" radius="75%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="criteria" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#cbd5e1" />
                    <Radar name="Cá nhân" dataKey="score" stroke="#0066ff" fill="#3b82f6" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground italic">Không đủ dữ liệu biểu đồ</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-[10px] text-muted-foreground border-t border-border/60 pt-4 leading-relaxed font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block shrink-0" />
                <span>Độ liên quan: Trả lời bám sát JD & câu hỏi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block shrink-0" />
                <span>Chiều sâu: Khả năng giải thích sâu sắc</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500 inline-block shrink-0" />
                <span>Cấu trúc: Tổ chức luận điểm logic, mạch lạc</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-pink-500 inline-block shrink-0" />
                <span>Giao tiếp: Khả năng diễn thuyết, dùng từ ngữ</span>
              </div>
            </div>
          </div>

          {/* Score & AI recommendation */}
          <div className="bg-card rounded-3xl border border-border/60 p-6 lg:p-8 shadow-card flex flex-col justify-between space-y-6">
            <div className="text-center">
              <div className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Điểm đánh giá chung</div>
              
              {/* Circular Gauge */}
              <div className="relative inline-flex items-center justify-center h-32 w-32 mb-3">
                <div className="absolute inset-0 rounded-full border-8 border-muted" />
                <div 
                  className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent border-l-transparent animate-pulse" 
                  style={{ transform: `rotate(${(report.finalScore / 100) * 360 - 90}deg)` }}
                />
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-extrabold tracking-tight text-primary">
                    {Math.round(report.finalScore)}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>

              <div>
                <Badge className={`px-4 py-1 text-sm font-bold rounded-full border-0 ${
                  report.decision === "PASS" 
                    ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15" 
                    : report.decision === "CONSIDER"
                    ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/15"
                    : "bg-destructive/15 text-destructive hover:bg-destructive/15"
                }`}>
                  {report.decision === "PASS" ? "Tuyển dụng (PASS)" : report.decision === "CONSIDER" ? "Cân nhắc (CONSIDER)" : "Từ chối (FAIL)"}
                </Badge>
              </div>
            </div>

            <div className="bg-secondary/40 border border-border/40 p-4.5 rounded-2xl text-xs space-y-2">
              <div className="font-bold text-foreground">Tổng quan đánh giá:</div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
                {report.summary}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Insights Panel: Strengths & Weaknesses */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Strengths card */}
          <div className="bg-card rounded-2xl border border-emerald-500/20 p-6 shadow-soft space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5 border-b border-emerald-500/10 pb-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" /> Điểm mạnh của bạn
            </div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {report.insights.filter(i => i.type === "STRENGTH").map((ins, i) => (
                <li key={ins.id || i} className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0 text-[10px]">✓</span>
                  <span className="leading-relaxed font-semibold text-foreground/90">{ins.title}</span>
                </li>
              ))}
              {report.insights.filter(i => i.type === "STRENGTH").length === 0 && (
                <li className="text-muted-foreground italic">Không có điểm mạnh nổi bật nào được ghi nhận.</li>
              )}
            </ul>
          </div>

          {/* Weaknesses card */}
          <div className="bg-card rounded-2xl border border-amber-500/20 p-6 shadow-soft space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 border-b border-amber-500/10 pb-2">
              <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" /> Điểm cần cải thiện
            </div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {report.insights.filter(i => i.type === "WEAKNESS").map((ins, i) => (
                <li key={ins.id || i} className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0 text-[10px]">!</span>
                  <span className="leading-relaxed font-semibold text-foreground/90">{ins.title}</span>
                </li>
              ))}
              {report.insights.filter(i => i.type === "WEAKNESS").length === 0 && (
                <li className="text-muted-foreground italic">Không phát hiện điểm yếu rõ rệt nào cần sửa đổi ngay.</li>
              )}
            </ul>
          </div>
        </motion.div>

        {/* Questions Summary scorecard table & collapsing details */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl border border-border/60 p-6 lg:p-8 shadow-card space-y-6"
        >
          <div>
            <h3 className="font-bold text-lg text-foreground mb-1 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Chi tiết từng câu hỏi & Đánh giá
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Bảng tổng hợp điểm số và phân loại phản hồi chi tiết cho tất cả {questions.length} câu hỏi trong phiên phỏng vấn của bạn.
            </p>
          </div>

          {/* scorecard list table */}
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-secondary/60 font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4 w-16 text-center">STT</th>
                    <th className="p-4">Nội dung câu hỏi</th>
                    <th className="p-4 w-28 text-center">Mức độ</th>
                    <th className="p-4 w-24 text-center">Điểm số</th>
                    <th className="p-4 w-44 text-center">Trạng thái đánh giá</th>
                    <th className="p-4 w-28 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-semibold">
                  {questions.map((q, index) => {
                    const score = q.interviewAnswer?.interviewEvaluation?.score || 5;
                    const status = getAnswerStatus(score);
                    return (
                      <tr key={q.id} className="hover:bg-muted/40 transition-colors">
                        <td className="p-4 font-extrabold text-center text-muted-foreground">Q{index + 1}</td>
                        <td className="p-4 font-bold text-foreground truncate max-w-[240px] sm:max-w-[320px]">
                          {q.questionText}
                        </td>
                        <td className="p-4 text-center">
                          {index + 1 <= 3 ? (
                            <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/15 bg-emerald-500/5 font-bold rounded-lg">
                              Standard
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] text-blue-500 border-blue-500/15 bg-blue-500/5 font-bold rounded-lg">
                              Personalized
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-center font-extrabold text-sm text-foreground">
                          {score}/10
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-extrabold ${status.color}`}>
                            {status.icon}
                            {status.label.split(" (")[0]}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id);
                              document.getElementById(`q-card-${q.id}`)?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="h-7 px-3 rounded-lg text-[10px] font-bold text-primary hover:bg-primary/10 hover:text-primary transition-all"
                          >
                            {expandedQuestionId === q.id ? "Thu gọn" : "Xem chi tiết"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Accordion Questions Details List */}
          <div className="space-y-4">
            {questions.map((q, index) => {
              const isExpanded = expandedQuestionId === q.id;
              const score = q.interviewAnswer?.interviewEvaluation?.score || 5;
              const status = getAnswerStatus(score);

              return (
                <div 
                  key={q.id} 
                  id={`q-card-${q.id}`}
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isExpanded ? "border-primary/40 shadow-soft bg-card" : "border-border/60 hover:border-border"
                  }`}
                >
                  {/* Collapsible Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                    className="w-full text-left p-4 lg:p-5 flex justify-between items-center bg-secondary/10 hover:bg-secondary/35 transition-all gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[10px] font-bold rounded-lg">
                          Câu {index + 1}
                        </Badge>
                        {index + 1 <= 3 ? (
                          <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/10 font-bold rounded-lg">
                            Standard
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] text-blue-500 border-blue-500/10 font-bold rounded-lg">
                            CV Personalized
                          </Badge>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${status.color}`}>
                          {status.label.split(" (")[0]}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-foreground line-clamp-1">
                        {q.questionText}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-extrabold px-2.5 py-1 rounded-xl ${
                        score >= 8 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : score >= 5 
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}>
                        {score}/10
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-5 border-t border-border/60 bg-card/60 text-xs space-y-4"
                      >
                        {/* Question and Answer */}
                        <div className="space-y-4">
                          <div>
                            <div className="font-bold text-foreground mb-1.5 flex items-center gap-1.5 text-[11px]">
                              <BookOpen className="h-4 w-4 text-primary shrink-0" /> Câu hỏi:
                            </div>
                            <p className="text-foreground leading-relaxed p-4 rounded-xl bg-secondary/20 border border-border/30 font-semibold text-sm">
                              {q.questionText}
                            </p>
                          </div>

                          <div>
                            <div className="font-bold text-foreground mb-1.5 flex items-center gap-1.5 text-[11px]">
                              <User className="h-4 w-4 text-muted-foreground shrink-0" /> Câu trả lời của bạn:
                            </div>
                            <p className="text-muted-foreground leading-relaxed p-4 rounded-xl bg-secondary/40 border border-border/40 whitespace-pre-wrap font-semibold leading-relaxed">
                              {q.interviewAnswer?.answerText || "Bỏ qua / Không có dữ liệu phản hồi"}
                            </p>
                          </div>
                        </div>

                        {/* Status detail box */}
                        <div className={`p-4 rounded-xl border flex gap-3 items-start shadow-soft ${status.color}`}>
                          <div className="mt-0.5 shrink-0">{status.icon}</div>
                          <div>
                            <div className="font-extrabold text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                              <span>Trạng thái đánh giá:</span> <span>{status.label}</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed text-[10px] font-medium">
                              {status.desc}
                            </p>
                          </div>
                        </div>

                        {/* AI Detailed Feedback */}
                        {q.interviewAnswer?.interviewEvaluation && (
                          <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 space-y-2">
                            <div className="font-bold text-primary flex items-center gap-1.5 text-[11px]">
                              <Cpu className="h-4 w-4 text-primary shrink-0 animate-pulse" /> Nhận xét chi tiết từ Trợ lý AI:
                            </div>
                            <p className="text-muted-foreground leading-relaxed text-[11px] whitespace-pre-wrap font-medium">
                              {q.interviewAnswer.interviewEvaluation.feedback}
                            </p>
                          </div>
                        )}

                        {/* Breakdown per criteria */}
                        {q.interviewAnswer?.answerScores && q.interviewAnswer.answerScores.length > 0 && (
                          <div className="pt-2">
                            <div className="font-bold text-foreground mb-2.5 flex items-center gap-1.5 text-[11px]">
                              <Award className="h-4 w-4 text-indigo-500 shrink-0" /> Điểm phân rã cụ thể cho 4 tiêu chí:
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {q.interviewAnswer.answerScores.map((sc) => (
                                <div key={sc.id} className="p-3.5 rounded-xl border border-border/40 bg-secondary/35 transition-all hover:bg-secondary/50">
                                  <div className="flex justify-between items-center mb-1 font-bold text-[10px]">
                                    <span className="text-foreground">
                                      {sc.criteria === "RELEVANCE" ? "Mức liên quan" : sc.criteria === "DEPTH" ? "Chiều sâu kiến thức" : sc.criteria === "STRUCTURE" ? "Cấu trúc trình bày" : "Khả năng giao tiếp"}
                                    </span>
                                    <Badge variant="outline" className={`text-[9px] font-extrabold border-0 rounded-lg ${
                                      sc.score >= 8 
                                        ? "text-emerald-500 bg-emerald-500/10" 
                                        : sc.score >= 5 
                                        ? "text-amber-500 bg-amber-500/10" 
                                        : "text-destructive bg-destructive/10"
                                    }`}>
                                      {sc.score}/10
                                    </Badge>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground leading-normal italic font-medium">
                                    &ldquo;{sc.comment}&rdquo;
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Navigation bottom */}
        <div className="flex justify-center gap-4 flex-wrap pt-4">
          <Button 
            onClick={handleRestart} 
            variant="outline" 
            className="rounded-xl border-2 font-bold px-6 h-11 transition-all duration-200"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Luyện tập lại ngay
          </Button>
          <Button 
            asChild 
            className="bg-gradient-primary text-primary-foreground rounded-xl font-bold px-6 h-11 shadow-glow transition-all duration-200 hover:opacity-95"
          >
            <Link to="/dashboard">Quay lại Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

      </div>
    </SiteLayout>
  );
}
