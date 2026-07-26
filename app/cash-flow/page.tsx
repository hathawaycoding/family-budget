import { AppShell } from "@/components/app-shell/app-shell";
import {
  clearBillActualAction,
  clearIncomeActualAction,
  deleteBillInstanceAction,
  deleteCashFlowDebtAccountAction,
  deletePlannedExpenseAction,
  deleteSavingsActivityAction,
  deleteTransactionAction,
  markBillPaidAction,
  markBillUnpaidAction,
  skipBillAction,
  toggleBillAutopayAction,
  unskipBillAction,
  updateBillInstanceAction,
  updateCashFlowDebtAccountAction,
  updateCashFlowIncomeAction,
  updateCashFlowPlannedExpenseAction,
  updateCashFlowSavingsActivityAction,
  updateCashFlowTransactionAction
} from "@/app/actions";
import { Card, Stat } from "@/components/ui/card";
import { SimpleTable } from "@/components/tables/simple-table";
import { cashFlowActivityRows, getCashFlowSummary } from "@/lib/cash-flow-view";
import { formatDateLabel } from "@/lib/dates";
import { formatWholeMoney } from "@/lib/money";
import { getMonthBundle } from "@/lib/services/budget-data-service";
import type { BillInstance, CashFlowRow, DebtAccount } from "@/lib/types";

export const dynamic = "force-dynamic";

function inputMoney(cents: number) {
  return (Math.abs(cents) / 100).toFixed(2);
}

const inputClass = "rounded-lg border border-white/15 bg-black/20 px-2 py-1 text-xs";
const saveButtonClass = "rounded-lg bg-ledger-blue px-3 py-1 text-xs font-bold text-ledger-ink";
const deleteButtonClass = "rounded-lg border border-red-400/60 px-3 py-1 text-xs text-red-200";

function DeleteForm({ id, action }: { id: string; action: (formData: FormData) => Promise<void> }) {
  return <form action={action}><input type="hidden" name="id" value={id} /><button className={deleteButtonClass}>Delete</button></form>;
}

function ClearActualForm({ id }: { id: string }) {
  return <form action={clearIncomeActualAction}><input type="hidden" name="id" value={id} /><button className={deleteButtonClass}>Clear actual</button></form>;
}

function EditPanel({ row, sourceAmountCents, hasActualIncome, bill, debt }: { row: CashFlowRow; sourceAmountCents: number; hasActualIncome?: boolean; bill?: BillInstance; debt?: DebtAccount }) {
  if (!row.sourceId || !row.sourceType) return <span className="text-xs text-slate-400">Calculated</span>;

  if (row.sourceType === "IncomeEntry") {
    return <div><form action={updateCashFlowIncomeAction} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={row.sourceId} /><input type="date" name="date" defaultValue={row.date} className={inputClass} /><input name="amount" defaultValue={inputMoney(sourceAmountCents)} className={`${inputClass} w-24`} /><button className={saveButtonClass}>Save</button></form>{hasActualIncome ? <div className="mt-2"><ClearActualForm id={row.sourceId} /></div> : null}</div>;
  }

  if (row.sourceType === "BillInstance" && bill) {
    return <div><form action={updateBillInstanceAction} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={row.sourceId} /><input type="date" name="date" defaultValue={row.date} className={inputClass} /><input name="amount" defaultValue={bill.actualAmountCents != null ? inputMoney(bill.actualAmountCents) : ""} className={`${inputClass} w-24`} placeholder={inputMoney(sourceAmountCents)} /><button className={saveButtonClass}>Save</button></form><div className="mt-2 flex flex-wrap gap-2">{bill.actualAmountCents != null ? <form action={clearBillActualAction}><input type="hidden" name="id" value={row.sourceId} /><button className={deleteButtonClass}>Clear actual</button></form> : null}<form action={bill.isPaid ? markBillUnpaidAction : markBillPaidAction}><input type="hidden" name="id" value={row.sourceId} /><input type="hidden" name="paidDate" value={bill.paidDate ?? bill.dueDate} /><input type="hidden" name="actualAmount" value="" /><button className={deleteButtonClass}>{bill.isPaid ? "Mark not paid" : "Mark paid"}</button></form><form action={bill.isSkipped ? unskipBillAction : skipBillAction}><input type="hidden" name="id" value={row.sourceId} /><button className={deleteButtonClass}>{bill.isSkipped ? "Unskip" : "Skip"}</button></form><form action={toggleBillAutopayAction}><input type="hidden" name="id" value={row.sourceId} /><button className={deleteButtonClass}>{bill.isAutopay ? "Not autopay" : "Autopay"}</button></form><DeleteForm id={row.sourceId} action={deleteBillInstanceAction} /></div></div>;
  }

  if (row.sourceType === "Transaction") {
    return <div><form action={updateCashFlowTransactionAction} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={row.sourceId} /><input type="date" name="date" defaultValue={row.date} className={inputClass} /><input name="label" defaultValue={row.label} className={`${inputClass} w-32`} /><input name="amount" defaultValue={inputMoney(sourceAmountCents)} className={`${inputClass} w-24`} /><select name="cashFlowTreatment" defaultValue="CASH_DEBIT" className={inputClass}><option value="CASH_DEBIT">Cash/debit</option><option value="CREDIT_CARD">Credit card</option></select><button className={saveButtonClass}>Save</button></form><div className="mt-2"><DeleteForm id={row.sourceId} action={deleteTransactionAction} /></div></div>;
  }

  if (row.sourceType === "PlannedExpense") {
    return <div><form action={updateCashFlowPlannedExpenseAction} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={row.sourceId} /><input type="date" name="date" defaultValue={row.date} className={inputClass} /><input name="label" defaultValue={row.label} className={`${inputClass} w-32`} /><input name="amount" defaultValue={inputMoney(sourceAmountCents)} className={`${inputClass} w-24`} /><button className={saveButtonClass}>Save</button></form><div className="mt-2"><DeleteForm id={row.sourceId} action={deletePlannedExpenseAction} /></div></div>;
  }

  if (row.sourceType === "SavingsActivity") {
    return <div><form action={updateCashFlowSavingsActivityAction} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={row.sourceId} /><input type="date" name="date" defaultValue={row.date} className={inputClass} /><input name="label" defaultValue={row.label === "Savings activity" ? "" : row.label} className={`${inputClass} w-32`} /><input name="amount" defaultValue={inputMoney(sourceAmountCents)} className={`${inputClass} w-24`} /><button className={saveButtonClass}>Save</button></form><div className="mt-2"><DeleteForm id={row.sourceId} action={deleteSavingsActivityAction} /></div></div>;
  }

  if (row.sourceType === "DebtAccount" && debt) {
    return <div><form action={updateCashFlowDebtAccountAction} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={row.sourceId} /><input type="date" name="date" defaultValue={row.date} className={inputClass} /><input name="minimumPayment" defaultValue={inputMoney(debt.minimumPaymentCents)} className={`${inputClass} w-24`} /><input name="extraPayment" defaultValue={inputMoney(debt.extraPaymentCents)} className={`${inputClass} w-24`} /><button className={saveButtonClass}>Save</button></form><div className="mt-2"><DeleteForm id={row.sourceId} action={deleteCashFlowDebtAccountAction} /></div></div>;
  }

  return <span className="text-xs text-slate-400">No actions</span>;
}

function ActionsCell(props: Parameters<typeof EditPanel>[0]) {
  if (!props.row.sourceId || !props.row.sourceType) return <span className="text-xs text-slate-400">Calculated</span>;

  return <details className="group min-w-[17rem] rounded-xl border border-white/10 bg-black/10 p-2"><summary className="cursor-pointer list-none rounded-lg px-2 py-1 text-sm font-bold text-ledger-blue outline-none transition group-open:bg-white/5 focus-visible:ring-2 focus-visible:ring-ledger-blue">Edit</summary><div className="mt-3 border-t border-white/10 pt-3"><EditPanel {...props} /></div></details>;
}

function AmountCell({ cents }: { cents: number }) {
  const color = cents > 0 ? "text-ledger-mint" : cents < 0 ? "text-red-100" : "text-slate-300";
  return <span className={color}>{formatWholeMoney(cents)}</span>;
}

function WarningCell({ row }: { row: CashFlowRow }) {
  if (row.isNegative) return <span className="rounded-full border border-ledger-rose/50 bg-ledger-rose/10 px-2 py-1 text-xs font-bold text-red-100">Negative balance</span>;
  if (row.isLowBalance) return <span className="rounded-full border border-ledger-amber/50 bg-ledger-amber/10 px-2 py-1 text-xs font-bold text-yellow-100">Low balance</span>;
  return "";
}

export default async function CashFlowPage() {
  const { household, month, cashFlowRows, previewCashFlowRows, futureExpenses, income, bills, transactions, plannedExpenses, savingsActivities, debtAccounts } = await getMonthBundle("2026-07");
  const summary = getCashFlowSummary(cashFlowRows, household.lowBalanceThresholdCents);
  const previewSummary = getCashFlowSummary(previewCashFlowRows, household.lowBalanceThresholdCents);
  const includedFutureCount = futureExpenses.filter((expense) => expense.status === "ACTIVE" && expense.includeInPlanPreview).length;
  const visibleRows = cashFlowActivityRows(cashFlowRows);
  const incomeAmounts = new Map(income.map((item) => [item.id, item.actualAmountCents ?? item.expectedAmountCents]));
  const incomeHasActual = new Map(income.map((item) => [item.id, item.actualAmountCents != null]));
  const billAmounts = new Map(bills.map((item) => [item.id, item.actualAmountCents ?? item.expectedAmountCents]));
  const billById = new Map(bills.map((item) => [item.id, item]));
  const transactionAmounts = new Map(transactions.map((item) => [item.id, item.totalAmountCents]));
  const plannedAmounts = new Map(plannedExpenses.map((item) => [item.id, item.actualAmountCents ?? item.expectedAmountCents]));
  const savingsAmounts = new Map(savingsActivities.map((item) => [item.id, item.actualAmountCents ?? item.plannedAmountCents ?? 0]));
  const debtById = new Map(debtAccounts.map((item) => [item.id, item]));

  function sourceAmount(row: CashFlowRow) {
    if (!row.sourceId) return row.amountCents;
    if (row.sourceType === "IncomeEntry") return incomeAmounts.get(row.sourceId) ?? row.amountCents;
    if (row.sourceType === "BillInstance") return billAmounts.get(row.sourceId) ?? row.amountCents;
    if (row.sourceType === "Transaction") return transactionAmounts.get(row.sourceId) ?? row.amountCents;
    if (row.sourceType === "PlannedExpense") return plannedAmounts.get(row.sourceId) ?? row.amountCents;
    if (row.sourceType === "SavingsActivity") return savingsAmounts.get(row.sourceId) ?? row.amountCents;
    return Math.abs(row.amountCents);
  }

  return (
    <AppShell>
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-5xl">Cash Flow</h1>
            <p className="mt-2 text-slate-300">Activity and risk days for {month.label}. Plain no-activity days are hidden so the forecast stays scannable.</p>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">Activity only</span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Stat label="Starting" value={formatWholeMoney(summary.startingBalanceCents)} />
          <Stat label="Ending" value={formatWholeMoney(summary.endingBalanceCents)} tone={summary.endingBalanceCents < 0 ? "bad" : "good"} />
          <Stat label="Lowest" value={formatWholeMoney(summary.lowestBalanceCents)} tone={summary.lowestBalanceCents < 0 ? "bad" : "warn"} />
          <Stat label="Negative days" value={String(summary.negativeDayCount)} tone={summary.negativeDayCount > 0 ? "bad" : "good"} />
          <Stat label="Next risk" value={summary.nextRiskDate ? formatDateLabel(summary.nextRiskDate) : "None"} tone={summary.nextRiskDate ? "bad" : "good"} />
          <Stat label="Low balance" value={summary.nextLowBalanceDate ? formatDateLabel(summary.nextLowBalanceDate) : summary.lowBalanceThresholdCents == null ? "Inactive" : "None"} tone={summary.nextLowBalanceDate ? "warn" : "good"} />
        </div>

        {summary.nextLowBalanceDate ? <p className="mt-5 rounded-2xl border border-ledger-amber/40 bg-ledger-amber/15 p-4 text-sm text-yellow-100">Projected checking falls below {formatWholeMoney(summary.lowBalanceThresholdCents ?? 0)} on {formatDateLabel(summary.nextLowBalanceDate)}. Main causes: {summary.majorLowBalanceCauses.join(", ") || "upcoming outflows"}.</p> : null}

        {includedFutureCount > 0 ? <div className="mt-5 rounded-2xl border border-ledger-blue/40 bg-ledger-blue/10 p-4 text-sm text-blue-100"><p className="font-bold">Future expense preview includes {includedFutureCount} active item{includedFutureCount === 1 ? "" : "s"}.</p><p className="mt-1">Preview lowest balance: {formatWholeMoney(previewSummary.lowestBalanceCents)}. {previewSummary.nextRiskDate ? `Negative risk starts ${formatDateLabel(previewSummary.nextRiskDate)}.` : previewSummary.nextLowBalanceDate ? `Low-balance risk starts ${formatDateLabel(previewSummary.nextLowBalanceDate)}.` : "No preview risk detected."}</p><a href="/future-expenses" className="mt-3 inline-block font-bold text-ledger-blue">Review future expenses</a></div> : null}

        <div className="mt-5 max-h-[38rem] overflow-auto rounded-2xl border border-white/10">
          <SimpleTable
            headers={["Date", "Activity", "Type", "Amount", "Balance", "Warning", "Actions"]}
            rows={visibleRows.map((row) => [
              formatDateLabel(row.date),
              row.label,
              row.type,
              <AmountCell key={`${row.date}-${row.label}-amount`} cents={row.amountCents} />,
              formatWholeMoney(row.balanceCents),
              <WarningCell key={`${row.date}-${row.label}-warning`} row={row} />,
              <ActionsCell key={`${row.sourceType ?? "calculated"}-${row.sourceId ?? row.date}-${row.label}`} row={row} sourceAmountCents={sourceAmount(row)} hasActualIncome={row.sourceId ? incomeHasActual.get(row.sourceId) : false} bill={row.sourceId ? billById.get(row.sourceId) : undefined} debt={row.sourceId ? debtById.get(row.sourceId) : undefined} />
            ])}
          />
        </div>
      </Card>
    </AppShell>
  );
}
