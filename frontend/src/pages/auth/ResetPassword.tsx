import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";

const schema = z.string().min(8, "Tối thiểu 8 ký tự").max(72);

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Đã cập nhật mật khẩu");
    navigate("/dashboard", { replace: true });
  }

  return (
    <AuthShell
      title="Đặt mật khẩu mới"
      subtitle="Chọn một mật khẩu mạnh và chưa từng dùng trước đây."
      seoTitle="Đặt lại mật khẩu — CareerAI"
      seoDescription="Đặt mật khẩu mới cho tài khoản CareerAI."
      path="/reset-password"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">Mật khẩu mới</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 h-11" required />
        </div>
        <Button type="submit" disabled={busy || !ready} className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {ready ? "Cập nhật mật khẩu" : "Đang xác thực liên kết…"}
        </Button>
      </form>
    </AuthShell>
  );
}