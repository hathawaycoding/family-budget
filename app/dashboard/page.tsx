import { AppShell } from "@/components/app-shell/app-shell";
import { Card, Stat } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PieSummary } from "@/components/charts/budget-charts";
import { formatWholeMoney } from "@/lib/money";
import { categories, transactions } from "@/lib/sample-data";
import { getMonthBundle } from "@/lib/reports";

export default function DashboardPage() {
  const bundles = [getMonthBundle("2026-07"), getMonthBundle("2026-08")];
  const categoryData = categories.slice(0, 5).map((category) => ({ name: category.name, value: transactions.flatMap((tx) => tx.splits).filter((split) => split.categoryId === category.id).reduce((sum, split) => sum + split.amountCents / 100, 0) }));
  const outflowData = bundles.map((bundle) => ({ name: bundle.month.label, value: (bundle.summary.assignedCents / 100) }));
  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="font-mono text-sm uppercase tracking-[0.28em] text-ledger-amber">Two-month worksheet</p><h1 className="font-display text-4xl md:text-6xl">Dashboard</h1></div>
        <a href="/cash-flow" className="rounded-xl bg-ledger-blue px-4 py-3 font-bold text-ledger-ink">Open cash-flow timeline</a>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {bundles.map(({ month, summary, cashFlowRows, transactions: monthTransactions, bills }) => {
          const actualBills = bills.filter((bill) => bill.isPaid).reduce((sum, bill) => sum + (bill.actualAmountCents ?? bill.expectedAmountCents), 0);
          const actualSpending = monthTransactions.reduce((sum, tx) => sum + tx.totalAmountCents, 0);
          return <Card key={month.id} className="relative overflow-hidden"><div className="absolute inset-y-0 left-0 w-2 bg-[repeating-linear-gradient(to_bottom,#f5b84b_0,#f5b84b_8px,transparent_8px,transparent_16px)]" /><div className="ml-2 flex items-start justify-between gap-3"><h2 className="font-display text-3xl">{month.label}</h2><StatusBadge status={summary.status} /></div><div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4"><Stat label="Income" value={formatWholeMoney(summary.expectedIncomeCents)} tone="good" /><Stat label="Bills" value={formatWholeMoney(summary.expectedBillsCents)} /><Stat label="Actual bills" value={formatWholeMoney(actualBills)} /><Stat label="Actual spending" value={formatWholeMoney(actualSpending)} /><Stat label="Assigned" value={formatWholeMoney(summary.assignedCents)} /><Stat label="Unassigned" value={formatWholeMoney(summary.unassignedCents)} tone={summary.unassignedCents < 0 ? "bad" : summary.unassignedCents > 0 ? "warn" : "good"} /><Stat label="Ending cash" value={formatWholeMoney(cashFlowRows.at(-1)?.balanceCents ?? 0)} tone={(cashFlowRows.at(-1)?.balanceCents ?? 0) < 0 ? "bad" : "info"} /><Stat label="Risk days" value={String(cashFlowRows.filter((row) => row.isNegative).length)} tone={cashFlowRows.some((row) => row.isNegative) ? "bad" : "good"} /></div>{summary.status === "Cash-Flow Risk" ? <p className="mt-5 rounded-2xl border border-ledger-rose/40 bg-ledger-rose/15 p-4 text-sm text-red-100">Projected cash flow goes below $0. Open Cash Flow to see the date.</p> : null}</Card>;
        })}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><Card><h2 className="font-display text-2xl">Variable spending by category</h2><PieSummary data={categoryData} /></Card><Card><h2 className="font-display text-2xl">Assigned outflow by month</h2><PieSummary data={outflowData} /></Card></div>
    </AppShell>
  );
}
