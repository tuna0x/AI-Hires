import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import SiteLayout from "@/components/site/SiteLayout";
import PageHero from "@/components/site/PageHero";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { posts, categories } from "@/data/blog";
import { ArrowRight, Calendar, Clock } from "lucide-react";

export default function BlogIndex() {
  const [cat, setCat] = useState("Tất cả");
  const filtered = cat === "Tất cả" ? posts : posts.filter((p) => p.category === cat);

  return (
    <SiteLayout>
      <Seo
        title="Cẩm nang — Bí quyết viết CV, ATS & Phỏng vấn thành công"
        description="Tổng hợp hướng dẫn thực hành chi tiết về viết CV, vượt qua bộ lọc ATS, chuẩn bị phỏng vấn và thăng tiến nghề nghiệp từ các nhà tuyển dụng chuyên nghiệp."
        path="/blog"
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Cẩm nang", path: "/blog" }])}
      />
      <PageHero eyebrow="Cẩm nang" title="Bí quyết viết CV & Phỏng vấn" subtitle="Lời khuyên thực tế từ các nhà tuyển dụng hàng đầu. Đi thẳng vào hành động." />

      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${cat === c ? "bg-gradient-primary text-primary-foreground" : "bg-card border border-border/60 text-muted-foreground hover:text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <motion.article
                key={p.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/blog/${p.slug}`} className="block group bg-card rounded-3xl border border-border/60 p-7 shadow-soft hover:shadow-glow hover:border-primary/30 transition-all h-full flex flex-col">
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary mb-3">{p.category}</span>
                  <h2 className="text-xl font-bold leading-snug group-hover:text-primary-dark transition-colors">{p.title}</h2>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{p.description}</p>
                  <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-3">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(p.date).toLocaleDateString("vi-VN", { month: "long", day: "numeric", year: "numeric" })}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.readTime}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}