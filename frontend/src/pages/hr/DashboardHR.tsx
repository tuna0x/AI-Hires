import { Link } from "react-router-dom";
import { 
  Users, FileSpreadsheet, Briefcase, Sparkles, TrendingUp, 
  ArrowRight, UserCheck, Star, ChevronRight, 
  Zap, Clock, Target, ArrowUpRight, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const RECENT_APPLICANTS = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    jobTitle: "Senior Java Spring Boot Engineer",
    appliedAt: "1 ngày trước",
    atsScore: 95,
    status: "Chờ Phỏng vấn AI",
  },
  {
    id: 2,
    name: "Trần Thị Thanh",
    jobTitle: "React Frontend Developer",
    appliedAt: "2 ngày trước",
    atsScore: 88,
    status: "Đang chấm điểm",
  },
  {
    id: 3,
    name: "Phạm Hoàng Minh",
    jobTitle: "AI Engineer (Python)",
    appliedAt: "3 ngày trước",
    atsScore: 98,
    status: "Đã mời phỏng vấn",
  }
];

const PIPELINE_STAGES = [
  { label: "Mới ứng tuyển", count: 12, color: "bg-blue-500" },
  { label: "Sàng lọc AI", count: 8, color: "bg-primary" },
  { label: "Phỏng vấn AI", count: 5, color: "bg-indigo-500" },
  { label: "Gặp mặt", count: 3, color: "bg-orange-500" },
  { label: "Offer", count: 2, color: "bg-emerald-500" }
];

export default function DashboardHR() {
  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      
      {/* SECTION: PIPELINE FUNNEL - Isolated Style */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="h-4 w-1.5 bg-primary rounded-full" />
             <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">Phễu Tuyển Dụng</h3>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest px-3 py-1">Live Monitor</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map((stage, idx) => (
            <div key={idx} className="relative group">
              <div className="h-32 rounded-[2rem] bg-card border border-border/80 shadow-soft flex flex-col items-center justify-center space-y-2 text-center transition-all duration-300 hover:border-primary/40 hover:shadow-card group overflow-hidden">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{stage.label}</div>
                <div className="text-4xl font-black text-foreground tracking-tighter">{stage.count}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION: METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-card border border-border/80 shadow-card flex flex-col justify-between group">
           <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shadow-soft">
                <TrendingUp className="h-5 w-5" />
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black uppercase tracking-widest">+12%</Badge>
           </div>
           <div className="mt-8 space-y-1">
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Hiệu suất tin đăng</div>
              <div className="text-4xl font-black text-foreground tracking-tighter">1.2k views</div>
           </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-card border border-border/80 shadow-card flex flex-col justify-between group">
           <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shadow-soft">
                <Target className="h-5 w-5" />
              </div>
              <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Precision
              </div>
           </div>
           <div className="mt-8 space-y-1">
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Độ chính xác AI (ATS)</div>
              <div className="text-4xl font-black text-foreground tracking-tighter">94% pts</div>
           </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-600/20 shadow-soft flex flex-col justify-between group">
           <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-500 shadow-soft">
                <Briefcase className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-indigo-400 opacity-40 group-hover:opacity-100 transition-opacity" />
           </div>
           <div className="mt-8 space-y-1">
              <div className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">Chiến dịch mở</div>
              <div className="text-4xl font-black text-foreground tracking-tighter">04 jobs</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-12">
        
        {/* SECTION: CANDIDATE LIST - Isolated Cards */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
               <div className="h-4 w-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
               <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">Ứng viên mới nộp</h3>
            </div>
            <Button asChild variant="link" className="text-[10px] text-primary font-black uppercase tracking-[0.2em] hover:no-underline">
              <Link to="/admin/hr/applicants" className="flex items-center gap-2 group/link">
                Tổ hợp hồ sơ <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-all" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {RECENT_APPLICANTS.map((app) => (
              <div key={app.id} className="p-6 md:px-10 rounded-[2.5rem] bg-card border border-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-primary/40 transition-all duration-300">
                <div className="flex items-center gap-8">
                  <div className="h-14 w-14 rounded-2xl bg-background border border-border flex items-center justify-center font-black text-xl text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-500">
                    {app.name.charAt(0)}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[16px] font-black text-foreground tracking-tight leading-none">{app.name}</h4>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-80">
                      <span className="truncate max-w-[180px]">{app.jobTitle}</span>
                      <div className="h-1 w-1 rounded-full bg-border" />
                      <span className="flex items-center gap-2"><Clock className="h-3 w-3 text-primary" /> {app.appliedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-12 border-t md:border-none pt-4 md:pt-0">
                  <div className="flex flex-col items-end">
                     <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1.5 opacity-60">AI Relevance</span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-primary tracking-tighter leading-none">{app.atsScore}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">%</span>
                     </div>
                  </div>
                  <Button 
                    asChild 
                    className="rounded-xl h-11 px-8 bg-primary hover:bg-primary-dark text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] shadow-glow shadow-primary/20 transition-all active:scale-95"
                  >
                    <Link to="/admin/hr/applicants">Chi tiết</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: AI INTELLIGENCE */}
        <aside className="space-y-6">
          <div className="flex items-center gap-3 px-2">
             <div className="h-4 w-1.5 bg-amber-500 rounded-full" />
             <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">Hệ thống gợi ý</h3>
          </div>

          <div className="rounded-[3rem] bg-card border border-border p-10 shadow-card space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-48 w-48 bg-primary/5 blur-[80px] pointer-events-none group-hover:bg-primary/10 transition-colors" />
            
            <div className="flex items-center gap-5 relative z-10">
               <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-soft">
                  <Sparkles className="h-5 w-5" />
               </div>
               <div>
                  <h4 className="text-base font-black text-foreground tracking-tight leading-none">Insight bởi Gemini</h4>
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary px-2 py-0.5 mt-2">Verified</Badge>
               </div>
            </div>

            <div className="space-y-8 relative z-10">
               <div className="p-6 rounded-3xl bg-background border border-border/80 shadow-soft space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                     <Zap className="h-4 w-4" /> Priority Match
                  </div>
                  <p className="text-[13px] text-foreground font-bold leading-snug">
                     Ứng viên <span className="text-primary tracking-tight">Nguyễn Văn An</span> đạt điểm số tuyệt đối.
                  </p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">
                     Phù hợp 95% với yêu cầu hệ thống Microservices & Spring Boot.
                  </p>
               </div>

               <div className="space-y-4 px-2">
                  <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Chi tiết kỹ năng chuyên môn</div>
                  {[
                    "Microservices / Spring Boot",
                    "Định dạng CV chuẩn ATS",
                    "Kinh nghiệm lead dự án"
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-4 group/item">
                       <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                       <span className="text-[12px] font-bold text-foreground/80">{p}</span>
                    </div>
                  ))}
               </div>

               <Button className="w-full bg-primary hover:bg-primary-dark text-primary-foreground rounded-2xl h-14 font-black text-[11px] uppercase tracking-[0.2em] shadow-glow shadow-primary/30 transition-all active:scale-[0.98]">
                  Gửi thư mời phỏng vấn
               </Button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
