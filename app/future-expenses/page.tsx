import { AppShell } from "@/components/app-shell/app-shell";
import { Card, Stat } from "@/components/ui/card";
import { buildCashFlowRows } from "@/lib/calculations/cash-flow";
import { calculateCustomSetAsideProgress, calculateEqualMonthlySetAside, getFutureExpenseRiskStatus, getFutureExpenseStatusLabel, getPriorityLabel } from "@/lib/calculations/future-expenses";
import { formatDateLabel } from "@/lib/dates";
import { formatWholeMoney } from "@/lib/money";
import { getBudgetData } from "@/lib/services/budget-data-service";
import { cancelFutureExpenseAction, completeFutureExpenseAction, convertFutureExpenseToPlannedExpenseAction, convertFutureExpenseToSinkingFundAction, createFutureExpenseAction, createFutureExpenseContributionAction, deleteFutureExpenseAction, deleteFutureExpenseContributionAction, updateFutureExpenseAction } from "@/app/actions";
import type { BudgetMonth, FutureExpense } from "@/lib/types";

export const dynamic = "force-dynamic";

const fieldClass = "rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm";
const smallFieldClass = "rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm";
const primaryButtonClass = "rounded-xl bg-ledger-amber px-4 py-3 font-bold text-ledger-ink";
const secondaryButtonClass = "rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-slate-100 hover:bg-white/10";
const dangerButtonClass = "rounded-xl border border-ledger-rose/50 px-4 py-3 text-sm font-bold text-red-100 hover:bg-ledger-rose/10";

function inputMoney(cents: number) {
  return (cents / 100).toFixed(2);
}

function toneClass(tone: "good" | "warn" | "bad") {
  return tone === "good" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100" : tone === "warn" ? "border-ledger-amber/50 bg-ledger-amber/10 text-yellow-100" : "border-ledger-rose/50 bg-ledger-rose/10 text-red-100";
}

function monthForExpense(expense: FutureExpense, months: BudgetMonth[]) {
  return months.find((month) => month.id === expense.monthId) ?? months.find((month) => month.startDate <= expense.dueDate && month.endDate >= expense.dueDate) ?? months[0];
}

function ExpenseForm({ categories, expense }: { categories: { id: string; name: string; isActive: boolean }[]; expense?: FutureExpense }) {
  const action = expense ? updateFutureExpenseAction : createFutureExpenseAction;
  return (
    <form action={action} className="grid gap-3">
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}
      <input name="description" defaultValue={expense?.description} className={fieldClass} placeholder="School supplies" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="expectedAmount" defaultValue={expense ? inputMoney(expense.expectedAmountCents) : ""} className={fieldClass} placeholder="Expected amount" />
        <input type="date" name="dueDate" defaultValue={expense?.dueDate ?? "2026-08-05"} className={fieldClass} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="categoryId" defaultValue={expense?.categoryId} className={fieldClass}>
          {categories.filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select name="priority" defaultValue={expense?.priority ?? "MEDIUM"} className={fieldClass}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="MUST_PAY">Must pay</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="type" defaultValue={expense?.type ?? "ONE_TIME"} className={fieldClass}>
          <option value="ONE_TIME">One-time</option>
          <option value="RECURRING">Recurring</option>
        </select>
        <select name="setAsideMode" defaultValue={expense?.setAsideMode ?? "EQUAL_MONTHLY"} className={fieldClass}>
          <option value="EQUAL_MONTHLY">Equal monthly</option>
          <option value="CUSTOM">Custom schedule</option>
        </select>
      </div>
      <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"><input name="includeInPlanPreview" type="checkbox" defaultChecked={expense?.includeInPlanPreview ?? true} /> Include in monthly plan preview</label>
      <details className="rounded-xl border border-white/10 p-3"><summary className="cursor-pointer text-sm font-bold text-ledger-blue">Notes</summary><textarea name="notes" defaultValue={expense?.notes ?? ""} className={`${fieldClass} mt-3 w-full`} placeholder="What should we remember before this is due?" /></details>
      <button className={primaryButtonClass}>{expense ? "Save future expense" : "Add future expense"}</button>
    </form>
  );
}

export default async function FutureExpensesPage() {
  const data = await getBudgetData();
  const { bills, categories, debtAccounts, futureExpenses, income, months, plannedExpenses, savingsActivities, transactions } = data;
  const activeFutureExpenses = futureExpenses.filter((expense) => expense.status === "ACTIVE");
  const nextThree = [...activeFutureExpenses].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  function previewRowsFor(expense: FutureExpense) {
    const month = monthForExpense(expense, months);
    return buildCashFlowRows({ month, income: income.filter((item) => item.monthId === month.id), bills: bills.filter((item) => item.monthId === month.id), transactions: transactions.filter((item) => item.monthId === month.id), plannedExpenses: plannedExpenses.filter((item) => item.monthId === month.id), futureExpenses: [expense], includeFutureExpensePreview: true, savingsActivities: savingsActivities.filter((item) => item.monthId === month.id), debtAccounts, lowBalanceThresholdCents: data.household.lowBalanceThresholdCents });
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.28em] text-ledger-amber">Upcoming obligations</p>
          <h1 className="font-display text-4xl md:text-6xl">Future Expenses</h1>
          <p className="mt-2 max-w-3xl text-slate-300">Plan costs before they become urgent. Active items can preview monthly affordability without becoming official budget entries until you convert them.</p>
        </div>
        <a href="#add-future-expense" className={primaryButtonClass}>Add future expense</a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Active" value={String(activeFutureExpenses.length)} tone="info" />
        <Stat label="Preview total" value={formatWholeMoney(activeFutureExpenses.filter((expense) => expense.includeInPlanPreview).reduce((sum, expense) => sum + expense.expectedAmountCents, 0))} tone="warn" />
        <Stat label="Next due" value={nextThree[0] ? formatDateLabel(nextThree[0].dueDate) : "None"} tone={nextThree[0] ? "info" : "good"} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
        <Card id="add-future-expense" className="self-start">
          <h2 className="font-display text-3xl">Add one thing early</h2>
          <p className="mt-2 text-sm text-slate-400">Keep the form short. Add a custom schedule after the expense exists.</p>
          <div className="mt-5"><ExpenseForm categories={categories} /></div>
        </Card>

        <div className="grid gap-4">
          {futureExpenses.length === 0 ? <Card><h2 className="font-display text-3xl">No future expenses yet</h2><p className="mt-2 text-slate-300">Add the next school, car, travel, or holiday cost so the budget can warn you early.</p></Card> : null}
          {futureExpenses.map((expense) => {
            const category = categoryById.get(expense.categoryId);
            const rows = previewRowsFor(expense);
            const risk = getFutureExpenseRiskStatus(expense, rows);
            const equalSetAside = calculateEqualMonthlySetAside(expense, months, months[0]?.id);
            const customProgress = calculateCustomSetAsideProgress(expense, expense.contributions);
            const statusLabel = getFutureExpenseStatusLabel(expense.status);
            const isActive = expense.status === "ACTIVE";
            return (
              <Card key={expense.id} className="overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-3xl">{expense.description}</h2>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClass(risk.tone)}`}>{risk.label}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{statusLabel}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{category?.name ?? "Unknown category"} · {getPriorityLabel(expense.priority)} · Due {formatDateLabel(expense.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-3xl font-bold text-ledger-amber">{formatWholeMoney(expense.expectedAmountCents)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{expense.includeInPlanPreview && expense.status === "ACTIVE" ? "In preview" : "Preview off"}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Set aside</p><p className="mt-1 font-mono text-xl font-bold">{formatWholeMoney(equalSetAside)}/mo</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Custom funded</p><p className="mt-1 font-mono text-xl font-bold">{formatWholeMoney(customProgress.scheduledTotalCents)}</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Remaining</p><p className="mt-1 font-mono text-xl font-bold">{formatWholeMoney(customProgress.remainingCents)}</p></div>
                </div>

                <details className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
                  <summary className="cursor-pointer list-none font-bold text-ledger-blue outline-none focus-visible:ring-2 focus-visible:ring-ledger-blue">Review</summary>
                  <div className="mt-4 grid gap-5 border-t border-white/10 pt-4 xl:grid-cols-2">
                    {isActive ? (
                    <div>
                      <h3 className="font-display text-2xl">Edit details</h3>
                      <div className="mt-3"><ExpenseForm categories={categories} expense={expense} /></div>
                    </div>
                    ) : <div className="rounded-2xl border border-white/10 p-4"><h3 className="font-display text-2xl">Locked planning item</h3><p className="mt-2 text-sm text-slate-300">This expense is {statusLabel.toLowerCase()}, so its original planning details stay visible for history without changing preview totals.</p></div>}
                    <div className="grid gap-4 self-start">
                      <div className="rounded-2xl border border-white/10 p-4"><h3 className="font-display text-2xl">Impact preview</h3><p className="mt-2 text-sm text-slate-300">{risk.date ? `${risk.label} on ${formatDateLabel(risk.date)} with projected checking at ${formatWholeMoney(risk.balanceCents ?? 0)}.` : "This fits the current preview without creating a warning."}</p></div>
                      {isActive ? (
                      <div className="rounded-2xl border border-white/10 p-4">
                        <h3 className="font-display text-2xl">Custom schedule</h3>
                        <form action={createFutureExpenseContributionAction} className="mt-3 flex flex-wrap gap-2">
                          <input type="hidden" name="futureExpenseId" value={expense.id} />
                          <input type="date" name="date" defaultValue={expense.dueDate} className={smallFieldClass} />
                          <input name="plannedAmount" className={`${smallFieldClass} w-32`} placeholder="Amount" />
                          <button className={secondaryButtonClass}>Add row</button>
                        </form>
                        <div className="mt-3 grid gap-2">{expense.contributions.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm"><span>{item.date ? formatDateLabel(item.date) : "Unscheduled"}: {formatWholeMoney(item.plannedAmountCents)}</span><form action={deleteFutureExpenseContributionAction}><input type="hidden" name="id" value={item.id} /><button className="text-red-200">Delete</button></form></div>)}</div>
                      </div>
                      ) : null}
                      {isActive ? (
                      <div className="rounded-2xl border border-white/10 p-4"><h3 className="font-display text-2xl">Actions</h3><div className="mt-3 flex flex-wrap gap-2"><form action={convertFutureExpenseToPlannedExpenseAction}><input type="hidden" name="id" value={expense.id} /><button className={secondaryButtonClass}>Convert to planned expense</button></form><form action={convertFutureExpenseToSinkingFundAction}><input type="hidden" name="id" value={expense.id} /><button className={secondaryButtonClass}>Convert to sinking fund</button></form><form action={completeFutureExpenseAction}><input type="hidden" name="id" value={expense.id} /><button className={secondaryButtonClass}>Complete</button></form><form action={cancelFutureExpenseAction}><input type="hidden" name="id" value={expense.id} /><button className={dangerButtonClass}>Cancel</button></form><form action={deleteFutureExpenseAction}><input type="hidden" name="id" value={expense.id} /><button className={dangerButtonClass}>Delete</button></form></div></div>
                      ) : null}
                    </div>
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
