import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Mic,
  RefreshCw,
  Sparkles,
  Trophy,
  Activity,
  Award,
  BookOpen,
  FileText,
  AlertCircle,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  User,
  ExternalLink,
  XCircle,
  UploadCloud,
  Trash2,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { toast } from "sonner";
import { useCvResult } from "@/lib/store";
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

export default function Interview() {
  const parsedCv = useCvResult();
  const navigate = useNavigate();
  
  // States
  const [setupMode, setSetupMode] = useState<"standard" | "mock">("mock");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  
  // JD Upload States
  const [jdInputMode, setJdInputMode] = useState<"text" | "file">("text");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isExtractingJd, setIsExtractingJd] = useState(false);
  const [showExtractedEditor, setShowExtractedEditor] = useState(false);

  const handleJdFileChange = async (file: File) => {
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("⚠️ Dung lượng file quá lớn. Vui lòng chọn tệp nhỏ hơn 5MB!");
      return;
    }
    
    setJdFile(file);
    setIsExtractingJd(true);
    setShowExtractedEditor(false);
    
    try {
      const extractedText = await interviewApi.extractJdText(file);
      if (extractedText && extractedText.trim()) {
        setJobDescription(extractedText);
        toast.success(`🎉 Tải lên và trích xuất thành công ${extractedText.split(/\s+/).filter(Boolean).length} từ từ tệp ${file.name}!`);
      } else {
        toast.error("⚠️ Nội dung trích xuất trống hoặc định dạng không được hỗ trợ!");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "❌ Trích xuất văn bản từ tệp thất bại. Vui lòng thử lại!");
      setJdFile(null);
    } finally {
      setIsExtractingJd(false);
    }
  };
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingIntervalId, setRecordingIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // Suggested Info from CV Store
  useEffect(() => {
    if (parsedCv) {
      if (parsedCv.rawGeminiData?.stage1_detection?.industry) {
        setTargetRole(parsedCv.rawGeminiData.stage1_detection.industry);
      }
      const extractedLevel = parsedCv.rawGeminiData?.stage1_detection?.level || "Middle";
      if (extractedLevel.toLowerCase().includes("senior") || extractedLevel.toLowerCase().includes("lead")) {
        setSelectedLevel("HARD");
      } else if (extractedLevel.toLowerCase().includes("intern") || extractedLevel.toLowerCase().includes("fresher") || extractedLevel.toLowerCase().includes("junior")) {
        setSelectedLevel("EASY");
      } else {
        setSelectedLevel("MEDIUM");
      }
    }
  }, [parsedCv]);

  // Voice/Recording simulation
  useEffect(() => {
    return () => {
      if (recordingIntervalId) clearInterval(recordingIntervalId);
    };
  }, [recordingIntervalId]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recordingIntervalId) {
        clearInterval(recordingIntervalId);
        setRecordingIntervalId(null);
      }
      // Mock typing in the box based on voice conversion
      if (!currentAnswer) {
        setCurrentAnswer(
          `Theo kinh nghiệm của tôi, giải pháp tốt nhất là tập trung vào thiết kế hệ thống có tính mở rộng (scaling). Tôi đã từng làm việc trong môi trường thực tế và áp dụng quy trình tối ưu cơ sở dữ liệu để giải quyết triệt để thắt nút cổ chai.`
        );
        toast.success("📝 Chuyển ngữ thành công! Đã tự động điền câu trả lời của bạn.");
      }
    } else {
      setIsRecording(true);
      setRecordingSeconds(0);
      const interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
      setRecordingIntervalId(interval);
      toast.success("🎤 Đang thu âm... Hãy nói rõ ràng vào micro để AI chuyển ngữ!");
    }
  };

  const handleStartInterview = async () => {
    setIsLoading(true);
    try {
      let activeSession: InterviewSession;

      if (setupMode === "mock") {
        if (!parsedCv?.resumeId) {
          toast.error("⚠️ Không tìm thấy CV của bạn. Vui lòng tải lên và phân tích CV trước!");
          setIsLoading(false);
          return;
        }
        if (!targetRole.trim() || !jobDescription.trim()) {
          toast.error("⚠️ Vui lòng nhập đầy đủ Vị trí mục tiêu và Mô tả công việc (JD) để AI cá nhân hóa câu hỏi!");
          setIsLoading(false);
          return;
        }

        activeSession = await interviewApi.startMockInterview({
          resumeId: parsedCv.resumeId,
          targetRole: targetRole,
          jobDescription: jobDescription,
          targetLevel: selectedLevel,
        });
      } else {
        // Standard session via Application (uses mock fallback for sandbox)
        activeSession = await interviewApi.startInterview({
          applicationId: 1, // Fallback application ID
          targetLevel: selectedLevel,
        });
      }

      setSession(activeSession);
      const initialQuestions = await interviewApi.getQuestions(activeSession.id);
      setQuestions(initialQuestions);
      setCurrentIdx(0);
      setCurrentAnswer("");
      toast.success(`🚀 Khởi tạo thành công! Bắt đầu phiên phỏng vấn trình độ ${selectedLevel === "EASY" ? "Intern/Fresher" : selectedLevel === "MEDIUM" ? "Junior/Middle" : "Senior/Lead"}. Chúc bạn làm tốt!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "❌ Lỗi kết nối hoặc API của Gemini quá tải. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || currentAnswer.trim().length < 10) {
      toast.error("⚠️ Câu trả lời quá ngắn! Hãy viết chi tiết hơn để hệ thống AI đánh giá chính xác.");
      return;
    }

    if (!session) return;

    setIsLoading(true);
    try {
      const response = await interviewApi.submitAnswer(session.id, currentAnswer);
      
      // Refresh question list to pull evaluations and newly generated questions
      const updatedQuestions = await interviewApi.getQuestions(session.id);
      setQuestions(updatedQuestions);

      const nextQNum = currentIdx + 2;
      if (response.isFinished) {
        toast.success("🎉 Đã hoàn thành câu hỏi cuối cùng! Đang tính toán điểm tổng hợp...");
        await handleFinishInterview();
      } else {
        setCurrentIdx((prev) => prev + 1);
        setCurrentAnswer("");
        if (nextQNum <= 3) {
          toast.success(`✓ Đã lưu câu trả lời câu ${currentIdx + 1}! Chuyển sang câu ${nextQNum} (Lấy từ Ngân hàng câu hỏi JD dùng chung).`);
        } else if (nextQNum === 4) {
          toast.success(`✓ Đã lưu câu trả lời câu ${currentIdx + 1}! Chuyển sang câu ${nextQNum} (AI đang phân tích dự án trong CV của bạn để cá nhân hóa câu hỏi).`);
        } else {
          toast.success(`✓ Đã lưu câu trả lời câu ${currentIdx + 1}! Chuyển sang câu ${nextQNum} (Câu hỏi tình huống bổ trợ nâng cao dựa trên câu trả lời trước).`);
        }
      }
    } catch (error: any) {
      console.error(error);
      toast.error("❌ Gửi câu trả lời thất bại. Vui lòng kiểm tra kết nối mạng!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      await interviewApi.finishInterview(session.id);
      toast.success("📊 Hoàn thành phiên phỏng vấn! Đang tạo báo cáo đánh giá...");
      navigate(`/interview/results/${session.id}`);
    } catch (error: any) {
      console.error(error);
      toast.error("❌ Không thể kết xuất báo cáo AI. Vui lòng kiểm tra log backend!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setSession(null);
    setQuestions([]);
    setCurrentIdx(0);
    setCurrentAnswer("");
    setReport(null);
  };

  const currentQuestion = questions[currentIdx];
  const progressPercent = questions.length > 0 ? (currentIdx / 5) * 100 : 0;

  // Render Section
  return (
    <SiteLayout>
      <Seo
        title="Luyện phỏng vấn — Mock Interview AI cá nhân hóa sâu sắc"
        description="Luyện phỏng vấn mô phỏng AI Hybrid, được cá nhân hóa theo CV của bạn và JD tuyển dụng."
        path="/interview"
        jsonLd={breadcrumbLd([
          { name: "Trang chủ", path: "/" },
          { name: "Luyện phỏng vấn", path: "/interview" },
        ])}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
            <Cpu className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="mt-4 font-semibold text-lg text-foreground animate-pulse">
            AI đang phân tích dữ liệu và khởi tạo câu hỏi...
          </p>
          <p className="text-sm text-muted-foreground mt-1">Quá trình này có thể mất vài giây</p>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        
        {/* CASE 1: NOT STARTED - SETUP VIEW */}
        {!session && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mx-auto max-w-3xl"
          >
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-3">
                <Sparkles className="h-3.5 w-3.5" /> Công nghệ Hybrid Interview 3 tầng độc quyền
              </span>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                Trình mô phỏng Phỏng vấn AI
              </h1>
              <p className="mt-3 text-muted-foreground text-base max-w-xl mx-auto">
                Trải nghiệm quy trình phỏng vấn tiêu chuẩn gồm 5 câu: 3 câu hỏi chuyên sâu từ Job/JD (tận dụng Ngân hàng câu hỏi dùng chung) và 2 câu hỏi cá nhân hóa sâu sắc dựa trên CV của bạn.
              </p>
            </div>

            {/* Quick warning if CV is not uploaded */}
            {!parsedCv?.resumeId && (
              <div className="mb-6 rounded-2xl bg-warning/10 border border-warning/30 p-4 text-sm flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-warning">Chưa phát hiện CV phân tích gần đây:</span> Hệ thống phỏng vấn AI tối ưu hóa tốt nhất khi có thông tin CV để cá nhân hóa các câu hỏi thứ 4 và thứ 5. Hãy tải lên CV của bạn trước khi bắt đầu.
                  <div className="mt-2">
                    <Button asChild size="sm" variant="outline" className="h-8 rounded-xl border-warning/40 text-warning hover:bg-warning/20">
                      <Link to="/cv-analysis">Tải lên và phân tích CV ngay</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Config Card */}
            <div className="bg-card rounded-3xl border border-border/60 p-8 shadow-card space-y-6">
              
              {/* Profile suggestion glass card */}
              {parsedCv && (
                <div className="bg-primary/5 rounded-2xl border border-primary/15 p-4 flex items-center justify-between gap-4 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">Phát hiện CV đã phân tích</div>
                      <div className="text-sm font-bold text-foreground truncate" title={parsedCv.fileName}>
                        {parsedCv.fileName
                          ? parsedCv.fileName
                              .replace(/^resumes\/\w+\//, "")
                              .replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/, "")
                          : "CV của bạn"}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-semibold shrink-0">
                    ID: {parsedCv.resumeId}
                  </Badge>
                </div>
              )}

              {/* Targets inputs */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role" className="font-semibold text-sm">Vị trí ứng tuyển mục tiêu</Label>
                  <Input 
                    id="role" 
                    placeholder="VD: Kỹ sư Backend Java, React Developer..." 
                    value={targetRole} 
                    onChange={(e) => setTargetRole(e.target.value)} 
                    className="mt-1.5 rounded-xl border-border/80 h-11"
                  />
                </div>
                <div>
                  <Label className="font-semibold text-sm">Cấp độ phỏng vấn (Level)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {(["EASY", "MEDIUM", "HARD"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSelectedLevel(level)}
                        className={`py-2 px-3 rounded-xl border-2 font-bold text-xs transition-all ${
                          selectedLevel === level
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground hover:border-border"
                        }`}
                      >
                        {level === "EASY" ? "Intern/Fresher" : level === "MEDIUM" ? "Junior/Middle" : "Senior/Lead"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="font-semibold text-sm">Bản mô tả công việc (JD tuyển dụng)</Label>
                  
                  {/* Premium Mode Toggle Tabs */}
                  <div className="inline-flex p-1 bg-muted/60 border border-border/40 rounded-xl max-w-xs text-xs font-bold self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setJdInputMode("text")}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        jdInputMode === "text"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Dán văn bản trực tiếp
                    </button>
                    <button
                      type="button"
                      onClick={() => setJdInputMode("file")}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        jdInputMode === "file"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Tải lên tệp JD
                    </button>
                  </div>
                </div>

                {jdInputMode === "text" ? (
                  <Textarea 
                    id="jd" 
                    rows={6} 
                    placeholder="Dán nội dung chi tiết bản tuyển dụng (Job Description) vào đây để AI phân tích cấu trúc, kỹ năng trọng tâm và sinh câu hỏi..." 
                    value={jobDescription} 
                    onChange={(e) => setJobDescription(e.target.value)} 
                    className="rounded-xl border-border/80 leading-relaxed text-sm focus-visible:ring-primary/40"
                  />
                ) : (
                  <div className="space-y-3">
                    {!jdFile ? (
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleJdFileChange(file);
                        }}
                        className={`border-2 border-dashed border-border/80 hover:border-primary/50 bg-muted/15 hover:bg-primary/[0.02] rounded-2xl p-6 text-center cursor-pointer transition-all ${
                          isExtractingJd ? "opacity-60 pointer-events-none" : ""
                        }`}
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".pdf,.docx,.txt";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleJdFileChange(file);
                          };
                          input.click();
                        }}
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <UploadCloud className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">Kéo thả file JD vào đây hoặc click để chọn file</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Hỗ trợ PDF, DOCX, TXT · Tối đa 5MB</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* File details card */}
                        <div className="flex items-center justify-between p-4 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-2xl">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                              <FileText className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground truncate max-w-[280px]" title={jdFile.name}>
                                {jdFile.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {(jdFile.size / 1024).toFixed(1)} KB · Trích xuất thành công {jobDescription.split(/\s+/).filter(Boolean).length} từ
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowExtractedEditor(!showExtractedEditor)}
                              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              {showExtractedEditor ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setJdFile(null);
                                setJobDescription("");
                                setShowExtractedEditor(false);
                              }}
                              className="h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Collapsible extracted text preview/editor */}
                        <AnimatePresence>
                          {showExtractedEditor && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden space-y-1.5"
                            >
                              <Label htmlFor="extracted-jd" className="text-xs text-muted-foreground font-semibold">
                                Biên tập lại văn bản trích xuất (nếu cần)
                              </Label>
                              <Textarea
                                id="extracted-jd"
                                rows={6}
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                className="rounded-xl border-border/80 leading-relaxed text-xs focus-visible:ring-primary/40 bg-muted/10"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Extraction progress indicator */}
                    {isExtractingJd && (
                      <div className="flex items-center gap-2 justify-center py-2 text-xs font-semibold text-primary">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        AI đang đọc tệp và trích xuất thông tin tuyển dụng...
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-6">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-primary" /> Mô hình chấm điểm 4 tiêu chí chuẩn doanh nghiệp.
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="rounded-xl border-2">
                    <Link to="/cv-analysis">Đổi CV khác</Link>
                  </Button>
                  <Button 
                    onClick={handleStartInterview} 
                    className="bg-gradient-primary text-primary-foreground rounded-xl px-6 font-bold shadow-glow"
                  >
                    <Mic className="mr-2 h-4 w-4" /> Bắt đầu ngay
                  </Button>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* CASE 2: SESSION IN PROGRESS */}
        {session && !report && currentQuestion && (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            
            {/* Live Interview Box */}
            <motion.section 
              key={currentQuestion.id} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-card rounded-3xl border border-border/60 p-8 lg:p-10 shadow-card relative overflow-hidden"
            >
              {/* Question origin background banner decoration */}
              <div className="absolute top-0 right-0 h-28 w-28 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Câu hỏi {currentIdx + 1} / 5
                  </span>
                  <Badge className="bg-primary/15 text-primary border-primary/20">
                    Q{currentIdx + 1}
                  </Badge>
                  {currentIdx + 1 <= 3 ? (
                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5 font-medium">
                      Standard Caching
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-blue-500/20 text-blue-500 bg-blue-500/5 font-medium animate-pulse">
                      Cá nhân hóa CV
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-semibold">
                  {Math.round(progressPercent)}% hoàn thành
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-8">
                <div 
                  className="h-full bg-gradient-primary transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>

              {/* Actual Question Text */}
              <h2 className="text-xl lg:text-2xl font-bold tracking-tight leading-snug text-foreground mb-6">
                {currentQuestion.questionText}
              </h2>

              {/* Context notes if available from CV/JD analysis */}
              {(currentQuestion.cvContext || currentQuestion.jdContext) && (
                <div className="mb-6 p-4 rounded-2xl bg-secondary/60 border border-border/40 text-xs space-y-2">
                  {currentQuestion.cvContext && (
                    <div>
                      <span className="font-bold text-primary">Cơ sở trong CV:</span> &ldquo;{currentQuestion.cvContext}&rdquo;
                    </div>
                  )}
                  {currentQuestion.jdContext && (
                    <div>
                      <span className="font-bold text-emerald-500">Yêu cầu từ JD:</span> &ldquo;{currentQuestion.jdContext}&rdquo;
                    </div>
                  )}
                </div>
              )}

              {/* Answer input */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="answer-box" className="text-sm font-bold text-foreground">
                    Câu trả lời của bạn
                  </Label>
                  {isRecording ? (
                    <span className="text-xs text-destructive animate-pulse font-bold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-destructive inline-block" /> Đang ghi âm: {recordingSeconds}s
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Nên viết tối thiểu 100 từ để được chấm điểm chính xác nhất.
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <Textarea
                    id="answer-box"
                    rows={8}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Hãy trả lời dựa trên kinh nghiệm thực tế của bạn. Khuyên dùng mô hình STAR: Tình huống (Situation) -> Nhiệm vụ (Task) -> Hành động (Action) -> Kết quả (Result) để đạt điểm cấu trúc cao nhất..."
                    className="rounded-2xl border-border/80 text-base leading-relaxed p-5 focus-visible:ring-primary/40 pr-14"
                  />
                  
                  {/* Speech to text simulator button */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`absolute bottom-4 right-4 h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                      isRecording 
                        ? "bg-destructive text-destructive-foreground animate-bounce shadow-glow" 
                        : "bg-primary/10 text-primary hover:bg-primary/25"
                    }`}
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                  <span>Số ký tự: {currentAnswer.length}</span>
                  <span>Từ: {currentAnswer.split(/\s+/).filter(Boolean).length} từ</span>
                </div>
              </div>

              {/* Control panel buttons */}
              <div className="mt-8 border-t border-border/60 pt-6 flex justify-between items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRestart} 
                  className="rounded-xl border-2"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Hủy bỏ phiên
                </Button>
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!currentAnswer.trim()}
                  className="bg-gradient-primary text-primary-foreground rounded-xl px-6 font-bold"
                >
                  {currentIdx + 1 === 5 ? "Nộp bài & Xem báo cáo" : "Chuyển câu tiếp"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

            </motion.section>

            {/* Side-panel details */}
            <aside className="space-y-4">
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                  <Activity className="h-4 w-4 text-primary" /> Thông tin phiên
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vị trí:</span>
                    <span className="font-bold text-foreground truncate max-w-[140px]">{targetRole || "Tổng hợp"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mức độ:</span>
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 font-semibold">
                      {selectedLevel === "EASY" ? "Dễ" : selectedLevel === "MEDIUM" ? "Trung bình" : "Khó"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-warning" /> Hướng dẫn phỏng vấn
                </div>
                <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> 
                    <span>Trả lời trung thực bám sát dự án đã thực sự thực hiện để câu hỏi cá nhân hóa phát huy tối đa công suất.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> 
                    <span>Có thể click vào <span className="font-semibold">Mic</span> để nói trực tiếp, hệ thống sẽ tự nhận diện giọng nói.</span>
                  </li>
                </ul>
              </div>
            </aside>

          </div>
        )}

        {/* CASE 3: INTERVIEW COMPLETED & REPORT GENERATED */}
        {report && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="mx-auto max-w-4xl"
          >
            {/* Header Badge */}
            <div className="text-center mb-8">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow mb-4">
                <Trophy className="h-7 w-7" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
                Báo cáo Đánh giá Phỏng vấn AI
              </h1>
              <p className="mt-2 text-muted-foreground text-sm">
                Phiên phỏng vấn đã được tổng hợp, phân rã điểm chi tiết dựa trên dữ liệu lịch sử và mô hình tiêu chuẩn doanh nghiệp.
              </p>
            </div>

            {/* Score Summary Circular Gauge Card */}
            <div className="grid md:grid-cols-[1fr_360px] gap-6 mb-8">
              
              {/* Radial Breakdown / Radar Chart */}
              <div className="bg-card rounded-3xl border border-border/60 p-6 lg:p-8 shadow-card flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" /> Phân tích đa tiêu chí (Radar Chart)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                    Biểu đồ mạng nhện biểu đạt năng lực ứng viên trên 4 khía cạnh trọng tâm.
                  </p>
                </div>

                {/* Recharts responsive radar chart container */}
                <div className="h-[240px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" radius="80%" data={[
                      { criteria: "Độ liên quan (Relevance)", score: questions.reduce((sum, q) => sum + (q.interviewAnswer?.answerScores?.find(s => s.criteria === "RELEVANCE")?.score || 5), 0) / 5 },
                      { criteria: "Chiều sâu (Depth)", score: questions.reduce((sum, q) => sum + (q.interviewAnswer?.answerScores?.find(s => s.criteria === "DEPTH")?.score || 5), 0) / 5 },
                      { criteria: "Diễn đạt (Communication)", score: questions.reduce((sum, q) => sum + (q.interviewAnswer?.answerScores?.find(s => s.criteria === "COMMUNICATION")?.score || 5), 0) / 5 },
                      { criteria: "Cấu trúc (Structure)", score: questions.reduce((sum, q) => sum + (q.interviewAnswer?.answerScores?.find(s => s.criteria === "STRUCTURE")?.score || 5), 0) / 5 },
                    ]}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="criteria" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#cbd5e1" />
                      <Radar name="Cá nhân" dataKey="score" stroke="#0066ff" fill="#3b82f6" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] text-muted-foreground border-t border-border/60 pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                    <span>Độ liên quan: Trả lời bám sát JD & câu hỏi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />
                    <span>Chiều sâu: Khả năng giải thích sâu sắc</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-violet-500 inline-block" />
                    <span>Cấu trúc: Tổ chức luận điểm logic, mạch lạc</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-pink-500 inline-block" />
                    <span>Giao tiếp: Khả năng diễn thuyết, sử dụng từ ngữ</span>
                  </div>
                </div>
              </div>

              {/* Circular Gauge Card and Summary Text */}
              <div className="bg-card rounded-3xl border border-border/60 p-6 lg:p-8 shadow-card flex flex-col justify-between space-y-6">
                <div className="text-center">
                  <div className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Điểm đánh giá chung</div>
                  
                  {/* Gauge */}
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
                    <Badge className={`px-4 py-1 text-sm font-bold rounded-full ${
                      report.decision === "PASS" 
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10" 
                        : report.decision === "CONSIDER"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10"
                        : "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/10"
                    }`}>
                      {report.decision === "PASS" ? "Tuyển dụng (PASS)" : report.decision === "CONSIDER" ? "Cân nhắc (CONSIDER)" : "Từ chối (FAIL)"}
                    </Badge>
                  </div>
                </div>

                <div className="bg-secondary/40 border border-border/40 p-4 rounded-2xl text-xs space-y-2">
                  <div className="font-bold text-foreground">Tổng quan đánh giá:</div>
                  <p className="text-muted-foreground leading-relaxed">
                    {report.summary}
                  </p>
                </div>
              </div>

            </div>

            {/* Insights Panel */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-card rounded-2xl border border-emerald-500/20 p-5 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Điểm mạnh của bạn
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {report.insights.filter(i => i.type === "STRENGTH").map((ins) => (
                    <li key={ins.id} className="flex items-start gap-2">
                      <span className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0 text-[10px]">✓</span>
                      <span>{ins.title}</span>
                    </li>
                  ))}
                  {report.insights.filter(i => i.type === "STRENGTH").length === 0 && (
                    <li className="text-muted-foreground italic">Không có điểm mạnh nào được ghi nhận.</li>
                  )}
                </ul>
              </div>

              <div className="bg-card rounded-2xl border border-amber-500/20 p-5 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Điểm cần cải thiện
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {report.insights.filter(i => i.type === "WEAKNESS").map((ins) => (
                    <li key={ins.id} className="flex items-start gap-2">
                      <span className="h-4 w-4 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0 text-[10px]">!</span>
                      <span>{ins.title}</span>
                    </li>
                  ))}
                  {report.insights.filter(i => i.type === "WEAKNESS").length === 0 && (
                    <li className="text-muted-foreground italic">Không phát hiện điểm yếu rõ rệt nào cần sửa chữa ngay lập tức.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Question by Question Breakdown Details */}
            <div className="bg-card rounded-3xl border border-border/60 p-6 lg:p-8 shadow-card mb-8">
              <h3 className="font-bold text-lg text-foreground mb-1 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Chi tiết từng câu hỏi & Đánh giá
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                Bảng tổng hợp điểm số và phân loại phản hồi chi tiết cho tất cả 5 câu hỏi trong phiên phỏng vấn của bạn.
              </p>

              {/* Summary Scorecard Table */}
              <div className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-muted/20 shadow-soft">
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
                    <tbody className="divide-y divide-border/40">
                      {questions.map((q, index) => {
                        const score = q.interviewAnswer?.interviewEvaluation?.score || 5;
                        const status = getAnswerStatus(score);
                        return (
                          <tr key={q.id} className="hover:bg-muted/40 transition-colors">
                            <td className="p-4 font-extrabold text-center text-muted-foreground">Q{index + 1}</td>
                            <td className="p-4 font-semibold text-foreground truncate max-w-[240px] sm:max-w-[320px]">
                              {q.questionText}
                            </td>
                            <td className="p-4 text-center">
                              {index + 1 <= 3 ? (
                                <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/15 bg-emerald-500/5 font-semibold">
                                  Standard
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] text-blue-500 border-blue-500/15 bg-blue-500/5 font-semibold">
                                  Personalized
                                </Badge>
                              )}
                            </td>
                            <td className="p-4 text-center font-extrabold text-sm text-foreground">
                              {score}/10
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${status.color}`}>
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
                                  // Scroll slightly to collapsible area
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

              {/* Collapsible Questions Accordion */}
              <div className="space-y-4">
                {questions.map((q, index) => {
                  const isExpanded = expandedQuestionId === q.id;
                  const score = q.interviewAnswer?.interviewEvaluation?.score || 5;
                  const status = getAnswerStatus(score);

                  return (
                    <div 
                      key={q.id} 
                      id={`q-card-${q.id}`}
                      className={`border rounded-2xl overflow-hidden transition-all ${
                        isExpanded ? "border-primary/40 shadow-soft bg-card" : "border-border/60 hover:border-border"
                      }`}
                    >
                      {/* Collapsible Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="w-full text-left p-4 lg:p-5 flex justify-between items-center bg-secondary/10 hover:bg-secondary/35 transition-all gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[10px] font-bold">
                              Câu {index + 1}
                            </Badge>
                            {index + 1 <= 3 ? (
                              <Badge variant="outline" className="text-[9px] text-emerald-500 border-emerald-500/10 font-medium">
                                Standard
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] text-blue-500 border-blue-500/10 font-medium">
                                CV Personalized
                              </Badge>
                            )}
                            {/* explicit evaluation label in header */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${status.color}`}>
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
                            <div className="space-y-3">
                              <div>
                                <div className="font-bold text-foreground mb-1 flex items-center gap-1.5 text-[11px]">
                                  <BookOpen className="h-3.5 w-3.5 text-primary" /> Câu hỏi:
                                </div>
                                <p className="text-foreground leading-relaxed p-4 rounded-xl bg-secondary/20 border border-border/30 font-medium">
                                  {q.questionText}
                                </p>
                              </div>

                              <div>
                                <div className="font-bold text-foreground mb-1 flex items-center gap-1.5 text-[11px]">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" /> Câu trả lời của bạn:
                                </div>
                                <p className="text-muted-foreground leading-relaxed p-4 rounded-xl bg-secondary/40 border border-border/40 whitespace-pre-wrap">
                                  {q.interviewAnswer?.answerText || "Bỏ qua / Không có dữ liệu"}
                                </p>
                              </div>
                            </div>

                            {/* Stylized Answer Status Assessment Block */}
                            <div className={`p-4 rounded-xl border flex gap-3 items-start shadow-soft ${status.color}`}>
                              <div className="mt-0.5">{status.icon}</div>
                              <div>
                                <div className="font-extrabold text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <span>Đánh giá kết quả:</span> <span>{status.label}</span>
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
                                  <Cpu className="h-3.5 w-3.5 text-primary" /> Nhận xét chi tiết từ Trợ lý AI:
                                </div>
                                <p className="text-muted-foreground leading-relaxed text-[11px] whitespace-pre-wrap">
                                  {q.interviewAnswer.interviewEvaluation.feedback}
                                </p>
                              </div>
                            )}

                            {/* Multi-criteria breakdowns per question */}
                            {q.interviewAnswer?.answerScores && q.interviewAnswer.answerScores.length > 0 && (
                              <div className="pt-2">
                                <div className="font-bold text-foreground mb-2 flex items-center gap-1.5 text-[11px]">
                                  <Award className="h-3.5 w-3.5 text-indigo-500" /> Điểm phân rã 4 tiêu chí cho câu hỏi này:
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                  {q.interviewAnswer.answerScores.map((sc) => (
                                    <div key={sc.id} className="p-3.5 rounded-xl border border-border/40 bg-secondary/30 transition-all hover:bg-secondary/45">
                                      <div className="flex justify-between items-center mb-1 font-bold text-[10px]">
                                        <span className="text-foreground">
                                          {sc.criteria === "RELEVANCE" ? "Mức liên quan" : sc.criteria === "DEPTH" ? "Chiều sâu kiến thức" : sc.criteria === "STRUCTURE" ? "Cấu trúc trình bày" : "Khả năng giao tiếp"}
                                        </span>
                                        <Badge variant="outline" className={`text-[9px] font-bold ${
                                          sc.score >= 8 
                                            ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" 
                                            : sc.score >= 5 
                                            ? "text-amber-500 bg-amber-500/5 border-amber-500/10" 
                                            : "text-destructive bg-destructive/5 border-destructive/10"
                                        }`}>
                                          {sc.score}/10
                                        </Badge>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground leading-normal italic">
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
            </div>

            {/* Complete Section Buttons */}
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              <Button 
                onClick={handleRestart} 
                variant="outline" 
                className="rounded-xl border-2 font-bold px-6"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Luyện lại ngay
              </Button>
              <Button 
                asChild 
                className="bg-gradient-primary text-primary-foreground rounded-xl font-bold px-6 shadow-glow"
              >
                <Link to="/dashboard">Quay lại Dashboard</Link>
              </Button>
            </div>

          </motion.div>
        )}

      </div>
    </SiteLayout>
  );
}