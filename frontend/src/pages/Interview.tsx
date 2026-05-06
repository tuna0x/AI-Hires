import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Mic, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { toast } from "sonner";

type Q = {
  id: number;
  text: string;
  skill: string;
  difficulty: "Easy" | "Medium" | "Hard";
  followUp: string;
  explanation: string;
};

const BANK: Q[] = [
  { id: 1, text: "Hãy chia sẻ về một dự án trong CV mà bạn cảm thấy tự hào nhất và lý do tại sao.", skill: "Giao tiếp", difficulty: "Easy", followUp: "Cụ thể bạn sẽ làm gì khác đi nếu được bắt đầu lại dự án đó từ đầu?", explanation: "Nhà tuyển dụng muốn nghe một câu chuyện mạch lạc theo mô hình STAR: Bối cảnh → Hành động của bạn → Kết quả đo lường được." },
  { id: 2, text: "Hãy mô tả lại một lần bạn phải đưa ra quyết định kỹ thuật quan trọng trong tình huống có nhiều yếu tố chưa rõ ràng. Bạn đã giải quyết thế nào?", skill: "Ra quyết định", difficulty: "Medium", followUp: "Nếu có thêm thông tin, điều gì có thể làm thay đổi quyết định đó của bạn?", explanation: "Sử dụng cấu trúc STAR. Hãy nêu bật các phương án đánh đổi (trade-offs) mà bạn đã cân nhắc và lý do tại sao chọn giải pháp đó." },
  { id: 3, text: "Bạn sẽ thiết kế hệ thống như thế nào để đáp ứng 1 triệu người dùng hoạt động đồng thời cho sản phẩm được đề cập trong CV của bạn?", skill: "Thiết kế hệ thống", difficulty: "Hard", followUp: "Điểm nghẽn nào sẽ bị quá tải đầu tiên trong thiết kế của bạn khi quy mô tăng gấp 10 lần?", explanation: "Hãy bao quát các khía cạnh về cân bằng tải (load balancing), lưu bộ nhớ đệm (caching), xử lý bất đồng bộ (async), phân mảnh dữ liệu và giám sát hệ thống." },
  { id: 4, text: "Kể về một lần bạn xảy ra bất đồng ý kiến hoặc xung đột với đồng nghiệp và cách bạn đã giải quyết nó.", skill: "Hợp tác", difficulty: "Medium", followUp: "Mối quan hệ công việc lâu dài giữa hai bạn sau sự việc đó tiến triển thế nào?", explanation: "Hãy thể hiện sự lắng nghe và thấu hiểu (empathy) trước, sau đó là giải pháp giải quyết khách quan hướng tới mục tiêu chung." },
  { id: 5, text: "Điểm yếu lớn nhất của bạn là gì, và bạn đang làm gì để khắc phục nó?", skill: "Tự nhận thức", difficulty: "Easy", followUp: "Hãy đưa ra một ví dụ cụ thể về nỗ lực cải thiện này trong vòng 3 tháng qua.", explanation: "Chọn một điểm yếu công việc thực tế (tránh câu trả lời sáo rỗng như 'quá ham việc'), đi kèm kế hoạch và hành động cải thiện cụ thể đang thực hiện." },
];

export default function Interview() {
  const [setupDone, setSetupDone] = useState(false);
  const [jd, setJd] = useState("");
  const [role, setRole] = useState("");
  const [idx, setIdx] = useState(0);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const questions = useMemo(() => BANK, []);
  const q = questions[idx];
  const progress = ((idx + (answers[q?.id] ? 1 : 0)) / questions.length) * 100;

  const next = () => {
    setShowFollowUp(false);
    setShowExplain(false);
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <SiteLayout>
      <Seo
        title="Luyện phỏng vấn — Mock Interview AI có cấu trúc"
        description="Luyện phỏng vấn mô phỏng AI có cấu trúc, được cá nhân hóa theo CV và vị trí ứng tuyển của bạn."
        path="/interview"
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Luyện phỏng vấn", path: "/interview" }])}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {!setupDone ? (
          <Setup onStart={(r, j) => { setRole(r); setJd(j); setSetupDone(true); }} />
        ) : done ? (
          <Summary answers={answers} questions={questions} onRestart={() => { setIdx(0); setAnswers({}); setDone(false); }} />
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            <motion.section key={q.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl border border-border/60 p-8 lg:p-10 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Câu {idx + 1} / {questions.length}</div>
                <div className="text-xs text-muted-foreground">{Math.round(progress)}% hoàn tất</div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-8"><div className="h-full bg-gradient-primary transition-all" style={{ width: `${progress}%` }} /></div>

              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight leading-tight">{q.text}</h2>
              <AnimatePresence>
                {showFollowUp && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 rounded-xl bg-primary-light border border-primary/20 p-4 text-sm">
                    <span className="font-semibold text-primary">Câu hỏi phụ:</span> {q.followUp}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-7">
                <Label htmlFor="answer" className="text-sm font-semibold">Câu trả lời của bạn</Label>
                <Textarea
                  id="answer"
                  rows={9}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Sử dụng cấu trúc STAR (Tình huống – Nhiệm vụ – Hành động – Kết quả)..."
                  className="mt-2 text-base leading-relaxed"
                />
                <div className="mt-2 text-xs text-muted-foreground">{(answers[q.id] ?? "").length} ký tự · nên viết 600–1200 cho vị trí senior</div>
              </div>

              <AnimatePresence>
                {showExplain && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 rounded-xl bg-secondary border border-border/60 p-4 text-sm">
                    <div className="flex items-center gap-2 font-semibold mb-1"><Lightbulb className="h-4 w-4 text-warning" /> Tiêu chuẩn trả lời xuất sắc</div>
                    <p className="text-secondary-foreground/90">{q.explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-7 flex flex-wrap gap-3 justify-between">
                <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(Math.max(0, idx - 1))} className="rounded-xl border-2"><ArrowLeft className="mr-2 h-4 w-4" /> Câu trước</Button>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-xl border-2" onClick={() => setShowExplain((v) => !v)}><Lightbulb className="mr-2 h-4 w-4" /> {showExplain ? "Ẩn" : "Hiện"} gợi ý</Button>
                  <Button variant="outline" className="rounded-xl border-2" onClick={() => { setShowFollowUp(true); toast.success("Đã tạo câu hỏi phụ dựa trên câu trả lời"); }}><RefreshCw className="mr-2 h-4 w-4" /> Câu hỏi phụ</Button>
                  <Button onClick={next} className="bg-gradient-primary text-primary-foreground rounded-xl">{idx + 1 === questions.length ? "Hoàn thành" : "Câu tiếp"} <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </div>
            </motion.section>

            <aside className="space-y-4">
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Câu hỏi này</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Kỹ năng</span><Badge className="bg-primary/15 text-primary hover:bg-primary/15">{q.skill}</Badge></div>
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Độ khó</span><Badge variant="outline" className={q.difficulty === "Hard" ? "border-destructive/40 text-destructive" : q.difficulty === "Medium" ? "border-warning/40 text-warning" : "border-primary/40 text-primary"}>{q.difficulty === "Hard" ? "Khó" : q.difficulty === "Medium" ? "Trung bình" : "Dễ"}</Badge></div>
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Phiên</div>
                {role && <p className="text-sm"><span className="text-muted-foreground">Vị trí:</span> <span className="font-semibold text-foreground">{role}</span></p>}
                <p className="text-xs text-muted-foreground mt-2">Câu hỏi được sinh từ CV của bạn{jd ? " và mô tả công việc bạn đã dán" : ""}.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function Setup({ onStart }: { onStart: (role: string, jd: string) => void }) {
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary mb-3"><Sparkles className="h-3.5 w-3.5" /> Bước 2 — Luyện tập</span>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Thiết lập phiên phỏng vấn</h1>
        <p className="mt-3 text-muted-foreground">Chúng tôi sẽ sinh bộ câu hỏi có cấu trúc, phù hợp với CV và vị trí của bạn.</p>
      </div>
      <div className="mt-8 bg-card rounded-3xl border border-border/60 p-8 shadow-card space-y-5">
        <div>
          <Label htmlFor="role">Vị trí mục tiêu</Label>
          <Input id="role" placeholder="VD: Senior Frontend Engineer" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="jd">Mô tả công việc (không bắt buộc)</Label>
          <Textarea id="jd" rows={6} placeholder="Dán JD để cá nhân hóa câu hỏi..." value={jd} onChange={(e) => setJd(e.target.value)} className="mt-1.5" />
          <p className="mt-1 text-xs text-muted-foreground">Bỏ qua nếu chỉ muốn câu hỏi dựa trên CV.</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-end">
          <Button asChild variant="outline" className="rounded-xl border-2"><Link to="/cv-analysis">Tải CV trước</Link></Button>
          <Button onClick={() => onStart(role || "Vị trí chung", jd)} className="bg-gradient-primary text-primary-foreground rounded-xl"><Mic className="mr-2 h-4 w-4" /> Bắt đầu phỏng vấn</Button>
        </div>
      </div>
    </div>
  );
}

function Summary({ answers, questions, onRestart }: { answers: Record<number, string>; questions: Q[]; onRestart: () => void }) {
  const answered = Object.values(answers).filter(Boolean).length;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow mb-4"><Trophy className="h-7 w-7" /></div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Hoàn thành phiên phỏng vấn</h1>
        <p className="mt-2 text-muted-foreground">Bạn đã trả lời {answered}/{questions.length} câu. Đây là tổng quan theo từng kỹ năng.</p>
      </div>
      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        {questions.map((q) => {
          const a = answers[q.id] ?? "";
          const score = Math.min(100, 40 + Math.floor(a.length / 12));
          return (
            <div key={q.id} className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">{q.skill}</Badge>
                <span className="text-sm font-bold text-primary">{a ? score : 0}/100</span>
              </div>
              <p className="text-sm font-medium line-clamp-2 text-foreground">{q.text}</p>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-primary" style={{ width: `${a ? score : 0}%` }} /></div>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> {a ? `${a.length} ký tự` : "Bỏ qua"}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex justify-center gap-3 flex-wrap">
        <Button onClick={onRestart} variant="outline" className="rounded-xl border-2"><RefreshCw className="mr-2 h-4 w-4" /> Luyện lại</Button>
        <Button asChild className="bg-gradient-primary text-primary-foreground rounded-xl"><Link to="/dashboard">Về tổng quan</Link></Button>
      </div>
    </div>
  );
}