import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Sparkles, LogOut, Shield, User as UserIcon, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const links = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/cv-analysis", label: "Phân tích CV" },
  { href: "/interview", label: "Luyện phỏng vấn" },
  // { href: "/pricing", label: "Bảng giá" }, // tạm ẩn
  { href: "/blog", label: "Bài viết" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success("Đã đăng xuất");
    navigate("/");
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 glass"
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-foreground">Intervio<span className="text-primary">.online</span></span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                pathname === l.href
                  ? "text-primary bg-primary-light"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" asChild><Link to="/admin"><Shield className="h-4 w-4" /> Admin</Link></Button>
          )}
          {user ? (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full transition-all hover:opacity-95">
                    <Avatar className="h-9 w-9 border border-primary/20 bg-primary/5 text-primary">
                      <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                        {user.name
                          ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                          : user.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold text-foreground max-w-[120px] truncate hidden md:inline-block">
                      {user.name || user.email.split("@")[0]}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 rounded-2xl border-border/60 shadow-card p-2 bg-card/95 backdrop-blur-md">
                  <DropdownMenuLabel className="px-3 py-2 font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground truncate">{user.name || "Cá nhân"}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                    <Link to="/profile" className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" /> Trang cá nhân
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground">
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> Bảng tổng quan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-xl px-3 py-2 text-xs font-bold cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/login">Đăng nhập</Link></Button>
              <Button asChild className="bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-glow transition-shadow">
                <Link to="/signup">Bắt đầu</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2 rounded-lg hover:bg-muted"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="lg:hidden border-t border-border/40 bg-background"
        >
          <div className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <Button onClick={() => { setOpen(false); handleSignOut(); }} variant="outline" className="w-full mt-2"><LogOut className="h-4 w-4" /> Đăng xuất</Button>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button asChild variant="outline"><Link to="/login" onClick={() => setOpen(false)}>Đăng nhập</Link></Button>
                <Button asChild className="bg-gradient-primary text-primary-foreground"><Link to="/signup" onClick={() => setOpen(false)}>Bắt đầu</Link></Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}