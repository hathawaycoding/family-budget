import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { income } from "@/lib/sample-data";
import { formatWholeMoney } from "@/lib/money";

export default function IncomePage() {
  return <AppShell><Card><h1 className="font-display text-5xl">Income</h1><p className="mt-2 text-slate-300">CS and TCH paychecks repeat every 14 days through December 2026. Forecasting uses actual amount when present, otherwise expected amount.</p><div className="mt-5"><SimpleTable headers={["Date", "Source", "Expected", "Actual"]} rows={income.map((item) => [item.date, item.source, formatWholeMoney(item.expectedAmountCents), item.actualAmountCents ? formatWholeMoney(item.actualAmountCents) : ""])}/></div></Card></AppShell>;
}
