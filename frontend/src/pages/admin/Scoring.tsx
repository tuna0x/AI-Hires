import { useState } from "react";
import { 
  CheckCircle2, AlertCircle, Info, Layout, BrainCircuit, 
  Star, ChevronDown, ChevronRight, Gauge, FileText, 
  UserCircle, MessageSquare, Zap, BarChart3, Binary, Award, Globe, GraduationCap, Github
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Metric {
  id: string;
  label: string;
  max: number;
}

interface Category {
  id: string;
  title: string;
  icon: any;
  max: number;
  metrics: Metric[];
}

interface Stage {
  id: string;
  title: string;
  icon: any;
  color: string;
  max: number;
  categories: Category[];
}

const SCORING_STRUCTURE: Stage[] = [
  {
    id: "core",
    title: "Stage 2: Core Analysis",
    icon: Layout,
    color: "primary",
    max: 50,
    categories: [
      {
        id: "ats_format",
        title: "ATS Format & Parsability",
        icon: FileText,
        max: 12,
        metrics: [
          { id: "file_technical", label: "File Technical", max: 3 },
          { id: "ats_parsability", label: "ATS Parsability", max: 5 },
          { id: "typography", label: "Typography", max: 2 },
          { id: "length", label: "Length", max: 2 },
        ]
      },
      {
        id: "professional_foundation",
        title: "Professional Foundation",
        icon: UserCircle,
        max: 18,
        metrics: [
          { id: "contact", label: "Contact Info", max: 4 },
          { id: "summary", label: "Career Summary", max: 5 },
          { id: "sections", label: "Core Sections", max: 5 },
          { id: "organization", label: "Organization", max: 4 },
        ]
      },
      {
        id: "content_quality",
        title: "Content Quality",
        icon: MessageSquare,
        max: 20,
        metrics: [
          { id: "language", label: "Language & Grammar", max: 5 },
          { id: "quantification", label: "Quantification", max: 8 },
          { id: "keywords", label: "Keywords Match", max: 4 },
          { id: "consistency", label: "Consistency", max: 3 },
        ]
      }
    ]
  },
  {
    id: "indepth",
    title: "Stage 3: In-depth Evaluation",
    icon: BrainCircuit,
    color: "amber",
    max: 40,
    categories: [
      {
        id: "experience_eval",
        title: "Experience Progression",
        icon: BarChart3,
        max: 20,
        metrics: [
          { id: "progression", label: "Career Progression", max: 4 },
          { id: "bullet_quality", label: "Bullet Point Quality", max: 8 },
          { id: "scope_impact", label: "Scope & Impact", max: 8 },
        ]
      },
      {
        id: "technical_evidence",
        title: "Technical Evidence",
        icon: Binary,
        max: 10,
        metrics: [{ id: "tech_evidence", label: "Tech Validation", max: 10 }]
      },
      {
        id: "projects",
        title: "Project Depth",
        icon: Zap,
        max: 7,
        metrics: [{ id: "project_depth", label: "Project Analysis", max: 7 }]
      },
      {
        id: "certs",
        title: "Certifications",
        icon: Info,
        max: 3,
        metrics: [{ id: "certification_value", label: "Cert Value", max: 3 }]
      }
    ]
  },
  {
    id: "bonus",
    title: "Stage 4: Bonus Points",
    icon: Star,
    color: "emerald",
    max: 10,
    categories: [
      {
        id: "leadership",
        title: "Leadership",
        icon: Gauge,
        max: 2,
        metrics: [{ id: "bonus_leadership", label: "Leadership Impact", max: 2 }]
      },
      {
        id: "international",
        title: "International",
        icon: Globe,
        max: 2,
        metrics: [{ id: "bonus_international", label: "Global Exposure", max: 2 }]
      },
      {
        id: "awards",
        title: "Awards",
        icon: Award,
        max: 2,
        metrics: [{ id: "bonus_awards", label: "Special Honors", max: 2 }]
      },
      {
        id: "learning",
        title: "Continuous Learning",
        icon: GraduationCap,
        max: 2,
        metrics: [{ id: "bonus_learning", label: "Self-Development", max: 2 }]
      },
      {
        id: "category_specific",
        title: "Category Specific",
        icon: Github,
        max: 2,
        metrics: [{ id: "bonus_cat_spec", label: "Portfolio/Specific", max: 2 }]
      }
    ]
  }
];

export default function Scoring() {
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    SCORING_STRUCTURE.forEach(s => 
      s.categories.forEach(c => 
        c.metrics.forEach(m => initial[m.id] = m.max)
      )
    );
    return initial;
  });

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    ats_format: true, professional_foundation: true, experience_eval: true
  });

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryTotal = (categoryId: string) => {
    const category = SCORING_STRUCTURE.flatMap(s => s.categories).find(c => c.id === categoryId);
    if (!category) return 0;
    return category.metrics.reduce((acc, m) => acc + (weights[m.id] || 0), 0);
  };

  const getStageTotal = (stageId: string) => {
    const stage = SCORING_STRUCTURE.find(s => s.id === stageId);
    if (!stage) return 0;
    return stage.categories.reduce((acc, c) => acc + getCategoryTotal(c.id), 0);
  };

  const grandTotal = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValid = grandTotal === 100 && SCORING_STRUCTURE.every(s => getStageTotal(s.id) === s.max);

  const handleWeightChange = (id: string, val: number) => {
    setWeights(prev => ({ ...prev, [id]: val }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-2">
        <div className="flex items-center gap-6">
           <div className="h-14 w-2.5 bg-primary rounded-full shadow-glow shadow-primary/20" />
           <div className="space-y-1">
             <h2 className="text-4xl font-black text-white tracking-tighter">Thuật toán Scoring CV</h2>
             <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-60">Phân tích đa tầng & Điều chỉnh điểm số tuyệt đối</p>
           </div>
        </div>
        <div className={cn(
          "flex items-center gap-6 px-10 py-5 rounded-[2.5rem] border transition-all shadow-elegant relative overflow-hidden group",
          grandTotal === 100 ? "bg-emerald-500/5 border-emerald-500/10" : "bg-destructive/5 border-destructive/10"
        )}>
           <div className="flex flex-col items-end">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Điểm tối đa</span>
             <div className="flex items-baseline gap-1">
               <span className={cn("text-4xl font-black tabular-nums", grandTotal === 100 ? "text-emerald-500" : "text-destructive")}>{grandTotal}</span>
               <span className="text-sm font-bold text-muted-foreground">pts</span>
             </div>
           </div>
           <div className={cn(
             "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110",
             grandTotal === 100 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
           )}>
             {grandTotal === 100 ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
           </div>
        </div>
      </div>

      <div className="space-y-16">
        {SCORING_STRUCTURE.map((stage) => {
          const stageTotal = getStageTotal(stage.id);
          const isStageValid = stageTotal === stage.max;

          return (
            <div key={stage.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Stage Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-soft",
                     stage.color === "primary" ? "bg-primary/10 text-primary border-primary/20" :
                     stage.color === "amber" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                     "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                   )}>
                      <stage.icon className="h-6 w-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-white tracking-tight">{stage.title}</h3>
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Stage Target</span>
                       <Badge variant="outline" className="bg-white/5 text-white border-white/5 rounded-md font-bold text-[10px]">{stage.max} pts</Badge>
                     </div>
                   </div>
                </div>
                <div className="text-right">
                  <div className={cn("text-2xl font-black tabular-nums", isStageValid ? "text-white" : "text-destructive")}>{stageTotal} <span className="text-sm">pts</span></div>
                  {!isStageValid && (
                    <span className="text-[9px] font-black text-destructive uppercase tracking-widest animate-pulse">Lệch: {stageTotal - stage.max} pts</span>
                  )}
                </div>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stage.categories.map((category) => {
                  const catTotal = getCategoryTotal(category.id);
                  const isExpanded = expandedCategories[category.id];

                  return (
                    <div 
                      key={category.id} 
                      className={cn(
                        "rounded-[2.5rem] bg-white/[0.03] border transition-all duration-500 overflow-hidden group",
                        isExpanded ? "border-white/10 ring-1 ring-white/5" : "border-white/5 hover:border-white/10"
                      )}
                    >
                      {/* Category Header */}
                      <div 
                        onClick={() => toggleCategory(category.id)}
                        className="p-8 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-5">
                           <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:text-primary transition-colors border border-white/5">
                              <category.icon className="h-5 w-5" />
                           </div>
                           <div>
                             <h4 className="text-sm font-black text-white group-hover:translate-x-1 transition-transform">{category.title}</h4>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">Target: {category.max} pts</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className={cn("text-lg font-black tabular-nums", catTotal === category.max ? "text-primary" : "text-destructive")}>{catTotal} pts</div>
                           <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
                             {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                           </div>
                        </div>
                      </div>

                      {/* Metrics List */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-8 pb-8 space-y-8 border-t border-white/5 pt-8">
                               {category.metrics.map((metric) => (
                                 <div key={metric.id} className="space-y-4">
                                   <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-white/70">{metric.label}</span>
                                      <div className="flex items-center gap-2">
                                        <input 
                                          type="number"
                                          value={weights[metric.id]}
                                          onChange={(e) => handleWeightChange(metric.id, parseInt(e.target.value) || 0)}
                                          className="w-12 bg-transparent text-right text-sm font-black text-primary border-none focus:ring-0 p-0"
                                        />
                                        <span className="text-[10px] text-muted-foreground font-black uppercase">pts</span>
                                      </div>
                                   </div>
                                   <Slider 
                                     value={[weights[metric.id]]} 
                                     max={Math.max(metric.max * 2, 10)} 
                                     step={1} 
                                     onValueChange={(v) => handleWeightChange(metric.id, v[0])} 
                                     className="py-1"
                                   />
                                   <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/20">
                                      <span>0 pts</span>
                                      <span>Mặc định: {metric.max} pts</span>
                                   </div>
                                 </div>
                               ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Persistence Bar */}
      <div className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50 transition-all duration-500",
        isValid ? "translate-y-0" : "translate-y-4 opacity-80"
      )}>
        <div className={cn(
          "p-6 rounded-[2.5rem] border backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6",
          isValid ? "bg-[#0F172A]/80 border-white/10" : "bg-destructive/10 border-destructive/20"
        )}>
          <div className="flex items-center gap-5">
             <div className={cn(
               "h-12 w-12 rounded-2xl flex items-center justify-center border",
               isValid ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
             )}>
                {isValid ? <Zap className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
             </div>
             <div className="space-y-1">
                <h4 className="text-sm font-black text-white tracking-tight uppercase">Xác nhận thuật toán</h4>
                <p className="text-[10px] text-muted-foreground font-bold leading-tight max-w-[300px]">
                  {isValid 
                    ? "Toàn bộ cấu trúc điểm đã khớp 100pts (50 Core, 40 In-depth, 10 Bonus). Sẵn sàng đồng bộ prompt AI." 
                    : "Tổng điểm chưa cân bằng. Vui lòng kiểm tra lại sự lệch điểm ở các giai đoạn phía trên."}
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <Button 
               variant="ghost" 
               className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-white/5"
               onClick={() => {
                 const initial: Record<string, number> = {};
                 SCORING_STRUCTURE.forEach(s => s.categories.forEach(c => c.metrics.forEach(m => initial[m.id] = m.max)));
                 setWeights(initial);
               }}
             >
               Reset Defaults
             </Button>
             <Button 
               disabled={!isValid}
               onClick={() => toast.success("Đã đồng bộ thuật toán Scoring với Gemini engine")}
               className="bg-primary hover:bg-primary-dark text-primary-foreground h-12 px-10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-glow shadow-primary/20 transition-all active:scale-95"
             >
               Update Engine 🚀
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, variant = "outline", className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <div className={cn("px-2 py-0.5 rounded-md inline-flex items-center", className)}>
      {children}
    </div>
  );
}