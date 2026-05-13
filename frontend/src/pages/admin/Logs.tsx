import { useState } from "react";
import { Search, Filter, ShieldCheck, AlertCircle, Info, RefreshCw, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_LOGS = [
  { id: 1, time: "12:42:15", level: "SUCCESS", event: "Đã phân tích CV", detail: "user_8821 · điểm 87 · Nguyen_Van_An_CV.pdf" },
  { id: 2, time: "12:39:10", level: "INFO", event: "Khởi tạo phỏng vấn", detail: "user_8821 · session-123 · 8 câu hỏi" },
  { id: 3, time: "12:31:05", level: "WARN", event: "Cập nhật trọng số chấm điểm", detail: "quản trị viên · từ khóa 22% → 25%" },
  { id: 4, time: "12:18:42", level: "SUCCESS", event: "Đã phân tích CV", detail: "user_2117 · điểm 72 · Tran_Thanh_CV.pdf" },
  { id: 5, time: "12:10:00", level: "WARN", event: "Cập nhật cấu hình câu hỏi", detail: "quản trị viên · câu trung bình 3 → 4" },
  { id: 6, time: "11:55:23", level: "DANGER", event: "Lỗi kết nối RabbitMQ", detail: "ResumeScanWorker · Reconnecting in 5s" }
];

import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Logs() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case "SUCCESS": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "WARN": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "DANGER": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
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
    <div className="space-y-10 pb-10 max-w-6xl mx-auto">
      
      <div className="flex items-center gap-4 px-1">
        <div className="h-10 w-1.5 bg-primary rounded-full shadow-glow shadow-primary/20" />
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">Audit Logs</h2>
          <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">Nhật ký hoạt động hệ thống thời gian thực</p>
        </div>
      </div>

      {/* Tìm kiếm và Bộ lọc */}
      <div className="flex flex-col md:flex-row gap-4 p-8 rounded-[2.5rem] bg-white/5 border border-white/5 shadow-soft">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Tìm kiếm nội dung nhật ký..." 
            className="pl-12 rounded-2xl border-white/10 bg-white/5 h-12 text-[13px] focus-visible:ring-primary/20" 
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select 
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="h-12 pl-12 pr-10 text-[13px] font-bold rounded-2xl border border-white/10 bg-[#0B0F19] text-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[200px] w-full"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="DANGER">DANGER</option>
            </select>
          </div>
          <Button onClick={() => { setLogs(INITIAL_LOGS); toast.success("Đã làm mới danh sách logs"); }} variant="outline" className="h-12 w-12 p-0 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 shrink-0 transition-all active:scale-95">
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Bảng Logs */}
      <div className="rounded-[2.5rem] border border-white/5 overflow-hidden bg-white/5 shadow-elegant">
        <div className="overflow-x-auto">
          <div className="divide-y divide-white/5">
            {filteredLogs.length > 0 ? filteredLogs.map((r) => (
              <div key={r.id} className="grid grid-cols-1 md:grid-cols-[140px_140px_1fr_auto] items-center gap-6 px-10 py-6 text-xs hover:bg-white/[0.03] transition-all duration-300">
                <span className="text-muted-foreground font-black tracking-widest flex items-center gap-3 opacity-60">
                   <Clock className="h-4 w-4 text-primary" /> {r.time}
                </span>
                <Badge className={cn(
                  "rounded-lg py-1.5 px-4 font-black w-32 flex items-center justify-center gap-2 border-0 tracking-widest", 
                  getBadgeStyle(r.level)
                )}>
                  {getIcon(r.level)} {r.level}
                </Badge>
                <div className="flex flex-col gap-1">
                   <span className="font-black text-white text-[13px] tracking-tight">{r.event}</span>
                   <span className="text-muted-foreground text-[11px] font-medium opacity-80">{r.detail}</span>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group/arrow cursor-pointer hover:bg-primary/20 transition-all text-white/40 hover:text-primary">
                    <AlertCircle className="h-4 w-4" />
                </div>
              </div>
            )) : (
              <div className="p-20 text-center space-y-4">
                 <div className="text-4xl">🔍</div>
                 <div className="text-muted-foreground font-bold uppercase tracking-widest">Không tìm thấy nhật ký tương ứng</div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}