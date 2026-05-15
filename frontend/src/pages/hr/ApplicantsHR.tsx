import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, FileText, CheckCircle2, Clock, Play, Sparkles, Filter, 
  ShieldCheck, Mail, ArrowUpRight, Search, ListFilter, 
  LayoutGrid, MoreHorizontal, CheckCircle, XCircle, AlertCircle, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock dữ liệu danh sách ứng viên ứng tuyển chi tiết
const INITIAL_APPLICANTS = [
  {
    id: 1,
    name: "Nguyễn Văn An",
    jobTitle: "Senior Java Spring Boot Engineer",
    cvName: "Nguyen_Van_An_Java_Developer_CV.pdf",
    appliedAt: "1 ngày trước",
    atsScore: 95,
    status: "SCREENED",
    matchDetails: "95% match with Java, Spring Boot, Microservices",
    matchedSkills: ["Java", "Spring Boot", "MySQL", "RabbitMQ", "Docker"],
    missingSkills: [],
  },
  {
    id: 2,
    name: "Trần Thị Thanh",
    jobTitle: "React Frontend Developer (Mid/Senior)",
    cvName: "Tran_Thanh_React_Dev_CV.pdf",
    appliedAt: "2 ngày trước",
    atsScore: 88,
    status: "INTERVIEWED",
    matchDetails: "88% match, needs Redux experience",
    matchedSkills: ["React", "TypeScript", "Tailwind CSS", "Vite"],
    missingSkills: ["Redux"],
    sessionId: "session-456"
  },
  {
    id: 3,
    name: "Phạm Hoàng Minh",
    jobTitle: "AI Engineer (Python / LLM & NLP)",
    cvName: "Pham_Minh_CV_AI.pdf",
    appliedAt: "3 ngày trước",
    atsScore: 98,
    status: "SCREENED",
    matchDetails: "Top Talent! 98% match in NLP/LLM",
    matchedSkills: ["Python", "Gemini API", "NLP", "LLM", "Vector DB"],
    missingSkills: ["PyTorch"],
  },
  {
    id: 4,
    name: "Lê Minh Tuấn",
    jobTitle: "Senior Java Spring Boot Engineer",
    cvName: "Le_Tuan_Java_CV.pdf",
    appliedAt: "5 ngày trước",
    atsScore: 68,
    status: "REJECTED",
    matchDetails: "68% match, missing core skills",
    matchedSkills: ["Java", "MySQL"],
    missingSkills: ["Spring Boot", "RabbitMQ", "Docker"],
  }
];

export default function ApplicantsHR() {
  const [applicants, setApplicants] = useState(INITIAL_APPLICANTS);
  const [activeApplicant, setActiveApplicant] = useState<any>(INITIAL_APPLICANTS[0]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const handleInviteInterview = (id: number) => {
    toast.success("Đã gửi email mời ứng viên thực hiện phỏng vấn AI thành công!");
  };

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(search.toLowerCase()) || app.jobTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-10">
      
      {/* Top Status Pipeline Selector - Standardized Natural Tabs */}
      <div className="flex border-b border-border/50 pb-px -mx-2 mb-2 overflow-x-auto no-scrollbar">
        {[
          { label: "Tất cả ứng viên", value: "ALL", icon: ListFilter },
          { label: "Sàng lọc AI", value: "SCREENED", icon: Sparkles },
          { label: "Đã phỏng vấn", value: "INTERVIEWED", icon: CheckCircle },
          { label: "Từ chối", value: "REJECTED", icon: XCircle },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={cn(
              "px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 relative whitespace-nowrap",
              filterStatus === tab.value 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className={cn("h-4 w-4 transition-transform", filterStatus === tab.value && "scale-110")} />
            {tab.label}
            {filterStatus === tab.value && (
              <motion.div layoutId="activeTabHr" className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full shadow-glow shadow-primary/20" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Applicants List - Clean Isolated Item Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, vị trí..." 
              className="pl-12 rounded-[1.25rem] border-border/80 bg-card h-14 focus-visible:ring-primary/20 placeholder:text-muted-foreground/50 font-semibold text-sm"
            />
          </div>

          <div className="space-y-4 custom-scrollbar lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-3">
            <AnimatePresence mode="popLayout">
              {filteredApplicants.map((app) => (
                <motion.button 
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={app.id}
                  onClick={() => setActiveApplicant(app)}
                  className={cn(
                    "w-full text-left p-6 rounded-[2rem] border transition-all relative group shadow-soft overflow-hidden",
                    activeApplicant?.id === app.id 
                      ? "bg-primary/[0.03] border-primary/40 shadow-glow shadow-primary/5" 
                      : "bg-card border-border/80 hover:border-primary/20"
                  )}
                >
                  {activeApplicant?.id === app.id && (
                    <div className="absolute top-0 left-0 h-full w-1 bg-primary" />
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <h4 className="text-[16px] font-black text-foreground group-hover:text-primary transition-colors leading-tight tracking-tight">{app.name}</h4>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3 text-primary/60" />
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none truncate max-w-[140px]">{app.jobTitle}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      app.atsScore >= 90 ? "bg-primary shadow-glow shadow-primary/40" : app.atsScore >= 80 ? "bg-emerald-500/60" : "bg-yellow-500/60"
                    )} />
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[9px] font-black px-2 py-0 border-border/60 uppercase">CV</Badge>
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{app.appliedAt}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-lg">
                      <span className="text-[13px] font-black text-primary tracking-tighter">{app.atsScore}%</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-2 space-y-6 min-h-[600px]">
          {activeApplicant ? (
            <motion.div 
              key={activeApplicant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
               {/* Candidate Summary Header - Natural Profile Aesthetic */}
               <div className="bg-card border border-border/80 rounded-[3rem] p-10 space-y-10 shadow-soft relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-64 w-64 bg-primary/[0.03] blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-[2.25rem] bg-gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-black shadow-glow shadow-primary/20 transition-transform hover:scale-105 duration-300">
                        {activeApplicant.name.charAt(0)}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-black text-foreground tracking-tighter">{activeApplicant.name}</h2>
                          {activeApplicant.atsScore >= 95 && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg font-black text-[9px] uppercase tracking-widest px-3 py-1">Top Talent</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2 px-3 py-1 bg-accent/30 rounded-lg border border-border/40 text-[11px] text-foreground/80 font-bold uppercase tracking-wider">
                              <Briefcase className="h-3.5 w-3.5 text-primary" /> {activeApplicant.jobTitle}
                           </div>
                           <div className={cn(
                             "flex items-center gap-2 px-3 py-1 rounded-lg border text-[11px] font-black uppercase tracking-widest",
                             activeApplicant.status === "SCREENED" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                           )}>
                             {activeApplicant.status === "SCREENED" ? "Đã sàng lọc" : "Đang phỏng vấn"}
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                       <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-accent/30 text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all">
                          <MoreHorizontal className="h-6 w-6" />
                       </Button>
                       <Button 
                         onClick={() => handleInviteInterview(activeApplicant.id)}
                         className="rounded-2xl bg-primary hover:bg-primary-dark text-primary-foreground font-black text-xs h-14 px-10 shadow-glow shadow-primary/20 transition-all active:scale-95 flex items-center gap-3"
                       >
                          <Mail className="h-5 w-5" /> Mời phỏng vấn AI
                       </Button>
                    </div>
                  </div>

                  {/* AI Match Overview Tiles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="bg-primary/[0.02] border border-primary/10 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center space-y-3 shadow-soft group/score transition-all hover:bg-primary/[0.04]">
                       <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-1 transition-transform group-hover/score:scale-110">
                        <Sparkles className="h-6 w-6 text-primary" />
                       </div>
                       <div className="space-y-0.5">
                          <div className="text-4xl font-black text-primary tracking-tighter tabular-nums">{activeApplicant.atsScore}%</div>
                          <div className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1">Match Score</div>
                       </div>
                    </div>

                    <div className="md:col-span-2 p-8 rounded-[2.5rem] bg-accent/10 border border-border/60 flex flex-col justify-center space-y-4 shadow-soft">
                       <div className="flex items-center gap-3 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                          <div className="h-6 w-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-3.5 w-3.5 text-primary" />
                          </div>
                          Nhận xét từ Gemini AI
                       </div>
                       <p className="text-[15px] font-semibold text-foreground/80 leading-relaxed italic pr-6 border-l-2 border-primary/30 pl-6">
                          {activeApplicant.matchDetails}
                       </p>
                    </div>
                  </div>
               </div>

               {/* Skills Breakdown - Isolated Style */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-card border border-border/80 rounded-[2.5rem] p-8 space-y-6 shadow-soft">
                     <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-3">
                           <div className="h-5 w-1 bg-emerald-500 rounded-full" />
                           Kỹ năng đã có (Matched)
                        </h3>
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                           <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-2.5">
                        {activeApplicant.matchedSkills.map((s: string) => (
                          <Badge key={s} className="bg-accent/30 text-foreground border-transparent rounded-[0.75rem] px-5 py-2.5 text-xs font-bold transition-all hover:bg-emerald-500/10 hover:text-emerald-500">
                             {s}
                          </Badge>
                        ))}
                     </div>
                  </div>

                  <div className="bg-card border border-border/80 rounded-[2.5rem] p-8 space-y-6 shadow-soft">
                     <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-500 flex items-center gap-3">
                           <div className="h-5 w-1 bg-yellow-500 rounded-full" />
                           Cần bổ trợ (Gap)
                        </h3>
                        <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                           <Clock className="h-4 w-4 text-yellow-500" />
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-2.5">
                        {activeApplicant.missingSkills.length > 0 ? activeApplicant.missingSkills.map((s: string) => (
                          <Badge key={s} className="bg-accent/30 text-foreground border-transparent rounded-[0.75rem] px-5 py-2.5 text-xs font-bold transition-all hover:bg-yellow-500/10 hover:text-yellow-500">
                             {s}
                          </Badge>
                        )) : (
                          <div className="flex flex-col items-center justify-center w-full py-8 space-y-3 opacity-40">
                            <ShieldCheck className="h-10 w-10 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hoàn hảo - Không thiếu kỹ năng</span>
                          </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* CV Management - Natural Surface */}
               <div className="bg-card border border-border/80 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-soft group hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-6">
                     <div className="h-16 w-16 rounded-2xl bg-accent/40 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                        <FileText className="h-8 w-8" />
                     </div>
                     <div className="space-y-1.5">
                        <div className="text-[16px] font-black text-foreground">{activeApplicant.cvName}</div>
                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Hồ sơ ứng tuyển đính kèm (PDF)</div>
                     </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="ghost" className="w-full sm:w-auto rounded-xl h-14 font-black text-[11px] uppercase tracking-widest gap-3 text-primary hover:bg-primary/5 px-8 transition-all">
                       <ArrowUpRight className="h-5 w-5" /> Xem chi tiết CV
                    </Button>
                  </div>
               </div>

            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-6 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]">
               <div className="h-20 w-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center">
                 <Users className="h-10 w-10 text-muted-foreground opacity-20" />
               </div>
               <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.3em] opacity-40">Chọn ứng viên để xem chi tiết</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
