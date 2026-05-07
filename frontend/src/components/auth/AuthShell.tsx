import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Seo } from "@/lib/seo";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  seoTitle,
  seoDescription,
  path,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  seoTitle: string;
  seoDescription: string;
  path: string;
}) {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0B0F19] px-4 py-16 overflow-hidden select-none">
      <Seo title={seoTitle} description={seoDescription} path={path} />

      {/* Background Neon Glowing Blobs with Slow Hover Animations */}
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

      {/* Floating Retro Grid / Subtle Overlay lines for Cyber Aesthetic */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px"
        }}
      />

      {/* Sleek Floating Back Home Button in top left corner */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground bg-secondary/30 border border-border/40 backdrop-blur-md hover:text-foreground hover:bg-secondary/60 hover:border-border/80 transition-all duration-300 shadow-soft"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Về trang chủ</span>
        </Link>
      </div>

      {/* Main Glassmorphic Central Card with Smooth Framer Motion Entrance */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.15 }}
        className="relative w-full max-w-[450px] z-10"
      >
        {/* Outer neon glow ring around the card */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 via-emerald-500/20 to-transparent rounded-2xl blur-sm" />

        {/* Card Body */}
        <div className="relative bg-[#111625]/85 border border-white/10 backdrop-blur-2xl rounded-2xl p-6 lg:p-8 shadow-elegant">
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center text-center mb-4">
            <Link to="/" className="inline-flex items-center gap-2.5 font-extrabold text-xl tracking-tight group">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-white">
                NextStep<span className="text-primary">AI</span>
              </span>
            </Link>
          </div>

          {/* Title & Subtitle */}
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

          {/* Form Content */}
          <div className="relative">
            {children}
          </div>

          {/* Footnotes / Switching Links */}
          {footer && (
            <div className="mt-5 pt-4 border-t border-border/40 text-center text-xs text-muted-foreground/80">
              {footer}
            </div>
          )}
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