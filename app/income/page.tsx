import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { formatWholeMoney } from "@/lib/money";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { updateIncomeActualAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const { income } = await getBudgetData();
  return <AppShell><Card><h1 className="font-display text-5xl">Income</h1><p className="mt-2 text-slate-300">CS and TCH paychecks repeat every 14 days through December 2026. Forecasting uses actual amount when present, otherwise expected amount.</p><div className="mt-5"><SimpleTable headers={["Date", "Source", "Expected", "Actual", "Update actual"]} rows={income.map((item) => [item.date, item.source, formatWholeMoney(item.expectedAmountCents), item.actualAmountCents ? formatWholeMoney(item.actualAmountCents) : "", <form key={item.id} action={updateIncomeActualAction} className="flex gap-2"><input type="hidden" name="id" value={item.id} /><input name="actualAmount" className="w-28 rounded-lg border border-white/15 bg-black/20 px-2 py-1" placeholder="0.00" /><button className="rounded-lg bg-ledger-blue px-3 py-1 font-bold text-ledger-ink">Save</button></form>])}/></div></Card></AppShell>;
}
