import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, Sparkles, ShieldCheck, Zap, Loader2, Check, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { cvStore, generateMockResult } from "@/lib/store";
import { useUploadCvMutation } from "@/hooks/queries/useCvQueries";
import { cvApi } from "@/api/cvApi";
import { mapResumeScanToAnalysisResult } from "@/lib/cvMapper";

const LOADER_STAGES = [
  {
    id: 1,
    title: "Giai đoạn 1: Tự động phát hiện",
    desc: "Đọc thông tin liên hệ, trình độ và ngành nghề ứng tuyển",
    range: [0, 25],
  },
  {
    id: 2,
    title: "Giai đoạn 2: Chấm điểm nền tảng",
    desc: "Đánh giá bố cục, độ dài và định dạng trình bày",
    range: [25, 50],
  },
  {
    id: 3,
    title: "Giai đoạn 3: Phân tích chuyên môn",
    desc: "Kiểm tra kỹ năng thực tế và từ khóa chuẩn ATS",
    range: [50, 75],
  },
  {
    id: 4,
    title: "Giai đoạn 4: Hoàn thành & Đề xuất",
    desc: "Biên soạn gợi ý cải thiện và câu hỏi phỏng vấn thử",
    range: [75, 100],
  },
];

export default function CvChecker() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  const [successFinished, setSuccessFinished] = useState(false);

  const uploadCvMutation = useUploadCvMutation();

  const startAnalysis = useCallback((selectedFile: File | string) => {
    setAnalyzing(true);
    setProgress(0);
    setIsTakingLonger(false);
    setSuccessFinished(false);
    setError(null);

    const isDemo = typeof selectedFile === "string";
    const fileName = isDemo ? selectedFile : selectedFile.name;

    // Thiết lập tiến trình thông minh, giảm tốc tự nhiên (organic decelerating progress)
    // Giúp thanh tiến trình chạy mượt mà, không bao giờ bị đứng khựng lại một chỗ
    const startTime = Date.now();
    let currentProgress = 0;

    const tick = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (currentProgress < 30) {
        currentProgress += 1.2; // Giai đoạn đầu chạy nhanh
      } else if (currentProgress < 55) {
        currentProgress += 0.6; // Chậm dần
      } else if (currentProgress < 80) {
        currentProgress += 0.25; // Chậm hơn nữa
      } else if (currentProgress < 97) {
        currentProgress += 0.06; // Rất chậm, len lỏi bò dần lên để không bao giờ bị khựng hoàn toàn
      }

      const roundedP = Math.min(97, Math.floor(currentProgress));
      setProgress(roundedP);

      // Nếu xử lý lâu hơn 9 giây, kích hoạt thông báo tối ưu phản hồi từ AI
      if (elapsed >= 9000) {
        setIsTakingLonger(true);
      }
    }, 100);

    const pollResumeStatus = async (scanId: number) => {
      try {
        const response = await cvApi.getScanDetails(scanId);
        const freshScan = response.data;
        if (freshScan) {
          if (freshScan.status === "COMPLETED") {
            clearInterval(tick);
            const mappedResult = mapResumeScanToAnalysisResult(freshScan);
            cvStore.setResult(mappedResult);
            setProgress(100);
            setSuccessFinished(true);
            setTimeout(() => {
              navigate("/results");
            }, 1400);
          } else if (freshScan.status === "FAILED") {
            clearInterval(tick);
            setAnalyzing(false);
            setError(freshScan.failureMessage || "Phân tích CV thất bại bằng AI. Vui lòng thử tải lại hoặc dùng tệp khác!");
          } else {
            setTimeout(() => pollResumeStatus(scanId), 3500);
          }
        } else {
          setTimeout(() => pollResumeStatus(scanId), 3500);
        }
      } catch (err: any) {
        clearInterval(tick);
        setAnalyzing(false);
        setError(err.response?.data?.message || err.message || "Có lỗi xảy ra khi kiểm tra tiến độ phân tích.");
      }
    };

    if (isDemo) {
      // CHẾ ĐỘ DEMO: Tự động chạy lên 100% sau 8.5s
      setTimeout(() => {
        clearInterval(tick);
        setProgress(100);
        setSuccessFinished(true);
        setTimeout(() => {
          cvStore.setResult(generateMockResult(fileName));
          navigate("/results");
        }, 1400);
      }, 8500);
    } else {
      // CHẾ ĐỘ API THẬT: Trigger upload lên backend Spring Boot
      uploadCvMutation.mutate(selectedFile, {
        onSuccess: (scan) => {
          if (scan.status === "COMPLETED" || scan.status === "FAILED") {
            clearInterval(tick);
            if (scan.status === "COMPLETED") {
              const mappedResult = mapResumeScanToAnalysisResult(scan);
              cvStore.setResult(mappedResult);
              setProgress(100);
              setSuccessFinished(true);
              setTimeout(() => {
                navigate("/results");
              }, 1400);
            } else {
              setAnalyzing(false);
              setError(scan.failureMessage || "Phân tích CV thất bại bằng AI.");
            }
          } else {
            setTimeout(() => pollResumeStatus(scan.id), 5000);
          }
        },
        onError: (err: any) => {
          clearInterval(tick);
          setAnalyzing(false);
          const errMsg = err.response?.data?.message || err.message || "Tải lên và phân tích CV thất bại. Vui lòng thử lại!";
          setError(errMsg);
        }
      });
    }
  }, [navigate, uploadCvMutation]);

  useEffect(() => {
    if (params.get("demo") === "1") {
      startAnalysis("demo_resume.pdf");
    }
  }, [params, startAnalysis]);

  const onDrop = useCallback((accepted: File[], rejections: any[]) => {
    setError(null);
    if (rejections.length) {
      setError("Vui lòng tải lên file PDF hoặc DOCX dung lượng dưới 5MB.");
      return;
    }
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    // Truyền trực tiếp đối tượng File thật
    startAnalysis(f);
  }, [startAnalysis]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    disabled: analyzing,
  });

  return (
    <SiteLayout>
      <Seo
        title="Phân tích CV — Tải CV để nhận điểm ATS tức thì"
        description="Tải lên PDF hoặc DOCX. Nhận điểm ATS, nhận xét theo từng mục và 3 vấn đề quan trọng cần sửa. Miễn phí."
        path="/cv-analysis"
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Phân tích CV", path: "/cv-analysis" }])}
      />

      <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Bước 1 — Phân tích CV
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Tải CV lên để được phân tích chuẩn ATS</h1>
          <p className="mt-4 text-lg text-muted-foreground">PDF hoặc DOCX, tối đa 5MB. File của bạn được xử lý riêng tư và không chia sẻ.</p>

          <div {...getRootProps()} className={`mt-10 rounded-3xl border-2 border-dashed p-10 lg:p-14 cursor-pointer transition-all bg-card ${isDragActive ? "border-primary bg-primary-light" : "border-border hover:border-primary/50 hover:bg-secondary/40"} ${analyzing ? "opacity-60 pointer-events-none" : ""}`}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <UploadCloud className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{isDragActive ? "Thả file vào đây" : "Kéo & thả CV của bạn"}</h3>
              <p className="mt-2 text-sm text-muted-foreground">hoặc bấm để chọn file — PDF, DOCX · tối đa 5MB</p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button className="bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-glow rounded-xl h-11 px-6 font-semibold">Tải CV lên</Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-11 px-6 font-semibold border-2"
                  onClick={(e) => { e.stopPropagation(); startAnalysis("demo_resume.pdf"); }}
                >Dùng CV mẫu</Button>
              </div>
              {file && <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> {file.name}</div>}
              {error && <p className="mt-4 text-sm text-destructive font-medium">{error}</p>}
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, label: "Riêng tư & bảo mật" },
              { icon: Zap, label: "Có kết quả trong 10 giây" },
              { icon: Sparkles, label: "Miễn phí trọn đời" },
            ].map((b) => (
              <div key={b.label} className="flex items-center justify-center gap-2 text-sm text-secondary-foreground/90">
                <b.icon className="h-4 w-4 text-primary" /> {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center p-4 bg-background/50 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-[#1E293B] border border-[#334155] p-7 lg:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)]"
            >
              {/* Header with clear honest step tracker */}
              {(() => {
                const activeStageIdx = LOADER_STAGES.findIndex(stage => progress >= stage.range[0] && progress < stage.range[1]);
                const currentStageNum = activeStageIdx !== -1 ? activeStageIdx + 1 : 4;

                return (
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-5">
                    <div className="text-left">
                      <h3 className="text-xl font-bold tracking-tight text-white">
                        {progress >= 100 ? "Phân tích CV hoàn tất!" : "Đang phân tích CV của bạn"}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">
                        {progress >= 100
                          ? "Đã chấm điểm toàn bộ nội dung thành công."
                          : `AI đang phân tích CV · Giai đoạn ${currentStageNum} / 4`
                        }
                      </p>
                    </div>
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                );
              })()}

              {/* Steps timeline */}
              <div className="mt-8 space-y-6 text-left relative pl-2">
                {/* Background connector line */}
                <div className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-slate-700/60" />

                {/* Animated active connector line */}
                <div
                  className="absolute left-[13px] top-3 w-[2px] bg-gradient-to-b from-emerald-500 to-amber-400 transition-all duration-300"
                  style={{ height: `${Math.max(0, Math.min(84, (progress / 100) * 84))}%` }}
                />

                {LOADER_STAGES.map((stage) => {
                  const isCompleted = progress >= stage.range[1];
                  const isActive = progress >= stage.range[0] && progress < stage.range[1];

                  return (
                    <motion.div
                      key={stage.id}
                      className="relative flex items-start gap-4"
                      initial={{ opacity: 0.4, x: 0 }}
                      animate={{
                        opacity: isActive || isCompleted ? 1 : 0.4,
                        x: isActive ? 6 : 0,
                        scale: isActive ? 1.01 : 1
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      {/* Left icon wrapper */}
                      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                        {isCompleted ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                            <Check className="h-4 w-4 stroke-[3.5px]" />
                          </div>
                        ) : isActive ? (
                          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/25 text-amber-400 border border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.35)]">
                            <span className="absolute inset-0 rounded-full border border-amber-400 animate-ping opacity-25" />
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-500">
                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                          </div>
                        )}
                      </div>

                      {/* Content wrapper */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold transition-colors ${isActive ? "text-amber-400" : isCompleted ? "text-emerald-400" : "text-slate-400"}`}>
                            {stage.title}
                          </h4>
                          {isCompleted && (
                            <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              HOÀN THÀNH
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 animate-pulse">
                              ĐANG PHÂN TÍCH
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed transition-colors ${isActive ? "text-slate-100" : "text-slate-400"}`}>
                          {stage.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress bar container */}
              <div className="mt-8 pt-5 border-t border-slate-700/60">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-400">Tổng tiến trình</span>
                  <span className="text-white font-mono">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 relative overflow-hidden rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeInOut", duration: 0.25 }}
                  >
                    {/* Soft, minimal shimmer effect */}
                    <motion.div
                      className="absolute inset-y-0 w-36 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ["-100%", "250%"] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Dynamic state-driven bottom banner alert boxes */}
              <div className="mt-6">
                {successFinished ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex gap-3 text-left shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  >
                    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center text-emerald-400">
                      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
                      <Check className="h-4 w-4 stroke-[3px]" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-emerald-400">🎉 Phân tích hoàn tất! Đang hiển thị kết quả...</p>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Hệ thống đang chuẩn bị định dạng bảng báo cáo và chuyển tiếp bạn sang trang điểm số.
                      </p>
                    </div>
                  </motion.div>
                ) : isTakingLonger ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4 flex gap-3 text-left"
                  >
                    <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-blue-400">Đang tối ưu hóa phản hồi đề xuất từ AI...</p>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Quá trình đang mất nhiều thời gian hơn dự kiến, xin vui lòng kiên nhẫn trong vài giây để nhận dữ liệu hoàn hảo.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4 flex gap-3 text-left">
                    <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-400">Trình xử lý AI đang hoạt động</p>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Phân tích chuẩn tuyển dụng ATS diễn ra tự động từ 10 - 30 giây. Vui lòng không đóng tab hoặc tải lại trang này.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SiteLayout>
  );
}
