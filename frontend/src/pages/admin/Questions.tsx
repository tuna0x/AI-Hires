import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Sparkles, AlertCircle, RefreshCw, 
  HelpCircle, BrainCircuit, 
  Zap, Gauge, MessageSquare, Save, Terminal,
  ChevronRight, Settings2, Play, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Questions() {
  const [easy, setEasy] = useState(2);
  const [med, setMed] = useState(4);
  const [hard, setHard] = useState(2);
  const [prompt, setPrompt] = useState(
    "Bạn là một chuyên gia tuyển dụng (Interviewer) AI kỳ cựu. Nhiệm vụ của bạn là chuẩn bị {count} câu hỏi phỏng vấn bằng Tiếng Việt dựa trên JD và CV của ứng viên.\n\n- Các câu hỏi nền tảng: Tập trung khai thác kỹ năng cốt lõi bám sát JD.\n- Các câu hỏi cá nhân hóa: Đào sâu vào các dự án và kinh nghiệm cụ thể trong CV.\n\nYêu cầu phản hồi dưới dạng mảng JSON chứa các object: question, cv_context, jd_context, can_reuse."
  );
  
  const [testResult, setTestResult] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestGeneration = () => {
    setIsTesting(true);
    setTimeout(() => {
      setTestResult([
        { id: 1, text: "Hãy giải thích sự khác biệt giữa @Component, @Service và @Repository trong Spring Boot?", skill: "Spring Boot", level: "Trung bình", hint: "Tập trung vào cơ chế Component Scanning và semantic meaning của từng annotation." },
        { id: 2, text: "Cơ chế hoạt động của RabbitMQ và cách bạn xử lý khi tin nhắn bị lỗi (dead-letter-queue) là gì?", skill: "RabbitMQ", level: "Khó", hint: "Đề cập đến exchange types, bindings và chính sách retry/DLQ." },
        { id: 3, text: "Bạn hiểu như thế nào về Virtual DOM trong React và tại sao nó lại giúp tăng hiệu suất?", skill: "React", level: "Trung bình", hint: "Giải thích quá trình diffing algorithm và reconciliation." },
      ]);
      setIsTesting(false);
      toast.success("Mô phỏng sinh câu hỏi thành công!");
    }, 1500);
  };

  const totalQuestions = easy + med + hard;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-12 w-1.5 bg-primary rounded-full" />
             <h2 className="text-3xl font-black text-foreground tracking-tight">AI Question Lab</h2>
          </div>
          <p className="text-muted-foreground text-sm font-medium ml-4">Điều chỉnh thuật toán và logic sinh câu hỏi phỏng vấn của Gemini Engine</p>
        </div>

        <div className="flex items-center gap-3 bg-card border border-border/60 p-1.5 rounded-2xl shadow-soft">
           <div className="flex items-center gap-3 px-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phân bổ:</span>
              <div className="flex gap-1.5">
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[11px]">{easy}E</Badge>
                <Badge className="bg-blue-500/10 text-blue-500 border-none font-bold text-[11px]">{med}M</Badge>
                <Badge className="bg-amber-500/10 text-amber-500 border-none font-bold text-[11px]">{hard}H</Badge>
              </div>
           </div>
           <Button 
            onClick={() => toast.success("Đã lưu cấu hình")}
            className="rounded-xl px-6 bg-primary hover:bg-primary-dark text-primary-foreground font-bold shadow-glow shadow-primary/20"
           >
             Lưu cấu hình
           </Button>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid lg:grid-cols-[320px_1fr] gap-8">
        
        {/* Left: Configuration Panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-[2rem] bg-card border border-border/60 shadow-card space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                <Settings2 className="h-4 w-4 text-primary" /> Tham số độ khó
              </div>
              
              <div className="space-y-5">
                {[
                  { label: "Cơ bản (Easy)", val: easy, set: setEasy, color: "bg-emerald-500", icon: Zap },
                  { label: "Nâng cao (Medium)", val: med, set: setMed, color: "bg-blue-500", icon: Gauge },
                  { label: "Chuyên sâu (Hard)", val: hard, set: setHard, color: "bg-amber-500", icon: Sparkles }
                ].map((item) => (
                  <div key={item.label} className="space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{item.label}</span>
                      <span className="text-foreground text-sm">{item.val} items</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Button 
                        variant="ghost" 
                        className="h-8 w-8 rounded-lg bg-background p-0 border border-border/50 hover:bg-accent"
                        onClick={() => item.set(Math.max(0, item.val - 1))}
                       >
                         -
                       </Button>
                       <div className="flex-1 h-2 bg-background border border-border/50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.val / 10) * 100}%` }}
                            className={cn("h-full", item.color)} 
                          />
                       </div>
                       <Button 
                        variant="ghost" 
                        className="h-8 w-8 rounded-lg bg-background p-0 border border-border/50 hover:bg-accent"
                        onClick={() => item.set(item.val + 1)}
                       >
                         +
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
               <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    Tổng số <strong>{totalQuestions} câu hỏi</strong> sẽ được sinh ra dựa trên JD và CV đã chọn.
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Prompt Editor & Preview */}
        <div className="space-y-6">
          
          <div className="rounded-[2.5rem] bg-card border border-border/60 shadow-elegant overflow-hidden flex flex-col">
            <div className="px-8 py-5 border-b border-border/40 bg-background/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-xs font-black text-foreground uppercase tracking-widest">System Instruction</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold border-border bg-background">Gemini 1.5 Pro</Badge>
            </div>

            <div className="p-1">
              <Textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[300px] w-full p-8 bg-transparent border-none focus-visible:ring-0 font-mono text-sm leading-relaxed resize-none text-foreground/90 placeholder:text-muted-foreground/30"
                placeholder="Nhập System Prompt tại đây..."
              />
            </div>

            <div className="px-8 py-4 bg-background/20 border-t border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Dynamic Var:</span>
                <code className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded select-all tracking-tighter font-black">{`{count}`}</code>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className={cn(
                  "rounded-full px-6 flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5 transition-all text-[11px] font-black uppercase tracking-widest",
                  isTesting && "animate-pulse"
                )}
                onClick={handleTestGeneration}
                disabled={isTesting}
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {isTesting ? "Generating..." : "Simulate Gemini"}
              </Button>
            </div>
          </div>

          {/* Results Preview */}
          <AnimatePresence>
            {testResult.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 px-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Simulation Results</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {testResult.map((q, idx) => (
                    <motion.div 
                      key={q.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-6 rounded-[2rem] bg-card/60 backdrop-blur-sm border border-border/40 hover:border-primary/30 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase">
                          {q.skill}
                        </Badge>
                        <span className="text-[11px] font-black text-muted-foreground/30 italic">#{idx + 1}</span>
                      </div>
                      <p className="text-sm font-bold text-foreground leading-snug mb-6 line-clamp-3">
                        {q.text}
                      </p>
                      <div className="p-4 rounded-2xl bg-background/50 border border-border/30 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                          <MessageSquare className="h-3 w-3" /> Gợi ý trả lời
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed italic line-clamp-2">
                          {q.hint}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}