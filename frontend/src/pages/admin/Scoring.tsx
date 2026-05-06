import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const labels: Record<string, string> = {
  formatting: "Định dạng & Bố cục",
  keywords: "Từ khóa chuyên môn",
  experience: "Kinh nghiệm làm việc",
  skills: "Kỹ năng chuyên môn",
  readability: "Khả năng đọc hiểu",
};

export default function Scoring() {
  const [w, setW] = useState({ formatting: 20, keywords: 25, experience: 25, skills: 15, readability: 15 });
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-5">
      {(Object.keys(w) as (keyof typeof w)[]).map((k) => (
        <div key={k}>
          <div className="flex items-center justify-between text-sm font-medium mb-2"><span>{labels[k]}</span><span className="text-muted-foreground">{w[k]}%</span></div>
          <Slider value={[w[k]]} max={50} step={1} onValueChange={(v) => setW({ ...w, [k]: v[0] })} />
        </div>
      ))}
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/40 p-4">
        <span className="text-sm font-semibold">Tổng trọng số (Cần đạt 100%)</span>
        <Badge className={total === 100 ? "bg-primary-light text-primary-dark" : "bg-destructive/10 text-destructive"}>{total}%</Badge>
      </div>
      <Button onClick={() => toast.success("Đã lưu quy tắc chấm điểm CV")} className="bg-gradient-primary text-primary-foreground rounded-xl">Lưu thay đổi</Button>
    </div>
  );
}