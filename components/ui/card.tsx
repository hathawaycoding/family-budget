import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sheet backdrop-blur dark:border-white/10 dark:bg-white/[0.07]", className)} {...props}>{children}</section>;
}

export function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "good" | "warn" | "bad" | "info" }) {
  const colors = { default: "text-slate-950 dark:text-white", good: "text-emerald-700 dark:text-ledger-mint", warn: "text-amber-700 dark:text-ledger-amber", bad: "text-red-700 dark:text-ledger-rose", info: "text-blue-700 dark:text-ledger-blue" };
  return <div><p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p><p className={`mt-1 font-mono text-2xl font-bold ${colors[tone]}`}>{value}</p></div>;
}
