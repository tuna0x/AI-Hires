import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Questions() {
  const [easy, setEasy] = useState(2);
  const [med, setMed] = useState(4);
  const [hard, setHard] = useState(2);
  const [prompt, setPrompt] = useState("Hãy sinh {count} câu hỏi phỏng vấn phù hợp với CV của ứng viên và bản mô tả công việc (JD) được cung cấp. Mỗi câu hỏi phải bao gồm: nội dung câu hỏi, nhãn kỹ năng, mức độ khó dễ, và một câu hỏi phụ thích ứng theo ngữ cảnh.");
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[["Dễ", easy, setEasy], ["Trung bình", med, setMed], ["Khó", hard, setHard]].map(([label, val, set]) => (
          <div key={label as string}>
            <Label>{label as string}</Label>
            <Input type="number" value={val as number} onChange={(e) => (set as (n: number) => void)(parseInt(e.target.value) || 0)} className="mt-1.5" />
          </div>
        ))}
      </div>
      <div className="mt-5">
        <Label>Câu lệnh hệ thống (System Prompt)</Label>
        <Textarea rows={6} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mt-1.5 font-mono text-xs" />
      </div>
      <Button onClick={() => toast.success("Đã lưu cấu hình logic sinh câu hỏi")} className="mt-5 bg-gradient-primary text-primary-foreground rounded-xl">Lưu thay đổi</Button>
    </div>
  );
}