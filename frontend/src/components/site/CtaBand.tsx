import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CtaBand() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 lg:p-14 text-primary-foreground shadow-elegant">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative grid lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Phân tích CV. Luyện phỏng vấn.</h2>
              <p className="mt-3 text-lg opacity-90 max-w-xl">Bộ công cụ nghề nghiệp tập trung — dành cho ứng viên nghiêm túc. Miễn phí dùng thử, không cần thẻ.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 h-12 px-7 text-base font-semibold rounded-xl">
                <Link to="/cv-analysis">Phân tích CV <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground h-12 px-7 text-base font-semibold rounded-xl">
                <Link to="/interview">Luyện phỏng vấn</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}