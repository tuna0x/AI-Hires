import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Lock, Eye, EyeOff, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";

const resetSchema = z.object({
  password: z
    .string()
    .min(1, "Mật khẩu không được để trống")
    .min(8, "Mật khẩu mới phải chứa ít nhất 8 ký tự")
    .max(72, "Mật khẩu quá dài (tối đa 72 ký tự)"),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
    },
  });

  async function onSubmit(data: ResetFormData) {
    setBusy(true);
    
    // Giả lập cuộc gọi API cập nhật mật khẩu mượt mà (chờ 1.5 giây)
    setTimeout(() => {
      setBusy(false);
      toast.success("Đặt lại mật khẩu thành công! Hãy dùng mật khẩu mới để đăng nhập.");
      navigate("/login", { replace: true });
    }, 1500);
  }

  return (
    <AuthShell
      title="Đặt mật khẩu mới"
      subtitle="Nhập mật khẩu bảo mật mới cho tài khoản NextStep AI của bạn."
      seoTitle="Đặt lại mật khẩu — NextStep AI"
      seoDescription="Tạo mật khẩu mới và khôi phục tài khoản NextStep AI của bạn một cách an toàn."
      path="/reset-password"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Password Field */}
        <div className="space-y-1.5 relative animate-fadeIn">
          <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Mật khẩu mới của bạn
          </Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground/60">
              <Lock className="h-4 w-4" />
            </span>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
              disabled={busy}
              className={`pl-10 pr-10 h-11 rounded-xl bg-secondary/20 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary/80 focus:ring-primary/20 transition-all duration-300 ${
                errors.password ? "border-destructive/80 focus:border-destructive/90" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={busy}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/60 hover:text-white transition-colors duration-200"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-destructive flex items-center gap-1 animate-fadeIn">
              ⚠ {errors.password.message}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={busy} 
          className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 mt-2"
        >
          {busy ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
              Đang cập nhật...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 justify-center">
              <span>Cập nhật mật khẩu</span>
              <Sparkles className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}