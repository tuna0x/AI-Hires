import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings, Sliders, ListChecks, Layers, ScrollText, Sparkles, 
  ArrowLeft, Bell, Search, LogOut, Users, Briefcase, 
  PlusCircle, PieChart, ClipboardList, ChevronRight, Menu,
  ChevronDown, LayoutDashboard, Database, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const ADMIN_TABS = [
  { to: "/admin/scoring", label: "Quy tắc chấm điểm CV", icon: Sliders, desc: "Cấu hình trọng số ATS" },
  { to: "/admin/questions", label: "Cấu hình câu hỏi", icon: ListChecks, desc: "Thiết lập AI Prompts" },
  { to: "/admin/skills", label: "Danh mục kỹ năng", icon: Layers, desc: "Quản lý nhãn kỹ năng" },
  { to: "/admin/users", label: "Quản lý người dùng", icon: Users, desc: "Phân quyền và tài khoản" },
  { to: "/admin/logs", label: "Nhật ký hệ thống", icon: ScrollText, desc: "Lịch sử hoạt động" },
] as const;

export const HR_TABS = [
  { to: "/admin/hr/dashboard", label: "Bảng quản lý HR", icon: PieChart, desc: "Tổng quan hiệu quả tuyển dụng" },
  { to: "/admin/hr/jobs", label: "Quản lý tin tuyển dụng", icon: Briefcase, desc: "Đăng tin mới và JD" },
  { to: "/admin/hr/applicants", label: "Danh sách ứng viên", icon: ClipboardList, desc: "Sàng lọc và Phỏng vấn" },
] as const;

const ALL_TABS = [...ADMIN_TABS, ...HR_TABS];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const current = ALL_TABS.find((t) => pathname.startsWith(t.to)) ?? ADMIN_TABS[0];

  return (
    <>
      <Seo
        title={`${current.label} — Admin · Intervio`}
        description="Bảng quản trị hệ thống phỏng vấn AI thông minh."
        path={current.to}
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Quản trị", path: "/admin" }, { name: current.label, path: current.to }])}
      />
      
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background font-sans text-foreground selection:bg-primary/30">
          <AdminSidebar />
          
          <main className="flex-1 flex flex-col min-w-0 relative">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 blur-[100px] rounded-full -ml-40 -mb-40 pointer-events-none" />

            {/* Header / Breadcrumb Frame */}
            <header className="h-20 flex items-center justify-between px-8 bg-background/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-40">
              <div className="flex items-center gap-6">
                 <SidebarTrigger className="lg:hidden text-muted-foreground hover:text-primary" />
                 <div className="flex flex-col">
                   <div className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent leading-tight">
                     {current.label}
                   </div>
                   <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
                     Workspace / <span className="text-primary">{current.label}</span>
                   </div>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 h-11 w-72 focus-within:ring-2 ring-primary/20 transition-all group">
                  <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    placeholder="Tìm kiếm nhanh..." 
                    className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground/50" 
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl relative h-10 w-10">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                  </Button>
                  <div className="h-8 w-[1px] bg-white/10 mx-2" />
                  <Button asChild variant="outline" className="border-white/10 bg-white/5 text-xs font-bold rounded-xl hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all px-5 h-10 shadow-soft">
                    <Link to="/" target="_blank">View Site</Link>
                  </Button>
                </div>
              </div>
            </header>

            {/* Content "Frame" Workspace */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
              <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.section
                    key={pathname}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-[calc(100vh-200px)]"
                  >
                    <Outlet />
                  </motion.section>
                </AnimatePresence>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}

function AdminSidebar() {
  const { state } = useSidebar();
  const { user, signOut } = useAuth();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-background/50 backdrop-blur-2xl">
      <SidebarHeader className="h-20 flex items-center px-6 border-b border-white/5">
        <Link to="/admin/hr/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-glow shadow-primary/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-white leading-none">INTERVIO</span>
              <span className="text-[9px] font-bold text-primary tracking-[0.3em] uppercase opacity-80 mt-1">Admin Panel</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-4 py-8 space-y-8">
        {/* SECTION: MAIN */}
        <div className="space-y-2">
          {!collapsed && <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-4 mb-4">Core</div>}
          <SidebarMenu className="gap-1.5">
             <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard" className="h-12 rounded-xl px-2 transition-all hover:bg-white/5">
                  <NavLink to="/admin/hr/dashboard" className={({ isActive }) => cn(
                    "flex items-center gap-4 w-full px-3 h-full rounded-xl transition-all font-bold",
                    isActive ? "text-primary bg-primary/10 border border-primary/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" : "text-muted-foreground hover:text-white"
                  )}>
                    <LayoutDashboard className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
             </SidebarMenuItem>
          </SidebarMenu>
        </div>

        {/* SECTION: RECRUITMENT */}
        <div className="space-y-2">
          {!collapsed && <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-4 mb-4">Tuyển Dụng</div>}
          <SidebarMenu className="gap-1.5">
            {HR_TABS.slice(1).map((t) => (
              <SidebarMenuItem key={t.to}>
                <SidebarMenuButton asChild tooltip={t.label} className="h-12 rounded-xl px-2 transition-all hover:bg-white/5">
                  <NavLink to={t.to} className={({ isActive }) => cn(
                    "flex items-center gap-4 w-full px-3 h-full rounded-xl transition-all font-bold",
                    isActive ? "text-primary bg-primary/10 border border-primary/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" : "text-muted-foreground hover:text-white"
                  )}>
                    <t.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{t.label}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        {/* SECTION: SYSTEM */}
        <div className="space-y-2">
          {!collapsed && <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-4 mb-4">Hệ Thống</div>}
          <SidebarMenu className="gap-1.5">
            {ADMIN_TABS.map((t) => (
              <SidebarMenuItem key={t.to}>
                <SidebarMenuButton asChild tooltip={t.label} className="h-12 rounded-xl px-2 transition-all hover:bg-white/5">
                  <NavLink to={t.to} className={({ isActive }) => cn(
                    "flex items-center gap-4 w-full px-3 h-full rounded-xl transition-all font-bold",
                    isActive ? "text-primary bg-primary/10 border border-primary/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" : "text-muted-foreground hover:text-white"
                  )}>
                    <t.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{t.label}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5 space-y-4">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/20">
              {user.name?.charAt(0) || "A"}
            </div>
            <div className="flex flex-col min-w-0">
               <span className="text-[13px] font-bold text-white truncate">{user.name || "Administrator"}</span>
               <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
            </div>
          </div>
        )}
        
        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center gap-3 h-12 rounded-xl text-muted-foreground font-bold hover:bg-destructive/10 hover:text-destructive transition-all border border-white/10 group"
        >
          <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}