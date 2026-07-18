import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { formatDateLabel } from "@/lib/dates";
import { formatWholeMoney } from "@/lib/money";
import { getMonthBundle } from "@/lib/services/budget-data-service";

export const dynamic = "force-dynamic";

export default async function CashFlowPage() {
  const { month, cashFlowRows } = await getMonthBundle("2026-07");
  return <AppShell><Card><h1 className="font-display text-5xl">Cash Flow</h1><p className="mt-2 text-slate-300">Every calendar day for {month.label}, including no-activity days.</p><div className="mt-5"><SimpleTable headers={["Date", "Activity", "Type", "Amount", "Balance", "Warning"]} rows={cashFlowRows.map((row) => [formatDateLabel(row.date), row.label, row.type, formatWholeMoney(row.amountCents), formatWholeMoney(row.balanceCents), row.isNegative ? "Negative balance" : ""])} /></div></Card></AppShell>;
}
