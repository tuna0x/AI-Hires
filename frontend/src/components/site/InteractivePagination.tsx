import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface InteractivePaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  typeLabel?: string; // e.g. "CV", "phiên", "bản ghi"
}

export default function InteractivePagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  typeLabel = "bản ghi"
}: InteractivePaginationProps) {
  const [inputPage, setInputPage] = useState("");

  // Sync input value when page changes
  useEffect(() => {
    setInputPage("");
  }, [currentPage]);

  if (totalPages <= 1) return null;

  // Helper to generate smart visible page numbers
  const getPageNumbers = (current: number, total: number) => {
    const pages = [];
    const maxVisible = 5;
    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      let start = Math.max(1, current - 2);
      let end = Math.min(total, current + 2);
      if (start === 1) {
        end = 5;
      } else if (end === total) {
        start = total - 4;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPage);
    if (isNaN(p) || p < 1 || p > totalPages) {
      toast.error(`⚠️ Vui lòng nhập số trang hợp lệ từ 1 đến ${totalPages}!`);
      return;
    }
    onPageChange(p);
  };

  return (
    <div className="mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
      <div className="text-muted-foreground">
        Hiển thị trang <span className="text-foreground">{currentPage}</span> / <span className="text-foreground">{totalPages}</span> (Tổng <span className="text-foreground">{totalElements}</span> {typeLabel})
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Prev Page Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-8 rounded-lg text-[10px] border-border/60 hover:bg-secondary/40 gap-1"
        >
          <ChevronLeft className="h-3 w-3" /> Trước
        </Button>

        {/* Clickable Page Numbers */}
        <div className="flex items-center gap-1.5">
          {getPageNumbers(currentPage, totalPages).map((pNum) => (
            <Button
              key={pNum}
              size="sm"
              variant={pNum === currentPage ? "default" : "outline"}
              onClick={() => onPageChange(pNum)}
              className={`h-8 w-8 p-0 rounded-lg text-[10px] font-bold transition-all ${
                pNum === currentPage 
                  ? "bg-gradient-primary text-primary-foreground shadow-glow" 
                  : "border-border/60 hover:bg-secondary/40 text-foreground"
              }`}
            >
              {pNum}
            </Button>
          ))}
        </div>

        {/* Next Page Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-8 rounded-lg text-[10px] border-border/60 hover:bg-secondary/40 gap-1"
        >
          Sau <ChevronRight className="h-3 w-3" />
        </Button>

        {/* Quick jump to page input */}
        <form onSubmit={handleJump} className="flex items-center gap-1 ml-2 border-l border-border/60 pl-3">
          <span className="text-muted-foreground text-[10px]">Đến trang</span>
          <Input
            type="text"
            placeholder={`${currentPage}`}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            className="h-8 w-12 text-center rounded-lg border-border/80 focus-visible:ring-primary/40 text-[10px] px-1"
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 text-[10px] px-2.5"
          >
            Nhảy
          </Button>
        </form>
      </div>
    </div>
  );
}
