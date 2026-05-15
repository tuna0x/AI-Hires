import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, Sparkles, Building2, 
  ShieldCheck, CheckCircle2, AlertTriangle, CloudUpload, Eye, Globe, 
  Users, Info, Share2, BookmarkPlus, ArrowUpRight, ChevronRight, MessageSquare,
  TrendingUp, Zap, Target, Award, Clock, ListFilter, Lightbulb, Trophy, Rocket,
  CheckCircle, ChevronDown, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { cn } from "@/lib/utils";
import SiteLayout from "@/components/site/SiteLayout";

// Dữ liệu mẫu việc làm chi tiết
const JOB_DETAILS_DATA: Record<number, any> = {
  1: {
    id: 1,
    title: "Kỹ sư Senior Java Spring Boot",
    company: "Tập đoàn Viettel",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80",
    location: "Hà Nội",
    salary: "35M - 50M VND",
    type: "Toàn thời gian",
    level: "Senior",
    category: "Backend",
    postedAt: "1 ngày trước",
    matchScore: 95,
    highlights: [
      { icon: Rocket, text: "Làm việc với hệ thống Microservices quy mô lớn" },
      { icon: Trophy, text: "Môi trường tập đoàn công nghệ Top 1 Việt Nam" },
      { icon: Lightbulb, text: "Cơ hội thăng tiến lên Tech Lead" }
    ],
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
  }
};

const SIMILAR_JOBS = [
  { id: 4, title: "Lập trình viên Android", company: "Zalo Group", salary: "25M - 45M", location: "Hồ Chí Minh" },
  { id: 5, title: "Kỹ sư Backend", company: "Tiki", salary: "30M - 55M", location: "Hồ Chí Minh" }
];

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = JOB_DETAILS_DATA[Number(id)] || JOB_DETAILS_DATA[1];
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isAppliedSuccess, setIsAppliedSuccess] = useState(false);
  const [hasScannedCv, setHasScannedCv] = useState(true);

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
      
      <div className="min-h-screen bg-[#0B0F19] text-slate-200 pb-32">
        <div className="mx-auto max-w-7xl px-4 pt-8">
          
          {/* Breadcrumb Navigation - Compact */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/jobs" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-all">
              <ArrowLeft className="h-3.5 w-3.5" /> 
              <span>Danh sách việc làm</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main Content Column */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Job Header Card - Compact & Neat */}
              <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-48 w-48 bg-primary/10 rounded-full blur-[80px] -mr-24 -mt-24" />
                
                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                  <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-2xl bg-secondary/20 p-1 flex items-center justify-center border border-white/5 shadow-lg shrink-0">
                    <img src={job.logo} alt={job.company} className="h-full w-full object-cover rounded-xl" />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                       <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight">{job.title}</h1>
                       <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-primary/80" />
                          <span className="text-sm font-bold text-slate-300">{job.company}</span>
                       </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                           <DollarSign className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="text-[14px] font-black text-emerald-400">{job.salary}</div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                           <MapPin className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="text-[14px] font-black text-slate-200">{job.location}</div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                           <Trophy className="h-4 w-4 text-orange-400" />
                        </div>
                        <div className="text-[14px] font-black text-slate-200">5+ năm kinh nghiệm</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-6 bg-white/[0.03] rounded-2xl border border-white/5">
                        <div>
                           <p className="text-[8px] font-black text-muted-foreground uppercase opacity-50 mb-0.5">Cấp bậc</p>
                           <p className="text-[10px] font-bold text-white">{job.level}</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-muted-foreground uppercase opacity-50 mb-0.5">Hạn nộp</p>
                           <p className="text-[10px] font-bold text-white">30/06</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-muted-foreground uppercase opacity-50 mb-0.5">Số lượng</p>
                           <p className="text-[10px] font-bold text-white">05 người</p>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-muted-foreground uppercase opacity-50 mb-0.5">Hình thức</p>
                           <p className="text-[10px] font-bold text-white">{job.type}</p>
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Body - Neat & Well-spaced */}
              <div className="bg-card/20 border border-white/5 rounded-[2rem] p-8 lg:p-10 space-y-10 shadow-lg backdrop-blur-md">
                
                {/* Highlights Bar */}
                <div className="flex flex-wrap gap-8 pb-8 border-b border-white/5">
                   {job.highlights.map((h: any, i: number) => (
                     <div key={i} className="flex gap-3 items-center">
                        <h.icon className="h-4 w-4 text-primary" />
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">{h.text}</p>
                     </div>
                   ))}
                </div>

                {/* Job Content Sections */}
                <div className="space-y-10 text-slate-300">
                   
                   <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-1 rounded-full bg-primary" />
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Chi tiết công việc</h2>
                      </div>
                      <p className="leading-relaxed text-sm font-medium opacity-80 pl-4 border-l border-white/5">
                        {job.description}
                      </p>
                   </div>

                   <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-1 rounded-full bg-primary" />
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Mô tả công việc</h2>
                      </div>
                      <ul className="space-y-3 pl-4">
                        {job.responsibilities.map((res: string, idx: number) => (
                           <li key={idx} className="flex gap-3 items-start group">
                             <div className="mt-2 h-1 w-1 rounded-full bg-primary shrink-0" />
                             <span className="text-sm font-semibold">{res}</span>
                           </li>
                        ))}
                      </ul>
                   </div>

                   <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-1 rounded-full bg-blue-500" />
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Yêu cầu ứng viên</h2>
                      </div>
                      <ul className="space-y-3 pl-4">
                        {job.requirements.map((req: string, idx: number) => (
                           <li key={idx} className="flex gap-3 items-start group">
                             <Check className="mt-1 h-3.5 w-3.5 text-blue-500 shrink-0" />
                             <span className="text-sm font-semibold">{req}</span>
                           </li>
                        ))}
                      </ul>
                   </div>

                   <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-1 rounded-full bg-emerald-500" />
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Quyền lợi</h2>
                      </div>
                      <ul className="space-y-3 pl-4">
                        {job.benefits.map((benefit: string, idx: number) => (
                           <li key={idx} className="flex gap-3 items-start group">
                             <CheckCircle2 className="mt-1 h-3.5 w-3.5 text-emerald-500 shrink-0" />
                             <span className="text-sm font-semibold">{benefit}</span>
                           </li>
                        ))}
                      </ul>
                   </div>
                </div>
              </div>

              {/* Similar Jobs section */}
              <div className="space-y-6 pt-6">
                 <h3 className="text-lg font-black text-white italic">Việc làm liên quan</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SIMILAR_JOBS.map((sJob) => (
                        <Link 
                        to={`/jobs/${sJob.id}`} 
                        key={sJob.id} 
                        className="group p-6 rounded-[1.5rem] bg-card/40 border border-white/5 hover:border-primary/40 hover:bg-card/60 transition-all flex flex-col gap-4 shadow-sm"
                        >
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                               <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors truncate max-w-[200px]">{sJob.title}</h4>
                               <p className="text-xs text-slate-400 font-semibold">{sJob.company}</p>
                            </div>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-0 text-[9px] font-black">{sJob.salary}</Badge>
                        </div>
                        </Link>
                    ))}
                 </div>
              </div>
            </div>

            {/* Sidebar Column - Tidy & Compact */}
            <div className="lg:col-span-4 space-y-6">
               
               {/* Conditional AI Score Card */}
               {hasScannedCv && (
                  <div className="bg-gradient-to-br from-[#1E2538] to-[#121829] border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 h-32 w-32 bg-primary/20 rounded-full blur-[60px] opacity-30" />
                     <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                           <h3 className="text-sm font-black text-white flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Độ phù hợp AI</h3>
                        </div>
                        <div className="flex flex-col items-center py-2">
                           <div className="relative h-24 w-24 mb-3">
                              <svg className="h-full w-full transform -rotate-90">
                                 <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                                 <circle 
                                 cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" 
                                 strokeDasharray={264} strokeDashoffset={264 * (1 - job.matchScore / 100)} 
                                 className="text-primary transition-all duration-1000"
                                 strokeLinecap="round"
                                 />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-white">{job.matchScore}%</div>
                           </div>
                           <p className="text-[10px] font-black uppercase text-primary tracking-widest">Điểm khớp CV</p>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[13px] font-bold text-slate-300 italic leading-relaxed opacity-90 pl-3 border-l-[2px] border-primary/20">"{job.aiAnalysis.whyFit}"</p>
                            <div className="space-y-3">
                                {Object.entries(job.aiAnalysis.matchBreakdown).map(([key, val]: any) => (
                                    <div key={key} className="space-y-1.5">
                                     <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                                        <span>{key === 'experience' ? 'Kinh nghiệm' : key === 'technical' ? 'Kỹ thuật' : 'Học vấn'}</span>
                                        <span className="text-primary">{val}%</span>
                                     </div>
                                     <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${val}%` }} />
                                     </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* Company Info Sidebar */}
               <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-tighter">Về {job.company}</h3>
                  <div className="space-y-4">
                     <p className="text-xs font-semibold text-slate-400 leading-relaxed italic line-clamp-4">{job.companyInfo.description}</p>
                     <div className="space-y-2 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs">
                           <span className="font-black text-muted-foreground uppercase opacity-50">Website</span>
                           <a href={`https://${job.companyInfo.website}`} target="_blank" className="font-bold text-primary hover:underline">{job.companyInfo.website}</a>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                           <span className="font-black text-muted-foreground uppercase opacity-50">Quy mô</span>
                           <span className="font-bold text-slate-200">{job.companyInfo.size}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

          </div>
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F19]/90 backdrop-blur-2xl border-t border-white/5 py-4 px-6">
           <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="hidden md:flex items-center gap-4">
                 <img src={job.logo} className="h-10 w-10 rounded-xl object-cover border border-white/10" />
                 <div>
                    <h3 className="font-black text-white text-sm truncate max-w-[200px]">{job.title}</h3>
                    <p className="text-[10px] text-primary font-bold">{job.company}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <Button variant="outline" className="h-12 w-12 p-0 rounded-xl border-white/10 hover:bg-white/5">
                    <BookmarkPlus className="h-5 w-5 text-slate-300" />
                 </Button>
                 <Dialog>
                    <DialogTrigger asChild>
                       <Button className="h-12 px-10 rounded-xl bg-gradient-primary text-primary-foreground font-black uppercase text-[11px] tracking-widest shadow-glow-primary">
                          Ứng tuyển ngay
                       </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm rounded-[2rem] bg-[#0D1222] border border-white/10 text-slate-200">
                       {!isAppliedSuccess ? (
                          <div className="space-y-6 p-2">
                             <h2 className="text-xl font-black text-white uppercase italic">Nộp đơn ứng tuyển</h2>
                             <div className="space-y-3">
                                {[
                                   { id: 1, name: "Java_Developer_CV_2024.pdf" },
                                   { id: 2, name: "Fullstack_Engineer_CV.pdf" }
                                ].map(cv => (
                                   <button 
                                      key={cv.id}
                                      onClick={() => setSelectedResumeId(cv.id)}
                                      className={cn(
                                         "w-full text-left p-4 rounded-xl border transition-all text-sm",
                                         selectedResumeId === cv.id ? "bg-primary/20 border-primary text-white" : "bg-white/5 border-white/5 text-slate-400"
                                      )}
                                   >
                                      <span className="font-bold">{cv.name}</span>
                                   </button>
                                ))}
                             </div>
                             <Button onClick={handleApply} className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px]" disabled={isApplying}>
                                {isApplying ? "Đang nộp..." : "Xác nhận nộp đơn"}
                             </Button>
                          </div>
                       ) : (
                          <div className="text-center py-6 space-y-4">
                             <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                             <h2 className="text-lg font-black text-white">Nộp đơn thành công!</h2>
                             <Button className="w-full h-12 rounded-xl bg-primary text-white font-black text-xs" onClick={() => navigate("/applications")}>Quản lý ứng tuyển</Button>
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
