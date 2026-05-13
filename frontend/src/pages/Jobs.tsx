import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Search, MapPin, Briefcase, DollarSign, Calendar, Sparkles, Filter, 
  ChevronDown, X, Building2, SlidersHorizontal, ArrowUpRight, 
  Clock, Globe, LayoutGrid, ListFilter, Star, CheckCircle2, ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Seo, breadcrumbLd } from "@/lib/seo";
import SiteLayout from "@/components/site/SiteLayout";
import { cn } from "@/lib/utils";

// Mock data (Mở rộng thêm trường để test lọc)
const MOCK_JOBS = [
  {
    id: 1,
    title: "Senior Java Spring Boot Engineer",
    company: "Viettel Group",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80",
    location: "Hà Nội",
    salary: 45, // Triệu VND
    type: "Full-time",
    level: "Senior",
    category: "Backend",
    workStyle: "Văn phòng",
    postedAt: "1 ngày trước",
    matchScore: 95,
  },
  {
    id: 2,
    title: "React Frontend Developer (Mid/Senior)",
    company: "VNG Corporation",
    location: "TP. Hồ Chí Minh",
    salary: 35,
    type: "Full-time",
    level: "Mid-Senior",
    category: "Frontend",
    workStyle: "Hybrid",
    postedAt: "3 ngày trước",
    matchScore: 88,
  },
  {
    id: 3,
    title: "AI Engineer (Python / LLM)",
    company: "FPT Smart Cloud",
    location: "Hà Nội",
    salary: 55,
    type: "Full-time",
    level: "Tech Lead",
    category: "AI / ML",
    workStyle: "Remote",
    postedAt: "Hôm nay",
    matchScore: 98,
  },
  {
    id: 4,
    title: "Intern Node.js Developer",
    company: "Tiki.vn",
    location: "TP. Hồ Chí Minh",
    salary: 10,
    type: "Internship",
    level: "Intern",
    category: "Backend",
    workStyle: "Văn phòng",
    postedAt: "5 ngày trước",
    matchScore: 65,
  }
];

const FILTER_CATEGORIES = {
  locations: ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Remote"],
  levels: ["Intern", "Junior", "Middle", "Senior", "Tech Lead"],
  types: ["Full-time", "Part-time", "Contract", "Internship"],
  fields: ["Backend", "Frontend", "AI / ML", "Mobile", "DevOps", "Data Science"],
  workStyles: ["Văn phòng", "Hybrid", "Remote"]
};

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState([0, 100]); // Triệu VND
  const [sortBy, setSortBy] = useState("latest");

  // Logic lọc nâng cao
  const filteredJobs = useMemo(() => {
    let result = MOCK_JOBS.filter(job => {
      const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          job.company.toLowerCase().includes(search.toLowerCase());
      const matchLocation = selectedLocations.length === 0 || selectedLocations.includes(job.location);
      const matchLevel = selectedLevels.length === 0 || selectedLevels.includes(job.level);
      const matchField = selectedFields.length === 0 || selectedFields.includes(job.category);
      const matchType = selectedTypes.length === 0 || selectedTypes.includes(job.type);
      const matchSalary = job.salary >= salaryRange[0] && job.salary <= salaryRange[1];
      
      return matchSearch && matchLocation && matchLevel && matchField && matchType && matchSalary;
    });

    // Sắp xếp
    if (sortBy === "salary_desc") result.sort((a, b) => b.salary - a.salary);
    if (sortBy === "match_score") result.sort((a, b) => b.matchScore - a.matchScore);
    
    return result;
  }, [search, selectedLocations, selectedLevels, selectedFields, selectedTypes, salaryRange, sortBy]);

  const toggleFilter = (item: string, state: string[], setState: (val: string[]) => void) => {
    setState(state.includes(item) ? state.filter(i => i !== item) : [...state, item]);
  };

  const removeFilter = (item: string) => {
    if (selectedLocations.includes(item)) toggleFilter(item, selectedLocations, setSelectedLocations);
    if (selectedLevels.includes(item)) toggleFilter(item, selectedLevels, setSelectedLevels);
    if (selectedFields.includes(item)) toggleFilter(item, selectedFields, setSelectedFields);
    if (selectedTypes.includes(item)) toggleFilter(item, selectedTypes, setSelectedTypes);
  };

  const allFilters = [...selectedLocations, ...selectedLevels, ...selectedFields, ...selectedTypes];

  return (
    <SiteLayout>
      <Seo 
        title="Việc làm IT hấp dẫn — Intervio"
        description="Tìm kiếm hàng ngàn cơ hội việc làm IT lương cao. Tự động đánh giá độ phù hợp với CV bằng AI (Gemini Pro)."
        path="/jobs"
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Việc làm", path: "/jobs" }])}
      />
      
      <div className="bg-[#0B0F19] min-h-screen">
        {/* Header Section: Search & Title */}
        <section className="relative pt-16 pb-12 overflow-hidden border-b border-border/40">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none">
            <div className="absolute -top-24 left-0 h-48 w-48 rounded-full bg-primary/20 blur-[100px]" />
            <div className="absolute top-12 right-0 h-48 w-48 rounded-full bg-blue-500/10 blur-[100px]" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1 animate-in slide-in-from-top-4 duration-500">
                <Sparkles className="h-3 w-3 mr-2" /> Hơn 5,000+ cơ hội đang chờ bạn
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4">
                Tìm kiếm <span className="text-gradient-primary">Sự nghiệp</span> mơ ước
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Kết nối với các tập đoàn công nghệ hàng đầu và nhận đánh giá Match Score tức thì bằng AI cho mỗi vị trí.
              </p>
            </div>

            {/* Main Search Bar */}
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-3 p-2 bg-card/40 backdrop-blur-xl border border-border/40 rounded-3xl shadow-2xl">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Tên công việc, vị trí, công ty..." 
                  className="pl-12 bg-transparent border-0 h-14 text-base focus-visible:ring-0" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="hidden md:block w-px h-8 bg-border/40" />
              <div className="flex items-center gap-2 px-4 w-full md:w-auto">
                 <MapPin className="h-5 w-5 text-muted-foreground" />
                 <span className="text-sm font-medium text-slate-300">Toàn quốc</span>
              </div>
              <Button className="w-full md:w-auto h-14 px-8 rounded-2xl bg-gradient-primary text-primary-foreground font-black shadow-glow hover:scale-[1.02] transition-all">
                Tìm ngay
              </Button>
            </div>
          </div>
        </section>

        {/* Content Section: Sidebar & List */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-10">
            
            {/* Sidebar Filters */}
            <aside className="lg:w-1/4 space-y-10 shrink-0">
               {/* Selected Filter Pills */}
               {allFilters.length > 0 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Đã chọn</h3>
                    <button onClick={() => {
                      setSelectedLocations([]); setSelectedLevels([]); setSelectedFields([]); setSelectedTypes([]);
                    }} className="text-[10px] font-bold text-primary hover:underline">Xóa tất cả</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allFilters.map(f => (
                      <Badge key={f} className="bg-primary/10 text-primary border-primary/20 gap-1 pl-3 pr-2 py-1.5 rounded-xl">
                        {f} <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter(f)} />
                      </Badge>
                    ))}
                  </div>
                </div>
               )}

               {/* Advanced Filter Groups */}
               <div className="space-y-8 bg-card/20 p-8 rounded-[2.5rem] border border-border/40 glass">
                 
                 {/* Salary range slider */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Mức lương</h3>
                      <span className="text-xs font-bold text-primary">{salaryRange[0]}m - {salaryRange[1]}m+</span>
                    </div>
                    <Slider 
                      value={salaryRange} 
                      max={150} 
                      step={5} 
                      onValueChange={setSalaryRange}
                      className="py-4"
                    />
                 </div>

                 {/* Locations */}
                 <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Địa điểm</h3>
                    <div className="space-y-2.5">
                      {FILTER_CATEGORIES.locations.map(loc => (
                         <div key={loc} className="flex items-center gap-3">
                            <Checkbox 
                              id={`loc-${loc}`} 
                              checked={selectedLocations.includes(loc)} 
                              onCheckedChange={() => toggleFilter(loc, selectedLocations, setSelectedLocations)}
                              className="rounded-lg border-muted-foreground/30 data-[state=checked]:bg-primary"
                            />
                            <label htmlFor={`loc-${loc}`} className="text-sm font-medium text-slate-300 cursor-pointer hover:text-primary transition-colors">{loc}</label>
                         </div>
                      ))}
                    </div>
                 </div>

                 {/* Categories / Fields */}
                 <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Lĩnh vực</h3>
                    <div className="grid grid-cols-1 gap-2.5">
                       {FILTER_CATEGORIES.fields.map(field => (
                          <button 
                            key={field}
                            onClick={() => toggleFilter(field, selectedFields, setSelectedFields)}
                            className={cn(
                              "text-left px-4 py-3 rounded-2xl text-sm font-bold border transition-all",
                              selectedFields.includes(field) 
                                ? "bg-primary/10 border-primary text-primary" 
                                : "bg-secondary/10 border-border/40 text-muted-foreground hover:bg-secondary/20"
                            )}
                          >
                            {field}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Work Style / Type */}
                 <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Hình thức</h3>
                    <div className="space-y-2.5">
                      {FILTER_CATEGORIES.workStyles.map(style => (
                        <div key={style} className="flex items-center gap-3">
                          <Checkbox id={`style-${style}`} className="rounded-lg border-muted-foreground/30 data-[state=checked]:bg-primary" />
                          <label htmlFor={`style-${style}`} className="text-sm font-medium text-slate-300">{style}</label>
                        </div>
                      ))}
                    </div>
                 </div>
               </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 space-y-10">
              
              {/* Toolbar: View mode, Sort, Result Count */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">Kết quả tìm kiếm</h2>
                  <p className="text-sm text-muted-foreground">Tìm thấy <span className="text-primary font-bold">{filteredJobs.length}</span> vị trí phù hợp</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex bg-secondary/20 p-1 rounded-xl border border-border/40">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-primary/20 text-primary"><LayoutGrid className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground"><ListFilter className="h-4 w-4" /></Button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="rounded-xl gap-2 border-border/40 text-sm font-bold">
                        Sắp xếp theo <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border/60 bg-card/95 p-2 backdrop-blur-xl">
                       <DropdownMenuItem onClick={() => setSortBy("latest")} className="rounded-xl font-bold text-xs py-2 px-3">Mới nhất</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setSortBy("salary_desc")} className="rounded-xl font-bold text-xs py-2 px-3">Lương cao đến thấp</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setSortBy("match_score")} className="rounded-xl font-bold text-xs py-2 px-3 text-primary bg-primary/5">Match Score cao nhất</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Job Cards Grid */}
              <div className="flex flex-col gap-6">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <Link 
                      to={`/jobs/${job.id}`} 
                      key={job.id} 
                      className="group relative block p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] bg-card/40 backdrop-blur-xl border border-border/40 hover:border-primary/40 hover:shadow-glow hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                    >
                      {/* Artistic Background Accent */}
                      <div className="absolute -top-12 -right-12 h-48 w-48 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-colors" />
                      
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
                        {/* Left Section: Logo */}
                        <div className="h-20 w-20 p-1 rounded-[1.5rem] bg-gradient-to-br from-primary/30 to-indigo-600/30 shadow-inner overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                           <img src={job.logo || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=50&q=80"} alt={job.company} className="h-full w-full object-cover rounded-[1.25rem]" />
                        </div>

                        {/* Middle Section: Job Primary Info */}
                        <div className="flex-1 space-y-3 min-w-0">
                           <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors leading-tight truncate">{job.title}</h3>
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-tighter px-2 py-0.5">
                                 {job.postedAt}
                              </Badge>
                           </div>
                           
                           <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-slate-400">
                              <span className="flex items-center gap-2 tracking-tight">
                                 <Building2 className="h-4 w-4 text-primary/60" /> {job.company}
                              </span>
                              <span className="flex items-center gap-2">
                                 <MapPin className="h-4 w-4 text-blue-500/80" /> {job.location}
                              </span>
                              <span className="flex items-center gap-2 text-emerald-400 font-extrabold">
                                 <DollarSign className="h-4 w-4" /> {job.salary}M - {job.salary + 10}M
                              </span>
                           </div>

                           <div className="flex flex-wrap gap-2 pt-1">
                              <Badge variant="secondary" className="bg-secondary/10 border-0 rounded-lg py-1 px-3 text-[10px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-foreground transition-colors">{job.category}</Badge>
                              <Badge variant="secondary" className="bg-primary/5 text-primary border-0 rounded-lg py-1 px-3 text-[10px] font-black uppercase tracking-tighter">{job.workStyle}</Badge>
                              <Badge variant="secondary" className="bg-orange-500/5 text-orange-500 border-0 rounded-lg py-1 px-3 text-[10px] font-black uppercase tracking-tighter">{job.level}</Badge>
                           </div>
                        </div>

                        {/* Right Section: Match Score & CTA */}
                        <div className="shrink-0 flex items-center gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-border/40">
                           <div className="flex flex-col items-center gap-1">
                              <div className="h-16 w-16 rounded-[1.25rem] bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-glow-sm">
                                 <span className="text-xl font-black">{job.matchScore}%</span>
                                 <span className="text-[10px] font-black uppercase tracking-tighter -mt-1">Match</span>
                              </div>
                           </div>

                           <div className="flex-1 md:flex-none">
                              <Button variant="ghost" className="w-full md:w-auto h-14 px-8 rounded-2xl bg-secondary/10 group-hover:bg-primary text-muted-foreground group-hover:text-white font-black text-xs uppercase tracking-widest border border-transparent group-hover:border-primary/20 transition-all gap-2">
                                 Xem chi tiết <ChevronRight className="h-4 w-4" />
                              </Button>
                           </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center space-y-6 bg-card/20 rounded-[3rem] border border-dashed border-border/60">
                     <div className="h-20 w-20 bg-secondary/40 rounded-[2.5rem] flex items-center justify-center mx-auto">
                        <Filter className="h-10 w-10 text-muted-foreground" />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-xl font-bold">Không tìm thấy việc làm</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để có kết quả tốt hơn.</p>
                     </div>
                     <Button variant="outline" className="rounded-2xl border-primary text-primary" onClick={() => {
                        setSearch(""); setSelectedLocations([]); setSelectedLevels([]); setSelectedFields([]); setSelectedTypes([]);
                     }}>Làm mới bộ lọc</Button>
                  </div>
                )}
              </div>
            </main>

          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
