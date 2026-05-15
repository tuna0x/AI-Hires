import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Tag, Search, Shield, Award, Sparkles, Layers, Filter, ArrowUpRight, X, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import axios from "axios";

interface Skill {
  id?: number;
  name: string;
  category: string;
  description?: string;
  popularity?: number;
  status: "VERIFIED" | "DRAFT";
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [addingToCategory, setAddingToCategory] = useState("Technical");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/v1/admin/skills");
      setSkills(response.data);
    } catch (error) {
      console.error("Failed to fetch skills", error);
      toast.error("Không thể tải danh sách kỹ năng.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!draft.trim()) return;
    if (skills.some(s => s.name.toLowerCase() === draft.trim().toLowerCase())) {
      toast.warning("Kỹ năng này đã tồn tại!");
      return;
    }
    
    try {
      const newSkill: Skill = { 
        name: draft.trim(), 
        category: addingToCategory, 
        popularity: 0, 
        status: "VERIFIED" 
      };
      const response = await axios.post("/api/v1/admin/skills", [newSkill]);
      setSkills([...skills, ...response.data]);
      setDraft("");
      toast.success("Đã thêm kỹ năng mới!");
    } catch (error) {
      toast.error("Lỗi khi thêm kỹ năng!");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/v1/admin/skills/${id}`);
      setSkills(skills.filter(s => s.id !== id));
      setSelectedSkills(selectedSkills.filter(sId => sId !== id));
      toast.success("Đã xóa kỹ năng");
    } catch (error) {
      toast.error("Lỗi khi xóa kỹ năng!");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const promises = selectedSkills.map(id => axios.delete(`/api/v1/admin/skills/${id}`));
      await Promise.all(promises);
      setSkills(skills.filter(s => !selectedSkills.includes(s.id!)));
      setSelectedSkills([]);
      setIsBulkMode(false);
      toast.success(`Đã xóa ${selectedSkills.length} kỹ năng`);
    } catch (error) {
      toast.error("Lỗi khi xóa hàng loạt!");
    }
  };

  const categories = ["Technical", "Soft Skills"]; 
  const categoryCounts = skills.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleAISuggest = () => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
      loading: 'Gemini AI đang phân tích xu hướng...',
      success: () => {
        const suggestions: Skill[] = [
          { name: "Next.js", category: "Technical", popularity: 45, status: "DRAFT" as const },
          { name: "Tailwind CSS", category: "Technical", popularity: 52, status: "DRAFT" as const },
          { name: "Quản lý thời gian", category: "Soft Skills", popularity: 30, status: "DRAFT" as const }
        ];
        const newSkills = suggestions.filter(s => !skills.some(existing => existing.name === s.name));
        setSkills([...skills, ...newSkills]);
        return "AI đã gợi ý thêm 3 kỹ năng mới!";
      }
    });
  };

  const toggleSelect = (id: number) => {
    setSelectedSkills(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const filteredSkills = skills.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "ALL" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-10 w-1.5 bg-primary rounded-full shadow-glow shadow-primary/20" />
             <h2 className="text-2xl font-black text-white tracking-tight">Thư viện kỹ năng</h2>
          </div>
          <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.2em] ml-4 opacity-70">Đối sánh từ khóa & Phân tích xu hướng AI</p>
        </div>

        <div className="flex items-center gap-3 bg-card p-1.5 rounded-2xl border border-border/40">
           <Button 
            onClick={handleAISuggest}
            className="bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl h-11 px-6 font-black text-xs gap-2 transition-all"
           >
              <Sparkles className="h-4 w-4" /> AI Suggest
           </Button>
           <Button 
            variant="ghost" 
            className="h-11 w-11 p-0 rounded-xl hover:bg-accent/30 text-muted-foreground"
            onClick={() => toast.info("Tính năng Export sẽ sớm ra mắt!")}
           >
              <ArrowUpRight className="h-4 w-4" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
        
        {/* Category Sidebar - Scalable Navigation */}
        <aside className="space-y-6 sticky top-24">
          <div className="bg-card border border-border/80 rounded-[2.5rem] p-6 space-y-2 shadow-soft">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-4 mb-4">Danh mục kỹ năng</h3>
            <button 
              onClick={() => setActiveCategory("ALL")}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[13px] font-black transition-all",
                activeCategory === "ALL" ? "bg-primary text-white shadow-glow shadow-primary/10" : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                 <Layers className="h-4 w-4" /> Tất cả
              </div>
              <span className={cn("text-[10px] tabular-nums", activeCategory === "ALL" ? "text-white/60" : "text-muted-foreground/40")}>{skills.length}</span>
            </button>

            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[13px] font-black transition-all",
                  activeCategory === cat ? "bg-primary text-white shadow-glow shadow-primary/10" : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                   {cat === "Technical" ? <Award className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                   {cat === "Technical" ? "Công nghệ" : "Kỹ năng mềm"}
                </div>
                <span className={cn("text-[10px] tabular-nums", activeCategory === cat ? "text-white/60" : "text-muted-foreground/40")}>{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>

          <Button variant="ghost" className="w-full rounded-[2rem] border border-dashed border-border/60 h-14 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-accent/20 hover:border-border transition-all">
             <Plus className="h-4 w-4 mr-2" /> Thêm danh mục
          </Button>
        </aside>

        {/* Main Content Area */}
        <div className="space-y-8">
          {/* Optimized Toolbar - Leaner & More Focused */}
          <div className={cn("grid grid-cols-1 gap-6 p-6 rounded-[2.5rem] bg-card border transition-all", isBulkMode ? "border-primary/40 bg-primary/[0.02]" : "border-border/60 shadow-soft")}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder={`Tìm kiếm trong ${activeCategory === "ALL" ? "tất cả" : activeCategory}...`} 
                  className="pl-12 rounded-2xl border-border/60 bg-background/50 h-14 text-[13px] font-semibold focus-visible:ring-primary/20" 
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-border/30 pt-6">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsBulkMode(true)}
                  className="h-14 px-8 rounded-xl gap-3 text-muted-foreground hover:text-foreground font-black text-[11px] uppercase tracking-widest border border-border/40 hover:border-border transition-all"
                >
                  <Filter className="h-4 w-4" /> Chọn nhiều
                </Button>
                {isBulkMode && (
                  <div className="flex items-center gap-3 animate-in slide-in-from-left-4">
                    <span className="text-[11px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                        Đã chọn {selectedSkills.length}
                    </span>
                    <Button onClick={handleBulkDelete} disabled={selectedSkills.length === 0} variant="destructive" className="rounded-xl h-14 px-8 font-black text-[11px] uppercase tracking-widest shadow-glow shadow-destructive/10">
                        Xóa hàng loạt
                    </Button>
                    <Button variant="ghost" onClick={() => { setIsBulkMode(false); setSelectedSkills([]); }} className="h-10 w-10 p-0 rounded-xl">
                        <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>

              {!isBulkMode && (
                <div className="flex gap-2 w-full sm:w-auto">
                    <select 
                      value={addingToCategory}
                      onChange={(e) => setAddingToCategory(e.target.value)}
                      className="rounded-xl border border-border/60 bg-background h-14 px-4 text-[11px] font-black uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-primary/20 min-w-[120px]"
                    >
                      <option value="Technical">Tech</option>
                      <option value="Soft Skills">Soft</option>
                    </select>
                    <Input 
                      value={draft} 
                      onChange={(e) => setDraft(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                      placeholder="Thêm kỹ năng..." 
                      className="rounded-xl border-border/60 bg-background h-14 w-full sm:w-48 text-[13px] font-medium" 
                    />
                    <Button onClick={handleAddSkill} className="bg-primary hover:bg-primary-dark text-white rounded-xl h-14 px-8 font-black text-[11px] uppercase tracking-widest shadow-glow shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95">
                      Thêm
                    </Button>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Grid - Render only active category or organized blocks */}
          <div className="space-y-12">
            {(activeCategory === "ALL" || activeCategory === "Technical") && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-primary">Công nghệ</h4>
                  <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <AnimatePresence mode="popLayout">
                    {filteredSkills.filter(s => s.category === "Technical").map((s) => (
                      <SkillChip key={s.name} s={s} isBulkMode={isBulkMode} isSelected={selectedSkills.includes(s.id!)} onToggle={() => toggleSelect(s.id!)} onDelete={() => handleDelete(s.id!)} color="primary" />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {(activeCategory === "ALL" || activeCategory === "Soft Skills") && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 px-2">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-500">Kỹ năng mềm</h4>
                  <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <AnimatePresence mode="popLayout">
                    {filteredSkills.filter(s => s.category === "Soft Skills").map((s) => (
                      <SkillChip key={s.name} s={s} isBulkMode={isBulkMode} isSelected={selectedSkills.includes(s.id!)} onToggle={() => toggleSelect(s.id!)} onDelete={() => handleDelete(s.id!)} color="amber" />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {filteredSkills.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center space-y-4 opacity-30">
                <Search className="h-12 w-12" />
                <p className="text-[11px] font-black uppercase tracking-[0.3em]">Không tìm thấy kết quả</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for better organization
function SkillChip({ s, isBulkMode, isSelected, onToggle, onDelete, color }: any) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={() => isBulkMode && onToggle()}
      className={cn(
        "group relative flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl border transition-all cursor-pointer",
        isSelected
          ? color === "primary" ? "bg-primary/20 border-primary shadow-glow shadow-primary/10" : "bg-amber-500/20 border-amber-500 shadow-glow shadow-amber-500/10"
          : "bg-card border-border/80 hover:border-primary/40 hover:bg-accent/10"
      )}
    >
      <span className="text-[14px] font-black text-foreground/90">{s.name}</span>
      
      {s.status === "DRAFT" && (
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
      )}

      {!isBulkMode ? (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }} 
          className="ml-1 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground/30 hover:text-destructive transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <div className={cn(
          "ml-1 h-4 w-4 rounded-md border flex items-center justify-center transition-all",
          isSelected 
            ? color === "primary" ? "bg-primary border-primary text-white" : "bg-amber-500 border-amber-500 text-white" 
            : "border-border/60 bg-white/5"
        )}>
          {isSelected && <X className="h-3 w-3" />}
        </div>
      )}
    </motion.div>
  );
}