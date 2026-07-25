import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { formatWholeMoney } from "@/lib/money";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { clearBillActualAction, markBillPaidAction, markBillUnpaidAction, skipBillAction, toggleBillAutopayAction, unskipBillAction, updateBillInstanceAction } from "@/app/actions";

export const dynamic = "force-dynamic";

function inputMoney(cents: number | null | undefined) {
  return cents == null ? "" : (cents / 100).toFixed(2);
}

export default async function BillsPage() {
  const { bills } = await getBudgetData();
  return <AppShell><Card><h1 className="font-display text-5xl">Bills</h1><p className="mt-2 text-slate-300">Bills affect cash flow on due date. Edits here update this bill instance only, not the recurring template.</p><div className="mt-5"><SimpleTable headers={["Due", "Bill", "Expected", "Actual", "Paid", "Paid date", "Autopay", "Skipped", "Actions"]} rows={bills.map((bill) => [bill.dueDate, bill.name, formatWholeMoney(bill.expectedAmountCents), bill.actualAmountCents != null ? formatWholeMoney(bill.actualAmountCents) : "", bill.isPaid ? "Yes" : "No", bill.paidDate ?? "", bill.isAutopay ? "Yes" : "No", bill.isSkipped ? "Yes" : "No", <div key={bill.id} className="flex min-w-[520px] flex-wrap gap-2"><form action={updateBillInstanceAction} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={bill.id} /><input type="date" name="date" defaultValue={bill.dueDate} className="rounded-lg border border-white/15 bg-black/20 px-2 py-1" /><input name="amount" defaultValue={inputMoney(bill.actualAmountCents)} className="w-24 rounded-lg border border-white/15 bg-black/20 px-2 py-1" placeholder="Actual" /><button className="rounded-lg bg-ledger-blue px-3 py-1 font-bold text-ledger-ink">Save</button></form>{bill.actualAmountCents != null ? <form action={clearBillActualAction}><input type="hidden" name="id" value={bill.id} /><button className="rounded-lg border border-red-400/60 px-3 py-1 text-red-200">Clear actual</button></form> : null}<form action={bill.isPaid ? markBillUnpaidAction : markBillPaidAction}><input type="hidden" name="id" value={bill.id} /><input type="hidden" name="paidDate" value={bill.paidDate ?? bill.dueDate} /><input type="hidden" name="actualAmount" value="" /><button className="rounded-lg border border-white/15 px-3 py-1">{bill.isPaid ? "Mark not paid" : "Mark paid"}</button></form><form action={bill.isSkipped ? unskipBillAction : skipBillAction}><input type="hidden" name="id" value={bill.id} /><button className="rounded-lg border border-white/15 px-3 py-1">{bill.isSkipped ? "Unskip" : "Skip"}</button></form><form action={toggleBillAutopayAction}><input type="hidden" name="id" value={bill.id} /><button className="rounded-lg border border-white/15 px-3 py-1">{bill.isAutopay ? "Not autopay" : "Autopay"}</button></form></div>])} /></div></Card></AppShell>;
}
