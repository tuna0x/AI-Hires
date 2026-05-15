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
      <div className="space-y-8 pb-10 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <div className="h-10 w-1.5 bg-primary rounded-full" />
               <h2 className="text-2xl font-black text-foreground tracking-tight">Cơ sở người dùng</h2>
            </div>
            <p className="text-muted-foreground text-sm font-medium ml-4 uppercase tracking-widest opacity-80">Quản lý quyền & Trạng thái tài khoản</p>
          </div>
          <Button className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl h-11 px-8 font-black text-xs shadow-glow shadow-primary/20 flex items-center gap-2 transition-all active:scale-95">
            <UserPlus className="h-4 w-4" /> Thêm người dùng
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 p-6 rounded-[2rem] bg-card border border-border/60 shadow-soft">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Tìm kiếm theo tên, email..." 
              className="pl-12 rounded-xl border-border bg-background/50 h-11 text-[13px] focus-visible:ring-primary/20" 
            />
          </div>

          <div className="flex gap-4">
             <div className="flex gap-1 p-1 rounded-xl bg-background border border-border">
                {["ALL", "ADMIN", "HR", "CANDIDATE"].map((r) => (
                  <Button 
                    key={r}
                    variant={filterRole === r ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterRole(r)}
                    className={cn("h-9 rounded-lg text-[10px] font-black uppercase tracking-widest", filterRole === r && "bg-primary text-primary-foreground")}
                  >
                    {r}
                  </Button>
                ))}
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-[2rem] border border-border/60 overflow-hidden bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-background/40">
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Người dùng</th>
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Vai trò</th>
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Trạng thái</th>
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Hoạt động</th>
                  <th className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredUsers.map((u) => (
                   <tr key={u.id} className="group hover:bg-muted/10 transition-all duration-300">
                     <td className="p-6">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center font-black text-primary text-sm">
                             {u.name.slice(0, 1)}
                           </div>
                           <div className="flex flex-col">
                             <span className="font-bold text-foreground group-hover:text-primary transition-colors text-[14px]">{u.name}</span>
                             <span className="text-[11px] text-muted-foreground">{u.email}</span>
                           </div>
                        </div>
                     </td>
                     <td className="p-6 text-[12px] font-bold text-foreground/80">{u.role}</td>
                     <td className="p-6">
                        <Badge className={cn(
                          "rounded-lg px-2 py-0.5 text-[9px] font-black tracking-widest border-none transition-colors",
                          u.status === "ACTIVE" 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-destructive/10 text-destructive"
                        )}>
                          {u.status}
                        </Badge>
                     </td>
                     <td className="p-6 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{u.lastActive}</td>
                     <td className="p-6 text-right">
                        <div className="flex justify-end gap-2">
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleToggleStatus(u.id)}
                            className={cn(
                              "h-9 w-9 rounded-lg transition-all",
                              u.status === "ACTIVE" 
                                ? "text-muted-foreground hover:text-destructive hover:bg-destructive/5" 
                                : "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                            )}
                           >
                             {u.status === "ACTIVE" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                           </Button>
                        </div>
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
