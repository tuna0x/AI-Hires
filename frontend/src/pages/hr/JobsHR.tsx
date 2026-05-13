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

// Mock dữ liệu tin tuyển dụng hiện có của nhà tuyển dụng
const INITIAL_HR_JOBS = [
  {
    id: 1,
    title: "Senior Java Spring Boot Engineer",
    location: "Hà Nội",
    salary: "35M - 50M VND",
    applicantsCount: 15,
    views: 842,
    conversion: "1.8%",
    status: "ACTIVE",
    postedAt: "1 ngày trước",
    skills: ["Java", "Spring Boot", "MySQL", "RabbitMQ", "Docker"]
  },
  {
    id: 2,
    title: "React Frontend Developer (Mid/Senior)",
    location: "TP. Hồ Chí Minh",
    salary: "25M - 40M VND",
    applicantsCount: 8,
    views: 420,
    conversion: "2.1%",
    status: "ACTIVE",
    postedAt: "3 ngày trước",
    skills: ["React", "TypeScript", "Tailwind CSS", "Redux", "Vite"]
  },
  {
    id: 3,
    title: "AI Engineer (Python / LLM & NLP)",
    location: "Hà Nội",
    salary: "40M - 65M VND",
    applicantsCount: 5,
    views: 1205,
    conversion: "0.4%",
    status: "PAUSED",
    postedAt: "Hôm nay",
    skills: ["Python", "Gemini API", "NLP", "LLM", "Vector DB"]
  }
];

export default function JobsHR() {
  const [jobs, setJobs] = useState(INITIAL_HR_JOBS);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [salary, setSalary] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [description, setDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !salary) {
      toast.error("Vui lòng điền đầy đủ các thông tin cốt lõi!");
      return;
    }

    const newJob = {
      id: jobs.length + 1,
      title,
      location,
      salary,
      applicantsCount: 0,
      views: 0,
      conversion: "0%",
      status: "ACTIVE",
      postedAt: "Vừa xong",
      skills: skillsText ? skillsText.split(",").map(s => s.trim()) : ["General"]
    };

    setJobs([newJob, ...jobs]);
    toast.success("Đăng tin tuyển dụng mới thành công!");
    setIsDialogOpen(false);
    
    // Reset forms
    setTitle(""); setLocation(""); setSalary(""); setSkillsText(""); setDescription("");
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
              <Plus className="h-5 w-5" /> Đăng tin tuyển dụng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl rounded-[2rem] md:rounded-[3rem] bg-[#0B0F19] border border-white/10 text-white p-6 md:p-10 shadow-elegant overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="absolute top-0 right-0 h-40 w-40 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            
            <DialogHeader className="space-y-4 relative z-10">
              <DialogTitle className="text-3xl font-black flex items-center gap-4 tracking-tight">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                Thiết lập tin mới
              </DialogTitle>
              <DialogDescription className="text-[13px] font-medium text-muted-foreground leading-relaxed max-w-md">
                Sử dụng Gemini AI để tự động chấm điểm match score giữa JD và ứng viên trong vài giây.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateJob} className="space-y-8 pt-8 relative z-10">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Chức danh công việc</label>
                   <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Java Engineer" className="rounded-2xl border-white/10 bg-white/5 h-12 focus-visible:ring-primary/20" />
                </div>
                <div className="space-y-2.5">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Địa điểm làm việc</label>
                   <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Hà Nội / Remote" className="rounded-2xl border-white/10 bg-white/5 h-12 focus-visible:ring-primary/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Ngân sách (Lương)</label>
                   <Input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="30M - 50M VND" className="rounded-2xl border-white/10 bg-white/5 h-12 focus-visible:ring-primary/20" />
                </div>
                <div className="space-y-2.5">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Kỹ năng cốt lõi (Cách nhau dấu ,)</label>
                   <Input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="React, Node.js, AWS..." className="rounded-2xl border-white/10 bg-white/5 h-12 focus-visible:ring-primary/20" />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Mô tả công việc (JD)</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập mô tả chi tiết yêu cầu công việc..." className="rounded-3xl border-white/10 bg-white/5 min-h-[140px] p-6 text-[13px] font-medium leading-relaxed focus-visible:ring-primary/20" />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                <Button type="button" variant="ghost" className="rounded-xl font-bold h-12 px-6" onClick={() => setIsDialogOpen(false)}>Hủy bỏ</Button>
                <Button type="submit" className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-[1.25rem] px-10 font-black h-12 shadow-glow shadow-primary/20 transition-all">Đăng tin ngay</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Danh sách các tin tuyển dụng */}
      <div className="space-y-6">
        {jobs.map((job) => (
          <div key={job.id} className="group p-10 rounded-[3.5rem] border border-white/5 bg-white/5 hover:border-primary/30 transition-all duration-500 shadow-soft">
            <div className="flex flex-col xl:flex-row gap-10 items-start xl:items-center">
              
              {/* Job Info Section */}
              <div className="flex-1 space-y-6 min-w-0">
                <div className="flex items-center gap-4">
                  <Badge className={cn(
                    "rounded-lg text-[9px] font-black px-3 py-1 border-0 tracking-widest",
                    job.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-500" : "bg-yellow-500/10 text-yellow-500"
                  )}>
                    {job.status === "ACTIVE" ? "ĐANG HOẠT ĐỘNG" : "ĐANG TẠM DỪNG"}
                  </Badge>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">{job.postedAt}</span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors truncate pr-8 tracking-tight leading-tight">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-8 text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-primary" /> {job.location}</span>
                    <span className="flex items-center gap-2.5"><DollarSign className="h-4 w-4 text-emerald-500" /> {job.salary}</span>
                    <span className="flex items-center gap-2.5"><Users className="h-4 w-4 text-blue-500" /> {job.applicantsCount} Ứng viên</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  {job.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-white/5 border-white/5 text-[10px] font-bold py-1.5 px-4 rounded-xl text-muted-foreground group-hover:text-white transition-all shadow-soft">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Campaign Performance Bar */}
              <div className="w-full xl:w-80 p-8 rounded-[2.5rem] bg-white/5 border border-white/5 grid grid-cols-2 gap-8 relative group/stats overflow-hidden shadow-soft group-hover:border-primary/20 transition-all">
                 <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                       <Eye className="h-3.5 w-3.5" /> Lượt xem
                    </div>
                    <div className="text-3xl font-black text-white tracking-tighter">{job.views}</div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                       <TrendingUp className="h-3.5 w-3.5" /> Conversion
                    </div>
                    <div className="text-3xl font-black text-primary tracking-tighter">{job.conversion}</div>
                 </div>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex items-center gap-4">
                <Button asChild className="rounded-[1.25rem] h-14 px-8 font-black text-xs bg-white/5 text-white border border-white/10 hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-glow shadow-primary/5 transition-all">
                  <Link to="/admin/hr/applicants" className="flex items-center gap-3">
                    Danh sách ứng viên <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex gap-3">
                   <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"><FileEdit className="h-5 w-5" /></Button>
                   <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="h-5 w-5" /></Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
