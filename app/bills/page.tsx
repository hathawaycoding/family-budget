import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { formatWholeMoney } from "@/lib/money";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { markBillPaidAction, skipBillAction, unskipBillAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function BillsPage() {
  const { bills } = await getBudgetData();
  return <AppShell><Card><h1 className="font-display text-5xl">Bills</h1><p className="mt-2 text-slate-300">Bills affect cash flow on due date. Paid date is stored for records, and skipped bills are excluded from cash flow.</p><div className="mt-5"><SimpleTable headers={["Due", "Bill", "Expected", "Actual", "Paid", "Autopay", "Skipped", "Actions"]} rows={bills.map((bill) => [bill.dueDate, bill.name, formatWholeMoney(bill.expectedAmountCents), bill.actualAmountCents ? formatWholeMoney(bill.actualAmountCents) : "", bill.isPaid ? "Yes" : "No", bill.isAutopay ? "Yes" : "No", bill.isSkipped ? "Yes" : "No", <div key={bill.id} className="flex flex-wrap gap-2"><form action={markBillPaidAction} className="flex gap-2"><input type="hidden" name="id" value={bill.id} /><input type="hidden" name="paidDate" value={bill.dueDate} /><input name="actualAmount" className="w-24 rounded-lg border border-white/15 bg-black/20 px-2 py-1" placeholder="Actual" /><button className="rounded-lg bg-ledger-blue px-3 py-1 font-bold text-ledger-ink">Paid</button></form><form action={bill.isSkipped ? unskipBillAction : skipBillAction}><input type="hidden" name="id" value={bill.id} /><button className="rounded-lg border border-white/15 px-3 py-1">{bill.isSkipped ? "Unskip" : "Skip"}</button></form></div>])} /></div></Card></AppShell>;
}
