import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { getCategoryCarryover } from "@/lib/calculations/category-carryover";
import { categories, transactions } from "@/lib/sample-data";
import { formatWholeMoney } from "@/lib/money";

export default function SpendingPage() {
  const carryovers = getCategoryCarryover(categories, transactions, "2026-07");
  return <AppShell><div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"><Card><h1 className="font-display text-5xl">Quick Add</h1><form className="mt-5 grid gap-3"><input className="rounded-xl border border-white/15 bg-black/20 px-4 py-3" placeholder="Merchant" /><input className="rounded-xl border border-white/15 bg-black/20 px-4 py-3" placeholder="Amount" /><select className="rounded-xl border border-white/15 bg-black/20 px-4 py-3">{categories.map((category) => <option key={category.id}>{category.name}</option>)}</select><button className="rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink" type="button">Add transaction</button><p className="text-sm text-slate-400">MVP form is wired for UI validation; persistence actions are next.</p></form></Card><Card><h2 className="font-display text-3xl">Category carryover</h2><div className="mt-5"><SimpleTable headers={["Category", "Base", "Available", "Spent", "Remaining", "Alert"]} rows={carryovers.map((item) => [item.category.name, formatWholeMoney(item.category.baseMonthlyBudgetCents), formatWholeMoney(item.availableBudgetCents), formatWholeMoney(item.actualSpentCents), formatWholeMoney(item.remainingCents), item.isWarning ? "80% reached" : ""])} /></div></Card></div><Card className="mt-5"><h2 className="font-display text-3xl">Transactions</h2><div className="mt-5"><SimpleTable headers={["Date", "Merchant", "Total", "Treatment", "Splits", "Receipt"]} rows={transactions.map((tx) => [tx.date, tx.merchant, formatWholeMoney(tx.totalAmountCents), tx.cashFlowTreatment, tx.splits.length, tx.receiptFileName ?? ""])} /></div></Card></AppShell>;
}
