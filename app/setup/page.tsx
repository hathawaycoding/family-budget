import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { activeCategories } from "@/lib/categories";
import { formatWholeMoney } from "@/lib/money";
import { createSpendingCategoryAction, deleteSpendingCategoryAction, disableSpendingCategoryAction, renameSpendingCategoryAction, updateCategoryBudgetAction } from "@/app/actions";

export const dynamic = "force-dynamic";

const checklist = ["Confirm starting checking balance", "Review CS and TCH paycheck dates and expected amounts", "Review recurring bills", "Review variable category budgets", "Review savings contributions", "Review credit card minimum payments and extra payments", "Confirm planned one-time expenses", "Check zero-based budget equals $0", "Check projected cash flow for negative days"];
const fieldClass = "rounded-xl border border-white/15 bg-black/20 px-4 py-3";
const smallFieldClass = "w-28 rounded-lg border border-white/15 bg-black/20 px-2 py-1";
const smallButtonClass = "rounded-lg bg-ledger-blue px-3 py-1 font-bold text-ledger-ink";
const dangerButtonClass = "rounded-lg border border-ledger-rose/50 px-3 py-1 text-red-100";

export default async function SetupPage() {
  const { categories } = await getBudgetData();
  const visibleCategories = activeCategories(categories);
  return (
    <AppShell>
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h1 className="font-display text-5xl">Setup</h1>
          <div className="mt-5 grid gap-3">{checklist.map((item, index) => <label key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"><input type="checkbox" defaultChecked={index < 4} /> <span>{item}</span></label>)}</div>
          <p className="mt-3 text-sm text-slate-400">Closed is a status marker; months remain editable.</p>
        </Card>

        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl">Spending categories</h2>
              <p className="mt-1 text-sm text-slate-400">Set up the categories and monthly budgets used by Quick Add and Category carryover.</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">{visibleCategories.length} active</span>
          </div>

          <form action={createSpendingCategoryAction} className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_9rem_auto]">
            <input name="name" className={fieldClass} placeholder="New category name" />
            <input name="baseMonthlyBudget" className={fieldClass} placeholder="Budget" />
            <button className="rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink">Add category</button>
          </form>

          <div className="mt-5 max-h-[31rem] overflow-auto rounded-2xl border border-white/10">
            <SimpleTable
              headers={["Category", "Current budget", "Manage"]}
              rows={visibleCategories.map((category) => [
                category.name,
                formatWholeMoney(category.baseMonthlyBudgetCents),
                <details key={category.id} className="group min-w-[18rem] rounded-xl border border-white/10 bg-black/10 p-2">
                  <summary className="cursor-pointer list-none rounded-lg px-2 py-1 text-sm font-bold text-ledger-blue outline-none transition group-open:bg-white/5 focus-visible:ring-2 focus-visible:ring-ledger-blue">Manage</summary>
                  <div className="mt-3 grid gap-2 border-t border-white/10 pt-3">
                    <form action={renameSpendingCategoryAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input name="name" className="min-w-36 rounded-lg border border-white/15 bg-black/20 px-2 py-1" placeholder="Rename" />
                      <button className={smallButtonClass}>Rename</button>
                    </form>
                    <form action={updateCategoryBudgetAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input name="baseMonthlyBudget" className={smallFieldClass} placeholder="0.00" />
                      <button className={smallButtonClass}>Save budget</button>
                    </form>
                    <form action={disableSpendingCategoryAction} className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <input type="hidden" name="categoryId" value={category.id} />
                      <label className="flex items-center gap-1"><input required type="checkbox" /> Confirm</label>
                      <button className={dangerButtonClass}>Disable</button>
                    </form>
                    <form action={deleteSpendingCategoryAction} className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <input type="hidden" name="categoryId" value={category.id} />
                      <label className="flex items-center gap-1"><input required type="checkbox" /> Confirm unused</label>
                      <button className={dangerButtonClass}>Delete unused</button>
                    </form>
                  </div>
                </details>
              ])}
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
