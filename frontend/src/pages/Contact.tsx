import { useForm } from "react-hook-form";
import { Mail, MessageSquare, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SiteLayout from "@/components/site/SiteLayout";
import PageHero from "@/components/site/PageHero";
import { Seo, breadcrumbLd } from "@/lib/seo";
import { toast } from "sonner";

type FormData = { name: string; email: string; company?: string; message: string };

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>();
  const onSubmit = async (data: FormData) => {
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Cảm ơn bạn! Chúng tôi đã nhận được thông tin và sẽ phản hồi trong vòng 1 ngày làm việc.");
    reset();
  };

  return (
    <SiteLayout>
      <Seo
        title="Liên hệ — Đội ngũ phát triển NextStep AI"
        description="Bạn có câu hỏi về NextStep AI, đề xuất tính năng hay hợp tác doanh nghiệp? Hãy gửi lời nhắn và chúng tôi sẽ phản hồi sớm nhất."
        path="/contact"
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Liên hệ", path: "/contact" }])}
      />
      <PageHero eyebrow="Liên hệ" title="Kết nối với chúng tôi" subtitle="Hỗ trợ kỹ thuật, hợp tác hay phản hồi đóng góp ý kiến — chúng tôi luôn sẵn sàng lắng nghe bạn." />

      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.4fr] gap-10">
          <div className="space-y-5">
            {[
              { icon: Mail, t: "Hòm thư chung", v: "hello@nextstep.ai" },
              { icon: MessageSquare, t: "Hỗ trợ kỹ thuật", v: "Phản hồi trong 4h (T2 - T6)" },
              { icon: Building, t: "Hợp tác doanh nghiệp", v: "sales@nextstep.ai" },
            ].map((c) => (
              <div key={c.t} className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-light text-primary"><c.icon className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xs text-muted-foreground">{c.t}</div>
                    <div className="font-semibold">{c.v}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-3xl border border-border/60 p-7 lg:p-9 shadow-card space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Họ và tên</Label>
                <Input id="name" {...register("name", { required: true })} placeholder="Nguyễn Văn A" />
                {errors.name && <p className="text-xs text-destructive">Vui lòng nhập họ và tên</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Địa chỉ Email</Label>
                <Input id="email" type="email" {...register("email", { required: true })} placeholder="email@congty.com" />
                {errors.email && <p className="text-xs text-destructive">Vui lòng nhập địa chỉ email</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Tên công ty (không bắt buộc)</Label>
              <Input id="company" {...register("company")} placeholder="Công ty TNHH ABC" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Nội dung lời nhắn</Label>
              <Textarea id="message" rows={5} {...register("message", { required: true })} placeholder="Chúng tôi có thể hỗ trợ gì cho bạn?" />
              {errors.message && <p className="text-xs text-destructive">Vui lòng nhập nội dung lời nhắn</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-primary text-primary-foreground rounded-xl h-11 font-semibold">
              {isSubmitting ? "Đang gửi..." : "Gửi lời nhắn"}
            </Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}