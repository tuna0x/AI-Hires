import { Link } from "react-router-dom";
import { Users, FileSpreadsheet, Briefcase, Sparkles, TrendingUp, ArrowRight, UserCheck, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock dữ liệu ứng viên mới nhất ứng tuyển
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
    status: "Đã hoàn thành AI, Đang chấm",
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
  { label: "Offer", count: 2, color: "bg-green-500" }
];

export default function DashboardHR() {
  return (
    <div className="space-y-10 pb-10">
      
      {/* Recruitment Pipeline (LinkedIn Style) */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
            <div className="h-6 w-1 bg-primary rounded-full" />
            Phễu tuyển dụng (Pipeline)
          </h3>
          <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 rounded-lg px-3 py-1 font-bold">
            Live Updates
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map((stage, idx) => (
            <div key={idx} className="relative p-6 rounded-[2rem] border border-white/5 bg-white/5 hover:border-primary/30 transition-all group overflow-hidden shadow-soft">
               <div className={cn("absolute top-0 right-0 h-1 w-full opacity-50", stage.color)} />
               <div className="space-y-2 relative z-10">
                 <div className="text-3xl font-black tracking-tight">{stage.count}</div>
                 <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stage.label}</div>
               </div>
               <ChevronRight className="absolute bottom-6 right-6 h-4 w-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </section>

      {/* Grid thống kê tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8 flex flex-col justify-between h-48 relative group overflow-hidden shadow-soft">
          <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Hiệu suất tin đăng</span>
            <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-5xl font-black tracking-tight">1.2k</h3>
            <p className="text-[11px] text-muted-foreground mt-2 font-medium">Lượt xem ứng viên tiềm năng trong tuần</p>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8 flex flex-col justify-between h-48 relative group overflow-hidden shadow-soft">
          <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Độ chính xác AI (ATS)</span>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Star className="h-5 w-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-5xl font-black tracking-tight">94%</h3>
            <span className="text-[11px] text-emerald-500 font-bold flex items-center gap-1.5 mt-2 bg-emerald-500/10 w-fit px-3 py-1 rounded-lg">
              <UserCheck className="h-3.5 w-3.5" /> Tiết kiệm 45h/tuần
            </span>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8 flex flex-col justify-between h-48 relative group overflow-hidden shadow-soft">
          <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Chiến dịch mở</span>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-5xl font-black tracking-tight">04</h3>
            <Button asChild variant="link" className="p-0 h-auto text-[11px] text-primary font-bold hover:no-underline mt-2">
              <Link to="/admin/hr/jobs" className="flex items-center gap-2 group/link">
                Quản lý tin đăng 
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Danh sách hồ sơ mới nộp */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
              <div className="h-6 w-1 bg-primary rounded-full" />
              Ứng viên mới nộp
            </h3>
            <Button asChild variant="ghost" className="text-xs text-primary hover:bg-primary/5 font-bold rounded-xl px-4 h-10">
              <Link to="/admin/hr/applicants" className="flex items-center gap-2">
                Xem tất cả <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4">
            {RECENT_APPLICANTS.map((app) => (
              <div key={app.id} className="p-6 rounded-[2.5rem] border border-white/5 bg-white/5 hover:border-primary/30 transition-all flex items-center justify-between gap-4 group shadow-soft">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center font-black text-xl text-primary border border-white/10 group-hover:scale-105 transition-transform shadow-glow shadow-primary/5">
                    {app.name.charAt(0)}
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors">{app.name}</h4>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <span className="truncate max-w-[200px]">{app.jobTitle}</span>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span>{app.appliedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right space-y-1">
                    <div className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.2em]">AI Match Score</div>
                    <div className="text-2xl font-black text-primary tracking-tight">{app.atsScore}%</div>
                  </div>
                  <Button asChild variant="outline" className="rounded-xl h-12 border-white/10 bg-white/5 hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-bold px-6 hidden md:flex transition-all">
                    <Link to="/admin/hr/applicants">Chi tiết hồ sơ</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột phải: AI Insights */}
        <div className="lg:col-span-1">
          <div className="rounded-[3rem] border border-white/10 bg-white/5 p-10 space-y-8 relative overflow-hidden glass shadow-elegant">
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-[50px] pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-accent/10 blur-[50px] pointer-events-none" />
            
            <h3 className="text-lg font-black flex items-center gap-3 border-b border-white/5 pb-6 text-white tracking-tight">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
              Đề xuất bởi Gemini
            </h3>

            <div className="space-y-8 relative z-10">
              <div className="flex items-start gap-5">
                <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-glow shadow-primary/20">
                   <UserCheck className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-[15px] font-bold text-white leading-snug">Thỏa thuận phỏng vấn cho ứng viên #952</h4>
                  <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">
                    Dựa trên Match Score 95%, <span className="text-primary font-bold">Nguyễn Văn An</span> nên được ưu tiên phỏng vấn vào khung giờ 14:00 - 15:00 sáng mai.
                  </p>
                </div>
              </div>
              
              <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                 <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Key Match Points:</div>
                 <ul className="text-[11px] space-y-3 font-medium text-white/70">
                    <li className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> 
                      Kinh nghiệm Microservices chuẩn
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> 
                      Kỹ năng Java Core vững chắc
                    </li>
                 </ul>
              </div>
              
              <Button asChild className="w-full bg-primary hover:bg-primary-dark text-primary-foreground rounded-2xl text-xs font-black h-14 shadow-glow shadow-primary/20 transition-all active:scale-[0.98]">
                <Link to="/admin/hr/applicants">Gửi thư mời tự động</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
