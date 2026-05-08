import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, Check, X, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth";

// Schema xác thực dữ liệu đăng ký bằng Zod
const signupSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Họ và tên không được để trống")
      .min(2, "Họ và tên phải chứa ít nhất 2 ký tự")
      .max(100, "Họ và tên quá dài (tối đa 100 ký tự)"),
    email: z
      .string()
      .min(1, "Email không được để trống")
      .email("Định dạng email không hợp lệ")
      .max(255),
    password: z
      .string()
      .min(1, "Mật khẩu không được để trống")
      .min(8, "Mật khẩu phải chứa ít nhất 8 ký tự")
      .max(72, "Mật khẩu quá dài (tối đa 72 ký tự)")
      .refine((val) => /[A-Za-z]/.test(val), {
        message: "Mật khẩu phải chứa ít nhất 1 chữ cái",
      })
      .refine((val) => /[0-9\W]/.test(val), {
        message: "Mật khẩu phải chứa ít nhất 1 chữ số hoặc ký tự đặc biệt",
      }),
    confirmPassword: z
      .string()
      .min(1, "Xác nhận mật khẩu không được để trống"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không trùng khớp",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const { user, loading, register: registerUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const initGoogle = () => {
      const btnContainer = document.getElementById("googleSignUpBtn");
      if ((window as any).google?.accounts?.id && btnContainer) {
        (window as any).google.accounts.id.initialize({
          client_id: "683526189569-4rcm86be6336e1n93hmdgq38cl0gdrgp.apps.googleusercontent.com",
          callback: async (response: any) => {
            setBusy(true);
            try {
              await loginWithGoogle(response.credential);
              toast.success("Đăng ký tài khoản bằng Google thành công!");
              navigate("/dashboard", { replace: true });
            } catch (err: any) {
              console.error("Google auth fail:", err);
              toast.error(err.message || "Đăng ký bằng Google thất bại.");
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
            text: "signup_with",
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
  }, [loginWithGoogle, navigate]);

  const passwordValue = watch("password", "");

  // Đánh giá các tiêu chí mật khẩu trực quan (Password strength checklist)
  const isMinLength = passwordValue.length >= 8;
  const hasLetter = /[A-Za-z]/.test(passwordValue);
  const hasNumberOrSpec = /[0-9\W]/.test(passwordValue);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(data: SignupFormData) {
    setBusy(true);
    try {
      await registerUser(data.email, data.password, data.fullName);
      toast.success("Tạo tài khoản thành công! Chào mừng bạn đến với NextStep AI.");
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Signup fail:", error);
      const errorMsg = error.response?.data?.message || error.message || "Đăng ký thất bại. Email có thể đã được sử dụng.";
      toast.error(errorMsg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Miễn phí trải nghiệm phân tích CV và chuẩn bị phỏng vấn thông minh."
      seoTitle="Đăng ký — Intervio"
      seoDescription="Tạo tài khoản Intervio để bắt đầu tối ưu hóa hồ sơ xin việc chuẩn ATS và luyện tập phỏng vấn AI."
      path="/signup"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-primary font-semibold hover:text-primary-glow hover:underline transition-all duration-300">
            Đăng nhập ngay
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name Field */}
        <div className="space-y-1 relative">
          <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Họ và tên
          </Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground/60">
              <UserIcon className="h-4 w-4" />
            </span>
            <Input
              id="fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              {...register("fullName")}
              disabled={busy}
              className={`pl-10 h-11 rounded-xl bg-secondary/20 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary/80 focus:ring-primary/20 transition-all duration-300 ${
                errors.fullName ? "border-destructive/80 focus:border-destructive/90" : ""
              }`}
            />
          </div>
          {errors.fullName && (
            <span className="text-xs text-destructive flex items-center gap-1 animate-fadeIn">
              ⚠ {errors.fullName.message}
            </span>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-1 relative">
          <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Địa chỉ Email
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
        <div className="space-y-1 relative">
          <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Mật khẩu bảo mật
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

          {/* Dynamic Compact Password Strength Bar */}
          {passwordValue && (
            <div className="space-y-1 mt-1.5 animate-fadeIn">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/75">
                <span>Độ mạnh mật khẩu:</span>
                <span className={
                  !isMinLength ? "text-destructive font-medium" :
                  (!hasLetter || !hasNumberOrSpec) ? "text-amber-500 font-medium" : "text-emerald-400 font-bold"
                }>
                  {!isMinLength ? "Yếu" :
                   (!hasLetter || !hasNumberOrSpec) ? "Trung bình" : "Mạnh (Đạt chuẩn)"}
                </span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    !isMinLength ? "w-1/3 bg-destructive" :
                    (!hasLetter || !hasNumberOrSpec) ? "w-2/3 bg-amber-500" : "w-full bg-emerald-500"
                  }`}
                />
              </div>
              {(!isMinLength || !hasLetter || !hasNumberOrSpec) && (
                <div className="text-[10px] text-muted-foreground/55 leading-tight">
                  Yêu cầu: {!isMinLength && "tối thiểu 8 ký tự"} {!hasLetter && "• có chữ cái"} {!hasNumberOrSpec && "• số/ký tự đặc biệt"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1 relative">
          <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
            Xác nhận mật khẩu
          </Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground/60">
              <Lock className="h-4 w-4" />
            </span>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
              disabled={busy}
              className={`pl-10 pr-10 h-11 rounded-xl bg-secondary/20 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-primary/80 focus:ring-primary/20 transition-all duration-300 ${
                errors.confirmPassword ? "border-destructive/80 focus:border-destructive/90" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={busy}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/60 hover:text-white transition-colors duration-200"
            >
              {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-xs text-destructive flex items-center gap-1 animate-fadeIn">
              ⚠ {errors.confirmPassword.message}
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
              Đang tạo tài khoản...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 justify-center">
              <span>Đăng ký tài khoản</span>
              <Sparkles className="h-4 w-4" />
            </span>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground/50 text-center leading-relaxed">
          Bằng việc đăng ký, bạn đồng ý với Điều khoản Sử dụng và Chính sách Bảo mật của Intervio.
        </p>

        {/* Separator */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Hoặc</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Google Sign In Button Container */}
        <div className="w-full flex justify-center py-0.5">
          <div id="googleSignUpBtn" className="min-h-[40px] w-full" />
        </div>
      </form>
    </AuthShell>
  );
}