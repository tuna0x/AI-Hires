import { useNavigate } from "react-router-dom";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center gap-6 max-w-sm"
      >
        <div className="h-20 w-20 rounded-[2rem] bg-destructive/10 border border-destructive/20 flex items-center justify-center">
          <ShieldX className="h-9 w-9 text-destructive" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive">
            403 – Truy cập bị từ chối
          </p>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Không có quyền truy cập</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bạn không có quyền xem trang này. Liên hệ quản trị viên để được cấp quyền phù hợp.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="ghost"
            className="flex-1 rounded-2xl border border-border/60 h-12 font-bold text-[12px] uppercase tracking-widest"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <Button
            className="flex-1 rounded-2xl h-12 font-bold text-[12px] uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-glow shadow-primary/20"
            onClick={() => navigate("/dashboard")}
          >
            Về Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
