import { Link } from "react-router-dom";
import { Briefcase, Building2, Calendar, CheckCircle2, ChevronRight, Play, Eye, Sparkles, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Seo, breadcrumbLd } from "@/lib/seo";

// Mock data lịch sử ứng tuyển
const MOCK_APPLICATIONS = [
  {
    id: 1,
    jobId: 1,
    title: "Senior Java Spring Boot Engineer",
    company: "Viettel Group",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80",
    appliedAt: "2 ngày trước",
    cvName: "Nguyen_Van_An_Java_Developer_CV.pdf",
    matchScore: 95,
    status: "AI_INTERVIEWING", // Đang chờ phỏng vấn AI
    steps: [
      { name: "Đã nộp hồ sơ", date: "2 ngày trước", completed: true },
      { name: "Sàng lọc ATS (95%)", date: "2 ngày trước", completed: true },
      { name: "Phỏng vấn AI", date: "Đang diễn ra", completed: false, active: true },
      { name: "Kết quả cuối cùng", date: "Chưa bắt đầu", completed: false }
    ],
    sessionId: "session-123"
  },
  {
    id: 2,
    jobId: 2,
    title: "React Frontend Developer (Mid/Senior)",
    company: "VNG Corporation",
    logo: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=100&q=80",
    appliedAt: "1 tuần trước",
    cvName: "Nguyen_Van_An_Fullstack_Engineer.pdf",
    matchScore: 88,
    status: "COMPLETED", // Đã hoàn thành phỏng vấn AI, đang review
    steps: [
      { name: "Đã nộp hồ sơ", date: "1 tuần trước", completed: true },
      { name: "Sàng lọc ATS (88%)", date: "1 tuần trước", completed: true },
      { name: "Phỏng vấn AI (Đã nộp)", date: "5 ngày trước", completed: true },
      { name: "Đánh giá & Review", date: "Đang xử lý", completed: false, active: true }
    ],
    sessionId: "session-456"
  }
];

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Applications() {
  return (
    <>
      <Seo
        title="Lịch sử ứng tuyển — Intervio"
        description="Theo dõi trạng thái các hồ sơ ứng tuyển, kiểm tra lịch phỏng vấn AI và xem báo cáo kết quả đánh giá."
        path="/applications"
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Lịch sử ứng tuyển", path: "/applications" }])}
      />
      <div className="min-h-screen bg-[#0B0F19] text-foreground pb-24 overflow-hidden relative">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 blur-[100px] rounded-full -ml-32 -mb-32" />

        <div className="mx-auto max-w-6xl px-6 pt-16 relative z-10">
          
          <div className="mb-12 flex items-center gap-6">
             <div className="h-14 w-2 bg-primary rounded-full shadow-glow shadow-primary/20" />
             <div className="space-y-1">
               <h1 className="text-4xl font-black tracking-tighter text-white">Hành trình Sự nghiệp</h1>
               <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Theo dõi & Quản lý cơ hội tuyển dụng AI</p>
             </div>
          </div>

          {/* Grid thống kê nhanh */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              ["Đang ứng tuyển", "2 vị trí", "02", "primary"],
              ["Chờ Phỏng vấn AI", "1 vị trí", "01", "amber"],
              ["Đã hoàn thành", "1 vị trí", "01", "emerald"]
            ].map(([lbl, val, count, color]) => (
              <div key={lbl} className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8 flex items-center justify-between shadow-soft hover:bg-white/[0.07] transition-all group">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{lbl}</span>
                  <div className={cn(
                    "text-2xl font-black tracking-tight",
                    color === "primary" ? "text-white" : color === "amber" ? "text-amber-500" : "text-emerald-500"
                  )}>{val}</div>
                </div>
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg border transition-all group-hover:scale-110",
                  color === "primary" ? "bg-primary/10 text-primary border-primary/20 shadow-glow shadow-primary/10" : 
                  color === "amber" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                  "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>{count}</div>
              </div>
            ))}
          </div>

          {/* Danh sách ứng tuyển */}
          <div className="space-y-8">
            {MOCK_APPLICATIONS.map((app) => (
              <motion.div 
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[3rem] border border-white/5 bg-white/5 p-10 lg:p-12 shadow-elegant space-y-10 hover:border-white/10 transition-all relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-primary/30 to-accent/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Header thẻ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <img src={app.logo} alt={app.company} className="h-20 w-20 rounded-[2rem] object-cover border border-white/10 shadow-soft group-hover:scale-105 transition-transform" />
                      <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-[#151C30]">
                         <Building2 className="h-4 w-4 text-[#151C30]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="bg-white/10 text-white/60 hover:bg-white/20 border-0 rounded-lg font-black text-[9px] px-3 tracking-widest uppercase">{app.company}</Badge>
                        <span className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Nộp {app.appliedAt}</span>
                      </div>
                      <h2 className="text-2xl font-black text-white hover:text-primary transition-colors tracking-tight">
                        <Link to={`/jobs/${app.jobId}`} className="hover:underline">{app.title}</Link>
                      </h2>
                      <div className="flex items-center gap-3">
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-muted-foreground font-medium">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span className="font-bold text-white/80">{app.cvName}</span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 bg-white/[0.02] p-4 rounded-[2rem] border border-white/5">
                    <div className="px-6 border-r border-white/5">
                      <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-60">Sàng lọc ATS</div>
                      <div className="text-3xl font-black text-primary tracking-tighter">{app.matchScore}<span className="text-sm ml-1">%</span></div>
                    </div>
                    <div>
                      {app.status === "AI_INTERVIEWING" ? (
                        <Button asChild className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-2xl h-14 px-8 font-black text-xs shadow-glow shadow-primary/20 transition-all active:scale-95 group/btn">
                          <Link to="/interview" className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                               <Play className="h-4 w-4 fill-current" />
                            </div>
                            Bắt đầu phỏng vấn
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild variant="outline" className="rounded-2xl h-14 px-8 font-black text-xs border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95">
                          <Link to={`/interview/results/${app.sessionId}`} className="flex items-center gap-3">
                            <Eye className="h-5 w-5 opacity-60" /> Xem báo cáo
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline tiến trình */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Hành trình hồ sơ</h3>
                    <Badge variant="outline" className="text-[9px] font-black bg-primary/10 text-primary border-primary/20 rounded-full py-0.5 px-3">STEP BY STEP</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden sm:block absolute top-[18px] left-[40px] right-[40px] h-[2px] bg-white/5 z-0" />
                    
                    {app.steps.map((step, idx) => (
                      <div key={idx} className="relative flex flex-col items-center sm:items-start gap-4 z-10">
                        <div className="shrink-0 group/step relative">
                          {step.completed ? (
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-glow shadow-emerald-500/5 group-hover/step:scale-110 transition-transform">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          ) : step.active ? (
                            <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 animate-pulse-slow">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>
                          ) : (
                            <div className="h-9 w-9 rounded-xl bg-white/5 text-white/20 flex items-center justify-center border border-white/5">
                              <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="text-center sm:text-left space-y-1">
                          <h4 className={cn(
                            "text-[13px] font-black tracking-tight",
                            step.completed ? "text-white" : step.active ? "text-primary" : "text-white/30"
                          )}>
                            {step.name}
                          </h4>
                          <span className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-40">{step.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {MOCK_APPLICATIONS.length === 0 && (
             <div className="rounded-[3rem] border border-white/5 bg-white/5 p-20 text-center flex flex-col items-center gap-6 shadow-elegant">
                <div className="h-24 w-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center border border-white/5 shadow-soft mb-4">
                   <AlertCircle className="h-10 w-10 text-white/20" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-2xl font-black text-white italic tracking-tighter">Chưa có dấu chân nào...</h2>
                   <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[11px] opacity-60">Hãy bắt đầu hành trình của bạn ngay hôm nay</p>
                </div>
                <Button className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-2xl h-12 px-10 font-black text-xs shadow-glow shadow-primary/20 mt-4 transition-all active:scale-95">
                   Khám phá việc làm 🚀
                </Button>
             </div>
          )}
        </div>
      </div>
    </>
  );
}
