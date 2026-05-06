export default function Logs() {
  const rows = [
    { t: "12:42", evt: "Đã phân tích CV", meta: "user_8821 · điểm 87" },
    { t: "12:39", evt: "Bắt đầu phỏng vấn", meta: "user_8821 · 8 câu hỏi" },
    { t: "12:31", evt: "Cập nhật trọng số chấm điểm", meta: "quản trị viên · từ khóa 22→25" },
    { t: "12:18", evt: "Đã phân tích CV", meta: "user_2117 · điểm 72" },
    { t: "12:10", evt: "Cập nhật cấu hình câu hỏi", meta: "quản trị viên · câu trung bình 3→4" },
  ];
  return (
    <div className="divide-y divide-border rounded-2xl border border-border/60 overflow-hidden">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[80px_1fr_auto] items-center gap-4 px-5 py-3 text-sm">
          <span className="text-muted-foreground tabular-nums">{r.t}</span>
          <span className="font-medium">{r.evt}</span>
          <span className="text-muted-foreground text-xs">{r.meta}</span>
        </div>
      ))}
    </div>
  );
}