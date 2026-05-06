import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";

const schema = z.string().trim().email("Email không hợp lệ").max(255);

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Đã gửi liên kết đặt lại mật khẩu");
  }

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      subtitle="Chúng tôi sẽ gửi liên kết an toàn để bạn tạo mật khẩu mới."
      seoTitle="Quên mật khẩu — CareerAI"
      seoDescription="Đặt lại mật khẩu CareerAI của bạn."
      path="/forgot-password"
      footer={<>Đã nhớ ra? <Link to="/login" className="text-primary font-medium hover:underline">Đăng nhập</Link></>}
    >
      {sent ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-sm">
          Vui lòng kiểm tra <span className="font-medium text-foreground">{email}</span> để nhận liên kết đặt lại. Có thể mất vài phút.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" required />
          </div>
          <Button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Gửi liên kết đặt lại
          </Button>
        </form>
      )}
    </AuthShell>
  );
}