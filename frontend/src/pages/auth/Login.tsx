import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth";

// Schema xác thực dữ liệu chặt chẽ bằng Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Định dạng email không hợp lệ")
    .max(255),
  password: z
    .string()
    .min(1, "Mật khẩu không được để trống")
    .min(6, "Mật khẩu phải chứa ít nhất 6 ký tự")
    .max(72, "Mật khẩu quá dài (tối đa 72 ký tự)"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { user, loading, login, loginWithGoogle } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get("next") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  // Khởi tạo React Hook Form kết hợp Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
 
  useEffect(() => {
    const initGoogle = () => {
      const btnContainer = document.getElementById("googleSignInBtn");
      if ((window as any).google?.accounts?.id && btnContainer) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "683526189569-4rcm86be6336e1n93hmdgq38cl0gdrgp.apps.googleusercontent.com",
          callback: async (response: any) => {
            setBusy(true);
            try {
              await loginWithGoogle(response.credential);
              toast.success("Đăng nhập bằng tài khoản Google thành công!");
              navigate(next, { replace: true });
            } catch (err: any) {
              console.error("Google auth fail:", err);
              toast.error(err.message || "Đăng nhập Google thất bại.");
            } finally {
              setBusy(false);
            }
          },
        });
        (window as any).google.accounts.id.renderButton(
          btnContainer,
          {
            theme: "filled_black",
            size: "large",
            width: "386",
            text: "signin_with",
            shape: "pill",
          }
        );
      }
    };

    const timer = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(timer);
        initGoogle();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [loginWithGoogle, navigate, next]);

  // Tránh hiển thị form nếu người dùng đã đăng nhập thành công
  if (!loading && user) return <Navigate to={next} replace />;

  async function onSubmit(data: LoginFormData) {
    setBusy(true);
    try {
      await login(data.email, data.password);
      toast.success("Chào mừng trở lại! Đăng nhập thành công.");
      navigate(next, { replace: true });
    } catch (error: any) {
      console.error("Login fail:", error);
      const errorMsg = error.response?.data?.message || error.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      toast.error(errorMsg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục tối ưu hóa CV và bứt phá sự nghiệp."
      seoTitle="Đăng nhập — Intervio"
      seoDescription="Đăng nhập tài khoản Intervio để phân tích CV, chấm điểm ATS và mô phỏng phỏng vấn thông minh."
      path="/login"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/signup" className="text-primary font-semibold hover:text-primary-glow hover:underline transition-all duration-300">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-1.5 relative">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Email của bạn
          </Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground/60">
              <Mail className="h-4 w-4" />
            </span>
            <Input
              id="email"
              type="email"
              placeholder="ten@viethas.com"
              autoComplete="email"
              {...register("email")}
              disabled={busy}
              className={`pl-10 h-11 rounded-xl bg-secondary/20 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary/80 focus:ring-primary/20 transition-all duration-300 ${
                errors.email ? "border-destructive/80 focus:border-destructive/90" : ""
              }`}
            />
          </div>
          {errors.email && (
            <span className="text-xs text-destructive flex items-center gap-1 animate-fadeIn">
              ⚠ {errors.email.message}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
              Mật khẩu
            </Label>
            <Link 
              to="/forgot-password" 
              className="text-xs text-primary font-medium hover:text-primary-glow transition-all duration-300"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground/60">
              <Lock className="h-4 w-4" />
            </span>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
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
              Đang xác thực...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 justify-center">
              <span>Đăng nhập ngay</span>
              <Sparkles className="h-4 w-4" />
            </span>
          )}
        </Button>

        {/* Separator */}
        <div className="relative flex py-1.5 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Hoặc</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Google Sign In Button Container */}
        <div className="w-full flex justify-center py-0.5">
          <div id="googleSignInBtn" className="min-h-[40px] w-full" />
        </div>
      </form>
    </AuthShell>
  );
}