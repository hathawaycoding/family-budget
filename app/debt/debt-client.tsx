"use client";

import { useActionState } from "react";
import { DebtTrend } from "@/components/charts/budget-charts";
import { Card } from "@/components/ui/card";
import { createDebtAccountFormAction, createDebtPaymentFormAction, deleteDebtAccountFormAction, disableDebtAccountFormAction, updateDebtAccountFormAction, type FormActionState } from "@/app/actions";
import { estimatedMonthlyInterestCents, projectedDebtTrend } from "@/lib/calculations/debt";
import { formatWholeMoney } from "@/lib/money";
import type { DebtAccount } from "@/lib/types";

const initialState: FormActionState = { error: "" };
const fieldClass = "rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-ledger-blue dark:border-white/15 dark:bg-black/20 dark:text-white";
const smallFieldClass = "rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-ledger-blue dark:border-white/15 dark:bg-black/20 dark:text-white";
const primaryButtonClass = "rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink disabled:cursor-not-allowed disabled:opacity-50";
const saveButtonClass = "rounded-lg bg-ledger-blue px-3 py-2 text-sm font-bold text-ledger-ink disabled:cursor-not-allowed disabled:opacity-50";
const dangerButtonClass = "rounded-lg border border-ledger-rose/50 px-3 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-100";

function moneyValue(value: number) {
  return (value / 100).toFixed(2);
}

function FormMessage({ state }: { state: FormActionState }) {
  if (state.error) return <p className="rounded-xl border border-ledger-rose/50 bg-ledger-rose/10 px-3 py-2 text-sm text-red-700 dark:text-red-100" role="alert">{state.error}</p>;
  if (state.success) return <p className="rounded-xl border border-ledger-mint/50 bg-ledger-mint/10 px-3 py-2 text-sm text-emerald-700 dark:text-ledger-mint">{state.success}</p>;
  return null;
}

function AddPaymentForm({ debtAccounts }: { debtAccounts: DebtAccount[] }) {
  const [state, action, pending] = useActionState(createDebtPaymentFormAction, initialState);
  const hasCards = debtAccounts.length > 0;
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">Add payment</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pick any active card you have added. Payments feed the debt plan and cash-flow view.</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{debtAccounts.length} active</span>
      </div>
      <form action={action} className="mt-5 grid gap-3 md:grid-cols-2">
        <select name="debtAccountId" className={fieldClass} disabled={!hasCards} defaultValue={debtAccounts[0]?.id ?? ""}>
          {hasCards ? debtAccounts.map((debt) => <option key={debt.id} value={debt.id}>{debt.name}</option>) : <option value="">Add a card first</option>}
        </select>
        <input name="dueDate" type="date" defaultValue="2026-07-20" className={fieldClass} disabled={!hasCards} />
        <input name="minimumPayment" className={fieldClass} placeholder="Minimum payment" inputMode="decimal" disabled={!hasCards} />
        <input name="extraPayment" className={fieldClass} placeholder="Extra payment" inputMode="decimal" disabled={!hasCards} />
        <input name="actualPayment" className={fieldClass} placeholder="Actual payment, optional" inputMode="decimal" disabled={!hasCards} />
        <button className={primaryButtonClass} disabled={!hasCards || pending}>{pending ? "Adding..." : "Add payment"}</button>
        <div className="md:col-span-2"><FormMessage state={state} /></div>
      </form>
    </Card>
  );
}

function AddCardForm() {
  const [state, action, pending] = useActionState(createDebtAccountFormAction, initialState);
  return (
    <Card>
      <h2 className="font-display text-3xl">Add card</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use the card names you recognize. These replace starter cards whenever you add your own.</p>
      <form action={action} className="mt-5 grid gap-3 md:grid-cols-2">
        <input name="name" className={fieldClass} placeholder="Card name" />
        <input name="currentBalance" className={fieldClass} placeholder="Current balance" inputMode="decimal" />
        <input name="startingBalance" className={fieldClass} placeholder="Starting balance" inputMode="decimal" />
        <input name="interestRate" className={fieldClass} placeholder="APR, e.g. 23.99" inputMode="decimal" />
        <input name="minimumPayment" className={fieldClass} placeholder="Minimum payment" inputMode="decimal" />
        <input name="extraPayment" className={fieldClass} placeholder="Extra payment" inputMode="decimal" />
        <input name="dueDay" className={fieldClass} placeholder="Due day, 1-31" inputMode="numeric" />
        <button className={primaryButtonClass} disabled={pending}>{pending ? "Adding..." : "Add card"}</button>
        <div className="md:col-span-2"><FormMessage state={state} /></div>
      </form>
    </Card>
  );
}

function RemoveCardForm({ debt }: { debt: DebtAccount }) {
  const [disableState, disableAction, disabling] = useActionState(disableDebtAccountFormAction, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteDebtAccountFormAction, initialState);
  return (
    <div className="grid gap-3 border-t border-slate-200 pt-3 dark:border-white/10">
      <form action={disableAction} className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input type="hidden" name="debtAccountId" value={debt.id} />
        <label className="flex items-center gap-2"><input required type="checkbox" /> Remove from active list</label>
        <button className={dangerButtonClass} disabled={disabling}>{disabling ? "Removing..." : "Remove"}</button>
      </form>
      <FormMessage state={disableState} />
      <form action={deleteAction} className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input type="hidden" name="debtAccountId" value={debt.id} />
        <label className="flex items-center gap-2"><input required type="checkbox" /> Delete if unused</label>
        <button className={dangerButtonClass} disabled={deleting}>{deleting ? "Deleting..." : "Delete unused"}</button>
      </form>
      <FormMessage state={deleteState} />
      <p className="text-xs text-slate-500 dark:text-slate-400">Cards with payment history are removed from active lists instead of deleted, so past reports stay intact.</p>
    </div>
  );
}

function ManageCardForm({ debt }: { debt: DebtAccount }) {
  const [state, action, pending] = useActionState(updateDebtAccountFormAction, initialState);
  return (
    <details className="mt-5 rounded-2xl border border-slate-200 bg-white/50 p-3 dark:border-white/10 dark:bg-black/10">
      <summary className="cursor-pointer list-none text-sm font-bold text-ledger-blue outline-none focus-visible:ring-2 focus-visible:ring-ledger-blue">Manage card</summary>
      <div className="mt-3 grid gap-4 border-t border-slate-200 pt-3 dark:border-white/10">
        <form action={action} className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <input type="hidden" name="debtAccountId" value={debt.id} />
          <input name="name" defaultValue={debt.name} className={smallFieldClass} placeholder="Card name" />
          <input name="currentBalance" defaultValue={moneyValue(debt.currentBalanceCents)} className={smallFieldClass} placeholder="Current" inputMode="decimal" />
          <input name="startingBalance" defaultValue={moneyValue(debt.startingBalanceCents)} className={smallFieldClass} placeholder="Starting" inputMode="decimal" />
          <input name="interestRate" defaultValue={debt.interestRatePercent} className={smallFieldClass} placeholder="APR" inputMode="decimal" />
          <input name="minimumPayment" defaultValue={moneyValue(debt.minimumPaymentCents)} className={smallFieldClass} placeholder="Minimum" inputMode="decimal" />
          <input name="extraPayment" defaultValue={moneyValue(debt.extraPaymentCents)} className={smallFieldClass} placeholder="Extra" inputMode="decimal" />
          <input name="dueDay" defaultValue={debt.dueDay} className={smallFieldClass} placeholder="Due day" inputMode="numeric" />
          <button className={saveButtonClass} disabled={pending}>{pending ? "Saving..." : "Save changes"}</button>
          <div className="md:col-span-2 xl:col-span-4"><FormMessage state={state} /></div>
        </form>
        <RemoveCardForm debt={debt} />
      </div>
    </details>
  );
}

function CardList({ debtAccounts }: { debtAccounts: DebtAccount[] }) {
  if (debtAccounts.length === 0) {
    return <Card className="mt-5"><h2 className="font-display text-3xl">Your cards</h2><p className="mt-3 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-500 dark:text-slate-400">Add your first credit card to start tracking payoff. Once added, it will appear in the payment dropdown automatically.</p></Card>;
  }
  return (
    <Card className="mt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">Your cards</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Each card shows the payoff facts first. Editing stays tucked away until you need it.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {debtAccounts.map((debt) => (
          <article key={debt.id} className="rounded-3xl border border-slate-200 bg-white/[0.55] p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl">{debt.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Due day {debt.dueDay} · {debt.interestRatePercent}% APR</p>
              </div>
              <span className="rounded-full border border-ledger-blue/50 bg-ledger-blue/10 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-100">Active</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Balance</p><p className="mt-1 font-mono text-xl font-bold">{formatWholeMoney(debt.currentBalanceCents)}</p></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Minimum</p><p className="mt-1 font-mono text-xl font-bold">{formatWholeMoney(debt.minimumPaymentCents)}</p></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Extra</p><p className="mt-1 font-mono text-xl font-bold">{formatWholeMoney(debt.extraPaymentCents)}</p></div>
              <div><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Interest est.</p><p className="mt-1 font-mono text-xl font-bold">{formatWholeMoney(estimatedMonthlyInterestCents(debt))}</p></div>
            </div>
            <ManageCardForm debt={debt} />
          </article>
        ))}
      </div>
    </Card>
  );
}

export function DebtClient({ debtAccounts }: { debtAccounts: DebtAccount[] }) {
  const trendSource = debtAccounts[0];
  const trend = trendSource ? projectedDebtTrend(trendSource).map((point) => ({ month: `M${point.month}`, balance: Math.round(point.balanceCents / 100) })) : [];
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-5">
          <Card>
            <h1 className="font-display text-5xl">Debt</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Credit cards only. Add the cards you actually use, hide the ones you do not, and keep payoff planning separate from normal spending.</p>
          </Card>
          <AddPaymentForm debtAccounts={debtAccounts} />
        </div>
        <div className="grid gap-5">
          <AddCardForm />
          <Card>
            <h2 className="font-display text-3xl">Debt trend</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Based on {trendSource ? trendSource.name : "your first active card"}. Interest is an estimate.</p>
            {trend.length > 0 ? <DebtTrend data={trend} /> : <p className="mt-5 rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-500 dark:text-slate-400">Add a card to see a payoff trend.</p>}
          </Card>
        </div>
      </div>
      <CardList debtAccounts={debtAccounts} />
    </>
  );
}
