import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-sheet backdrop-blur", className)}>{children}</section>;
}

export function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "good" | "warn" | "bad" | "info" }) {
  const colors = { default: "text-white", good: "text-ledger-mint", warn: "text-ledger-amber", bad: "text-ledger-rose", info: "text-ledger-blue" };
  return <div><p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p><p className={`mt-1 font-mono text-2xl font-bold ${colors[tone]}`}>{value}</p></div>;
}
