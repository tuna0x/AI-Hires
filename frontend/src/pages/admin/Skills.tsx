
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Tag, Search, Shield, Award, Sparkles, Layers, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const INITIAL_SKILLS = [
  { name: "Java Core", category: "Technical" },
  { name: "Spring Boot", category: "Technical" },
  { name: "React", category: "Technical" },
  { name: "TypeScript", category: "Technical" },
  { name: "RabbitMQ", category: "Technical" },
  { name: "Docker", category: "Technical" },
  { name: "Giao tiếp", category: "Soft Skills" },
  { name: "Giải quyết vấn đề", category: "Soft Skills" },
  { name: "Làm việc nhóm", category: "Soft Skills" },
];

export default function Skills() {
  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState("Technical");
  const [search, setSearch] = useState("");

  const handleAddSkill = () => {
    if (!draft.trim()) return;
    if (skills.some(s => s.name.toLowerCase() === draft.trim().toLowerCase())) {
      toast.warning("Kỹ năng này đã tồn tại!");
      return;
    }
    setSkills([...skills, { name: draft.trim(), category }]);
    setDraft("");
    toast.success("Đã thêm kỹ năng chuyên môn thành công!");
  };

  const handleDelete = (name: string) => {
    setSkills(skills.filter(s => s.name !== name));
    toast.success("Đã xóa kỹ năng khỏi danh sách");
  };

  const filteredSkills = skills.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-10 pb-10 max-w-6xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1">
        <div className="flex items-center gap-4">
          <div className="h-10 w-1.5 bg-primary rounded-full shadow-glow shadow-primary/20" />
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">Thư viện kỹ năng</h2>
            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest">Quản lý từ khóa đối sánh ATS</p>
          </div>
        </div>
      </div>

      {/* Tìm kiếm và thêm kỹ năng */}
      <div className="flex flex-col lg:flex-row gap-4 p-8 rounded-[2.5rem] bg-white/5 border border-white/5 shadow-soft">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Tìm kiếm nhãn kỹ năng..." 
            className="pl-12 rounded-2xl border-white/10 bg-white/5 h-12 text-[13px] focus-visible:ring-primary/20" 
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 pl-12 pr-10 text-[13px] font-bold rounded-2xl border border-white/10 bg-[#0B0F19] text-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none min-w-[200px]"
            >
              <option value="Technical">Kỹ thuật (Hard Skill)</option>
              <option value="Soft Skills">Kỹ năng mềm (Soft Skill)</option>
            </select>
          </div>
          <div className="flex gap-4">
            <Input 
              value={draft} 
              onChange={(e) => setDraft(e.target.value)} 
              placeholder="Nhập tên nhãn..." 
              className="rounded-2xl border-white/10 bg-white/5 h-12 w-full sm:w-56 text-[13px]" 
            />
            <Button onClick={handleAddSkill} className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-[1.25rem] h-12 font-black text-xs px-6 shadow-glow shadow-primary/20 transition-all active:scale-95 whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" /> Thêm nhãn
            </Button>
          </div>
        </div>
      </div>

      {/* Grid danh mục */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        {/* Phân loại Technical */}
        <div className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8 space-y-8 shadow-elegant group">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h4 className="text-[10px] font-black text-white px-4 py-1.5 rounded-lg bg-primary/20 border border-primary/20 uppercase tracking-[0.2em] flex items-center gap-3">
              <Award className="h-4 w-4 text-primary" /> Kỹ thuật (Hard Skills)
            </h4>
            <div className="text-xl font-black text-white/40 tracking-tighter">{filteredSkills.filter(s => s.category === "Technical").length}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <AnimatePresence>
              {filteredSkills.filter(s => s.category === "Technical").map((s) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <Badge className="bg-white/5 text-white/80 hover:bg-white/10 pl-4 pr-2 py-2 rounded-xl gap-3 font-bold border border-white/5 text-[13px] shadow-soft group/badge transition-all">
                    {s.name}
                    <button onClick={() => handleDelete(s.name)} className="rounded-lg hover:bg-destructive/20 hover:text-destructive p-1 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Phân loại Soft Skills */}
        <div className="rounded-[2.5rem] border border-white/5 bg-white/5 p-8 space-y-8 shadow-elegant group">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h4 className="text-[10px] font-black text-white px-4 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/20 uppercase tracking-[0.2em] flex items-center gap-3">
              <Layers className="h-4 w-4 text-amber-500" /> Kỹ năng mềm (Soft Skills)
            </h4>
            <div className="text-xl font-black text-white/40 tracking-tighter">{filteredSkills.filter(s => s.category === "Soft Skills").length}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <AnimatePresence>
              {filteredSkills.filter(s => s.category === "Soft Skills").map((s) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <Badge className="bg-white/5 text-white/80 hover:bg-white/10 pl-4 pr-2 py-2 rounded-xl gap-3 font-bold border border-white/10 text-[13px] shadow-soft group/badge transition-all">
                    {s.name}
                    <button onClick={() => handleDelete(s.name)} className="rounded-lg hover:bg-destructive/20 hover:text-destructive p-1 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  );
}