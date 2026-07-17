import { AppShell } from "@/components/app-shell/app-shell";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { bills } from "@/lib/sample-data";
import { formatWholeMoney } from "@/lib/money";

export default function BillsPage() {
  return <AppShell><Card><h1 className="font-display text-5xl">Bills</h1><p className="mt-2 text-slate-300">Bills affect cash flow on due date. Paid date is stored for records, and skipped bills are excluded from cash flow.</p><div className="mt-5"><SimpleTable headers={["Due", "Bill", "Expected", "Actual", "Paid", "Autopay", "Skipped"]} rows={bills.map((bill) => [bill.dueDate, bill.name, formatWholeMoney(bill.expectedAmountCents), bill.actualAmountCents ? formatWholeMoney(bill.actualAmountCents) : "", bill.isPaid ? "Yes" : "No", bill.isAutopay ? "Yes" : "No", bill.isSkipped ? "Yes" : "No"])} /></div></Card></AppShell>;
}
