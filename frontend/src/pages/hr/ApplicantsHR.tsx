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
      
      {/* Top Status Pipeline Selector */}
      <div className="flex border-b border-white/5 pb-px -mx-2">
        {[
          { label: "Tất cả", value: "ALL", icon: ListFilter },
          { label: "Sàng lọc AI", value: "SCREENED", icon: Sparkles },
          { label: "Đã phỏng vấn", value: "INTERVIEWED", icon: CheckCircle },
          { label: "Từ chối", value: "REJECTED", icon: XCircle },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={cn(
              "px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-2 relative",
              filterStatus === tab.value 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-white"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {filterStatus === tab.value && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Applicants List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên, vị trí..." 
              className="pl-12 rounded-2xl border-white/5 bg-white/5 h-12 focus-visible:ring-primary/20 placeholder:text-muted-foreground/50 font-medium"
            />
          </div>

          <div className="space-y-3 custom-scrollbar lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
            <AnimatePresence mode="popLayout">
              {filteredApplicants.map((app) => (
                <motion.button 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={app.id}
                  onClick={() => setActiveApplicant(app)}
                  className={cn(
                    "w-full text-left p-6 rounded-[2rem] border transition-all relative group shadow-soft overflow-hidden",
                    activeApplicant?.id === app.id 
                      ? "bg-primary/5 border-primary/30 shadow-glow shadow-primary/5" 
                      : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                >
                  {activeApplicant?.id === app.id && (
                    <div className="absolute top-0 left-0 h-full w-1 bg-primary" />
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1.5">
                      <h4 className="text-[15px] font-bold text-white group-hover:text-primary transition-colors leading-tight">{app.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">{app.jobTitle}</p>
                    </div>
                    <div className={cn(
                      "h-2 w-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]",
                      app.atsScore >= 90 ? "bg-primary" : app.atsScore >= 80 ? "bg-green-500" : "bg-yellow-500"
                    )} />
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-8 rounded bg-white/10 flex items-center justify-center text-[8px] font-black text-white/40 uppercase">CV</div>
                      <span className="text-[10px] text-muted-foreground font-bold tracking-tight">{app.appliedAt}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white">{app.atsScore}%</span>
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
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
               {/* Candidate Summary Header */}
               <div className="bg-white/5 border border-white/5 rounded-[3rem] p-10 space-y-10 shadow-elegant relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 blur-[60px] rounded-full -mr-16 -mt-16" />
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground text-3xl font-black shadow-glow shadow-primary/20">
                        {activeApplicant.name.charAt(0)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h2 className="text-3xl font-black text-white tracking-tight">{activeApplicant.name}</h2>
                          {activeApplicant.atsScore >= 95 && (
                            <Badge className="bg-primary/20 text-primary border-primary/20 rounded-lg font-black text-[9px] uppercase tracking-widest px-2 py-0.5">Top Talent</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[13px] text-muted-foreground font-bold uppercase tracking-wider">
                           <Briefcase className="h-4 w-4 text-primary" /> {activeApplicant.jobTitle}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                       <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 font-bold h-12 w-12 p-0 hover:bg-white/10">
                          <MoreHorizontal className="h-5 w-5" />
                       </Button>
                       <Button 
                         onClick={() => handleInviteInterview(activeApplicant.id)}
                         className="rounded-[1.25rem] bg-primary hover:bg-primary-dark text-primary-foreground font-black text-xs h-12 px-8 shadow-glow shadow-primary/20 transition-all active:scale-95"
                       >
                          <Mail className="h-4 w-4 mr-2" /> Mời phỏng vấn AI
                       </Button>
                    </div>
                  </div>

                  {/* AI Match Overview Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center space-y-2 shadow-soft">
                       <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                       </div>
                       <div className="space-y-0.5">
                          <div className="text-4xl font-black text-primary tracking-tighter">{activeApplicant.atsScore}%</div>
                          <div className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mt-1">Match Score</div>
                       </div>
                    </div>

                    <div className="md:col-span-2 p-8 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col justify-center space-y-4 shadow-soft">
                       <div className="flex items-center gap-3 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                          <div className="h-5 w-5 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-3 w-3 text-primary" />
                          </div>
                          Nhận xét từ Gemini AI
                       </div>
                       <p className="text-[15px] font-medium text-white/80 leading-relaxed italic pr-4">
                          "{activeApplicant.matchDetails}"
                       </p>
                    </div>
                  </div>
               </div>

               {/* Skills Breakdown Section */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-soft">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-3">
                        <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                        Kỹ năng khớp (Matched)
                     </h3>
                     <div className="flex flex-wrap gap-2.5">
                        {activeApplicant.matchedSkills.map((s: string) => (
                          <Badge key={s} className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-xl px-4 py-2 text-xs font-bold shadow-soft">
                             {s}
                          </Badge>
                        ))}
                     </div>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-soft">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500 flex items-center gap-3">
                        <div className="h-6 w-1 bg-yellow-500 rounded-full" />
                        Kỹ năng cần bổ trợ
                     </h3>
                     <div className="flex flex-wrap gap-2.5">
                        {activeApplicant.missingSkills.length > 0 ? activeApplicant.missingSkills.map((s: string) => (
                          <Badge key={s} className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 rounded-xl px-4 py-2 text-xs font-bold shadow-soft">
                             {s}
                          </Badge>
                        )) : (
                          <div className="flex flex-col items-center justify-center w-full py-4 space-y-2 opacity-40">
                            <ShieldCheck className="h-8 w-8" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Không có kỹ năng bị thiếu</span>
                          </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* CV Management & External Links */}
               <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-soft group hover:border-white/10 transition-all">
                  <div className="flex items-center gap-6">
                     <div className="h-14 w-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="h-7 w-7" />
                     </div>
                     <div className="space-y-1">
                        <div className="text-[15px] font-bold text-white group-hover:text-primary transition-colors">{activeApplicant.cvName}</div>
                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.1em]">Hồ sơ đính kèm (PDF)</div>
                     </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" className="rounded-xl h-12 font-bold text-xs gap-3 text-primary hover:bg-primary/5 px-6">
                       <ArrowUpRight className="h-4 w-4" /> Xem hồ sơ chi tiết
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
