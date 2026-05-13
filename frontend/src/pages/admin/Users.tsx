import { useState } from "react";
import { Users, UserPlus, Shield, User, Lock, Unlock, Check, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

// Mock dữ liệu người dùng hệ thống
const INITIAL_USERS = [
  { id: 1, name: "Nguyễn Văn An", email: "an.nguyen@gmail.com", role: "CANDIDATE", status: "ACTIVE", lastActive: "10 phút trước" },
  { id: 2, name: "Phạm Hồng Phúc", email: "phuc.pham@intervio.com", role: "HR", status: "ACTIVE", lastActive: "2 giờ trước" },
  { id: 3, name: "Trần Anh Tú", email: "tu.tran@admin.intervio", role: "ADMIN", status: "ACTIVE", lastActive: "Hôm qua" },
  { id: 4, name: "Lê Minh Tuấn", email: "tuan.le@outlook.com", role: "CANDIDATE", status: "LOCKED", lastActive: "5 ngày trước" },
];

export default function AdminUsers() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");

  const handleToggleStatus = (id: number) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const newStatus = u.status === "ACTIVE" ? "LOCKED" : "ACTIVE";
        toast.success(`Đã ${newStatus === "ACTIVE" ? "mở khóa" : "khóa"} tài khoản ${u.name}`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const handleChangeRole = (id: number, newRole: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        toast.success(`Đã thay đổi vai trò của ${u.name} thành ${newRole}`);
        return { ...u, role: newRole };
      }
      return u;
    }));
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <Seo title="Quản lý Người dùng — Admin Intervio" description="Quản lý tài khoản, thay đổi quyền truy cập, kích hoạt hoặc khóa tài khoản của người dùng." path="/admin/users" />
      <div className="space-y-8 pb-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-1">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1.5 bg-primary rounded-full shadow-glow shadow-primary/20" />
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">Cơ sở người dùng</h2>
              <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">Quản lý quyền & Trạng thái tài khoản</p>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-[1.25rem] h-12 px-8 font-black text-xs shadow-glow shadow-primary/20 flex items-center gap-2 transition-all active:scale-95">
            <UserPlus className="h-4 w-4" /> Thêm người dùng
          </Button>
        </div>

        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="flex flex-col md:flex-row gap-4 p-6 rounded-[2.5rem] bg-white/5 border border-white/5 shadow-soft">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Tìm kiếm theo tên, email..." 
              className="pl-12 rounded-2xl border-white/10 bg-white/5 h-12 text-[13px] focus-visible:ring-primary/20" 
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="h-12 pl-12 pr-10 text-[13px] font-bold rounded-2xl border border-white/10 bg-[#0B0F19] text-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[180px] w-full"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="ADMIN">Quản trị viên</option>
                <option value="HR">Nhà tuyển dụng</option>
                <option value="CANDIDATE">Ứng viên</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bảng danh sách người dùng */}
        <div className="rounded-[2.5rem] border border-white/5 overflow-hidden bg-white/5 shadow-elegant">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Họ và tên</th>
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Email liên hệ</th>
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Vai trò truy cập</th>
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Trạng thái</th>
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Hoạt động</th>
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shadow-soft border border-primary/20">
                          {u.name.slice(0, 1)}
                        </div>
                        <span className="font-bold text-white group-hover:text-primary transition-colors text-[14px]">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-[13px] font-medium text-white/60">{u.email}</td>
                    <td className="p-6">
                      <select 
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className="h-9 px-4 rounded-xl border border-white/10 bg-white/5 text-[12px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <option value="CANDIDATE">Ứng viên</option>
                        <option value="HR">HR Recruitment</option>
                        <option value="ADMIN">System Admin</option>
                      </select>
                    </td>
                    <td className="p-6">
                      <Badge className={cn(
                        "rounded-lg px-3 py-1 text-[9px] font-black tracking-widest border-0",
                        u.status === "ACTIVE" 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : "bg-destructive/10 text-destructive"
                      )}>
                        {u.status === "ACTIVE" ? "ACTIVE" : "LOCKED"}
                      </Badge>
                    </td>
                    <td className="p-6 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{u.lastActive}</td>
                    <td className="p-6 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleStatus(u.id)}
                        className={cn(
                          "h-10 w-10 rounded-xl transition-all",
                          u.status === "ACTIVE" 
                            ? "text-white/40 hover:text-destructive hover:bg-destructive/10" 
                            : "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                        )}
                        title={u.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      >
                        {u.status === "ACTIVE" ? <Lock className="h-4 w-4" /> : <Unlock className="h-5 w-5" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
