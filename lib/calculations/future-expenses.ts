import { expensePlanningCents } from "@/lib/money";
import type { BudgetMonth, CashFlowRow, FutureExpense, FutureExpenseContribution } from "@/lib/types";

export function getIncludedFutureExpenses(futureExpenses: FutureExpense[]) {
  return futureExpenses.filter((expense) => expense.status === "ACTIVE" && expense.includeInPlanPreview);
}

export function calculateEqualMonthlySetAside(expense: Pick<FutureExpense, "expectedAmountCents" | "dueDate">, months: BudgetMonth[], startMonthId?: string) {
  const eligibleMonths = months.filter((month) => {
    const afterStart = startMonthId ? month.id >= startMonthId : true;
    return afterStart && month.startDate <= expense.dueDate;
  });
  return Math.ceil(expensePlanningCents(expense.expectedAmountCents) / Math.max(1, eligibleMonths.length));
}

export function calculateCustomSetAsideProgress(expense: Pick<FutureExpense, "expectedAmountCents" | "dueDate">, contributions: FutureExpenseContribution[]) {
  const scheduledTotalCents = contributions.filter((item) => !item.date || item.date <= expense.dueDate).reduce((sum, item) => sum + expensePlanningCents(item.plannedAmountCents), 0);
  const requiredCents = expensePlanningCents(expense.expectedAmountCents);
  const remainingCents = Math.max(0, requiredCents - scheduledTotalCents);
  return { scheduledTotalCents, remainingCents, isFunded: remainingCents === 0 };
}

export function getFutureExpenseRiskStatus(expense: FutureExpense, rows: CashFlowRow[]) {
  const expenseRows = rows.filter((row) => row.sourceType === "FutureExpense" && row.sourceId === expense.id);
  const negative = expenseRows.find((row) => row.isNegative) ?? rows.find((row) => row.date >= expense.dueDate && row.isNegative);
  const low = expenseRows.find((row) => row.isLowBalance) ?? rows.find((row) => row.date >= expense.dueDate && row.isLowBalance);
  if (negative) return { label: "Negative risk", tone: "bad" as const, date: negative.date, balanceCents: negative.balanceCents };
  if (low) return { label: "Low-balance risk", tone: "warn" as const, date: low.date, balanceCents: low.balanceCents };
  return { label: "Fits plan", tone: "good" as const, date: null, balanceCents: null };
}

export function getFutureExpenseStatusLabel(status: FutureExpense["status"]) {
  const labels: Record<FutureExpense["status"], string> = {
    DRAFT: "Draft",
    ACTIVE: "Active",
    CONVERTED_TO_PLANNED_EXPENSE: "Planned",
    CONVERTED_TO_SINKING_FUND: "Funded",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled"
  };
  return labels[status];
}

export function getPriorityLabel(priority: FutureExpense["priority"]) {
  const labels: Record<FutureExpense["priority"], string> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", MUST_PAY: "Must pay" };
  return labels[priority];
}
