import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "Email không được để trống")
    .email("Định dạng email không hợp lệ")
    .max(255),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailValue, setEmailValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotFormData) {
    setBusy(true);
    setEmailValue(data.email);
    
    // Giả lập cuộc gọi API reset mật khẩu mượt mà (chờ 1.5 giây)
    setTimeout(() => {
      setBusy(false);
      setSent(true);
      toast.success("Yêu cầu đã được gửi đi thành công!");
    }, 1500);
  }

  return sent ? (
        <div className="space-y-5 text-center animate-fadeIn">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Kiểm tra hộp thư</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Chúng tôi đã gửi một email hướng dẫn đặt lại mật khẩu tới <span className="text-white font-semibold">{emailValue}</span>. Vui lòng kiểm tra hộp thư đến (hoặc thư rác).
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setSent(false)}
            className="w-full h-11 rounded-xl bg-secondary/20 border-white/10 text-white hover:bg-secondary/40 transition-all duration-200"
          >
            Gửi lại yêu cầu khác
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5 relative">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
              Địa chỉ Email đã đăng ký
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

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={busy} 
            className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 mt-2"
          >
            {busy ? (
              <span className="flex items-center gap-2 justify-center">
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Đang gửi liên kết...
              </span>
            ) : (
              "Gửi liên kết đặt lại"
            )}
          </Button>
        </form>
  );
}