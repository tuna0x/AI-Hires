import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Briefcase, DollarSign, Calendar, Sparkles, Filter,
  ChevronDown, X, Building2, SlidersHorizontal, ArrowUpRight,
  Clock, Globe, LayoutGrid, ListFilter, Star, CheckCircle2, ChevronRight,
  TrendingUp, AlertCircle, RefreshCw, Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Seo, breadcrumbLd } from "@/lib/seo";
import SiteLayout from "@/components/site/SiteLayout";
import { cn } from "@/lib/utils";

// Dữ liệu mẫu
const MOCK_JOBS = [
  {
    id: 1,
    title: "Senior Java Spring Boot Engineer",
    company: "Viettel Group",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=80",
    location: "Hà Nội",
    salary: 45,
    type: "Toàn thời gian",
    level: "Senior",
    industry: "Công nghệ thông tin",
    companyIndustry: "Viễn thông",
    jobField: "Phần mềm Backend",
    workStyle: "Văn phòng",
    postedAtValue: 1715700000000,
    updatedAtValue: 1715786400000,
    postedAt: "1 ngày trước",
    isUrgent: true,
  },
  {
    id: 2,
    title: "React Frontend Developer (Mid/Senior)",
    company: "VNG Corporation",
    location: "TP. Hồ Chí Minh",
    salary: 35,
    type: "Toàn thời gian",
    level: "Senior",
    industry: "Công nghệ thông tin",
    companyIndustry: "Giải trí số",
    jobField: "Phần mềm Frontend",
    workStyle: "Hybrid",
    postedAtValue: 1715527200000,
    updatedAtValue: 1715613600000,
    postedAt: "3 ngày trước",
    isUrgent: false,
  },
  {
    id: 3,
    title: "AI Engineer (Python / LLM)",
    company: "FPT Smart Cloud",
    location: "Hà Nội",
    salary: 55,
    type: "Toàn thời gian",
    level: "Tech Lead",
    industry: "Công nghệ thông tin",
    companyIndustry: "Điện toán đám mây",
    jobField: "AI / Học máy",
    workStyle: "Remote",
    postedAtValue: 1715786400000,
    updatedAtValue: 1715872800000,
    postedAt: "Hôm nay",
    isUrgent: true,
  },
  {
    id: 4,
    title: "Intern Node.js Developer",
    company: "Tiki.vn",
    location: "TP. Hồ Chí Minh",
    salary: 10,
    type: "Thực tập",
    level: "Intern",
    industry: "Thương mại điện tử",
    companyIndustry: "Bán lẻ trực tuyến",
    jobField: "Phần mềm Backend",
    workStyle: "Văn phòng",
    postedAtValue: 1715354400000,
    updatedAtValue: 1715440800000,
    postedAt: "5 ngày trước",
    isUrgent: false,
  }
];

const FILTER_CATEGORIES = {
  locations: ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Remote"],
  levels: ["Thực tập", "Junior", "Middle", "Senior", "Tech Lead"],
  salaries: [
    "Dưới 10 triệu",
    "10 - 20 triệu",
    "20 - 30 triệu",
    "30 - 50 triệu",
    "Trên 50 triệu",
    "Thỏa thuận"
  ],
  // Searchable categories
  industries: ["Công nghệ thông tin", "Thương mại điện tử", "Tài chính", "Bảo hiểm", "Giáo dục", "Y tế"],
  companyIndustries: ["Viễn thông", "Giải trí số", "Điện toán đám mây", "Bán lẻ trực tuyến", "Logistics", "Fintech"],
  jobFields: ["Phần mềm Backend", "Phần mềm Frontend", "AI / Học máy", "Mobile App", "DevOps", "Dữ liệu lớn"]
};

const SORT_OPTIONS = [
  { value: "posted", label: "Ngày đăng", icon: <Clock className="h-4 w-4" /> },
  { value: "updated", label: "Ngày cập nhật", icon: <RefreshCw className="h-4 w-4" /> },
  { value: "salary_desc", label: "Lương cao đến thấp", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "urgent", label: "Cần tuyển gấp", icon: <AlertCircle className="h-4 w-4" /> },
];

function ComboboxFilter({
  label,
  options,
  selected,
  onSelect,
  icon: Icon
}: {
  label: string,
  options: string[],
  selected: string[],
  onSelect: (val: string) => void,
  icon: any
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </h3>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-primary/40 text-xs font-bold text-slate-400 rounded-xl h-10 px-4"
          >
            {selected.length > 0
              ? `${selected.length} đã chọn`
              : `Chọn ${label.toLowerCase()}...`}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0 bg-[#0D1222] border-white/10 shadow-2xl backdrop-blur-xl rounded-xl">
          <Command className="bg-transparent">
            <CommandInput placeholder={`Tìm ${label.toLowerCase()}...`} className="h-9 text-xs border-white/5" />
            <CommandList className="max-h-[200px] overflow-y-auto custom-scrollbar">
              <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">Không tìm thấy.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => {
                      onSelect(option);
                    }}
                    className="text-xs font-bold py-2.5 px-4 cursor-pointer hover:bg-white/5 aria-selected:bg-primary/20 aria-selected:text-primary transition-all flex items-center justify-between"
                  >
                    {option}
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary",
                        selected.includes(option) ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedSalaries, setSelectedSalaries] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedCompanyIndustries, setSelectedCompanyIndustries] = useState<string[]>([]);
  const [selectedJobFields, setSelectedJobFields] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("posted");

  const filteredJobs = useMemo(() => {
    let result = MOCK_JOBS.filter(job => {
      const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.company.toLowerCase().includes(search.toLowerCase());
      const matchLocation = selectedLocations.length === 0 || selectedLocations.includes(job.location);
      const matchLevel = selectedLevels.length === 0 || selectedLevels.includes(job.level);
      const matchIndustry = selectedIndustries.length === 0 || selectedIndustries.includes(job.industry);
      const matchCompanyIndustry = selectedCompanyIndustries.length === 0 || selectedCompanyIndustries.includes(job.companyIndustry);
      const matchJobField = selectedJobFields.length === 0 || selectedJobFields.includes(job.jobField);

      let matchSalary = selectedSalaries.length === 0;
      if (selectedSalaries.length > 0) {
        matchSalary = selectedSalaries.some(range => {
          if (range === "Dưới 10 triệu") return job.salary < 10;
          if (range === "10 - 20 triệu") return job.salary >= 10 && job.salary <= 20;
          if (range === "20 - 30 triệu") return job.salary > 20 && job.salary <= 30;
          if (range === "30 - 50 triệu") return job.salary > 30 && job.salary <= 50;
          if (range === "Trên 50 triệu") return job.salary > 50;
          if (range === "Thỏa thuận") return job.salary === 0;
          return false;
        });
      }

      return matchSearch && matchLocation && matchLevel && matchSalary &&
        matchIndustry && matchCompanyIndustry && matchJobField;
    });

    if (sortBy === "salary_desc") result.sort((a, b) => b.salary - a.salary);
    if (sortBy === "urgent") result.sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0));
    if (sortBy === "posted") result.sort((a, b) => b.postedAtValue - a.postedAtValue);
    if (sortBy === "updated") result.sort((a, b) => b.updatedAtValue - a.updatedAtValue);

    return result;
  }, [search, selectedLocations, selectedLevels, selectedSalaries, selectedIndustries, selectedCompanyIndustries, selectedJobFields, sortBy]);

  const toggleFilter = (item: string, state: string[], setState: (val: string[]) => void) => {
    setState(state.includes(item) ? state.filter(i => i !== item) : [...state, item]);
  };

  const removeFilter = (item: string) => {
    if (selectedLocations.includes(item)) toggleFilter(item, selectedLocations, setSelectedLocations);
    if (selectedLevels.includes(item)) toggleFilter(item, selectedLevels, setSelectedLevels);
    if (selectedSalaries.includes(item)) toggleFilter(item, selectedSalaries, setSelectedSalaries);
    if (selectedIndustries.includes(item)) toggleFilter(item, selectedIndustries, setSelectedIndustries);
    if (selectedCompanyIndustries.includes(item)) toggleFilter(item, selectedCompanyIndustries, setSelectedCompanyIndustries);
    if (selectedJobFields.includes(item)) toggleFilter(item, selectedJobFields, setSelectedJobFields);
  };

  const allFilters = [
    ...selectedLocations, ...selectedLevels, ...selectedSalaries,
    ...selectedIndustries, ...selectedCompanyIndustries, ...selectedJobFields
  ];

  return (
    <SiteLayout>
      <Seo
        title="Việc làm IT hấp dẫn — Intervio"
        description="Tìm kiếm hàng ngàn cơ hội việc làm IT lương cao. Tự động đánh giá độ phù hợp với CV bằng AI (Gemini Pro)."
        path="/jobs"
        jsonLd={breadcrumbLd([{ name: "Trang chủ", path: "/" }, { name: "Việc làm", path: "/jobs" }])}
      />

      <div className="bg-[#0B0F19] min-h-screen">
        {/* Header Section */}
        <section className="relative pt-12 pb-10 overflow-hidden border-b border-border/20">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none">
            <div className="absolute -top-12 left-0 h-32 w-32 rounded-full bg-primary/10 blur-[80px]" />
            <div className="absolute top-4 right-0 h-32 w-32 rounded-full bg-blue-500/5 blur-[80px]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center space-y-6">
            <div className="space-y-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest">
                <Sparkles className="h-3 w-3 mr-1" /> Hơn 5,000+ Việc Làm Đang Chờ
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase italic">
                Xây Dựng <span className="text-primary italic">Tương Lai</span>
              </h1>
            </div>

            <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-2 p-1.5 bg-card/20 backdrop-blur-3xl border border-white/5 rounded-2xl shadow-xl">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Tên công việc, từ khóa, công ty..."
                  className="pl-11 bg-transparent border-0 h-12 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="hidden md:block w-px h-6 bg-white/5" />
              <div className="flex items-center gap-2 px-4 w-full md:w-auto shrink-0">
                <MapPin className="h-4 w-4 text-primary/60" />
                <span className="text-xs font-bold text-slate-400">Toàn quốc</span>
              </div>
              <Button className="w-full md:w-auto h-12 px-8 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-glow-sm hover:scale-[1.02] transition-all">
                Tìm kiếm
              </Button>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar Filters */}
            <aside className="lg:w-[260px] space-y-6 shrink-0">
              {allFilters.length > 0 && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Bộ lọc đang chọn</h3>
                    <button onClick={() => {
                      setSelectedLocations([]); setSelectedLevels([]); setSelectedSalaries([]);
                      setSelectedIndustries([]); setSelectedCompanyIndustries([]); setSelectedJobFields([]);
                    }} className="text-[9px] font-black text-primary hover:underline uppercase">Xóa tất cả</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allFilters.map(f => (
                      <Badge key={f} className="bg-primary/5 text-primary border-primary/10 gap-1 pl-2.5 pr-1.5 py-1 rounded-lg text-[10px] font-bold">
                        {f} <X className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100" onClick={() => removeFilter(f)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-6 bg-white/[0.02] p-6 rounded-[1.5rem] border border-white/5 backdrop-blur-md">

                {/* Mức lương */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-primary" /> Mức lương
                  </h3>
                  <div className="space-y-2">
                    {FILTER_CATEGORIES.salaries.map(range => (
                      <div key={range} className="flex items-center gap-2.5 group">
                        <Checkbox
                          id={`salary-${range}`}
                          checked={selectedSalaries.includes(range)}
                          onCheckedChange={() => toggleFilter(range, selectedSalaries, setSelectedSalaries)}
                          className="h-4 w-4 rounded-md border-white/10 data-[state=checked]:bg-primary"
                        />
                        <label htmlFor={`salary-${range}`} className="text-xs font-bold text-slate-400 cursor-pointer group-hover:text-primary transition-colors">{range}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Địa điểm */}
                <div className="space-y-3 pt-6 border-t border-white/5">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Địa điểm
                  </h3>
                  <div className="space-y-2">
                    {FILTER_CATEGORIES.locations.map(loc => (
                      <div key={loc} className="flex items-center gap-2.5 group">
                        <Checkbox
                          id={`loc-${loc}`}
                          checked={selectedLocations.includes(loc)}
                          onCheckedChange={() => toggleFilter(loc, selectedLocations, setSelectedLocations)}
                          className="h-4 w-4 rounded-md border-white/10 data-[state=checked]:bg-primary"
                        />
                        <label htmlFor={`loc-${loc}`} className="text-xs font-bold text-slate-400 cursor-pointer group-hover:text-primary transition-colors">{loc}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kinh nghiệm */}
                <div className="space-y-3 pt-6 border-t border-white/5">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-primary" /> Kinh nghiệm
                  </h3>
                  <div className="space-y-2">
                    {FILTER_CATEGORIES.levels.map(level => (
                      <div key={level} className="flex items-center gap-2.5 group">
                        <Checkbox
                          id={`level-${level}`}
                          checked={selectedLevels.includes(level)}
                          onCheckedChange={() => toggleFilter(level, selectedLevels, setSelectedLevels)}
                          className="h-4 w-4 rounded-md border-white/10 data-[state=checked]:bg-primary"
                        />
                        <label htmlFor={`level-${level}`} className="text-xs font-bold text-slate-400 cursor-pointer group-hover:text-primary transition-colors">{level}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search Selection Filters */}
                <div className="pt-6 border-t border-white/5 space-y-6">
                  <ComboboxFilter
                    label="Ngành nghề"
                    options={FILTER_CATEGORIES.industries}
                    selected={selectedIndustries}
                    onSelect={(val) => toggleFilter(val, selectedIndustries, setSelectedIndustries)}
                    icon={Briefcase}
                  />
                  <ComboboxFilter
                    label="Lĩnh vực công ty"
                    options={FILTER_CATEGORIES.companyIndustries}
                    selected={selectedCompanyIndustries}
                    onSelect={(val) => toggleFilter(val, selectedCompanyIndustries, setSelectedCompanyIndustries)}
                    icon={Building2}
                  />
                  <ComboboxFilter
                    label="Lĩnh vực việc làm"
                    options={FILTER_CATEGORIES.jobFields}
                    selected={selectedJobFields}
                    onSelect={(val) => toggleFilter(val, selectedJobFields, setSelectedJobFields)}
                    icon={ListFilter}
                  />
                </div>
              </div>
            </aside>

            {/* List area */}
            <main className="flex-1 space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Vị Trí Đang Tuyển</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Tìm thấy <span className="text-primary">{filteredJobs.length}</span> công việc phù hợp</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest shrink-0">Sắp xếp theo:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10 rounded-xl gap-2 border-white/5 bg-white/[0.02] text-xs font-black uppercase tracking-widest hover:border-primary/40 transition-all">
                        {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label || "Ngày đăng"} <ChevronDown className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-white/10 bg-[#0D1222] p-1 shadow-2xl backdrop-blur-xl">
                      {SORT_OPTIONS.map(option => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={cn(
                            "rounded-lg font-bold text-[11px] py-2.5 px-4 flex items-center gap-3 transition-all",
                            sortBy === option.value ? "bg-primary/20 text-primary" : "text-slate-400 hover:bg-white/5"
                          )}
                        >
                          {option.icon} {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <Link
                      to={`/jobs/${job.id}`}
                      key={job.id}
                      className="group relative p-5 md:p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/10 hover:border-primary/40 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                        <div className="h-16 w-16 p-0.5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 shrink-0 border border-white/10">
                          <img src={job.logo} alt={job.company} className="h-full w-full object-cover rounded-[14px]" />
                        </div>

                        <div className="flex-1 space-y-3 min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-[19px] font-black text-white group-hover:text-primary transition-colors tracking-tight truncate">{job.title}</h3>
                            {job.isUrgent && (
                              <Badge className="bg-red-500/10 text-red-500 border-red-500/20 rounded-md text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 animate-pulse">
                                Tuyển gấp
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-bold text-slate-400">
                            <span className="flex items-center gap-1.5 group-hover:text-slate-200 transition-colors">
                              <Building2 className="h-3.5 w-3.5 text-primary" /> {job.company}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-blue-400/80" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1.5 text-emerald-400">
                              <DollarSign className="h-3.5 w-3.5" /> {job.salary}M - {job.salary + 10}M
                            </span>
                            <span className="flex items-center gap-1.5 opacity-60">
                              <Clock className="h-3.5 w-3.5" /> {job.postedAt}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-0.5">
                            <Badge key="cat" variant="secondary" className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-0 rounded-lg">{job.industry}</Badge>
                            <Badge key="style" variant="secondary" className="bg-primary/10 text-primary border-0 rounded-lg text-[9px] font-black uppercase tracking-widest">{job.companyIndustry}</Badge>
                            <Badge key="level" variant="secondary" className="bg-orange-500/10 text-orange-400 border-0 rounded-lg text-[9px] font-black uppercase tracking-widest">{job.level}</Badge>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white/[0.03] text-slate-500 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                          <ArrowUpRight className="h-5 w-5" />
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-24 text-center space-y-6 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/10">
                    <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                      <Filter className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white italic uppercase">Không tìm thấy công việc</h3>
                      <p className="text-xs text-muted-foreground font-bold italic">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                    </div>
                    <Button variant="ghost" className="text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/10" onClick={() => {
                      setSearch(""); setSelectedLocations([]); setSelectedLevels([]); setSelectedSalaries([]);
                      setSelectedIndustries([]); setSelectedCompanyIndustries([]); setSelectedJobFields([]);
                    }}>Đặt lại bộ lọc</Button>
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
