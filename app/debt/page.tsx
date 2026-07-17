import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { DebtTrend } from "@/components/charts/budget-charts";
import { estimatedMonthlyInterestCents, projectedDebtTrend } from "@/lib/calculations/debt";
import { debtAccounts } from "@/lib/sample-data";
import { formatWholeMoney } from "@/lib/money";

export default function DebtPage() {
  const trend = projectedDebtTrend(debtAccounts[0]).map((point) => ({ month: `M${point.month}`, balance: Math.round(point.balanceCents / 100) }));
  return <AppShell><div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Card><h1 className="font-display text-5xl">Debt</h1><p className="mt-2 text-slate-300">Credit cards only. Balances are manually updated monthly and interest is an estimate.</p><div className="mt-5"><SimpleTable headers={["Card", "Balance", "APR", "Min", "Extra", "Est. interest"]} rows={debtAccounts.map((debt) => [debt.name, formatWholeMoney(debt.currentBalanceCents), `${debt.interestRatePercent}%`, formatWholeMoney(debt.minimumPaymentCents), formatWholeMoney(debt.extraPaymentCents), formatWholeMoney(estimatedMonthlyInterestCents(debt))])} /></div></Card><Card><h2 className="font-display text-3xl">Debt trend</h2><DebtTrend data={trend} /></Card></div></AppShell>;
}
