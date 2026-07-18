import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { getSavingsBalance } from "@/lib/calculations/savings";
import { formatWholeMoney } from "@/lib/money";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { createSavingsActivityAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const { savingsActivities, savingsFunds } = await getBudgetData();
  return <AppShell><div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]"><Card><h1 className="font-display text-5xl">Savings</h1><p className="mt-2 text-slate-300">Savings are tracked by fund, not bank account. Withdrawals cannot make a fund negative.</p><form action={createSavingsActivityAction} className="mt-5 grid gap-3"><select name="fundId" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3">{savingsFunds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select><input type="date" name="date" defaultValue="2026-07-15" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3" /><select name="type" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3"><option value="CONTRIBUTION">Contribution</option><option value="WITHDRAWAL">Withdrawal</option></select><input name="amount" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3" placeholder="Amount" /><input name="description" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3" placeholder="Description" /><button className="rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink">Add activity</button></form></Card><Card><h2 className="font-display text-3xl">Funds</h2><div className="mt-5"><SimpleTable headers={["Fund", "Type", "Mode", "Current", "Target", "Monthly", "Due"]} rows={savingsFunds.map((fund) => [fund.name, fund.type, fund.mode, formatWholeMoney(getSavingsBalance(fund, savingsActivities)), fund.targetAmountCents ? formatWholeMoney(fund.targetAmountCents) : "", formatWholeMoney(fund.plannedContributionCents), fund.dueDate ?? ""])} /></div></Card></div></AppShell>;
}
