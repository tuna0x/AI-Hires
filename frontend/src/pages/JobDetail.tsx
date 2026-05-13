import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, Sparkles, Building2, 
  ShieldCheck, CheckCircle2, AlertTriangle, CloudUpload, Eye, Globe, 
  Users, Info, Share2, BookmarkPlus, ArrowUpRight, ChevronRight, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { cn } from "@/lib/utils";
import SiteLayout from "@/components/site/SiteLayout";

// Mock data việc làm chi tiết
const JOB_DETAILS_DATA: Record<number, any> = {
  1: {
    id: 1,
    title: "Senior Java Spring Boot Engineer",
    company: "Viettel Group",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80",
    location: "Hà Nội",
    salary: "35M - 50M VND",
    type: "Full-time",
    level: "Senior",
    category: "Backend",
    postedAt: "1 ngày trước",
    matchScore: 95,
    companyInfo: {
      website: "viettel.com.vn",
      size: "50,000+ nhân viên",
      industry: "Viễn thông & Công nghệ",
      description: "Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel) là tập đoàn viễn thông lớn nhất Việt Nam."
    },
    description: "Chúng tôi đang tìm kiếm một Senior Java Developer có kinh nghiệm chuyên sâu về Spring Boot để thiết kế và phát triển các hệ thống viễn thông vi dịch vụ (Microservices) có độ tin cậy và lưu lượng xử lý cực lớn.",
    responsibilities: [
      "Thiết kế, phát triển và bảo trì các API backend hiệu năng cao, chịu tải lớn.",
      "Tối ưu hóa các truy vấn SQL, phân bổ caching qua Redis để đảm bảo thời gian phản hồi API dưới 100ms.",
      "Tối ưu kiến trúc bất đồng bộ sử dụng RabbitMQ / Kafka.",
      "Đóng gói và triển khai ứng dụng dưới Docker & Kubernetes."
    ],
    requirements: [
      "Có ít nhất 5 năm kinh nghiệm làm việc chuyên sâu với Java Core và Spring Boot Ecosystem.",
      "Thành thạo cấu trúc dữ liệu, giải thuật và mẫu thiết kế (Design Patterns).",
      "Kinh nghiệm làm việc với MySQL, PostgreSQL, tối ưu hóa Indexing và Query Execution Plan.",
      "Thành thạo kiến thức về cơ chế Message Queue (RabbitMQ hoặc Kafka)."
    ],
    matchedSkills: ["Java", "Spring Boot", "MySQL", "RabbitMQ", "Docker"],
    missingSkills: [],
    benefits: [
      "Mức lương cạnh tranh lên tới 50 triệu VND kèm thưởng hiệu quả công việc tháng 13, 14, 15.",
      "Gói bảo hiểm sức khỏe quốc tế cao cấp dành cho nhân viên và người thân.",
      "Được tài trợ 100% học phí thi các chứng chỉ chuyên môn quốc tế.",
      "Làm việc tại tòa nhà văn phòng thông minh hiện đại bậc nhất."
    ],
    aiAnalysis: {
      whyFit: "Kinh nghiệm Spring Boot của bạn hoàn toàn trùng khớp với core stack của dự án Microservices tại Viettel.",
      tip: "Hãy nhấn mạnh các dự án bạn đã xử lý concurrency (RabbitMQ/Kafka) trong vòng phỏng vấn.",
      matchBreakdown: { experience: 98, technical: 94, education: 90 }
    }
  },
  2: {
    id: 2,
    title: "React Frontend Developer (Mid/Senior)",
    company: "VNG Corporation",
    logo: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=100&q=80",
    location: "TP. Hồ Chí Minh",
    salary: "25M - 40M VND",
    type: "Full-time",
    level: "Mid-Senior",
    category: "Frontend",
    postedAt: "3 ngày trước",
    matchScore: 88,
    companyInfo: {
      website: "vng.com.vn",
      size: "5,000+ nhân viên",
      industry: "Internet & Gaming",
      description: "VNG là công ty công nghệ kỳ lân đầu tiên của Việt Nam, nổi tiếng với Zalo, Zing MP3 và VNG Games."
    },
    description: "Tham gia vào đội ngũ phát triển siêu ứng dụng của VNG, thiết kế giao diện tinh xảo, mượt mà phục vụ hàng triệu người dùng hoạt động mỗi ngày.",
    responsibilities: [
      "Xây dựng giao diện web đáp ứng (Responsive Layout) sử dụng React 18, TypeScript và Tailwind CSS.",
      "Tích hợp và đồng bộ hóa dữ liệu từ API RESTful mượt mà thông qua React Query.",
      "Tối ưu hóa Lighthouse score và cải thiện hiệu năng kết xuất của DOM."
    ],
    requirements: [
      "Có tối thiểu 3 năm kinh nghiệm làm lập trình viên ReactJS.",
      "Sử dụng thành thạo TypeScript, CSS và Tailwind CSS.",
      "Hiểu biết sâu sắc về quản lý trạng thái (Redux toolkit, Context API, Zustand).",
      "Biết sử dụng Vite hoặc Webpack để tối ưu hóa bundle."
    ],
    matchedSkills: ["React", "TypeScript", "Tailwind CSS", "Vite"],
    missingSkills: ["Redux"],
    benefits: [
      "Thu nhập hấp dẫn, review lương định kỳ 2 lần/năm.",
      "Cung cấp Macbook Pro đời mới nhất phục vụ công việc.",
      "Trải nghiệm tin học chuẩn chỉnh trong môi trường làm việc trẻ trung, sáng tạo."
    ],
    aiAnalysis: {
      whyFit: "Kỹ năng React/Vite của bạn rất vững chắc, chỉ thiếu Redux nhưng có thể bù đắp qua kinh nghiệm Zustand.",
      tip: "Tìm hiểu thêm về Redux Toolkit vì dự án này sử dụng nó làm core state management.",
      matchBreakdown: { experience: 85, technical: 90, education: 88 }
    }
  }
};

const SIMILAR_JOBS = [
  { id: 4, title: "Android Developer", company: "Zalo Group", salary: "25M - 45M", location: "Hồ Chí Minh" },
  { id: 5, title: "Backend Engineer", company: "Tiki", salary: "30M - 55M", location: "Hồ Chí Minh" }
];

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = JOB_DETAILS_DATA[Number(id)] || JOB_DETAILS_DATA[1];
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isAppliedSuccess, setIsAppliedSuccess] = useState(false);

  const handleApply = () => {
    if (!selectedResumeId) {
      toast.warning("Vui lòng chọn một CV để ứng tuyển!");
      return;
    }
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setIsAppliedSuccess(true);
      toast.success("Nộp hồ sơ ứng tuyển thành công!");
    }, 1500);
  };

  return (
    <SiteLayout>
      <Seo
        title={`${job.title} tại ${job.company} — Intervio`}
        description={`Ứng tuyển ngay vị trí ${job.title} mức lương ${job.salary}. Phân tích điểm khớp CV tự động với trí tuệ nhân tạo.`}
        path={`/jobs/${job.id}`}
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Việc làm", path: "/jobs" }, { name: job.title, path: `/jobs/${job.id}` }])}
      />
      <div className="min-h-screen bg-[#0B0F19] text-foreground pb-32">
        <div className="mx-auto max-w-6xl px-4 pt-8">
          
          {/* Nút quay lại & Toolbar */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-all group px-4 py-2 rounded-2xl bg-secondary/20 border border-border/40 hover:border-primary/40">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
              <span>Danh sách việc làm</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-2xl border border-border/40 text-muted-foreground hover:bg-secondary/40"><Share2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="rounded-2xl border border-border/40 text-muted-foreground hover:bg-secondary/40"><BookmarkPlus className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Cột chính & Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Cột Trái - Content */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Job Info Header Card */}
              <div className="relative overflow-hidden rounded-[3rem] border border-border/50 bg-card p-8 lg:p-10 shadow-card">
                <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
                
                <div className="relative flex flex-col md:flex-row gap-8">
                  <img 
                    src={job.logo} 
                    alt={job.company} 
                    className="h-24 w-24 lg:h-32 lg:w-32 rounded-[2.5rem] object-cover border border-border shadow-2xl" 
                  />
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter">HOT JOB</Badge>
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Đăng {job.postedAt}</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">{job.title}</h1>
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 font-bold text-slate-200">
                        <Building2 className="h-4 w-4 text-primary" /> {job.company}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" /> {job.location}
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Match Score for Detail Page */}
                  <div className="flex flex-col items-center justify-center bg-[#1A233A]/80 backdrop-blur-md border border-primary/20 pb-4 pt-6 px-6 rounded-[2.5rem] min-w-[140px] text-center shadow-glow">
                    <div className="relative h-16 w-16 mb-2">
                      <svg className="h-full w-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-secondary/30" />
                        <circle 
                          cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
                          strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - job.matchScore / 100)} 
                          className="text-primary transition-all duration-1000"
                        />
                      </svg>
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <div className="text-2xl font-black text-primary">{job.matchScore}%</div>
                    <div className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">Trùng khớp AI</div>
                  </div>
                </div>

                {/* Grid các chỉ số nhanh */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-border/40">
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Mức lương</div>
                    <div className="font-bold text-green-500 flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> {job.salary}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Kinh nghiệm</div>
                    <div className="font-bold flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-blue-500" /> {job.level}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Loại hình</div>
                    <div className="font-bold flex items-center gap-1.5"><Calendar className="h-4 w-4 text-orange-500" /> {job.type}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Lĩnh vực</div>
                    <div className="font-bold flex items-center gap-1.5"><Badge variant="secondary" className="bg-primary/10 text-primary border-0 rounded-md py-0 px-2">{job.category}</Badge></div>
                  </div>
                </div>
              </div>

              {/* Recruitment Timeline (New Function) */}
              <div className="rounded-[2.5rem] border border-border/50 bg-card p-8 shadow-card space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" /> Lộ trình ứng tuyển
                </h3>
                <div className="flex items-center justify-between relative px-2">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/40 -translate-y-1/2 z-0" />
                  {[
                    { label: "Nộp đơn", icon: CloudUpload, color: "bg-blue-500" },
                    { label: "Sàng lọc AI", icon: Sparkles, color: "bg-primary" },
                    { label: "Phỏng vấn AI", icon: MessageSquare, color: "bg-indigo-500" },
                    { label: "Technical", icon: Briefcase, color: "bg-orange-500" },
                    { label: "Nhận Offer", icon: CheckCircle2, color: "bg-green-500" }
                  ].map((step, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-lg", idx <= 1 ? step.color : "bg-card border border-border")}>
                        <step.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs / Detailed Sections */}
              <div className="rounded-[2.5rem] border border-border/50 bg-card p-8 lg:p-10 shadow-card space-y-10">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black tracking-tight border-b border-border/40 pb-4">Mô tả chi tiết</h3>
                  <p className="text-muted-foreground leading-relaxed text-base italic">{job.description}</p>
                  
                  <div className="mt-8 space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-bold text-foreground">Trách nhiệm công việc:</h4>
                      <ul className="grid grid-cols-1 gap-3">
                        {job.responsibilities.map((res: string, idx: number) => (
                          <li key={idx} className="flex gap-3 items-start group">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0 transition-all group-hover:scale-150" />
                            <span className="text-muted-foreground text-[15px] leading-relaxed">{res}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-4 pt-4">
                      <h4 className="text-lg font-bold text-foreground">Yêu cầu chuyên môn:</h4>
                      <ul className="grid grid-cols-1 gap-3">
                        {job.requirements.map((req: string, idx: number) => (
                          <li key={idx} className="flex gap-3 items-start py-3 px-4 rounded-2xl bg-secondary/10 border border-border/40 hover:bg-secondary/20 transition-all">
                            <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />
                            <span className="text-muted-foreground text-[15px] leading-relaxed">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" /> Quyền lợi vượt trội
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {job.benefits.map((benefit: string, idx: number) => (
                      <div key={idx} className="flex gap-3 items-center p-4 rounded-2xl bg-[#1A233A]/40 border border-border/40">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Similar Jobs (New Function) */}
              <div className="space-y-6 pt-4">
                <h3 className="text-2xl font-black tracking-tight px-4">Việc làm tương tự</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                  {SIMILAR_JOBS.map((sJob) => (
                    <div key={sJob.id} className="group p-6 rounded-[2rem] bg-card/60 backdrop-blur-sm border border-border/40 hover:border-primary/40 transition-all flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h4 className="font-bold group-hover:text-primary transition-colors">{sJob.title}</h4>
                          <p className="text-xs text-muted-foreground">{sJob.company} • {sJob.location}</p>
                        </div>
                        <span className="text-xs font-bold text-green-500">{sJob.salary}</span>
                      </div>
                      <Link to={`/jobs/${sJob.id}`} className="text-xs font-bold text-primary flex items-center gap-1 group/link">
                        Xem chi tiết <ArrowUpRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cột Phải - Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Deep AI Analysis (Enhanced Section) */}
              <div className="sticky top-24 space-y-8">
                <div className="rounded-[2.5rem] border border-border/50 bg-card p-6 shadow-card space-y-6 relative overflow-hidden glass">
                  <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-[50px] pointer-events-none" />
                  
                  <h3 className="text-lg font-black flex items-center gap-2 border-b border-border/40 pb-4">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" /> Phân tích bởi Gemini AI
                  </h3>

                  <div className="space-y-6">
                    <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-primary">Tại sao bạn phù hợp?</h4>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">"{job.aiAnalysis.whyFit}"</p>
                    </div>

                    <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-orange-500">Lời khuyên của Mentors AI</h4>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">"{job.aiAnalysis.tip}"</p>
                    </div>

                    {/* Radar Chart Placeholder / Match Breakdown */}
                    <div className="space-y-4 pt-2">
                       {Object.entries(job.aiAnalysis.matchBreakdown).map(([key, val]: any) => (
                         <div key={key} className="space-y-1.5">
                           <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                             <span>{key === 'experience' ? 'Kinh nghiệm' : key === 'technical' ? 'Kỹ thuật' : 'Học vấn'}</span>
                             <span className="text-primary">{val}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-secondary/40 rounded-full overflow-hidden">
                             <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${val}%` }} />
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Company Pulse Info (New Section) */}
                <div className="rounded-[2.5rem] border border-border/50 bg-secondary/10 p-8 shadow-card space-y-6">
                  <h3 className="text-lg font-bold">Về công ty</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase">Website</div>
                        <a href={`https://${job.companyInfo.website}`} target="_blank" className="text-sm font-bold text-primary hover:underline">{job.companyInfo.website}</a>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase">Quy mô</div>
                        <div className="text-sm font-bold">{job.companyInfo.size}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase">Ngành nghề</div>
                        <div className="text-sm font-bold">{job.companyInfo.industry}</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 leading-relaxed">{job.companyInfo.description}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Persistent Action Bar (Premium UI) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-2xl border-t border-border/40 py-6 px-4 animate-in slide-in-from-bottom-full duration-500">
          <div className="mx-auto max-w-6xl flex items-center justify-between gap-6">
            <div className="hidden md:flex items-center gap-4">
              <img src={job.logo} className="h-12 w-12 rounded-xl object-cover border border-border" />
              <div>
                <div className="font-bold">{job.title}</div>
                <div className="text-xs text-muted-foreground">{job.company} • {job.salary}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button variant="outline" className="rounded-2xl h-14 px-6 gap-2 font-bold flex-1 md:flex-none border-border/60">
                <BookmarkPlus className="h-5 w-5" /> Lưu tin
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary text-primary-foreground rounded-2xl h-14 px-10 font-black shadow-glow flex-1 md:flex-none hover:scale-[1.02] transition-all"> 
                    Ứng tuyển ngay bằng AI
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] bg-[#0D1222] border border-border/60 text-foreground shadow-2xl">
                  {!isAppliedSuccess ? (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                          <Building2 className="h-6 w-6 text-primary" /> Nộp đơn vào {job.company}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">Hệ thống sẽ gửi hồ sơ và khởi chạy đánh giá ATS tự động bằng Google Gemini.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Chúng tôi tìm thấy 2 CV của bạn:</label>
                          <div className="space-y-2">
                            {[
                              { id: 1, name: "Nguyen_Van_An_Java_Developer_CV.pdf" },
                              { id: 2, name: "Nguyen_Van_An_Fullstack_Engineer.pdf" }
                            ].map((res) => (
                              <button 
                                key={res.id}
                                onClick={() => setSelectedResumeId(res.id)}
                                className={cn(
                                  "flex items-center justify-between w-full p-4 rounded-3xl border text-left transition-all",
                                  selectedResumeId === res.id 
                                    ? "bg-primary/10 border-primary text-foreground shadow-glow" 
                                    : "bg-secondary/10 border-border/40 text-muted-foreground hover:bg-secondary/20"
                                )}
                              >
                                <span className="text-sm font-bold truncate pr-4">{res.name}</span>
                                {selectedResumeId === res.id && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="relative flex py-2 items-center">
                          <div className="flex-grow border-t border-border/40"></div>
                          <span className="flex-shrink mx-4 text-muted-foreground text-[10px] font-black uppercase tracking-widest">Hoặc tạo mới</span>
                          <div className="flex-grow border-t border-border/40"></div>
                        </div>

                        {/* Drop zone tải lên CV mới */}
                        <div className="border-2 border-dashed border-border/60 bg-secondary/10 hover:bg-primary/5 hover:border-primary/50 transition-all p-8 rounded-[2.5rem] text-center space-y-3 cursor-pointer group">
                          <div className="h-12 w-12 bg-secondary/40 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                            <CloudUpload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div className="text-sm font-black">Tải lên CV mới của bạn</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-bold">Hệ thống sẽ tự động quét kỹ năng khi ứng tuyển</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button 
                          onClick={handleApply}
                          disabled={isApplying}
                          className="bg-gradient-primary text-primary-foreground rounded-2xl h-14 font-black shadow-glow text-lg"
                        >
                          {isApplying ? "Đang so khớp bằng AI..." : "Nộp đơn & Phân tích ngay"}
                        </Button>
                        <Button variant="ghost" className="rounded-2xl" onClick={() => setSelectedResumeId(null)}>Hủy bỏ</Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 space-y-6">
                      <div className="h-20 w-20 rounded-[2rem] bg-green-500/10 text-green-500 flex items-center justify-center mx-auto border border-green-500/20 shadow-glow shadow-green-500/10">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black">Tuyệt vời!</h2>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                          Hồ sơ của bạn đã được chuyển giao và đạt mức trùng khớp cao. Hãy chuẩn bị cho vòng phỏng vấn AI.
                        </p>
                      </div>
                      <div className="pt-4 flex flex-col gap-3">
                        <Button className="bg-primary hover:bg-primary-dark rounded-2xl h-14 font-black" onClick={() => navigate("/applications")}>
                          Xem tiến độ hồ sơ
                        </Button>
                        <Button variant="ghost" className="rounded-2xl" onClick={() => setIsAppliedSuccess(false)}>Đóng lại</Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
