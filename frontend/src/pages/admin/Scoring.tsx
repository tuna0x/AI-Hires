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
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="h-12 w-1.5 bg-primary rounded-full" />
             <h2 className="text-3xl font-black text-foreground tracking-tight">Thuật toán Scoring CV</h2>
          </div>
          <p className="text-muted-foreground text-sm font-medium ml-4 uppercase tracking-[0.2em] opacity-80">Phân tích đa tầng & Điều chỉnh điểm số tuyệt đối</p>
        </div>

        <div className={cn(
          "flex items-center gap-6 px-8 py-4 rounded-3xl border transition-all shadow-soft relative overflow-hidden group",
          grandTotal === 100 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-destructive/5 border-destructive/20"
        )}>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Điểm tối đa</span>
            <div className="flex items-baseline gap-1">
              <span className={cn("text-3xl font-black tabular-nums", grandTotal === 100 ? "text-emerald-500" : "text-destructive")}>{grandTotal}</span>
              <span className="text-sm font-bold text-muted-foreground">pts</span>
            </div>
          </div>
          <div className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center border transition-all",
            grandTotal === 100 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
          )}>
            {grandTotal === 100 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>
        </div>
      </div>

      <div className="grid gap-12">
        {SCORING_STRUCTURE.map((stage) => {
          const stageTotal = getStageTotal(stage.id);
          const isStageValid = stageTotal === stage.max;

          return (
            <div key={stage.id} className="space-y-8">
              {/* Stage Header */}
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center border border-border/50",
                    stage.color === "primary" ? "bg-primary/10 text-primary" :
                    stage.color === "amber" ? "bg-amber-500/10 text-amber-500" :
                    "bg-emerald-500/10 text-emerald-500"
                  )}>
                    <stage.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">{stage.title}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Stage Target</span>
                       <Badge variant="outline" className="bg-muted/50 text-foreground border-border rounded-md font-bold text-[10px]">{stage.max} pts</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn("text-2xl font-black tabular-nums", isStageValid ? "text-foreground" : "text-destructive")}>{stageTotal} <span className="text-sm">pts</span></div>
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
                        "rounded-[2rem] bg-card border border-border/60 transition-all duration-300 overflow-hidden group",
                        isExpanded ? "ring-1 ring-primary/20 bg-card/80 shadow-card" : "hover:border-primary/30"
                      )}
                    >
                      {/* Category Header */}
                      <div 
                        onClick={() => toggleCategory(category.id)}
                        className="p-6 cursor-pointer flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-9 w-9 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                            <category.icon className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{category.title}</h4>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">Target: {category.max} pts</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={cn("text-md font-black tabular-nums", catTotal === category.max ? "text-primary" : "text-destructive")}>{catTotal} pts</div>
                          <div className="h-7 w-7 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground">
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
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
                            className="bg-background/20"
                          >
                            <div className="px-6 pb-6 space-y-8 border-t border-border/20 pt-6">
                              {category.metrics.map((metric) => (
                                <div key={metric.id} className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-muted-foreground">{metric.label}</span>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number"
                                        value={weights[metric.id]}
                                        onChange={(e) => handleWeightChange(metric.id, parseInt(e.target.value) || 0)}
                                        className="w-10 bg-transparent text-right text-sm font-black text-primary border-none focus:ring-0 p-0"
                                      />
                                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">pts</span>
                                    </div>
                                  </div>
                                  <Slider 
                                    value={[weights[metric.id]]} 
                                    max={Math.max(metric.max * 2, 10)} 
                                    step={1} 
                                    onValueChange={(v) => handleWeightChange(metric.id, v[0])} 
                                    className="py-1"
                                  />
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

      {/* Action Bar */}
      <div className={cn(
        "fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-40 transition-all duration-500",
        isValid ? "translate-y-0" : "translate-y-2 opacity-90 scale-[0.98]"
      )}>
        <div className={cn(
          "p-5 rounded-[2.5rem] border backdrop-blur-xl shadow-elegant flex flex-col md:flex-row items-center justify-between gap-6 transition-colors",
          isValid ? "bg-card/95 border-primary/20" : "bg-card/95 border-destructive/20"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center border",
              isValid ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
            )}>
              {isValid ? <Zap className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest">Update Engine 🚀</h4>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight max-w-[280px]">
                {isValid 
                  ? "Cấu trúc điểm số hợp lệ. Sẵn sàng cập nhật cho hệ thống." 
                  : "Tổng điểm chưa đạt 100. Hãy điều chỉnh trước khi lưu."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="h-10 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-accent"
              onClick={() => {
                const initial: Record<string, number> = {};
                SCORING_STRUCTURE.forEach(s => s.categories.forEach(c => c.metrics.forEach(m => initial[m.id] = m.max)));
                setWeights(initial);
              }}
            >
              Reset
            </Button>
            <Button 
              disabled={!isValid}
              onClick={() => toast.success("Đã cập nhật thuật toán!")}
              className="bg-primary hover:bg-primary-dark text-primary-foreground h-10 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-glow shadow-primary/20"
            >
              Cập nhật ngay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, variant = "outline", className }: { children: React.ReactNode, variant?: string, className?: string }) {
  return (
    <div className={cn("px-2 py-0.5 rounded-md inline-flex items-center border border-border text-[11px] font-medium transition-colors", className)}>
      {children}
    </div>
  );
}