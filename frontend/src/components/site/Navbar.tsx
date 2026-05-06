import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Sparkles, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

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
          <span className="text-foreground">Career<span className="text-primary">AI</span></span>
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
            <>
              <span className="text-sm text-muted-foreground max-w-[160px] truncate">{user.email}</span>
              <Button variant="ghost" onClick={handleSignOut}><LogOut className="h-4 w-4" /> Đăng xuất</Button>
              <Button asChild className="bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-glow transition-shadow">
                <Link to="/dashboard">Tổng quan</Link>
              </Button>
            </>
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