import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Seo } from "@/lib/seo";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function AuthLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const path = location.pathname;

  let seoTitle = "Đăng nhập — Intervio";
  let seoDescription = "Đăng nhập tài khoản Intervio để phân tích CV, chấm điểm ATS và mô phỏng phỏng vấn thông minh.";
  let title = "Chào mừng trở lại";
  let subtitle = "Đăng nhập để tiếp tục tối ưu hóa CV và bứt phá sự nghiệp.";
  let footer = (
    <>
      Chưa có tài khoản?{" "}
      <Link to="/signup" className="text-primary font-semibold hover:text-primary-glow hover:underline transition-all duration-300">
        Đăng ký ngay
      </Link>
    </>
  );

  if (path === "/signup") {
    seoTitle = "Đăng ký — Intervio";
    seoDescription = "Tạo tài khoản Intervio để bắt đầu tối ưu hóa hồ sơ xin việc chuẩn ATS và luyện tập phỏng vấn AI.";
    title = "Tạo tài khoản";
    subtitle = "Miễn phí trải nghiệm phân tích CV và chuẩn bị phỏng vấn thông minh.";
    footer = (
      <>
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-primary font-semibold hover:text-primary-glow hover:underline transition-all duration-300">
          Đăng nhập ngay
        </Link>
      </>
    );
  } else if (path === "/forgot-password") {
    seoTitle = "Quên mật khẩu — Intervio";
    seoDescription = "Yêu cầu đặt lại mật khẩu Intervio của bạn một cách an toàn.";
    title = "Đặt lại mật khẩu";
    subtitle = "Nhập email của bạn, chúng tôi sẽ gửi liên kết an toàn để thiết lập mật khẩu mới.";
    footer = (
      <>
        Đã nhớ ra mật khẩu?{" "}
        <Link to="/login" className="text-primary font-semibold hover:text-primary-glow hover:underline transition-all duration-300">
          Đăng nhập ngay
        </Link>
      </>
    );
  } else if (path === "/reset-password") {
    seoTitle = "Đặt lại mật khẩu — Intervio";
    seoDescription = "Tạo mật khẩu mới cho tài khoản Intervio của bạn.";
    title = "Đặt lại mật khẩu mới";
    subtitle = "Thiết lập mật khẩu mới để bảo mật tài khoản của bạn.";
    footer = (
      <Link to="/login" className="text-primary font-semibold hover:text-primary-glow hover:underline transition-all duration-300">
        Quay lại đăng nhập
      </Link>
    );
  }

  const showGoogleAuth = path === "/login" || path === "/signup";

  // Centralized Google One Tap and Identity Sign-In rendering
  useEffect(() => {
    if (!showGoogleAuth) return;

    const initGoogle = () => {
      const googleClient = (window as any).google;
      const btnContainer = document.getElementById("googleAuthBtn");
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (googleClient && btnContainer && clientId) {
        googleClient.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            try {
              await loginWithGoogle(response.credential);
              toast.success("Đăng nhập bằng Google thành công!");
              navigate("/dashboard", { replace: true });
            } catch (err: any) {
              console.error("Google auth fail:", err);
              toast.error(err.message || "Xác thực qua Google thất bại.");
            }
          },
        });

        googleClient.accounts.id.renderButton(
          btnContainer,
          {
            theme: "outline",
            size: "large",
            width: "386",
            text: path === "/signup" ? "signup_with" : "signin_with",
            shape: "rectangular", // Clean rectangular design matching input corners!
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
  }, [path, showGoogleAuth, loginWithGoogle, navigate]);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0B0F19] px-4 py-16 overflow-hidden select-none">
      <Seo title={seoTitle} description={seoDescription} path={path} />

      {/* Background Neon Glowing Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blob 1: Emerald/Green */}
        <div 
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]"
          style={{
            animation: "drift-slow 25s infinite alternate ease-in-out"
          }}
        />
        {/* Blob 2: Cyan/Teal */}
        <div 
          className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[130px]"
          style={{
            animation: "drift-slow 30s infinite alternate-reverse ease-in-out 3s"
          }}
        />
        {/* Blob 3: Purple/Indigo */}
        <div 
          className="absolute top-[30%] left-[40%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[100px]"
          style={{
            animation: "drift-slow 20s infinite alternate ease-in-out 1s"
          }}
        />
      </div>

      {/* Floating Retro Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px"
        }}
      />

      {/* Permanent Back Home Button */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground bg-secondary/30 border border-border/40 backdrop-blur-md hover:text-foreground hover:bg-secondary/60 hover:border-border/80 transition-all duration-300 shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Về trang chủ</span>
        </Link>
      </div>

      {/* Shared Central Glassmorphic Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.15 }}
        className="relative w-full max-w-[450px] z-10"
      >
        {/* Outer neon glow ring */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 via-emerald-500/20 to-transparent rounded-2xl blur-sm" />

        {/* Card Body */}
        <div className="relative bg-[#111625]/85 border border-white/10 backdrop-blur-2xl rounded-2xl p-6 lg:p-8 shadow-elegant">
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center text-center mb-4">
            <Link to="/" className="inline-flex items-center gap-2.5 font-extrabold text-xl tracking-tight group">
              <img src="/logo2.png" alt="Intervio" className="h-9 w-9 object-contain group-hover:scale-105 transition-transform duration-300" />
              <span className="text-white">
                Intervio<span className="text-primary">.online</span>
              </span>
            </Link>
          </div>

          {/* Dynamic Content Transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={path}
              initial={{ opacity: 0, x: path === "/login" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: path === "/login" ? 10 : -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {/* Dynamic Title & Subtitle */}
              <div className="space-y-1 mb-5 text-center">
                <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-none">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-[320px] mx-auto">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Child Route Form */}
              <div className="relative">
                <Outlet />
              </div>

              {/* Persistent Google Authenticator (Maintains mounting inside the card body!) */}
              {showGoogleAuth && (
                <div className="mt-4">
                  {/* Separator */}
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-3 text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">Hoặc</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  {/* Google Sign In Button Container */}
                  <div className="w-full flex justify-center py-0.5">
                    <div id="googleAuthBtn" className="min-h-[40px] w-full flex justify-center" />
                  </div>
                </div>
              )}

              {/* Dynamic Footer Switching Link */}
              {footer && (
                <div className="mt-5 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground/80">
                  {footer}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Global CSS for slow drifts */}
      <style>{`
        @keyframes drift-slow {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(4%, 5%) scale(1.05); }
          100% { transform: translate(-2%, -3%) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
