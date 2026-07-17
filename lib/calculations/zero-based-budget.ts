import { expensePlanningCents, incomePlanningCents } from "@/lib/money";
import type { BillInstance, BudgetMonth, DebtAccount, IncomeEntry, MonthStatus, PlannedExpense, SavingsActivity, SpendingCategory } from "@/lib/types";

export function getZeroBasedSummary(args: {
  month: BudgetMonth;
  income: IncomeEntry[];
  bills: BillInstance[];
  categories: SpendingCategory[];
  plannedExpenses: PlannedExpense[];
  savingsActivities: SavingsActivity[];
  debtAccounts: DebtAccount[];
  hasCashFlowRisk: boolean;
}) {
  const expectedIncomeCents = args.income.reduce((sum, item) => sum + incomePlanningCents(item.actualAmountCents ?? item.expectedAmountCents), 0);
  const expectedBillsCents = args.bills.filter((bill) => !bill.isSkipped).reduce((sum, bill) => sum + expensePlanningCents(bill.actualAmountCents ?? bill.expectedAmountCents), 0);
  const variableBudgetCents = args.categories.filter((category) => category.isActive).reduce((sum, category) => sum + expensePlanningCents(category.baseMonthlyBudgetCents), 0);
  const plannedExpenseCents = args.plannedExpenses.reduce((sum, expense) => sum + expensePlanningCents(expense.actualAmountCents ?? expense.expectedAmountCents), 0);
  const savingsCents = args.savingsActivities.reduce((sum, activity) => sum + expensePlanningCents(activity.actualAmountCents ?? activity.plannedAmountCents ?? 0), 0);
  const debtCents = args.debtAccounts.reduce((sum, debt) => sum + expensePlanningCents(debt.minimumPaymentCents + debt.extraPaymentCents), 0);
  const assignedCents = expectedBillsCents + variableBudgetCents + plannedExpenseCents + savingsCents + debtCents;
  const unassignedCents = expectedIncomeCents - assignedCents;
  let status: MonthStatus = "Balanced";
  if (args.month.isClosed) status = "Closed";
  else if (args.hasCashFlowRisk) status = "Cash-Flow Risk";
  else if (unassignedCents < 0) status = "Underfunded";
  else if (unassignedCents > 0) status = "Needs Assignment";
  return { expectedIncomeCents, expectedBillsCents, variableBudgetCents, plannedExpenseCents, savingsCents, debtCents, assignedCents, unassignedCents, status };
}
