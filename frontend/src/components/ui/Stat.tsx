export function Stat({ value, note, tone = "default" }: {
  value: string; note?: string; tone?: "default" | "up" | "down";
}) {
  const toneClass = tone === "up" ? "text-emerald-600" : tone === "down" ? "text-rose-600" : "text-slate-500";
  return (
    <div>
      <div className="text-3xl font-semibold">{value}</div>
      {note && <div className={`${toneClass} text-sm mt-1`}>{note}</div>}
    </div>
  );
}
