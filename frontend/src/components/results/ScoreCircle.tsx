import { motion } from "framer-motion";

export default function ScoreCircle({ score }: { score: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} stroke="hsl(var(--muted))" strokeWidth="14" fill="none" />
        <motion.circle
          cx="80" cy="80" r={r}
          stroke="hsl(var(--primary))" strokeWidth="14" strokeLinecap="round" fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-5xl font-extrabold text-foreground leading-none">{score}</div>
          <div className="text-xs text-muted-foreground mt-1.5 font-medium">trên 100</div>
        </div>
      </div>
    </div>
  );
}