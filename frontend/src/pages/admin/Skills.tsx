import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Skills() {
  const [skills, setSkills] = useState(["Giao tiếp", "Thiết kế hệ thống", "Ra quyết định", "Hợp tác", "Giải quyết vấn đề", "Tự nhận thức", "Kiến trúc hệ thống", "Năng lực lãnh đạo"]);
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <Badge key={s} className="bg-primary-light text-primary-dark hover:bg-primary-light pl-3 pr-1.5 py-1 gap-2">
            {s}
            <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="rounded-full hover:bg-primary/20 p-0.5"><Trash2 className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Thêm kỹ năng mới..." />
        <Button onClick={() => { if (draft.trim()) { setSkills([...skills, draft.trim()]); setDraft(""); toast.success("Đã thêm kỹ năng mới"); } }} className="bg-gradient-primary text-primary-foreground rounded-xl"><Plus className="mr-1 h-4 w-4" /> Thêm</Button>
      </div>
    </div>
  );
}