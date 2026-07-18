import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { DebtTrend } from "@/components/charts/budget-charts";
import { estimatedMonthlyInterestCents, projectedDebtTrend } from "@/lib/calculations/debt";
import { formatWholeMoney } from "@/lib/money";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { createDebtPaymentAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function DebtPage() {
  const { debtAccounts } = await getBudgetData();
  const trend = projectedDebtTrend(debtAccounts[0]).map((point) => ({ month: `M${point.month}`, balance: Math.round(point.balanceCents / 100) }));
  return <AppShell><div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Card><h1 className="font-display text-5xl">Debt</h1><p className="mt-2 text-slate-300">Credit cards only. Balances are manually updated monthly and interest is an estimate.</p><form action={createDebtPaymentAction} className="mt-5 grid gap-3 md:grid-cols-2"><select name="debtAccountId" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3">{debtAccounts.map((debt) => <option key={debt.id} value={debt.id}>{debt.name}</option>)}</select><input name="dueDate" type="date" defaultValue="2026-07-20" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3" /><input name="minimumPayment" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3" placeholder="Minimum" /><input name="extraPayment" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3" placeholder="Extra" /><input name="actualPayment" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3" placeholder="Actual" /><button className="rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink">Add payment</button></form><div className="mt-5"><SimpleTable headers={["Card", "Balance", "APR", "Min", "Extra", "Est. interest"]} rows={debtAccounts.map((debt) => [debt.name, formatWholeMoney(debt.currentBalanceCents), `${debt.interestRatePercent}%`, formatWholeMoney(debt.minimumPaymentCents), formatWholeMoney(debt.extraPaymentCents), formatWholeMoney(estimatedMonthlyInterestCents(debt))])} /></div></Card><Card><h2 className="font-display text-3xl">Debt trend</h2><DebtTrend data={trend} /></Card></div></AppShell>;
}
