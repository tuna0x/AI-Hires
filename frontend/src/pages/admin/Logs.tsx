import { useState } from "react";
import { Search, Filter, ShieldCheck, AlertCircle, Info, RefreshCw, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const INITIAL_LOGS = [
  { id: 1, time: "12:42:15", level: "SUCCESS", event: "Đã phân tích CV", detail: "user_8821 · điểm 87 · Nguyen_Van_An_CV.pdf" },
  { id: 2, time: "12:39:10", level: "INFO", event: "Khởi tạo phỏng vấn", detail: "user_8821 · session-123 · 8 câu hỏi" },
  { id: 3, time: "12:31:05", level: "WARN", event: "Cập nhật trọng số chấm điểm", detail: "quản trị viên · từ khóa 22% → 25%" },
  { id: 4, time: "12:18:42", level: "SUCCESS", event: "Đã phân tích CV", detail: "user_2117 · điểm 72 · Tran_Thanh_CV.pdf" },
  { id: 5, time: "12:10:00", level: "WARN", event: "Cập nhật cấu hình câu hỏi", detail: "quản trị viên · câu trung bình 3 → 4" },
  { id: 6, time: "11:55:23", level: "DANGER", event: "Lỗi kết nối RabbitMQ", detail: "ResumeScanWorker · Reconnecting in 5s" }
];

export default function Logs() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case "SUCCESS": return "bg-emerald-500/10 text-emerald-500";
      case "WARN": return "bg-amber-500/10 text-amber-500";
      case "DANGER": return "bg-destructive/10 text-destructive";
      default: return "bg-blue-500/10 text-blue-500";
    }
  };

  const getIcon = (level: string) => {
    switch (level) {
      case "SUCCESS": return <ShieldCheck className="h-4 w-4" />;
      case "WARN": return <AlertCircle className="h-4 w-4" />;
      case "DANGER": return <AlertCircle className="h-4 w-4 animate-pulse" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.event.toLowerCase().includes(search.toLowerCase()) || l.detail.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filterLevel === "ALL" || l.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-1.5 bg-primary rounded-full" />
             <h2 className="text-2xl font-black text-foreground tracking-tight">Audit Logs</h2>
          </div>
          <p className="text-muted-foreground text-sm font-medium ml-4 uppercase tracking-widest opacity-80">Nhật ký hoạt động hệ thống thời gian thực</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 p-6 rounded-[2rem] bg-card border border-border/60 shadow-soft">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Tìm kiếm nội dung nhật ký..." 
            className="pl-12 rounded-xl border-border bg-background/50 h-11 text-[13px] focus-visible:ring-primary/20" 
          />
        </div>

        <div className="flex gap-4">
          <div className="flex gap-1 p-1 rounded-xl bg-background border border-border overflow-x-auto">
             {["ALL", "SUCCESS", "INFO", "WARN", "DANGER"].map((l) => (
               <Button 
                key={l}
                variant={filterLevel === l ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterLevel(l)}
                className={cn("h-9 rounded-lg text-[10px] font-black uppercase tracking-widest", filterLevel === l && "bg-primary text-primary-foreground")}
               >
                 {l}
               </Button>
             ))}
          </div>
          <Button onClick={() => { setLogs(INITIAL_LOGS); toast.success("Đã làm mới logs"); }} variant="outline" className="h-11 w-11 p-0 rounded-xl border-border bg-background/50 hover:bg-accent shrink-0 transition-all active:scale-95">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Log List */}
      <div className="rounded-[2.5rem] border border-border/60 overflow-hidden bg-card shadow-card">
        <div className="overflow-x-auto">
          <div className="divide-y divide-border/20">
            {filteredLogs.length > 0 ? filteredLogs.map((r) => (
              <div key={r.id} className="grid grid-cols-1 sm:grid-cols-[120px_140px_1fr] items-center gap-6 px-8 py-6 text-xs hover:bg-muted/10 transition-all duration-300">
                <span className="text-muted-foreground font-black tracking-widest flex items-center gap-3 opacity-60">
                   <Clock className="h-3.5 w-3.5 text-primary" /> {r.time}
                </span>
                <Badge className={cn(
                  "rounded-lg py-1.5 px-4 font-black w-32 flex items-center justify-center gap-2 border-none tracking-widest", 
                  getBadgeStyle(r.level)
                )}>
                  {getIcon(r.level)} {r.level}
                </Badge>
                <div className="flex flex-col gap-1">
                   <span className="font-bold text-foreground text-[13px] tracking-tight">{r.event}</span>
                   <span className="text-muted-foreground text-[11px] font-medium opacity-80">{r.detail}</span>
                </div>
              </div>
            )) : (
              <div className="p-20 text-center space-y-4">
                 <div className="text-4xl opacity-20">🔍</div>
                 <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Không có dữ liệu phù hợp</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}