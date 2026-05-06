import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Gauge, ListChecks, Wand2, Mic, Crown,
  Download, CheckCircle2, AlertTriangle, XCircle, Copy, ArrowRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { cvStore, useCvResult, generateMockResult } from "@/lib/store";
import ScoreCircle from "@/components/results/ScoreCircle";
import { toast } from "sonner";

const NAV = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "ats", label: "Điểm ATS", icon: Gauge },
  { id: "sections", label: "Phân tích từng mục", icon: ListChecks },
  { id: "improve", label: "Cải thiện CV", icon: Wand2 },
  { id: "practice", label: "Luyện phỏng vấn", icon: Mic },
  { id: "upgrade", label: "Nâng cấp", icon: Crown },
];

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
            <div className="bg-card rounded-3xl border border-border/60 p-3 shadow-soft">
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  onClick={() => setActive(n.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${active === n.id ? "bg-primary-light text-primary-dark" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <n.icon className="h-4 w-4" /> {n.label}
                </a>
              ))}
            </div>
          </aside>

          <div className="space-y-10">
            <Overview result={result} />
            <AtsBreakdown result={result} />
            <SectionAnalysis result={result} />
            <Improve result={result} />
            <PracticeCta />
            {/* <Upgrade />  // Pricing tạm ẩn */}
          </div>
        </motion.div>
      </div>
    </SiteLayout>
  );
}

function Overview({ result }: { result: ReturnType<typeof generateMockResult> }) {
  return (
    <section id="overview" className="relative overflow-hidden rounded-3xl bg-card border border-border/60 p-8 lg:p-10 shadow-card scroll-mt-24">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 text-primary px-3 py-1 text-xs font-semibold mb-4 border border-primary/30">
            <Sparkles className="h-3.5 w-3.5" /> Đã phân tích xong
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground">{result.status}</h1>
          <p className="mt-2 text-lg text-secondary-foreground/90">Chúng tôi đã phân tích <span className="font-semibold text-foreground">{result.fileName}</span> theo 6 tiêu chí.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-95 rounded-xl h-11 px-5 font-semibold shadow-glow"><Download className="mr-2 h-4 w-4" /> Tải báo cáo</Button>
            <Button variant="outline" className="rounded-xl h-11 px-5 font-semibold border-2" asChild>
              <Link to="/cv-analysis">Tải lại CV <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" className="rounded-xl h-11 px-5 font-semibold border-2" asChild>
              <Link to="/interview"><Mic className="mr-2 h-4 w-4" /> Luyện phỏng vấn</Link>
            </Button>
          </div>
        </div>
        <div className="grid place-items-center rounded-3xl p-6 bg-primary/10 border border-primary/25">
          <ScoreCircle score={result.score} />
        </div>
      </div>
    </section>
  );
}

function AtsBreakdown({ result }: { result: ReturnType<typeof generateMockResult> }) {
  const items = [
    { key: "Định dạng", v: result.breakdown.formatting },
    { key: "Từ khóa", v: result.breakdown.keywords },
    { key: "Kinh nghiệm", v: result.breakdown.experience },
    { key: "Học vấn", v: result.breakdown.education },
    { key: "Kỹ năng", v: result.breakdown.skills },
    { key: "Khả năng đọc", v: result.breakdown.readability },
  ];
  return (
    <section id="ats" className="scroll-mt-24">
      <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Chi tiết điểm ATS</h2>
      <p className="text-muted-foreground mt-1">Điểm số của từng thành phần trong CV của bạn.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((it, i) => (
          <motion.div
            key={it.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-foreground">{it.key}</span>
              <span className="text-2xl font-bold text-primary">{it.v}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${it.v}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.1 + i * 0.05 }} className="h-full bg-gradient-primary" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SectionAnalysis({ result }: { result: ReturnType<typeof generateMockResult> }) {
  const map = {
    good: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/15", label: "Tốt" },
    warn: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/15", label: "Cần cải thiện" },
    bad: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/15", label: "Cần sửa" },
  } as const;
  return (
    <section id="sections" className="scroll-mt-24">
      <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Phân tích từng mục CV</h2>
      <p className="text-muted-foreground mt-1">Nhận xét cụ thể cho từng phần trong CV của bạn.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {result.sections.map((s, i) => {
          const m = map[s.status];
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${m.bg}`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{s.title}</h3>
                    <Badge variant="secondary" className={`${m.bg} ${m.color} border-0`}>{m.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{s.note}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function Improve({ result }: { result: ReturnType<typeof generateMockResult> }) {
  const [applied, setApplied] = useState<number[]>([]);
  return (
    <section id="improve" className="scroll-mt-24">
      <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Đề xuất cải thiện từ AI</h2>
      <p className="text-muted-foreground mt-1">Thay những gạch đầu dòng yếu bằng phiên bản sắc nét, có số liệu.</p>
      <div className="mt-6 space-y-4">
        {result.suggestions.map((s, i) => {
          const isApplied = applied.includes(i);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-border/60 p-6 shadow-soft">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trước</div>
                  <p className="text-sm text-secondary-foreground">{s.before}</p>
                </div>
                <div className="rounded-xl bg-primary/15 p-4 border border-primary/30">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Sau</div>
                  <p className="text-sm font-medium text-foreground">{s.after}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">💡 {s.reason}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className={isApplied ? "bg-success text-primary-foreground" : "bg-gradient-primary text-primary-foreground"}
                  onClick={() => { setApplied([...applied, i]); toast.success("Đã áp dụng đề xuất"); }}
                >
                  {isApplied ? <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Đã áp dụng</> : "Áp dụng đề xuất"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(s.after); toast.success("Đã sao chép"); }}>
                  <Copy className="mr-1.5 h-4 w-4" /> Sao chép
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
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Giờ thì luyện phỏng vấn nào</h2>
            <p className="mt-2 text-secondary-foreground/90 max-w-xl">Chúng tôi tạo phiên phỏng vấn có cấu trúc từ CV của bạn — kèm nhãn kỹ năng, độ khó và câu hỏi phụ thích ứng. Không phải chat, chỉ luyện tập tập trung.</p>
          </div>
          <div className="flex lg:justify-end">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground rounded-xl h-12 px-7 font-semibold shadow-glow">
              <Link to="/interview">Bắt đầu luyện <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Upgrade() {
  return (
    <section id="upgrade" className="scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl bg-card border border-primary/30 p-8 lg:p-10 shadow-elegant">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
          <div>
            <Crown className="h-7 w-7 text-primary mb-3" />
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Mở khóa phân tích không giới hạn & luyện phỏng vấn trọn vẹn</h2>
            <p className="mt-2 text-muted-foreground max-w-xl">Thành viên Pro có quyền phân tích CV không giới hạn, thực hành phỏng vấn dài hơn, lưu trữ lịch sử phiên bản và chấm điểm chi tiết theo kỹ năng.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground rounded-xl h-12 px-7 font-semibold shadow-glow">
              <Link to="/pricing">Nâng cấp Pro</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl h-12 px-7 font-semibold border-2">
              <Link to="/pricing">Bắt đầu dùng thử</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}