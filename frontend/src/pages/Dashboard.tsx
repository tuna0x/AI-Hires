import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Mic, Wand2, Lightbulb, TrendingUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteLayout from "@/components/site/SiteLayout";
import ScoreCircle from "@/components/results/ScoreCircle";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { cvStore, useCvResult, generateMockResult } from "@/lib/store";

export default function Dashboard() {
  const result = useCvResult();

  useEffect(() => {
    cvStore.hydrate();
  }, []);

  return (
    <SiteLayout>
      <Seo
        title="Tổng quan — Trung tâm hành động Intervio"
        description="Điểm CV, các nhận xét chính và hành động tiếp theo để cải thiện CV hoặc luyện phỏng vấn."
        path="/dashboard"
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Tổng quan", path: "/dashboard" }])}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Tổng quan</span>
            <h1 className="mt-1 text-3xl lg:text-4xl font-bold tracking-tight">Chào mừng trở lại</h1>
            <p className="mt-2 text-muted-foreground">Đây là tình trạng CV của bạn và những việc nên làm tiếp.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl border-2"><Link to="/cv-analysis"><Upload className="mr-2 h-4 w-4" /> Phân tích lại</Link></Button>
            <Button asChild className="bg-gradient-primary text-primary-foreground rounded-xl"><Link to="/interview"><Mic className="mr-2 h-4 w-4" /> Luyện phỏng vấn</Link></Button>
          </div>
        </header>

        {result ? <Hub /> : <Empty />}
      </div>
    </SiteLayout>
  );

  function Hub() {
    if (!result) return null;
    const insights = (result.topIssues ?? []).slice(0, 3);
    return (
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl border border-border/60 p-8 shadow-card">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Điểm ATS hiện tại</span>
              <h2 className="mt-1 text-2xl font-bold">{result.status}</h2>
              <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5"><FileText className="h-4 w-4" /> {result.fileName}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild className="bg-gradient-primary text-primary-foreground rounded-xl"><Link to="/results"><Wand2 className="mr-2 h-4 w-4" /> Cải thiện CV</Link></Button>
                <Button asChild variant="outline" className="rounded-xl border-2"><Link to="/interview">Luyện phỏng vấn <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              </div>
            </div>
            <ScoreCircle score={result.score} />
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-3xl border border-border/60 p-8 shadow-card">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Nhận xét quan trọng</h3>
          </div>
          <ul className="space-y-4">
            {insights.map((it, i) => (
              <li key={i} className="flex gap-3">
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${it.severity === "high" ? "bg-destructive/10 text-destructive" : it.severity === "medium" ? "bg-warning/10 text-warning" : "bg-primary-light text-primary"}`}>{i + 1}</span>
                <div>
                  <p className="font-semibold text-sm">{it.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{it.fix}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button asChild variant="link" className="mt-4 px-0 text-primary"><Link to="/results">Xem báo cáo đầy đủ <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 grid sm:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: "Điểm ATS", value: `${result.score}/100` },
            { icon: Wand2, label: "Đề xuất AI", value: `${result.suggestions.length}` },
            { icon: Mic, label: "Sẵn sàng phỏng vấn", value: "Bấm để bắt đầu" },
          ].map((c) => (
            <div key={c.label} className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-light text-primary"><c.icon className="h-5 w-5" /></span>
              <div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className="font-bold text-foreground">{c.value}</div>
              </div>
            </div>
          ))}
        </motion.section>
      </div>
    );
  }

  function Empty() {
    return (
      <div className="mt-12 text-center bg-card border border-border/60 rounded-3xl p-12 shadow-soft">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow mb-4">
          <Upload className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold">Chưa phân tích CV nào</h2>
        <p className="mt-2 text-muted-foreground">Tải CV lên để xem điểm ATS, nhận xét chi tiết và bắt đầu luyện phỏng vấn.</p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Button asChild className="bg-gradient-primary text-primary-foreground rounded-xl h-11 px-6"><Link to="/cv-analysis"><Upload className="mr-2 h-4 w-4" /> Tải CV lên</Link></Button>
          <Button asChild variant="outline" className="rounded-xl h-11 px-6 border-2" onClick={() => cvStore.setResult(generateMockResult("demo_resume.pdf"))}><Link to="/dashboard">Thử với CV mẫu</Link></Button>
        </div>
      </div>
    );
  }
}