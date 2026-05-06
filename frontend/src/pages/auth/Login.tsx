import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

export default function Login() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={next} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Chào mừng trở lại");
    navigate(next, { replace: true });
  }

  async function onGoogle() {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + next });
    if (r.error) { setBusy(false); toast.error("Đăng nhập Google thất bại"); }
  }

  return (
    <AuthShell
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục cải thiện CV và luyện phỏng vấn."
      seoTitle="Đăng nhập — CareerAI"
      seoDescription="Đăng nhập CareerAI để phân tích CV và luyện phỏng vấn."
      path="/login"
      footer={<>Chưa có tài khoản? <Link to="/signup" className="text-primary font-medium hover:underline">Tạo tài khoản</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Button type="button" variant="outline" className="w-full rounded-xl h-11" onClick={onGoogle} disabled={busy}>
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Tiếp tục với Google
        </Button>
        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-background px-2 relative z-10">hoặc đăng nhập bằng email</span>
          <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" required />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Quên?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-11" required />
        </div>
        <Button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-glow">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Đăng nhập
        </Button>
      </form>
    </AuthShell>
  );
}