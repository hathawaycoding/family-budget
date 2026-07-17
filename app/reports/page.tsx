import { AppShell } from "@/components/app-shell/app-shell";
import { Card, Stat } from "@/components/ui/card";
import { getMonthBundle } from "@/lib/reports";
import { formatWholeMoney } from "@/lib/money";

const exports = ["transactions", "bills", "monthly-summary", "cash-flow", "planned-vs-actual", "debt-balances", "savings-goals"];

export default function ReportsPage() {
  const { summary } = getMonthBundle("2026-07");
  return <AppShell><Card><h1 className="font-display text-5xl">Reports</h1><div className="mt-5 grid gap-4 md:grid-cols-3"><Stat label="Planned income" value={formatWholeMoney(summary.expectedIncomeCents)} tone="good" /><Stat label="Assigned outflow" value={formatWholeMoney(summary.assignedCents)} /><Stat label="Unassigned" value={formatWholeMoney(summary.unassignedCents)} tone={summary.unassignedCents < 0 ? "bad" : "warn"} /></div><h2 className="mt-8 font-display text-3xl">CSV exports</h2><div className="mt-4 flex flex-wrap gap-3">{exports.map((item) => <a key={item} className="rounded-xl border border-white/15 px-4 py-3" href={`/api/exports/${item}.csv`}>{item}.csv</a>)}</div></Card></AppShell>;
}
