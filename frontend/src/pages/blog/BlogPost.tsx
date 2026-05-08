import { Link, useParams, Navigate } from "react-router-dom";
import SiteLayout from "@/components/site/SiteLayout";
import { Seo, breadcrumbLd, articleLd } from "@/lib/seo";
import { posts } from "@/data/blog";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CtaBand from "@/components/site/CtaBand";

export default function BlogPost() {
  const { slug } = useParams();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return <Navigate to="/blog" replace />;

  const path = `/blog/${post.slug}`;

  return (
    <SiteLayout>
      <Seo
        title={`${post.title} — Cẩm nang Intervio`}
        description={post.description}
        path={path}
        type="article"
        jsonLd={[
          breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Cẩm nang", path: "/blog" }, { name: post.title, path }]),
          articleLd({ title: post.title, description: post.description, path, date: post.date }),
        ]}
      />

      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <Button asChild variant="ghost" className="mb-6 -ml-2"><Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Tất cả bài viết</Link></Button>
        <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary">{post.category}</span>
        <h1 className="mt-3 text-4xl lg:text-5xl font-bold tracking-tight leading-tight">{post.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{post.description}</p>
        <div className="mt-6 flex items-center gap-5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(post.date).toLocaleDateString("vi-VN", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {post.readTime}</span>
        </div>

        <div className="mt-10 space-y-10">
          {post.body.map((sec) => (
            <section key={sec.heading}>
              <h2 className="text-2xl font-bold tracking-tight">{sec.heading}</h2>
              <div className="mt-3 space-y-4 text-foreground/90 leading-relaxed">
                {sec.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </section>
          ))}
        </div>
      </article>
      <CtaBand />
    </SiteLayout>
  );
}