import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { cookies } from "next/headers";
import { getCategoryCarryover } from "@/lib/calculations/category-carryover";
import { activeCategories, recentItems } from "@/lib/categories";
import { formatWholeMoney } from "@/lib/money";
import { ShoppingGuardrailClient } from "./shopping-guardrail-client";
import {
  createTransactionAction,
  deleteTransactionAction
} from "@/app/actions";
import { getBudgetData } from "@/lib/services/budget-data-service";

export const dynamic = "force-dynamic";

const fieldClass = "rounded-xl border border-white/15 bg-black/20 px-4 py-3";
const dangerButtonClass = "rounded-lg border border-ledger-rose/50 px-3 py-1 text-red-100";

export default async function SpendingPage() {
  const { household, months, income, bills, categories, transactions, shoppingChecks, plannedExpenses, savingsActivities, debtAccounts } = await getBudgetData();
  const actor = ((await cookies()).get("family-budget-actor")?.value === "TCH" ? "TCH" : "CS") as "CS" | "TCH";
  const visibleCategories = activeCategories(categories);
  const carryovers = getCategoryCarryover(visibleCategories, transactions, "2026-07");
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const recentTransactions = recentItems(transactions, 12);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell>
      <ShoppingGuardrailClient actor={actor} months={months} categories={visibleCategories} transactions={transactions} income={income} bills={bills} plannedExpenses={plannedExpenses} savingsActivities={savingsActivities} debtAccounts={debtAccounts} shoppingChecks={shoppingChecks} lowBalanceThresholdCents={household.lowBalanceThresholdCents} />

      <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <Card className="mt-5 self-start">
          <h1 className="font-display text-5xl">Quick Add</h1>
          <form action={createTransactionAction} className="mt-5 grid gap-3">
            <input type="date" name="date" defaultValue={today} className={fieldClass} />
            <input name="merchant" className={fieldClass} placeholder="Merchant" />
            <input name="amount" className={fieldClass} placeholder="Amount" />
            <select name="categoryId" className={fieldClass}>
              {visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <p className="text-xs text-slate-400">Need a new category or budget change? Manage spending categories in Setup.</p>
            <select name="cashFlowTreatment" className={fieldClass}>
              <option value="CASH_DEBIT">Cash/debit</option>
              <option value="CREDIT_CARD">Credit card</option>
            </select>
            <select name="plannedStatus" className={fieldClass}>
              <option value="UNPLANNED">Unplanned</option>
              <option value="PLANNED">Planned</option>
            </select>
            <label className="flex items-center gap-2 text-sm"><input name="isReimbursable" type="checkbox" /> Reimbursable</label>
            <textarea name="notes" className={fieldClass} placeholder="Notes" />
            <label className="flex items-start gap-2 rounded-2xl border border-ledger-amber/30 bg-ledger-amber/10 p-3 text-sm text-yellow-100"><input name="confirmOverride" type="checkbox" className="mt-1" /> Confirm Shopping Guardrail warnings if this purchase is near/over category budget or creates cash-flow risk.</label>
            <button className="rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink">Add transaction</button>
          </form>
        </Card>

        <Card className="mt-5 self-start">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl">Recent transactions</h2>
              <p className="mt-1 text-sm text-slate-400">Latest entries stay close to Quick Add so you can confirm what you just logged.</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">Latest 12</span>
          </div>
          <div className="mt-5 max-h-[31rem] overflow-auto rounded-2xl border border-white/10">
            <SimpleTable
              headers={["Date", "Merchant", "Total", "Treatment", "Splits", "Receipt", "Delete"]}
              rows={recentTransactions.map((tx) => [
                tx.date,
                tx.merchant,
                formatWholeMoney(tx.totalAmountCents),
                tx.cashFlowTreatment,
                <div key={`${tx.id}-splits`} className="grid gap-1">
                  {tx.splits.map((split) => {
                    const category = categoryById.get(split.categoryId);
                    return <span key={`${tx.id}-${split.categoryId}`}>{category?.name ?? "Unknown category"}: {formatWholeMoney(split.amountCents)}</span>;
                  })}
                </div>,
                tx.receiptFileName ?? "",
                <form key={tx.id} action={deleteTransactionAction}>
                  <input type="hidden" name="id" value={tx.id} />
                  <button className={dangerButtonClass}>Delete</button>
                </form>
              ])}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl">Category carryover</h2>
            <p className="mt-1 text-sm text-slate-400">Transactions update these totals automatically. Change category names and budgets in Setup.</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">{carryovers.length} active</span>
        </div>
        <div className="mt-5 max-h-[31rem] overflow-auto rounded-2xl border border-white/10">
          <SimpleTable
            headers={["Category", "Base", "Available", "Spent", "Remaining", "Alert"]}
            rows={carryovers.map((item) => [
              item.category.name,
              formatWholeMoney(item.category.baseMonthlyBudgetCents),
              formatWholeMoney(item.availableBudgetCents),
              formatWholeMoney(item.actualSpentCents),
              formatWholeMoney(item.remainingCents),
              item.isWarning ? "80% reached" : ""
            ])}
          />
        </div>
      </Card>
    </AppShell>
  );
}
