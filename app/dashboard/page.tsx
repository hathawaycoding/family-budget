import { AppShell } from "@/components/app-shell/app-shell";
import { Card, Stat } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PieSummary } from "@/components/charts/budget-charts";
import { getFutureExpenseStatusLabel, getPriorityLabel } from "@/lib/calculations/future-expenses";
import { getCashFlowSummary } from "@/lib/cash-flow-view";
import { formatDateLabel } from "@/lib/dates";
import { formatWholeMoney } from "@/lib/money";
import { getBudgetData, getMonthBundle } from "@/lib/services/budget-data-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [data, july, august] = await Promise.all([getBudgetData(), getMonthBundle("2026-07"), getMonthBundle("2026-08")]);
  const bundles = [july, august];
  const { categories, transactions } = data;
  const upcomingFutureExpenses = data.futureExpenses.filter((expense) => expense.status === "ACTIVE").sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3);
  const openShoppingChecks = data.shoppingChecks.filter((check) => !["CONVERTED_TO_TRANSACTION", "CANCELLED"].includes(check.status)).slice(0, 3);
  const categoryById = new Map(categories.map((category) => [category.id, category]));
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
          const cashFlowSummary = getCashFlowSummary(cashFlowRows, data.household.lowBalanceThresholdCents);
          return <Card key={month.id} className="relative overflow-hidden"><div className="absolute inset-y-0 left-0 w-2 bg-[repeating-linear-gradient(to_bottom,#f5b84b_0,#f5b84b_8px,transparent_8px,transparent_16px)]" /><div className="ml-2 flex items-start justify-between gap-3"><h2 className="font-display text-3xl">{month.label}</h2><StatusBadge status={summary.status} /></div><div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4"><Stat label="Income" value={formatWholeMoney(summary.expectedIncomeCents)} tone="good" /><Stat label="Bills" value={formatWholeMoney(summary.expectedBillsCents)} /><Stat label="Actual bills" value={formatWholeMoney(actualBills)} /><Stat label="Actual spending" value={formatWholeMoney(actualSpending)} /><Stat label="Assigned" value={formatWholeMoney(summary.assignedCents)} /><Stat label="Unassigned" value={formatWholeMoney(summary.unassignedCents)} tone={summary.unassignedCents < 0 ? "bad" : summary.unassignedCents > 0 ? "warn" : "good"} /><Stat label="Ending cash" value={formatWholeMoney(cashFlowRows.at(-1)?.balanceCents ?? 0)} tone={(cashFlowRows.at(-1)?.balanceCents ?? 0) < 0 ? "bad" : "info"} /><Stat label="Risk days" value={String(cashFlowRows.filter((row) => row.isNegative).length)} tone={cashFlowRows.some((row) => row.isNegative) ? "bad" : "good"} /></div>{summary.status === "Cash-Flow Risk" ? <p className="mt-5 rounded-2xl border border-ledger-rose/40 bg-ledger-rose/15 p-4 text-sm text-red-100">Projected cash flow goes below $0. Open Cash Flow to see the date.</p> : null}{cashFlowSummary.nextLowBalanceDate ? <p className="mt-5 rounded-2xl border border-ledger-amber/40 bg-ledger-amber/15 p-4 text-sm text-yellow-100">Low balance risk on {formatDateLabel(cashFlowSummary.nextLowBalanceDate)}. Lowest projected balance: {formatWholeMoney(cashFlowSummary.lowestBalanceCents)}. {cashFlowSummary.majorLowBalanceCauses.length ? `Main causes: ${cashFlowSummary.majorLowBalanceCauses.join(", ")}.` : ""}</p> : null}</Card>;
        })}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2"><Card><h2 className="font-display text-2xl">Variable spending by category</h2><PieSummary data={categoryData} /></Card><Card><h2 className="font-display text-2xl">Assigned outflow by month</h2><PieSummary data={outflowData} /></Card></div>
      <Card className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-3xl">Upcoming future expenses</h2><p className="mt-1 text-sm text-slate-400">Next obligations that can be previewed before they become official budget items.</p></div><a href="/future-expenses" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold">Review future expenses</a></div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">{upcomingFutureExpenses.length ? upcomingFutureExpenses.map((expense) => <div key={expense.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-display text-2xl">{expense.description}</h3><span className="rounded-full border border-ledger-amber/40 bg-ledger-amber/10 px-2 py-1 text-xs text-yellow-100">{expense.includeInPlanPreview ? "In preview" : "Preview off"}</span></div><p className="mt-2 font-mono text-2xl font-bold text-ledger-amber">{formatWholeMoney(expense.expectedAmountCents)}</p><p className="mt-1 text-sm text-slate-400">Due {formatDateLabel(expense.dueDate)} · {categoryById.get(expense.categoryId)?.name ?? "Unknown"} · {getPriorityLabel(expense.priority)}</p><p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">{getFutureExpenseStatusLabel(expense.status)}</p></div>) : <p className="text-sm text-slate-400">No active future expenses yet.</p>}</div>
      </Card>
      <Card className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-3xl">Shopping approvals</h2><p className="mt-1 text-sm text-slate-400">Open pre-purchase checks and spouse requests before they become transactions.</p></div><a href="/spending" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold">Open Spending</a></div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">{openShoppingChecks.length ? openShoppingChecks.map((check) => <div key={check.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-display text-2xl">{check.merchant}</h3><span className="rounded-full border border-ledger-amber/40 bg-ledger-amber/10 px-2 py-1 text-xs text-yellow-100">{check.status.toLowerCase().replaceAll("_", " ")}</span></div><p className="mt-2 font-mono text-2xl font-bold text-ledger-amber">{formatWholeMoney(check.amountCents)}</p><p className="mt-1 text-sm text-slate-400">{formatDateLabel(check.date)} · {categoryById.get(check.categoryId)?.name ?? "Unknown"} · requested by {check.requestedBy}</p>{check.reviewResponseNote ? <p className="mt-3 text-sm text-slate-300">{check.reviewResponseNote}</p> : null}</div>) : <p className="text-sm text-slate-400">No open shopping checks.</p>}</div>
      </Card>
    </AppShell>
  );
}
