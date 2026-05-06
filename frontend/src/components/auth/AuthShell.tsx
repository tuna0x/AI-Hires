import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <Seo title={seoTitle} description={seoDescription} path={path} />
      <aside className="hidden lg:flex relative overflow-hidden bg-gradient-primary text-primary-foreground p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-glow)" }} />
        <Link to="/" className="relative flex items-center gap-2 font-bold text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </span>
          CareerAI
        </Link>
        <div className="relative space-y-6 max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Phân tích CV. <br /> Luyện phỏng vấn. <br /> Nhận được offer.
          </h2>
          <p className="text-primary-foreground/90 text-base leading-relaxed">
            Hàng nghìn ứng viên đang dùng CareerAI để khắc phục lỗi ATS và luyện câu hỏi đúng vị trí ứng tuyển.
          </p>
          <ul className="space-y-2 text-sm text-primary-foreground/95">
            <li>✓ Chấm điểm ATS kèm gợi ý sửa cụ thể</li>
            <li>✓ Mock interview theo đúng CV của bạn</li>
            <li>✓ Riêng tư — dữ liệu luôn thuộc về bạn</li>
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/60">© {new Date().getFullYear()} CareerAI</p>
      </aside>

      <main className="flex flex-col">
        <div className="lg:hidden p-6 border-b border-border/60">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            CareerAI
          </Link>
        </div>
        <div className="flex-1 grid place-items-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}