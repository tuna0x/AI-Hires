import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Loader2,
  Award,
  Trophy,
  Activity,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Cpu,
  ArrowRight,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SiteLayout from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth";
import apiClient from "@/api/apiClient";
import { mapResumeToAnalysisResult } from "@/lib/cvMapper";
import { cvStore } from "@/lib/store";
import { interviewApi } from "@/api/interviewApi";
import { InterviewQuestion, InterviewReport } from "@/types/interview";
import { toast } from "sonner";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const getAnswerStatus = (score: number) => {
  if (score >= 8) {
    return {
      label: "Đạt (Correct / Good)",
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
      desc: "Câu trả lời xuất sắc, trình bày mạch lạc, bám sát yêu cầu chuyên môn và thể hiện kiến thức sâu rộng."
    };
  } else if (score >= 5) {
    return {
      label: "Cần cải thiện (Needs Improvement)",
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      icon: <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />,
      desc: "Câu trả lời đúng hướng nhưng còn sơ sài, thiếu ví dụ thực tế hoặc cần cấu trúc chặt chẽ hơn."
    };
  } else {
    return {
      label: "Chưa đạt / Sai lệch kiến thức (Poor)",
      color: "bg-destructive/10 text-destructive border-destructive/20",
      icon: <XCircle className="h-4 w-4 text-destructive shrink-0" />,
      desc: "Câu trả lời chưa đúng trọng tâm, sai lệch kiến thức hoặc bỏ qua câu hỏi. Cần ôn tập kỹ lại chủ đề này."
    };
  }
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Active Tab State
  const [activeTab, setActiveTab] = useState("info");

  // Info Tab States
  const [profileLoading, setProfileLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [age, setAge] = useState<string | number>("");
  const [gender, setGender] = useState("MALE");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Resume Tab States
  const [resumes, setResumes] = useState<any[]>([]);
  const [resumesLoading, setResumesLoading] = useState(false);

  // Sessions Tab States
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Detailed Modal View States
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // Fetch complete profile on mount
  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      setProfileLoading(true);
      try {
        const response: any = await apiClient.get(`/api/v1/users/${user.id}`);
        if (response?.data) {
          const d = response.data;
          setFullName(d.fullName || "");
          setPhoneNumber(d.phoneNumber || "");
          setAge(d.age || "");
          setGender(d.gender || "MALE");
          setAddress(d.address || "");
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        toast.error("Không thể tải thông tin hồ sơ chi tiết");
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  // Lazy load resumes when clicking on CV history tab
  useEffect(() => {
    if (activeTab === "resumes") {
      loadResumes();
    } else if (activeTab === "sessions") {
      loadSessions();
    }
  }, [activeTab]);

  async function loadResumes() {
    setResumesLoading(true);
    try {
      const response: any = await apiClient.get("/api/v1/resumes/my-resumes");
      if (response?.data) {
        setResumes(response.data);
      }
    } catch (err) {
      console.error("Error loading resumes:", err);
      toast.error("Không thể tải danh sách CV đã lưu");
    } finally {
      setResumesLoading(false);
    }
  }

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const response: any = await apiClient.get("/api/v1/interviews/my-sessions");
      if (response?.data) {
        setSessions(response.data);
      }
    } catch (err) {
      console.error("Error loading sessions:", err);
      toast.error("Không thể tải danh sách phỏng vấn");
    } finally {
      setSessionsLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      await apiClient.put("/api/v1/users", {
        id: user.id,
        fullName,
        phoneNumber,
        age: age ? parseInt(age.toString()) : null,
        gender,
        address,
      });
      toast.success("🎉 Cập nhật thông tin hồ sơ thành công!");
      await refreshUser(); // sync with Navbar names
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi cập nhật hồ sơ, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  }

  function handleViewCvDetails(resume: any) {
    try {
      const result = mapResumeToAnalysisResult(resume);
      cvStore.setResult(result);
      toast.success("📂 Đang tải báo cáo phân tích CV...");
      navigate("/results");
    } catch (err) {
      console.error(err);
      toast.error("Không thể chuyển đổi hoặc mở dữ liệu phân tích của CV này.");
    }
  }

  async function handleViewSessionDetails(session: any) {
    setSelectedSession(session);
    setModalOpen(true);
    setModalLoading(true);
    setReport(null);
    setQuestions([]);
    setExpandedQuestionId(null);
    try {
      const [finalReport, questionList] = await Promise.all([
        interviewApi.getReport(session.id),
        interviewApi.getQuestions(session.id)
      ]);
      setReport(finalReport);
      setQuestions(questionList);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi tải chi tiết phiên phỏng vấn. Có thể phiên này chưa hoàn thành báo cáo.");
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-10">
        
        {/* Profile Premium Banner Header */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 lg:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center text-2xl lg:text-3xl font-extrabold shadow-glow">
              {fullName ? fullName.split(" ").pop()?.slice(0, 2).toUpperCase() : user?.email.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl lg:text-2xl font-extrabold text-foreground flex items-center gap-2">
                {fullName || "Người dùng Intervio"}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  <Sparkles className="h-3 w-3" /> Candidate Pro
                </span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <Badge variant="outline" className="px-3.5 py-1.5 rounded-xl border-border/80 bg-secondary/30 text-foreground">
              Mã ứng viên: #{user?.id}
            </Badge>
          </div>
        </div>

        {/* Tabbed content space */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          
          <TabsList className="bg-muted/40 p-1 border border-border/60 rounded-2xl grid grid-cols-3 max-w-lg">
            <TabsTrigger value="info" className="rounded-xl font-bold text-xs py-2.5 transition-all">
              <User className="h-4 w-4 mr-1.5 shrink-0" /> Hồ sơ cá nhân
            </TabsTrigger>
            <TabsTrigger value="resumes" className="rounded-xl font-bold text-xs py-2.5 transition-all">
              <FileText className="h-4 w-4 mr-1.5 shrink-0" /> Lịch sử quét CV
            </TabsTrigger>
            <TabsTrigger value="sessions" className="rounded-xl font-bold text-xs py-2.5 transition-all">
              <Activity className="h-4 w-4 mr-1.5 shrink-0" /> Phỏng vấn thử
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PERSONAL INFORMATION */}
          <TabsContent value="info">
            <div className="bg-card rounded-3xl border border-border/60 p-6 lg:p-8 shadow-card">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground">Thông tin cá nhân</h2>
                <p className="text-xs text-muted-foreground">Vui lòng cập nhật thông tin chính xác để AI cá nhân hóa câu hỏi phỏng vấn tối ưu nhất.</p>
              </div>

              {profileLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="font-semibold text-xs">Địa chỉ Email (Không thể thay đổi)</Label>
                      <Input id="email" type="email" value={user?.email || ""} disabled className="rounded-xl border-border/60 bg-muted/40 text-muted-foreground h-11 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fullname" className="font-semibold text-xs">Họ và tên của bạn</Label>
                      <Input id="fullname" placeholder="Nhập đầy đủ họ và tên..." value={fullName} onChange={(e) => setFullName(e.target.value)} required className="rounded-xl border-border/80 h-11 text-xs focus-visible:ring-primary/40" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="font-semibold text-xs">Số điện thoại liên hệ</Label>
                      <Input id="phone" placeholder="VD: 0987654321..." value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="rounded-xl border-border/80 h-11 text-xs focus-visible:ring-primary/40" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="age" className="font-semibold text-xs">Tuổi của bạn</Label>
                      <Input id="age" type="number" placeholder="Nhập số tuổi..." value={age} onChange={(e) => setAge(e.target.value)} className="rounded-xl border-border/80 h-11 text-xs focus-visible:ring-primary/40" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gender" className="font-semibold text-xs">Giới tính</Label>
                      <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-border/80 bg-background h-11 text-xs px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                        <option value="MALE">Nam (Male)</option>
                        <option value="FEMALE">Nữ (Female)</option>
                        <option value="OTHER">Khác (Other)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="font-semibold text-xs">Địa chỉ sinh sống / Thường trú</Label>
                    <Input id="address" placeholder="VD: Quận Cầu Giấy, Hà Nội..." value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl border-border/80 h-11 text-xs focus-visible:ring-primary/40" />
                  </div>

                  <div className="border-t border-border/60 pt-6 flex justify-end">
                    <Button type="submit" disabled={saving} className="bg-gradient-primary text-primary-foreground font-bold rounded-xl shadow-glow px-6 text-xs h-11">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang cập nhật...
                        </>
                      ) : (
                        "Lưu thông tin hồ sơ"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: CV SCAN HISTORY */}
          <TabsContent value="resumes">
            <div className="bg-card rounded-3xl border border-border/60 p-6 lg:p-8 shadow-card">
              <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Lịch sử phân tích & chấm điểm CV</h2>
                  <p className="text-xs text-muted-foreground">Tất cả tài liệu sơ yếu lý lịch bạn đã tải lên hệ thống.</p>
                </div>
                <Button asChild size="sm" className="bg-gradient-primary rounded-xl text-xs font-bold">
                  <Link to="/cv-analysis">Tải lên CV mới</Link>
                </Button>
              </div>

              {resumesLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <p className="font-semibold text-sm text-muted-foreground">Chưa phát hiện lịch sử quét CV</p>
                  <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">Vui lòng tải lên CV của bạn tại trang Phân tích CV để nhận báo cáo ATS tức thì.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/60 shadow-soft">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-border/80 bg-secondary/60 font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="p-4">Tên tệp tin</th>
                          <th className="p-4 text-center">Điểm số ATS</th>
                          <th className="p-4">Đánh giá chung</th>
                          <th className="p-4">Ngày tải lên</th>
                          <th className="p-4 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {resumes.map((res) => {
                          let geminiData: any = {};
                          try {
                            geminiData = JSON.parse(res.parsedData);
                          } catch (ex) {}
                          
                          const score = geminiData.total_score || 0;
                          
                          return (
                            <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-4 font-bold text-foreground truncate max-w-[200px]">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary shrink-0" />
                                  <span className="line-clamp-1">{res.fileUrl.split("/").pop()}</span>
                                </div>
                              </td>
                              <td className="p-4 text-center font-extrabold text-sm text-foreground">
                                <Badge className={
                                  score >= 85 
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                    : score >= 70 
                                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                                    : "bg-destructive/10 text-destructive border border-destructive/20"
                                }>
                                  {score}/100
                                </Badge>
                              </td>
                              <td className="p-4 font-medium text-muted-foreground">
                                {score >= 85 ? "CV Xuất Sắc" : score >= 70 ? "CV Khá Tốt — Cần Tối Ưu" : "CV Cần Cải Thiện Nhiều"}
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {new Date(res.createdAt).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </td>
                              <td className="p-4 text-center">
                                <Button size="sm" onClick={() => handleViewCvDetails(res)} className="rounded-xl h-8 px-4 text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-all">
                                  Xem báo cáo <ExternalLink className="ml-1 h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: MOCK INTERVIEW SESSIONS */}
          <TabsContent value="sessions">
            <div className="bg-card rounded-3xl border border-border/60 p-6 lg:p-8 shadow-card">
              <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Lịch sử luyện tập phỏng vấn</h2>
                  <p className="text-xs text-muted-foreground">Danh sách tất cả các phiên mô phỏng phỏng vấn thử AI mà bạn đã thực hiện.</p>
                </div>
                <Button asChild size="sm" className="bg-gradient-primary rounded-xl text-xs font-bold">
                  <Link to="/interview">Tạo phiên mới</Link>
                </Button>
              </div>

              {sessionsLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Activity className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <p className="font-semibold text-sm text-muted-foreground">Chưa phát hiện phiên phỏng vấn nào</p>
                  <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">Hãy bắt đầu một phiên phỏng vấn thử AI mô phỏng 3 tầng dựa trên CV và JD của bạn.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {sessions.map((ses) => {
                    const isFinished = ses.status === "COMPLETED";
                    return (
                      <div key={ses.id} className="rounded-2xl border border-border/60 p-5 bg-secondary/20 hover:border-primary/30 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-[9px] font-bold">
                              ID: #{ses.id}
                            </Badge>
                            <Badge className={isFinished ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20" : "bg-blue-500/15 text-blue-500 border border-blue-500/20"}>
                              {isFinished ? "Đã hoàn tất" : "Đang tiến hành"}
                            </Badge>
                          </div>
                          
                          <h3 className="font-bold text-sm text-foreground line-clamp-1">{ses.jobTitle || "Luyện tập phỏng vấn tự do"}</h3>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground font-semibold">
                            <div>Trình độ: <span className="text-foreground">{ses.difficultyLevel === "EASY" ? "Intern/Fresher" : ses.difficultyLevel === "MEDIUM" ? "Junior/Middle" : "Senior/Lead"}</span></div>
                            <div>Tổng câu: <span className="text-foreground">{ses.totalQuestions}/{ses.maxQuestions}</span></div>
                          </div>
                        </div>

                        <div className="border-t border-border/40 pt-4 flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground">
                            {new Date(ses.startTime).toLocaleDateString("vi-VN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          
                          {isFinished ? (
                            <Button size="sm" onClick={() => handleViewSessionDetails(ses)} className="h-8 rounded-lg bg-primary text-primary-foreground font-bold hover:shadow-glow text-[10px]">
                              Xem đánh giá chi tiết
                            </Button>
                          ) : (
                            <Button size="sm" asChild variant="outline" className="h-8 rounded-lg text-[10px] border-primary/30 text-primary hover:bg-primary/5">
                              <Link to="/interview">Tiếp tục phỏng vấn</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>

        {/* MODAL / DRAWER INTERVIEW DETAIL EVALUATION VIEW */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 lg:p-8 bg-background border-border/60">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> Chi tiết kết quả phỏng vấn phiên #{selectedSession?.id}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Vị trí mục tiêu: {selectedSession?.jobTitle || "Luyện tập phỏng vấn"}. Cấp độ: {selectedSession?.difficultyLevel === "EASY" ? "Intern/Fresher" : selectedSession?.difficultyLevel === "MEDIUM" ? "Junior/Middle" : "Senior/Lead"}.
              </DialogDescription>
            </DialogHeader>

            {modalLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground animate-pulse font-semibold">AI đang tổng hợp và kết xuất báo cáo lịch sử...</p>
              </div>
            ) : report ? (
              <div className="space-y-6">
                
                {/* Circular gauge & summary feedback card */}
                <div className="grid md:grid-cols-[1fr_360px] gap-6">
                  
                  {/* Radar Chart */}
                  <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" /> Phân tích đa tiêu chí (Radar Chart)
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">
                        Biểu đồ mạng nhện đánh giá năng lực phỏng vấn của bạn.
                      </p>
                    </div>

                    <div className="h-[200px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" radius="70%" data={[
                          { criteria: "Độ liên quan", score: questions.reduce((sum, q) => sum + (q.interviewAnswer?.answerScores?.find(s => s.criteria === "RELEVANCE")?.score || 5), 0) / (questions.length || 1) },
                          { criteria: "Chiều sâu", score: questions.reduce((sum, q) => sum + (q.interviewAnswer?.answerScores?.find(s => s.criteria === "DEPTH")?.score || 5), 0) / (questions.length || 1) },
                          { criteria: "Diễn đạt", score: questions.reduce((sum, q) => sum + (q.interviewAnswer?.answerScores?.find(s => s.criteria === "COMMUNICATION")?.score || 5), 0) / (questions.length || 1) },
                          { criteria: "Cấu trúc", score: questions.reduce((sum, q) => sum + (q.interviewAnswer?.answerScores?.find(s => s.criteria === "STRUCTURE")?.score || 5), 0) / (questions.length || 1) },
                        ]}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="criteria" tick={{ fill: "#64748b", fontSize: 9, fontWeight: "bold" }} />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#cbd5e1" />
                          <Radar name="Cá nhân" dataKey="score" stroke="#0066ff" fill="#3b82f6" fillOpacity={0.2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Summary Scores & Pass Decision */}
                  <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft flex flex-col justify-between space-y-4">
                    <div className="text-center">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Điểm tổng kết</div>
                      
                      {/* Gauge */}
                      <div className="relative inline-flex items-center justify-center h-24 w-24 mb-2">
                        <div className="absolute inset-0 rounded-full border-6 border-muted" />
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-extrabold text-primary">
                            {Math.round(report.finalScore)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">/ 100</span>
                        </div>
                      </div>

                      <div>
                        <Badge className={`px-3 py-0.5 text-xs font-bold rounded-full ${
                          report.decision === "PASS" 
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10" 
                            : report.decision === "CONSIDER"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10"
                            : "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/10"
                        }`}>
                          {report.decision === "PASS" ? "PASS" : report.decision === "CONSIDER" ? "CONSIDER" : "FAIL"}
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-secondary/40 border border-border/40 p-3.5 rounded-xl text-[10px] leading-relaxed">
                      <div className="font-bold text-foreground mb-1">AI Đánh giá tổng quan:</div>
                      <p className="text-muted-foreground line-clamp-3">
                        {report.summary}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Insights Panel: Strengths & Weaknesses */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-card rounded-2xl border border-emerald-500/20 p-4.5 shadow-soft">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-2.5 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Điểm mạnh
                    </div>
                    <ul className="space-y-1.5 text-[10px] text-muted-foreground">
                      {report.insights.filter(i => i.type === "STRENGTH").map((ins) => (
                        <li key={ins.id} className="flex items-start gap-1.5">
                          <span className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0 text-[9px]">✓</span>
                          <span>{ins.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-card rounded-2xl border border-amber-500/20 p-4.5 shadow-soft">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-2.5 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> Điểm cần cải thiện
                    </div>
                    <ul className="space-y-1.5 text-[10px] text-muted-foreground">
                      {report.insights.filter(i => i.type === "WEAKNESS").map((ins) => (
                        <li key={ins.id} className="flex items-start gap-1.5">
                          <span className="h-4 w-4 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0 text-[9px]">!</span>
                          <span>{ins.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Dialog Transcript Conversation Accordion list */}
                <div className="space-y-3">
                  <div className="border-t border-border/60 pt-4">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <BookOpen className="h-4.5 w-4.5 text-primary" /> Lịch sử đối thoại & Chấm điểm từng câu hỏi
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">Xem chi tiết câu hỏi, câu trả lời và nhận xét của trợ lý AI cho cả 5 câu phỏng vấn.</p>
                  </div>

                  <div className="space-y-3">
                    {questions.map((q, index) => {
                      const isExpanded = expandedQuestionId === q.id;
                      const score = q.interviewAnswer?.interviewEvaluation?.score || 5;
                      const status = getAnswerStatus(score);

                      return (
                        <div key={q.id} className={`border rounded-2xl overflow-hidden transition-all ${
                          isExpanded ? "border-primary/30 shadow-soft bg-card" : "border-border/60"
                        }`}>
                          <button type="button" onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)} className="w-full text-left p-3.5 flex justify-between items-center bg-secondary/10 hover:bg-secondary/20 transition-all gap-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge className="bg-primary/10 text-primary border border-primary/10 hover:bg-primary/10 text-[9px] font-bold">Câu {index + 1}</Badge>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border ${status.color}`}>
                                  {status.label.split(" (")[0]}
                                </span>
                              </div>
                              <p className="font-bold text-xs text-foreground line-clamp-1">{q.questionText}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-extrabold text-foreground bg-primary/5 px-2 py-1 rounded-lg border border-border/40">{score}/10</span>
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-4 border-t border-border/40 bg-card/40 space-y-3 text-[10px]">
                              <div>
                                <span className="font-bold text-foreground">Câu hỏi của AI:</span>
                                <p className="text-foreground p-3.5 rounded-xl bg-secondary/20 border border-border/40 mt-1 font-medium">{q.questionText}</p>
                              </div>
                              <div>
                                <span className="font-bold text-muted-foreground">Câu trả lời của bạn:</span>
                                <p className="text-muted-foreground p-3.5 rounded-xl bg-secondary/40 border border-border/60 mt-1 whitespace-pre-wrap leading-relaxed">{q.interviewAnswer?.answerText || "Không có phản hồi."}</p>
                              </div>
                              
                              {q.interviewAnswer?.interviewEvaluation && (
                                <div className="p-3 rounded-xl border border-primary/10 bg-primary/5 space-y-1.5">
                                  <div className="font-bold text-primary flex items-center gap-1">
                                    <Cpu className="h-3.5 w-3.5 text-primary" /> Phân tích nhận xét từ AI:
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{q.interviewAnswer.interviewEvaluation.feedback}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 space-y-2">
                <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
                <p className="font-semibold text-sm">Không thể kết xuất báo cáo phỏng vấn</p>
                <p className="text-xs text-muted-foreground">Có thể phiên phỏng vấn này chưa được hoàn thành hoặc có lỗi phân tích từ AI.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </SiteLayout>
  );
}
