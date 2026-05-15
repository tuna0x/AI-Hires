import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  Users, Layers, ScrollText, ListChecks, Sliders,
  LayoutDashboard, ChevronRight,
  LogOut, ChevronDown, UserCircle,
  PanelLeftClose, PanelLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarProvider, useSidebar, SidebarInset
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";

interface TabDef {
  to: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  permission?: string; // undefined = visible to all users in admin layout
}

const HR_TABS: TabDef[] = [
  { to: "/admin/hr/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "view:hr:dashboard" },
  { to: "/admin/hr/jobs", label: "Tin tuyển dụng", icon: Layers, permission: "manage:jobs" },
  { to: "/admin/hr/applicants", label: "Ứng viên", icon: Users, permission: "manage:applicants" },
];

const ADMIN_TABS: TabDef[] = [
  { to: "/admin/scoring", label: "Cấu hình Điểm số", icon: Sliders, permission: "manage:scoring" },
  { to: "/admin/questions", label: "Bộ câu hỏi AI", icon: ListChecks, permission: "manage:questions" },
  { to: "/admin/skills", label: "Kỹ năng chuyên môn", icon: Layers, permission: "manage:skills" },
  { to: "/admin/users", label: "Nhân sự & Phân quyền", icon: Users, permission: "manage:users" },
  { to: "/admin/logs", label: "Nhật ký hệ thống", icon: ScrollText, permission: "view:logs" },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Super Admin",
  SUPER_ADMIN: "Super Admin",
  HR: "HR Manager",
  RECRUITER: "Recruiter",
};

export default function AdminLayout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
        <AdminSidebar />
        <SidebarInset className="flex flex-col min-w-0 overflow-hidden relative bg-background">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-[1440px] mx-auto min-h-full">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AdminHeader() {
  const location = useLocation();
  const { user } = useAuth();
  const allTabs = [...HR_TABS, ...ADMIN_TABS];
  const current = allTabs.find((t) => t.to === location.pathname);

  return (
    <header className="h-16 border-b border-border/50 flex items-center justify-between px-10 bg-background/80 backdrop-blur-md z-30">
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground uppercase tracking-widest overflow-hidden">
          <span className="hidden sm:inline">Quản trị</span>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-foreground truncate">{current?.label || "Hệ thống"}</span>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-[11px] font-bold text-foreground">
            {user?.name || user?.email || "Admin"}
          </span>
          <span className="text-[9px] text-primary font-black uppercase tracking-tighter">
            {ROLE_LABELS[user?.role ?? ""] || user?.role || "Admin"}
          </span>
        </div>
        <div className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-soft overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <UserCircle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>
    </header>
  );
}

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const { hasPermission } = usePermission();
  const collapsed = state === "collapsed";

  // Filter tabs based on user permissions. ADMIN/SUPER_ADMIN bypass in usePermission.
  const visibleHrTabs = HR_TABS.filter((t) => !t.permission || hasPermission(t.permission));
  const visibleAdminTabs = ADMIN_TABS.filter((t) => !t.permission || hasPermission(t.permission));

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  function SidebarItem({ to, label, icon: Icon }: TabDef) {
    const isActive = location.pathname === to;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={label}
          className={cn(
            "h-11 rounded-xl transition-all duration-200",
            collapsed ? "px-0 justify-center" : "px-3",
            isActive
              ? "bg-primary text-primary-foreground font-bold shadow-glow shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50 font-medium"
          )}
        >
          <Link to={to} className={cn("flex items-center", collapsed ? "justify-center w-full" : "gap-3")}>
            <Icon className={cn("h-5 w-5 shrink-0 transition-transform", isActive ? "text-inherit scale-110" : "text-primary/70")} />
            {!collapsed && <span className="text-[13px] tracking-tight truncate">{label}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/50 bg-sidebar-background transition-all duration-300 z-40"
      style={{ "--sidebar-width-icon": "80px" } as React.CSSProperties}
    >
      <SidebarHeader
        className={cn(
          "border-b border-border/50 bg-sidebar-background relative group transition-all",
          collapsed
            ? "h-24 flex flex-col items-center justify-center gap-2 px-0"
            : "h-16 flex items-center px-6"
        )}
      >
        <div className={cn("flex items-center transition-all", collapsed ? "flex-col gap-3" : "w-full justify-between")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 min-w-[36px] rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow shadow-primary/10 transition-transform active:scale-95">
              <span className="font-black text-primary-foreground text-sm">A</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="font-black text-sm tracking-tighter leading-none">INTERVIO</span>
                <span className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5 opacity-80">
                  Workspace
                </span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "text-muted-foreground hover:text-foreground transition-all rounded-lg",
              collapsed ? "h-8 w-8 opacity-40 hover:opacity-100 bg-accent/30" : "h-8 w-8 opacity-60"
            )}
          >
            {state === "expanded" ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("gap-6 transition-all", collapsed ? "p-0" : "p-3")}>
        {/* CORE: Dashboard */}
        {visibleHrTabs.length > 0 && (
          <SidebarGroup className={cn(collapsed && "px-0")}>
            {!collapsed && (
              <SidebarGroupLabel className="px-3 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mb-3">
                Tổng quan
              </SidebarGroupLabel>
            )}
            <SidebarMenu className={cn("gap-2", collapsed && "items-center")}>
              <SidebarItem {...visibleHrTabs[0]} />
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* RECRUITMENT */}
        {visibleHrTabs.slice(1).length > 0 && (
          <SidebarGroup className={cn(collapsed && "px-0")}>
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer px-3 mb-2">
                  {!collapsed ? (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tuyển Dụng</span>
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=closed]/collapsible:-rotate-90" />
                    </>
                  ) : (
                    <div className="h-[1px] w-full bg-border/40" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarMenu className={cn("gap-2", collapsed && "items-center")}>
                  {visibleHrTabs.slice(1).map((t) => (
                    <SidebarItem key={t.to} {...t} />
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* SYSTEM */}
        {visibleAdminTabs.length > 0 && (
          <SidebarGroup className={cn(collapsed && "px-0")}>
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer px-3 mb-2">
                  {!collapsed ? (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hệ Thống</span>
                      <ChevronDown className="h-3 w-3 transition-transform group-data-[state=closed]/collapsible:-rotate-90" />
                    </>
                  ) : (
                    <div className="h-[1px] w-full bg-border/40" />
                  )}
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarMenu className={cn("gap-2", collapsed && "items-center")}>
                  {visibleAdminTabs.map((t) => (
                    <SidebarItem key={t.to} {...t} />
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className={cn(
                "h-11 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
                collapsed ? "px-0 justify-center" : "px-3 gap-3"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="text-[13px] font-bold">Đăng xuất</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}