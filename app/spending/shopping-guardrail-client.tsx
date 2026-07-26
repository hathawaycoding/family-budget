"use client";

import { useMemo, useState } from "react";
import { cancelShoppingCheckAction, convertShoppingCheckToTransactionAction, createShoppingCheckAction, respondToShoppingCheckAction } from "@/app/actions";
import { calculateShoppingGuardrailPreview } from "@/lib/calculations/shopping-guardrail";
import { formatDateLabel } from "@/lib/dates";
import { formatWholeMoney } from "@/lib/money";
import type { Actor, BillInstance, BudgetMonth, DebtAccount, IncomeEntry, PlannedExpense, SavingsActivity, ShoppingCheck, SpendingCategory, SpendingTransaction } from "@/lib/types";

const fieldClass = "rounded-xl border border-white/15 bg-black/20 px-4 py-3";
const secondaryButton = "rounded-xl border border-white/15 px-4 py-3 text-sm font-bold hover:bg-white/10";
const primaryButton = "rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink";

type Props = {
  actor: Actor;
  months: BudgetMonth[];
  categories: SpendingCategory[];
  transactions: SpendingTransaction[];
  income: IncomeEntry[];
  bills: BillInstance[];
  plannedExpenses: PlannedExpense[];
  savingsActivities: SavingsActivity[];
  debtAccounts: DebtAccount[];
  shoppingChecks: ShoppingCheck[];
  lowBalanceThresholdCents?: number | null;
};

function statusTone(status: string) {
  if (status === "APPROVED") return "border-ledger-mint/50 bg-ledger-mint/15 text-ledger-mint";
  if (status === "WAIT_REQUESTED" || status === "EXPIRED" || status === "CANCELLED") return "border-ledger-rose/50 bg-ledger-rose/15 text-ledger-rose";
  if (status === "CONVERTED_TO_TRANSACTION") return "border-ledger-blue/50 bg-ledger-blue/15 text-ledger-blue";
  return "border-ledger-amber/50 bg-ledger-amber/15 text-ledger-amber";
}

function friendlyStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}

export function ShoppingGuardrailClient(props: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(props.categories[0]?.id ?? "");
  const [cashFlowTreatment, setCashFlowTreatment] = useState<"CASH_DEBIT" | "CREDIT_CARD">("CASH_DEBIT");
  const amountCents = Math.round(Number(amount.replace(/[$,]/g, "")) * 100);
  const month = props.months.find((item) => item.startDate <= date && item.endDate >= date) ?? props.months[0];
  const preview = useMemo(() => {
    if (!month || !categoryId || !Number.isFinite(amountCents) || amountCents <= 0) return null;
    return calculateShoppingGuardrailPreview({ check: { monthId: month.id, date, merchant, categoryId, amountCents, cashFlowTreatment }, month, categories: props.categories, transactions: props.transactions.filter((item) => item.monthId === month.id), income: props.income.filter((item) => item.monthId === month.id), bills: props.bills.filter((item) => item.monthId === month.id), plannedExpenses: props.plannedExpenses.filter((item) => item.monthId === month.id), savingsActivities: props.savingsActivities.filter((item) => item.monthId === month.id), debtAccounts: props.debtAccounts, lowBalanceThresholdCents: props.lowBalanceThresholdCents });
  }, [amountCents, cashFlowTreatment, categoryId, date, merchant, month, props.bills, props.categories, props.debtAccounts, props.income, props.lowBalanceThresholdCents, props.plannedExpenses, props.savingsActivities, props.transactions]);
  const activeChecks = props.shoppingChecks.filter((check) => check.status !== "CONVERTED_TO_TRANSACTION").slice(0, 8);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-ledger-amber/35 bg-ledger-amber/10 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-ledger-amber">Before you buy</p>
        <h2 className="mt-2 font-display text-4xl">Shopping Guardrail</h2>
        <p className="mt-2 text-sm text-slate-300">Preview a purchase, ask your spouse, or save the check before it becomes a real transaction.</p>
        <form action={createShoppingCheckAction} className="mt-5 grid gap-3">
          <input type="date" name="date" value={date} onChange={(event) => setDate(event.target.value)} className={fieldClass} />
          <input name="merchant" value={merchant} onChange={(event) => setMerchant(event.target.value)} className={fieldClass} placeholder="Merchant" />
          <input name="amount" value={amount} onChange={(event) => setAmount(event.target.value)} className={fieldClass} placeholder="Estimated amount" />
          <select name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={fieldClass}>{props.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          <select name="cashFlowTreatment" value={cashFlowTreatment} onChange={(event) => setCashFlowTreatment(event.target.value as "CASH_DEBIT" | "CREDIT_CARD")} className={fieldClass}><option value="CASH_DEBIT">Cash/debit</option><option value="CREDIT_CARD">Credit card</option></select>
          <textarea name="requestNote" className={fieldClass} placeholder="Optional note for spouse" />
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
            {preview ? <div className="grid gap-2"><div className="flex flex-wrap gap-2">{preview.warnings.map((warning) => <span key={warning} className="rounded-full border border-white/15 px-2 py-1 text-xs font-bold">{warning}</span>)}</div><p>{preview.categoryName} after purchase: <strong>{formatWholeMoney(preview.categoryRemainingAfterCents)}</strong></p>{preview.projectedBalanceAfterPurchaseCents == null ? <p>Credit-card check: category warning only, no checking cash-flow impact.</p> : <p>Checking after purchase: <strong>{formatWholeMoney(preview.projectedBalanceAfterPurchaseCents)}</strong>{preview.riskDate ? ` · Risk date ${formatDateLabel(preview.riskDate)}` : ""}</p>}{preview.requiresConfirmation ? <p className="text-yellow-100">Warnings will require confirmation before this becomes a transaction.</p> : null}</div> : <p className="text-slate-400">Enter an amount to see the guardrail preview.</p>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2"><button name="intent" value="SAVE" className={secondaryButton}>Save check</button><button name="intent" value="ASK_SPOUSE" className={primaryButton}>Ask spouse</button></div>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-[0.24em] text-ledger-blue">Approval queue</p><h2 className="mt-2 font-display text-4xl">Shopping checks</h2></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-400">{activeChecks.length} open</span></div>
        <div className="mt-5 grid gap-3">
          {activeChecks.length ? activeChecks.map((check) => {
            const checkMonth = props.months.find((item) => item.id === check.monthId) ?? props.months[0];
            const checkPreview = checkMonth ? calculateShoppingGuardrailPreview({ check, month: checkMonth, categories: props.categories, transactions: props.transactions.filter((item) => item.monthId === check.monthId), income: props.income.filter((item) => item.monthId === check.monthId), bills: props.bills.filter((item) => item.monthId === check.monthId), plannedExpenses: props.plannedExpenses.filter((item) => item.monthId === check.monthId), savingsActivities: props.savingsActivities.filter((item) => item.monthId === check.monthId), debtAccounts: props.debtAccounts, lowBalanceThresholdCents: props.lowBalanceThresholdCents }) : null;
            const canRespond = check.requestedBy !== props.actor && check.status !== "CANCELLED" && check.status !== "EXPIRED";
            const needsOverride = checkPreview?.requiresConfirmation || check.status === "CANCELLED";
            return <article key={check.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-2xl">{check.merchant}</h3><p className="text-sm text-slate-400">{formatDateLabel(check.date)} · {formatWholeMoney(check.amountCents)} · {check.cashFlowTreatment === "CASH_DEBIT" ? "Cash/debit" : "Credit card"} · requested by {check.requestedBy}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(check.status)}`}>{friendlyStatus(check.status)}</span></div>{checkPreview ? <div className="mt-3 flex flex-wrap gap-2">{checkPreview.warnings.map((warning) => <span key={warning} className="rounded-full border border-white/15 px-2 py-1 text-xs">{warning}</span>)}</div> : null}{check.requestNote ? <p className="mt-3 text-sm text-slate-300">Request: {check.requestNote}</p> : null}{check.reviewResponseNote ? <p className="mt-2 text-sm text-slate-300">Response: {check.reviewResponseNote}</p> : null}<div className="mt-4 grid gap-2 md:grid-cols-3">{canRespond ? <form action={respondToShoppingCheckAction} className="grid gap-2"><input type="hidden" name="id" value={check.id} /><input name="responseNote" className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm" placeholder="Optional response" /><button name="response" value="APPROVED" className={secondaryButton}>Approve</button><button name="response" value="WAIT_REQUESTED" className={secondaryButton}>Request wait</button></form> : null}<form action={convertShoppingCheckToTransactionAction} className="grid gap-2"><input type="hidden" name="id" value={check.id} /><input name="notes" className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm" placeholder="Transaction notes" />{needsOverride ? <label className="flex items-center gap-2 text-xs text-yellow-100"><input name="confirmOverride" type="checkbox" /> Confirm warning</label> : null}<button className={primaryButton}>Convert to transaction</button></form><form action={cancelShoppingCheckAction}><input type="hidden" name="id" value={check.id} /><button className={secondaryButton}>Cancel</button></form></div></article>;
          }) : <p className="rounded-2xl border border-white/10 p-4 text-sm text-slate-400">No open shopping checks yet.</p>}
        </div>
      </section>
    </div>
  );
}
