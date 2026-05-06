import { Link } from "react-router-dom";
import { Sparkles, Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40 mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </span>
              <span>Career<span className="text-primary">AI</span></span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Công cụ nghề nghiệp AI tập trung giúp bạn nâng cấp CV và chinh phục phỏng vấn. Phân tích, sửa lỗi, luyện tập, nhận offer.
            </p>
            <div className="flex gap-3">
              <a aria-label="Twitter" className="p-2 rounded-lg hover:bg-muted"><Twitter className="h-4 w-4" /></a>
              <a aria-label="LinkedIn" className="p-2 rounded-lg hover:bg-muted"><Linkedin className="h-4 w-4" /></a>
              <a aria-label="GitHub" className="p-2 rounded-lg hover:bg-muted"><Github className="h-4 w-4" /></a>
            </div>
          </div>

          <FooterCol title="Sản phẩm" links={[
            { to: "/dashboard", label: "Tổng quan" },
            { to: "/cv-analysis", label: "Phân tích CV" },
            { to: "/interview", label: "Luyện phỏng vấn" },
          ]} />
          <FooterCol title="Tài nguyên" links={[
            { to: "/blog", label: "Bài viết" },
            { to: "/blog/best-resume-tips", label: "Mẹo viết CV hay" },
            { to: "/blog/interview-questions-2025", label: "Câu hỏi phỏng vấn 2025" },
          ]} />
          <FooterCol title="Công ty" links={[
            { to: "/contact", label: "Liên hệ" },
            { to: "/admin", label: "Quản trị" },
          ]} />
        </div>

        <div className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground flex flex-col sm:flex-row gap-4 justify-between">
          <p>© {new Date().getFullYear()} CareerAI. Mọi quyền được bảo lưu.</p>
          <p>Phân tích. Cải thiện. Luyện tập. Thành công.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-semibold text-sm mb-4">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}