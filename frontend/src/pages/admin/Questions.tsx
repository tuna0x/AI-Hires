import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Sliders, AlertCircle, RefreshCw, CheckCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Questions() {
  const [easy, setEasy] = useState(2);
  const [med, setMed] = useState(4);
  const [hard, setHard] = useState(2);
  const [prompt, setPrompt] = useState(
    "Hãy sinh {count} câu hỏi phỏng vấn phù hợp với CV của ứng viên và bản mô tả công việc (JD) được cung cấp. Mỗi câu hỏi phải bao gồm: nội dung câu hỏi, nhãn kỹ năng, mức độ khó dễ, và gợi ý trả lời thích ứng theo ngữ cảnh để so khớp điểm."
  );
  
  const [testResult, setTestResult] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestGeneration = () => {
    setIsTesting(true);
    setTimeout(() => {
      setTestResult([
        { id: 1, text: "Hãy giải thích sự khác biệt giữa `@Component`, `@Service` và `@Repository` trong Spring Boot?", skill: "Spring Boot", level: "Trung bình" },
        { id: 2, text: "Cơ chế hoạt động của RabbitMQ và cách bạn xử lý khi tin nhắn bị lỗi (dead-letter-queue) là gì?", skill: "RabbitMQ", level: "Khó" },
      ]);
      setIsTesting(false);
      toast.success("Mô phỏng sinh câu hỏi thành công bằng Gemini!");
    }, 1200);
  };

  return (
    <div className="space-y-10 pb-10 max-w-5xl mx-auto">
      
      <div className="flex items-center gap-4 px-1">
        <div className="h-10 w-1.5 bg-primary rounded-full shadow-glow shadow-primary/20" />
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">Cấu hình câu hỏi AI</h2>
          <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">Tối ưu hóa Engine Gemini cho phỏng vấn</p>
        </div>
      </div>

      {/* Grid điều chỉnh số lượng câu hỏi */}
      <div className="grid sm:grid-cols-3 gap-6">
        {[
          ["Số câu hỏi Dễ", easy, setEasy, "bg-emerald-500/10 text-emerald-500"],
          ["Số câu hỏi Trung bình", med, setMed, "bg-blue-500/10 text-blue-500"],
          ["Số câu hỏi Khó", hard, setHard, "bg-amber-500/10 text-amber-500"]
        ].map(([lbl, val, set, badgeStyle]) => (
          <div key={lbl as string} className="rounded-[2.5rem] border border-white/5 p-8 bg-white/5 flex flex-col justify-between space-y-6 shadow-soft hover:border-white/20 transition-all group">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{lbl as string}</span>
              <Badge className={cn("border-0 rounded-lg px-2 py-0.5 text-[9px] font-black tracking-widest", badgeStyle as string)}>ACTIVE</Badge>
            </div>
            <div className="flex items-center justify-center gap-4">
               <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10" onClick={() => (set as any)(Math.max(0, (val as number) - 1))}>-</Button>
               <div className="text-4xl font-black tracking-tighter text-white w-12 text-center">{val as number}</div>
               <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10" onClick={() => (set as any)((val as number) + 1)}>+</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Cấu hình System Prompt */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Câu lệnh hệ thống (System Prompt của Gemini)</Label>
          <Badge className="bg-primary/20 text-primary border-primary/20 font-black text-[9px] px-3 py-1 rounded-lg tracking-widest">
            <Sparkles className="h-3 w-3 mr-1.5 animate-pulse" /> DYNAMIC AI ENGINE
          </Badge>
        </div>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Textarea 
            rows={6} 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            className="rounded-[2rem] border border-white/10 bg-white/5 font-mono text-[13px] leading-relaxed p-8 relative z-10 focus-visible:ring-primary/20 transition-all shadow-elegant" 
          />
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 w-fit">
          <AlertCircle className="h-4 w-4 text-primary" />
          <p className="text-[11px] text-muted-foreground font-medium italic">Sử dụng biến <span className="text-primary font-bold">{`{count}`}</span> để hệ thống truyền số lượng câu hỏi động.</p>
        </div>
      </div>

      {/* Button Save */}
      <div className="flex gap-4 pt-6 border-t border-white/5">
        <Button onClick={() => toast.success("Đã lưu cấu hình sinh câu hỏi AI")} className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-[1.25rem] font-black text-xs h-14 px-10 shadow-glow shadow-primary/20 transition-all active:scale-95 flex items-center gap-3">
          <CheckCircle className="h-5 w-5" /> Lưu cấu hình Engine
        </Button>
        <Button onClick={handleTestGeneration} disabled={isTesting} variant="outline" className="rounded-[1.25rem] bg-white/5 border-white/10 text-white font-bold text-xs h-14 px-8 hover:bg-white/10 active:scale-95 transition-all flex items-center gap-3">
          <RefreshCw className={cn("h-4 w-4", isTesting && "animate-spin")} /> {isTesting ? "Đang xử lý..." : "Mô phỏng Gemini"}
        </Button>
      </div>

      {/* Kết quả mô phỏng */}
      <AnimatePresence>
        {testResult.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-white/10 p-10 rounded-[3rem] bg-white/[0.02] space-y-8 shadow-elegant overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent opacity-30" />
            <h4 className="text-[12px] font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              Phản hồi từ Gemini API (Live Simulation)
            </h4>
            <div className="grid gap-4">
              {testResult.map((q) => (
                <div key={q.id} className="p-6 bg-white/5 rounded-[1.5rem] border border-white/5 space-y-4 hover:border-white/10 transition-all shadow-soft group">
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="bg-white/10 text-white/70 rounded-lg py-1 px-3 text-[10px] font-black tracking-widest">{q.skill}</Badge>
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em]">{q.level}</span>
                  </div>
                  <p className="font-bold text-[15px] text-white/90 leading-snug group-hover:text-primary transition-colors pr-10">{q.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}