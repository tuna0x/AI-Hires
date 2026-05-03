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
    toast.success("Thanks! We'll be in touch within 1 business day.");
    reset();
  };

  return (
    <SiteLayout>
      <Seo
        title="Contact — Talk to the CV Checker AI Team"
        description="Questions about CV Checker AI, partnerships, or team plans? Drop us a note and we'll reply within one business day."
        path="/contact"
        jsonLd={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])}
      />
      <PageHero eyebrow="Contact" title="Let's talk" subtitle="Sales, support, partnerships, press — we read every message." />

      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.4fr] gap-10">
          <div className="space-y-5">
            {[
              { icon: Mail, t: "Email", v: "hello@cvchecker.ai" },
              { icon: MessageSquare, t: "Support", v: "Reply within 4h, Mon–Fri" },
              { icon: Building, t: "Teams & Enterprise", v: "sales@cvchecker.ai" },
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
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name", { required: true })} placeholder="Jane Doe" />
                {errors.name && <p className="text-xs text-destructive">Name is required</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email", { required: true })} placeholder="jane@company.com" />
                {errors.email && <p className="text-xs text-destructive">Email is required</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company (optional)</Label>
              <Input id="company" {...register("company")} placeholder="Acme Inc" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={5} {...register("message", { required: true })} placeholder="How can we help?" />
              {errors.message && <p className="text-xs text-destructive">Message is required</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-primary text-primary-foreground rounded-xl h-11 font-semibold">
              {isSubmitting ? "Sending..." : "Send message"}
            </Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}