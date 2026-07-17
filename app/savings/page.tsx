import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { getSavingsBalance } from "@/lib/calculations/savings";
import { savingsActivities, savingsFunds } from "@/lib/sample-data";
import { formatWholeMoney } from "@/lib/money";

export default function SavingsPage() {
  return <AppShell><Card><h1 className="font-display text-5xl">Savings</h1><p className="mt-2 text-slate-300">Savings are tracked by fund, not bank account. Withdrawals cannot make a fund negative.</p><div className="mt-5"><SimpleTable headers={["Fund", "Type", "Mode", "Current", "Target", "Monthly", "Due"]} rows={savingsFunds.map((fund) => [fund.name, fund.type, fund.mode, formatWholeMoney(getSavingsBalance(fund, savingsActivities)), fund.targetAmountCents ? formatWholeMoney(fund.targetAmountCents) : "", formatWholeMoney(fund.plannedContributionCents), fund.dueDate ?? ""])} /></div></Card></AppShell>;
}
