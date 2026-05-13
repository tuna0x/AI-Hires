import { useState } from "react";
import { Link } from "react-router-dom";
import { CloudUpload, FileText, Calendar, Trash2, ArrowRight, Star, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Seo, breadcrumbLd } from "@/lib/seo";

// Mock data CV đã tải lên
const MOCK_RESUMES = [
  {
    id: 1,
    name: "Nguyen_Van_An_Java_Developer_CV.pdf",
    uploadedAt: "3 ngày trước",
    size: "2.4 MB",
    score: 85,
    status: "Parsed",
    details: {
      formatting: 90,
      keywords: 80,
      experience: 85,
      skills: 85,
      readability: 90,
    }
  },
  {
    id: 2,
    name: "Nguyen_Van_An_Fullstack_Engineer.pdf",
    uploadedAt: "1 tuần trước",
    size: "3.1 MB",
    score: 72,
    status: "Parsed",
    details: {
      formatting: 75,
      keywords: 70,
      experience: 75,
      skills: 65,
      readability: 80,
    }
  }
];

export default function MyResumes() {
  const [resumes, setResumes] = useState(MOCK_RESUMES);
  const [activeResume, setActiveResume] = useState<any>(MOCK_RESUMES[0]);

  const handleDelete = (id: number) => {
    setResumes(resumes.filter(r => r.id !== id));
    toast.success("Đã xóa CV thành công");
    if (activeResume?.id === id) {
      setActiveResume(resumes.find(r => r.id !== id) || null);
    }
  };

  return (
    <>
      <Seo
        title="Tủ hồ sơ CV của tôi — Intervio"
        description="Quản lý kho CV cá nhân, kiểm tra và phân tích mức độ tương thích ATS với hệ thống trí tuệ nhân tạo."
        path="/my-resumes"
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "CV của tôi", path: "/my-resumes" }])}
      />
      <div className="min-h-screen bg-[#0B0F19] text-foreground pb-20">
        <div className="mx-auto max-w-6xl px-4 pt-10">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Tủ hồ sơ của tôi</h1>
              <p className="text-sm text-muted-foreground mt-1">Lưu trữ, cập nhật và xem điểm phân tích chất lượng ATS cho từng bản CV.</p>
            </div>
            
            {/* Điểm tổng hợp trung bình */}
            <div className="flex items-center gap-3 bg-[#13192B] border border-border/60 p-4 rounded-3xl shrink-0">
              <Sparkles className="h-6 w-6 text-primary animate-bounce" />
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Điểm ATS Trung bình</span>
                <div className="text-xl font-black text-foreground">78.5 <span className="text-xs text-muted-foreground">/ 100</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cột trái: Tải lên & Danh sách CV */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Vùng kéo thả tải lên */}
              <div className="border border-dashed border-border/50 bg-[#111627]/60 hover:border-primary/40 transition-colors p-8 rounded-3xl text-center space-y-3 cursor-pointer group">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <CloudUpload className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold">Tải lên CV mới của bạn</h3>
                  <p className="text-xs text-muted-foreground">Chấp nhận file .pdf, .docx (Dưới 10MB)</p>
                </div>
                <Button className="bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground text-xs font-semibold rounded-xl h-9 px-4">
                  Chọn tập tin
                </Button>
              </div>

              {/* Danh sách các CV */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Tài liệu đã tải lên ({resumes.length})</h3>
                <div className="space-y-2">
                  {resumes.map((res) => (
                    <div 
                      key={res.id}
                      onClick={() => setActiveResume(res)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${activeResume?.id === res.id ? "bg-[#18213A] border-primary/40 shadow-card" : "bg-card border-border/40 hover:bg-secondary/20"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${activeResume?.id === res.id ? "bg-primary-light text-primary" : "bg-secondary text-muted-foreground"}`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-xs font-bold truncate pr-2">{res.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{res.size}</span>
                            <span>•</span>
                            <span>{res.uploadedAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Badge className={`rounded-lg h-6 px-1.5 font-bold ${res.score >= 80 ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>{res.score}đ</Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Cột Phải: Phân tích chất lượng ATS chi tiết */}
            <div className="lg:col-span-2">
              {activeResume ? (
                <div className="rounded-3xl border border-border/50 bg-card p-6 lg:p-8 shadow-card space-y-6">
                  
                  {/* Header chi tiết CV */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black truncate max-w-sm">{activeResume.name}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Đã phân tích vào {activeResume.uploadedAt}</p>
                      </div>
                    </div>

                    <Button asChild className="bg-primary hover:bg-primary-dark rounded-xl h-10 px-5 text-xs font-bold shadow-lg shadow-primary/10">
                      <Link to="/jobs">Tìm việc phù hợp <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                    </Button>
                  </div>

                  {/* Thanh biểu diễn điểm ATS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-secondary/20 border border-border/40 p-6 rounded-3xl">
                    <div className="md:col-span-1 text-center md:text-left space-y-1">
                      <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Đánh giá chung</span>
                      <h3 className={`text-2xl font-black ${activeResume.score >= 80 ? "text-green-500" : "text-yellow-500"}`}>
                        {activeResume.score >= 80 ? "Rất Cạnh Tranh" : "Cần Hoàn Thiện Thêm"}
                      </h3>
                      <p className="text-xs text-muted-foreground">CV này của bạn đạt chất lượng tốt để vượt qua bộ lọc ATS của hầu hết các doanh nghiệp lớn.</p>
                    </div>

                    <div className="md:col-span-2 flex flex-col items-center justify-center space-y-2 border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-black text-primary">{activeResume.score}</span>
                        <span className="text-xs text-muted-foreground font-semibold">/100 điểm</span>
                      </div>
                      <Progress value={activeResume.score} className="h-2 w-full max-w-xs" />
                    </div>
                  </div>

                  {/* Chi tiết thành phần ATS */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-bold flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Điểm thành phần phân tích ATS</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-border/40 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Định dạng & Bố cục</span>
                          <span className="text-green-500">{activeResume.details.formatting}%</span>
                        </div>
                        <Progress value={activeResume.details.formatting} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Bố cục 1 cột rõ ràng, không sử dụng bảng lồng nhau giúp AI đọc hiểu 100%.</p>
                      </div>

                      <div className="border border-border/40 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Kinh nghiệm làm việc</span>
                          <span className="text-green-500">{activeResume.details.experience}%</span>
                        </div>
                        <Progress value={activeResume.details.experience} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Sử dụng nhiều động từ hành động mạnh mẽ và dẫn chứng kết quả bằng số liệu.</p>
                      </div>

                      <div className="border border-border/40 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Từ khóa chuyên môn</span>
                          <span className="text-yellow-500">{activeResume.details.keywords}%</span>
                        </div>
                        <Progress value={activeResume.details.keywords} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Bạn có thể bổ sung thêm các từ khóa như "CI/CD", "Redis", hoặc "Unit Testing" để tối ưu hơn.</p>
                      </div>

                      <div className="border border-border/40 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Khả năng đọc hiểu</span>
                          <span className="text-green-500">{activeResume.details.readability}%</span>
                        </div>
                        <Progress value={activeResume.details.readability} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Độ dài tóm tắt lý tưởng, phân chia các đề mục chính phụ mạch lạc, trực quan.</p>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-20 rounded-3xl border border-dashed border-border/60 bg-card/40 flex flex-col items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm font-medium">Bạn chưa tải lên CV nào trong tài khoản.</p>
                  <p className="text-xs text-muted-foreground mt-1">Vui lòng kéo thả hoặc bấm nút tải lên ở cột bên trái.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
