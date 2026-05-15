import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Briefcase, MapPin, DollarSign, Users, Plus, CheckCircle2, 
  ChevronRight, X, Sparkles, Eye, TrendingUp, AlertCircle, FileEdit, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock dữ liệu chi tiết cho "Natural" Job Management
const INITIAL_HR_JOBS = [
  {
    id: 1,
    title: "Senior Java Spring Boot Engineer",
    locations: ["Hà Nội", "Remote"],
    salary: "35M - 50M VND",
    type: "Full-time",
    level: "Senior",
    applicantsCount: 15,
    views: 842,
    conversion: "1.8%",
    status: "ACTIVE",
    postedAt: "1 ngày trước",
    skills: ["Java", "Spring Boot", "MySQL", "RabbitMQ", "Docker"],
    description: "Chúng tôi tìm kiếm Senior Java Engineer để xây dựng hệ thống lõi cho Intervio...",
    requirements: "- Ít nhất 5 năm kinh nghiệm Java\n- Thành thạo Spring Boot\n- Kinh nghiệm về Microservices",
    benefits: "- Lương thưởng cạnh tranh\n- Bảo hiểm sức khỏe cao cấp\n- 15 ngày phép năm"
  },
  {
    id: 2,
    title: "React Frontend Developer (Mid/Senior)",
    locations: ["TP. Hồ Chí Minh"],
    salary: "25M - 40M VND",
    type: "Full-time",
    level: "Middle / Senior",
    applicantsCount: 8,
    views: 420,
    conversion: "2.1%",
    status: "ACTIVE",
    postedAt: "3 ngày trước",
    skills: ["React", "TypeScript", "Tailwind CSS", "Redux", "Vite"],
    description: "Tham gia phát triển giao diện AI-centric cho hệ thống quản trị mới...",
    requirements: "- 3+ năm kinh nghiệm React\n- Thành thạo TypeScript & CSS\n- Tư duy UI/UX tốt",
    benefits: "- Môi trường làm việc năng động\n- Remote 2 ngày/tuần\n- Teambuilding hàng quý"
  },
  {
    id: 3,
    title: "AI Engineer (Python / LLM & NLP)",
    locations: ["Hà Nội", "Remote"],
    salary: "40M - 65M VND",
    type: "Full-time",
    level: "Senior",
    applicantsCount: 5,
    views: 1205,
    conversion: "0.4%",
    status: "PAUSED",
    postedAt: "Hôm nay",
    skills: ["Python", "Gemini API", "NLP", "LLM", "Vector DB"],
    description: "Phát triển các thuật toán scoring và phân tích CV bằng Gemini Pro...",
    requirements: "- Kinh nghiệm về LLM (Gemini, GPT)\n- Thành thạo Python & LangChain\n- Kiến thức về NLP",
    benefits: "- Thưởng dự án theo hiệu suất\n- Cơ hội làm việc với AI state-of-the-art\n- Mac Pro M3"
  }
];

const AVAILABLE_LOCATIONS = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Remote"];

export default function JobsHR() {
  const [jobs, setJobs] = useState(INITIAL_HR_JOBS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    title: "",
    locations: [] as string[],
    salary: "",
    type: "Full-time",
    level: "Senior",
    skillsText: "",
    description: "",
    requirements: "",
    benefits: ""
  });

  const toggleLocation = (loc: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(loc)
        ? prev.locations.filter(l => l !== loc)
        : [...prev.locations, loc]
    }));
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.locations.length === 0 || !formData.salary) {
      toast.error("Vui lòng điền đầy đủ tiêu đề, địa điểm và mức lương!");
      return;
    }

    const newJob = {
      ...formData,
      id: Date.now(),
      applicantsCount: 0,
      views: 0,
      conversion: "0%",
      status: "ACTIVE",
      postedAt: "Vừa xong",
      skills: formData.skillsText ? formData.skillsText.split(",").map(s => s.trim()) : ["Chung"]
    };

    setJobs([newJob as any, ...jobs]);
    toast.success("Đăng tin tuyển dụng mới thành công!");
    setIsDialogOpen(false);
    
    // Reset forms
    setFormData({
      title: "", locations: [], salary: "", type: "Full-time", 
      level: "Senior", skillsText: "", description: "", requirements: "", benefits: ""
    });
  };

  return (
    <div className="space-y-10 pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-primary rounded-full" />
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">Quản lý chiến dịch</h2>
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Tối ưu hiệu suất & Đăng tin mới</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-[1.25rem] h-14 px-8 font-black text-xs shadow-glow shadow-primary/20 flex items-center gap-3 hover:scale-[1.02] transition-all active:scale-95">
              <Plus className="h-5 w-5" /> Đăng tin tuyển dụng mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl rounded-[2.5rem] bg-[#0F172A] border border-white/10 text-white p-0 shadow-elegant overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
            
            <div className="px-10 py-8 border-b border-white/5 relative z-10 shrink-0 bg-white/[0.02]">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-2xl font-black flex items-center gap-3 tracking-tight">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  Thiết lập chiến dịch mới
                </DialogTitle>
                <DialogDescription className="text-[12px] font-medium text-muted-foreground ml-13">
                  Cung cấp thông tin chi tiết để Gemini AI tối ưu hóa việc chấm điểm ứng viên.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
              <form id="job-form" onSubmit={handleCreateJob} className="space-y-10">
                {/* Section: Thông tin cơ bản */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Thông tin cơ bản</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Chức danh công việc</label>
                       <Input 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})} 
                        placeholder="e.g. Senior Java Engineer" 
                        className="rounded-2xl border-white/10 bg-white/5 h-12 focus-visible:ring-primary/20" 
                       />
                    </div>
                    <div className="space-y-2.5">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Ngân sách (Lương)</label>
                       <Input 
                        value={formData.salary} 
                        onChange={(e) => setFormData({...formData, salary: e.target.value})} 
                        placeholder="30M - 50M VND" 
                        className="rounded-2xl border-white/10 bg-white/5 h-12 focus-visible:ring-primary/20" 
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Cấp bậc</label>
                       <select 
                        value={formData.level} 
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 h-12 px-4 text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                       >
                         <option value="Intern">Intern</option>
                         <option value="Junior">Junior</option>
                         <option value="Middle">Middle</option>
                         <option value="Senior">Senior</option>
                         <option value="Lead/Manager">Lead / Manager</option>
                       </select>
                    </div>
                    <div className="space-y-2.5">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Hình thức làm việc</label>
                       <select 
                        value={formData.type} 
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 h-12 px-4 text-sm focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                       >
                         <option value="Full-time">Full-time</option>
                         <option value="Part-time">Part-time</option>
                         <option value="Contract">Contract</option>
                         <option value="Freelance">Freelance</option>
                       </select>
                    </div>
                  </div>
                </div>

                {/* Section: Địa điểm (Multi-select) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Địa điểm làm việc</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_LOCATIONS.map(loc => (
                      <Badge 
                        key={loc}
                        onClick={() => toggleLocation(loc)}
                        className={cn(
                          "cursor-pointer px-4 py-2 rounded-xl border transition-all text-[11px] font-bold",
                          formData.locations.includes(loc) 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-white/5 text-muted-foreground border-white/5 hover:border-white/20"
                        )}
                      >
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Section: Chi tiết nội dung */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-1 bg-blue-500 rounded-full" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Nội dung chi tiết</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Kỹ năng cốt lõi (Cách nhau bằng dấu phẩy)</label>
                    <Input 
                      value={formData.skillsText} 
                      onChange={(e) => setFormData({...formData, skillsText: e.target.value})} 
                      placeholder="e.g. React, Node.js, Docker..." 
                      className="rounded-2xl border-white/10 bg-white/5 h-12 focus-visible:ring-primary/20" 
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Mô tả công việc (JD)</label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Nhập nội dung JD..." 
                      className="rounded-2xl border-white/10 bg-white/5 min-h-[120px] focus-visible:ring-primary/20 p-4 text-sm" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Yêu cầu ứng viên</label>
                      <Textarea 
                        value={formData.requirements} 
                        onChange={(e) => setFormData({...formData, requirements: e.target.value})} 
                        placeholder="Nhập yêu cầu..." 
                        className="rounded-2xl border-white/10 bg-white/5 min-h-[120px] focus-visible:ring-primary/20 p-4 text-sm" 
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Quyền lợi & Đãi ngộ</label>
                      <Textarea 
                        value={formData.benefits} 
                        onChange={(e) => setFormData({...formData, benefits: e.target.value})} 
                        placeholder="Nhập quyền lợi..." 
                        className="rounded-2xl border-white/10 bg-white/5 min-h-[120px] focus-visible:ring-primary/20 p-4 text-sm" 
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-10 py-6 border-t border-white/5 relative z-10 shrink-0 flex justify-end gap-4 bg-white/[0.01]">
              <Button type="button" variant="ghost" className="rounded-xl font-bold h-12 px-8" onClick={() => setIsDialogOpen(false)}>Đóng</Button>
              <Button form="job-form" type="submit" className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl px-10 font-black h-12 shadow-glow shadow-primary/20 transition-all">Lưu & Đăng ngay</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Danh sách các tin tuyển dụng - Isolated Card Architecture (v6) */}
      <div className="space-y-6">
        {jobs.map((job) => (
          <div key={job.id} className="group p-8 rounded-[2.5rem] border border-border/80 bg-card hover:border-primary/40 transition-all duration-300 shadow-soft overflow-hidden relative">
            {/* Hover Accent */}
            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center">
              
              {/* Job Info Section */}
              <div className="flex-1 space-y-5 min-w-0">
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    "rounded-lg text-[9px] font-black px-3 py-1 border-0 tracking-widest",
                    job.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {job.status === "ACTIVE" ? "ĐANG HOẠT ĐỘNG" : "ĐANG TẠM DỪNG"}
                  </Badge>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{job.postedAt}</span>
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{job.type}</span>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors truncate pr-8 tracking-tighter">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-6 text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="flex items-center gap-2 text-foreground/80">
                      <MapPin className="h-4 w-4 text-primary" /> 
                      {job.locations?.join(" • ") || "Nghiên cứu"}
                    </span>
                    <span className="flex items-center gap-2 text-foreground/80">
                      <DollarSign className="h-4 w-4 text-primary" /> 
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-2 text-foreground/80">
                      <Users className="h-4 w-4 text-primary" /> 
                      {job.applicantsCount} Ứng viên
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {job.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-accent/30 border-transparent text-[10px] font-bold py-1 px-4 rounded-lg text-muted-foreground group-hover:text-foreground transition-all">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Quick Performance View */}
              <div className="shrink-0 flex items-center gap-10 px-8 border-x border-border/40 hidden xl:flex">
                 <div className="text-center group/stat">
                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 group-hover/stat:text-primary transition-colors">Lượt xem</div>
                    <div className="text-2xl font-black text-foreground tracking-tighter">{job.views}</div>
                 </div>
                 <div className="text-center group/stat">
                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 group-hover/stat:text-primary transition-colors">Tỉ lệ</div>
                    <div className="text-2xl font-black text-primary tracking-tighter">{job.conversion}</div>
                 </div>
              </div>

              {/* Actions - Permanent High Visibility */}
              <div className="shrink-0 flex items-center gap-3 w-full xl:w-auto pt-4 xl:pt-0">
                <Button asChild className="flex-1 xl:flex-none bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl h-12 px-6 font-black text-xs shadow-glow shadow-primary/10 transition-all">
                  <Link to="/admin/hr/applicants" className="flex items-center gap-2">
                    Ứng viên <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-accent/30 text-muted-foreground hover:text-primary border border-transparent hover:border-primary/30 transition-all">
                  <FileEdit className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-destructive/5 text-muted-foreground hover:text-destructive border border-transparent hover:border-destructive/30 transition-all">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
