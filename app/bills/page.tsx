import { AppShell } from "@/components/app-shell/app-shell";
import { Card, Stat } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { formatBillDisplayDate, getBillStatusPills, getBillsSummary, type BillStatusTone } from "@/lib/bills-view";
import { formatWholeMoney } from "@/lib/money";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { clearBillActualAction, markBillPaidAction, markBillUnpaidAction, skipBillAction, toggleBillAutopayAction, unskipBillAction, updateBillInstanceAction } from "@/app/actions";

export const dynamic = "force-dynamic";

type Bill = Awaited<ReturnType<typeof getBudgetData>>["bills"][number];

function inputMoney(cents: number | null | undefined) {
  return cents == null ? "" : (cents / 100).toFixed(2);
}

function StatusPill({ children, tone = "default" }: { children: React.ReactNode; tone?: BillStatusTone }) {
  const colors = {
    default: "border-white/10 bg-white/[0.04] text-slate-300",
    good: "border-ledger-mint/40 bg-ledger-mint/10 text-ledger-mint",
    warn: "border-ledger-amber/50 bg-ledger-amber/10 text-ledger-amber",
    bad: "border-ledger-rose/50 bg-ledger-rose/10 text-red-100",
    info: "border-ledger-blue/50 bg-ledger-blue/10 text-ledger-blue"
  };

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${colors[tone]}`}>{children}</span>;
}

function BillStatus({ bill }: { bill: Bill }) {
  return (
    <div className="flex min-w-48 flex-wrap gap-2">
      {getBillStatusPills(bill).map((pill) => <StatusPill key={pill.label} tone={pill.tone}>{pill.label}</StatusPill>)}
    </div>
  );
}

function ManageBill({ bill }: { bill: Bill }) {
  return (
    <details className="group min-w-[18rem] rounded-xl border border-white/10 bg-black/10 p-2">
      <summary className="cursor-pointer list-none rounded-lg px-2 py-1 text-sm font-bold text-ledger-blue outline-none transition group-open:bg-white/5 focus-visible:ring-2 focus-visible:ring-ledger-blue">Manage</summary>
      <div className="mt-3 grid gap-3 border-t border-white/10 pt-3">
        <form action={updateBillInstanceAction} className="grid gap-2 sm:grid-cols-[9rem_7rem_auto]">
          <input type="hidden" name="id" value={bill.id} />
          <label className="grid gap-1 text-xs text-slate-400">
            Due date
            <input type="date" name="date" defaultValue={bill.dueDate} className="rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-slate-100" />
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Actual
            <input name="amount" defaultValue={inputMoney(bill.actualAmountCents)} className="rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-slate-100" placeholder="0.00" />
          </label>
          <button className="self-end rounded-lg bg-ledger-blue px-3 py-1.5 font-bold text-ledger-ink">Save</button>
        </form>

        <div className="flex flex-wrap gap-2">
          {bill.actualAmountCents != null ? <form action={clearBillActualAction}><input type="hidden" name="id" value={bill.id} /><button className="rounded-lg border border-ledger-rose/50 px-3 py-1.5 text-sm text-red-100">Clear actual</button></form> : null}
          <form action={bill.isPaid ? markBillUnpaidAction : markBillPaidAction}>
            <input type="hidden" name="id" value={bill.id} />
            <input type="hidden" name="paidDate" value={bill.paidDate ?? bill.dueDate} />
            <input type="hidden" name="actualAmount" value="" />
            <button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm">{bill.isPaid ? "Mark not paid" : "Mark paid"}</button>
          </form>
          <form action={bill.isSkipped ? unskipBillAction : skipBillAction}><input type="hidden" name="id" value={bill.id} /><button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm">{bill.isSkipped ? "Unskip" : "Skip"}</button></form>
          <form action={toggleBillAutopayAction}><input type="hidden" name="id" value={bill.id} /><button className="rounded-lg border border-white/15 px-3 py-1.5 text-sm">{bill.isAutopay ? "Not autopay" : "Autopay"}</button></form>
        </div>
      </div>
    </details>
  );
}

export default async function BillsPage() {
  const { bills } = await getBudgetData();
  const { totalExpectedCents, paidCount, unpaidCount, skippedCount } = getBillsSummary(bills);

  return (
    <AppShell>
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-5xl">Bills</h1>
            <p className="mt-2 max-w-3xl text-slate-300">Bills affect cash flow on due date. Scan status first, then open Manage only when a bill needs an edit.</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">Instance edits only</span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total expected" value={formatWholeMoney(totalExpectedCents)} />
          <Stat label="Paid" value={String(paidCount)} tone="good" />
          <Stat label="Unpaid" value={String(unpaidCount)} tone={unpaidCount > 0 ? "bad" : "good"} />
          <Stat label="Skipped" value={String(skippedCount)} tone={skippedCount > 0 ? "warn" : "default"} />
        </div>

        <div className="mt-5">
          <SimpleTable
            headers={["Due", "Bill", "Expected", "Actual", "Status", "Actions"]}
            rows={bills.map((bill) => [
              formatBillDisplayDate(bill.dueDate),
              <div key={`${bill.id}-name`}><p className="font-bold">{bill.name}</p>{bill.isSkipped ? <p className="mt-1 text-xs text-ledger-amber">Excluded from cash flow</p> : null}</div>,
              formatWholeMoney(bill.expectedAmountCents),
              bill.actualAmountCents != null ? formatWholeMoney(bill.actualAmountCents) : <span key={`${bill.id}-actual`} className="text-slate-500">Not entered</span>,
              <BillStatus key={`${bill.id}-status`} bill={bill} />,
              <ManageBill key={`${bill.id}-manage`} bill={bill} />
            ])}
          />
        </div>
      </Card>
    </AppShell>
  );
}
