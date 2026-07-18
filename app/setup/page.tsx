import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { formatWholeMoney } from "@/lib/money";
import { updateCategoryBudgetAction } from "@/app/actions";

export const dynamic = "force-dynamic";

const checklist = ["Confirm starting checking balance", "Review CS and TCH paycheck dates and expected amounts", "Review recurring bills", "Review variable category budgets", "Review savings contributions", "Review credit card minimum payments and extra payments", "Confirm planned one-time expenses", "Check zero-based budget equals $0", "Check projected cash flow for negative days"];

export default async function SetupPage() {
  const { categories } = await getBudgetData();
  return <AppShell><div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"><Card><h1 className="font-display text-5xl">Setup</h1><div className="mt-5 grid gap-3">{checklist.map((item, index) => <label key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"><input type="checkbox" defaultChecked={index < 4} /> <span>{item}</span></label>)}</div><p className="mt-3 text-sm text-slate-400">Closed is a status marker; months remain editable.</p></Card><Card><h2 className="font-display text-3xl">Category budgets</h2><div className="mt-5"><SimpleTable headers={["Category", "Current", "New budget"]} rows={categories.map((category) => [category.name, formatWholeMoney(category.baseMonthlyBudgetCents), <form key={category.id} action={updateCategoryBudgetAction} className="flex gap-2"><input type="hidden" name="categoryId" value={category.id} /><input name="baseMonthlyBudget" className="w-28 rounded-lg border border-white/15 bg-black/20 px-2 py-1" placeholder="0.00" /><button className="rounded-lg bg-ledger-blue px-3 py-1 font-bold text-ledger-ink">Save</button></form>])} /></div></Card></div></AppShell>;
}
