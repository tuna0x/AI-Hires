import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Sliders, ListChecks, Layers, ScrollText, Sparkles, ArrowLeft, Bell, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  { to: "/admin/scoring", label: "Quy tắc chấm điểm CV", icon: Sliders, desc: "Cấu hình trọng số các tiêu chí đánh giá ATS" },
  { to: "/admin/questions", label: "Cấu hình câu hỏi", icon: ListChecks, desc: "Thiết lập câu lệnh hệ thống sinh câu hỏi" },
  { to: "/admin/skills", label: "Danh mục kỹ năng", icon: Layers, desc: "Quản lý nhãn kỹ năng dùng trong phỏng vấn" },
  { to: "/admin/logs", label: "Nhật ký hệ thống", icon: ScrollText, desc: "Theo dõi lịch sử hoạt động của quản trị viên" },
] as const;

export default function AdminLayout() {
  const { pathname } = useLocation();
  const current = ADMIN_TABS.find((t) => pathname.startsWith(t.to)) ?? ADMIN_TABS[0];
  return (
    <>
      <Seo
        title={`${current.label} — Quản trị · NextStep AI`}
        description="Cấu hình trọng số chấm điểm CV, thiết lập sinh câu hỏi phỏng vấn, quản lý phân loại kỹ năng và xem nhật ký hệ thống."
        path={current.to}
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Quản trị", path: "/admin" }, { name: current.label, path: current.to }])}
      />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-secondary/30">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="sticky top-0 z-30 h-16 flex items-center gap-3 border-b border-border/60 bg-background/80 backdrop-blur px-4 lg:px-8">
              <SidebarTrigger />
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-foreground">NextStep AI</Link>
                <span>/</span>
                <Link to="/admin" className="hover:text-foreground">Quản trị</Link>
                <span>/</span>
                <span className="text-foreground font-medium">{current.label}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 h-9 w-64">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input placeholder="Tìm kiếm cài đặt…" className="bg-transparent text-sm outline-none w-full" />
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl"><Bell className="h-4 w-4" /></Button>
                <Button asChild variant="outline" size="sm" className="rounded-xl"><Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Quay lại ứng dụng</Link></Button>
              </div>
            </header>

            <main className="flex-1 p-4 lg:p-8">
              <div className="mx-auto max-w-5xl">
                <div className="flex items-start gap-4 mb-6">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-light text-primary shrink-0"><current.icon className="h-6 w-6" /></span>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{current.label}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{current.desc}</p>
                  </div>
                </div>
                <motion.section
                  key={pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-card rounded-3xl border border-border/60 p-6 lg:p-8 shadow-card"
                >
                  <Outlet />
                </motion.section>
              </div>
            </main>
          </div>
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
    <Sidebar collapsible="icon" className="border-r border-border/60">
      <SidebarHeader className="border-b border-border/60">
        <Link to="/" className="flex items-center gap-2 px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow shrink-0">
            <Sparkles className="h-5 w-5" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-bold text-sm leading-tight">NextStep<span className="text-primary">AI</span></div>
              <div className="text-[11px] text-muted-foreground">Bảng quản trị</div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Cấu hình</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_TABS.map((t) => (
                <SidebarMenuItem key={t.to}>
                  <SidebarMenuButton asChild tooltip={t.label}>
                    <NavLink to={t.to} className={({ isActive }) => cn("flex items-center gap-2", isActive && "bg-primary-light text-primary-dark font-medium")}>
                      <t.icon className="h-4 w-4" />
                      <span>{t.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Lối tắt</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link to="/dashboard"><Settings className="h-4 w-4" /><span>Bảng tổng quan</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/60">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-light text-primary font-semibold text-sm">
              {(user?.email ?? "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">Admin</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Đăng xuất"><LogOut className="h-4 w-4" /></button>
          </div>
        ) : (
          <button onClick={signOut} className="grid h-9 w-9 place-items-center rounded-full bg-primary-light text-primary mx-auto" title="Đăng xuất"><LogOut className="h-4 w-4" /></button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}