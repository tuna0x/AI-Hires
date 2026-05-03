import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, Sparkles, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { cvStore, generateMockResult } from "@/lib/store";

const STAGES = [
  "Reading your CV...",
  "Extracting skills...",
  "Calculating ATS score...",
  "Matching jobs...",
  "Preparing suggestions...",
];

export default function CvChecker() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  const startAnalysis = useCallback((name: string) => {
    setAnalyzing(true);
    setProgress(0);
    setStageIdx(0);
    const start = Date.now();
    const total = 7000;
    const stageInterval = setInterval(() => {
      setStageIdx((s) => (s + 1) % STAGES.length);
    }, 1300);
    const tick = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / total) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(tick);
        clearInterval(stageInterval);
        cvStore.setResult(generateMockResult(name));
        setTimeout(() => navigate("/results"), 350);
      }
    }, 80);
  }, [navigate]);

  useEffect(() => {
    if (params.get("demo") === "1") {
      startAnalysis("demo_resume.pdf");
    }
  }, [params, startAnalysis]);

  const onDrop = useCallback((accepted: File[], rejections: any[]) => {
    setError(null);
    if (rejections.length) {
      setError("Please upload a PDF or DOCX under 5MB.");
      return;
    }
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    startAnalysis(f.name);
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
        title="CV Analysis — Upload Your Resume for Instant ATS Score"
        description="Upload your PDF or DOCX. Get an ATS score, section-by-section feedback, and the top 3 critical issues to fix. Free."
        path="/cv-analysis"
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "CV Analysis", path: "/cv-analysis" }])}
      />

      <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary-dark mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Step 1 — Analyze your CV
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Upload your CV for an ATS-grade analysis</h1>
          <p className="mt-4 text-lg text-muted-foreground">PDF or DOCX, max 5MB. Your file is processed privately and never shared.</p>

          <div {...getRootProps()} className={`mt-10 rounded-3xl border-2 border-dashed p-10 lg:p-14 cursor-pointer transition-all bg-card ${isDragActive ? "border-primary bg-primary-light" : "border-border hover:border-primary/50 hover:bg-secondary/40"} ${analyzing ? "opacity-60 pointer-events-none" : ""}`}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <UploadCloud className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{isDragActive ? "Drop it here" : "Drag & drop your CV"}</h3>
              <p className="mt-2 text-sm text-muted-foreground">or click to browse — PDF, DOCX · up to 5MB</p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button className="bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-glow rounded-xl h-11 px-6 font-semibold">Upload Resume</Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-11 px-6 font-semibold border-2"
                  onClick={(e) => { e.stopPropagation(); startAnalysis("demo_resume.pdf"); }}
                >Try Demo CV</Button>
              </div>
              {file && <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> {file.name}</div>}
              {error && <p className="mt-4 text-sm text-destructive font-medium">{error}</p>}
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { icon: ShieldCheck, label: "Private & secure" },
              { icon: Zap, label: "Result in 10s" },
              { icon: Sparkles, label: "Free forever" },
            ].map((b) => (
              <div key={b.label} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
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
            className="fixed inset-0 z-[60] grid place-items-center p-4 bg-background/40 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-md rounded-3xl glass shadow-elegant border border-border/40 p-8 text-center"
            >
              <div className="relative mx-auto h-20 w-20">
                <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 animate-ping" />
                <div className="absolute inset-0 grid place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              </div>
              <h3 className="mt-6 text-xl font-bold">Analyzing your CV</h3>
              <p className="mt-2 text-sm text-muted-foreground">Estimated time: 6–10 seconds</p>

              <div className="mt-6 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full bg-gradient-primary" animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.08 }} />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(progress)}%</span>
                <span>{progress >= 100 ? "Done" : "Working..."}</span>
              </div>

              <div className="mt-6 h-6 relative">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={stageIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute inset-x-0 text-sm font-medium text-foreground"
                  >
                    {STAGES[stageIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SiteLayout>
  );
}