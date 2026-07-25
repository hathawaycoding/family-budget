import { eachDay } from "@/lib/dates";
import { expensePlanningCents, incomePlanningCents } from "@/lib/money";
import type { BillInstance, BudgetMonth, CashFlowRow, DebtAccount, IncomeEntry, PlannedExpense, SavingsActivity, SpendingTransaction } from "@/lib/types";

type Args = {
  month: BudgetMonth;
  income: IncomeEntry[];
  bills: BillInstance[];
  transactions: SpendingTransaction[];
  plannedExpenses: PlannedExpense[];
  savingsActivities: SavingsActivity[];
  debtAccounts: DebtAccount[];
  lowBalanceThresholdCents?: number | null;
};

function isLowBalance(balanceCents: number, thresholdCents?: number | null) {
  return thresholdCents != null && balanceCents >= 0 && balanceCents < thresholdCents;
}

export function buildCashFlowRows(args: Args): CashFlowRow[] {
  const rows: CashFlowRow[] = [];
  let balance = args.month.startingBalanceCents;

  for (const date of eachDay(args.month.startDate, args.month.endDate)) {
    const events: Omit<CashFlowRow, "balanceCents" | "isNegative">[] = [];
    for (const item of args.income.filter((entry) => entry.date === date)) {
      events.push({ date, label: `${item.source} paycheck`, type: "Income", amountCents: incomePlanningCents(item.actualAmountCents ?? item.expectedAmountCents), sourceType: "IncomeEntry", sourceId: item.id, canEdit: true, canDelete: true });
    }
    for (const item of args.bills.filter((bill) => bill.dueDate === date && !bill.isSkipped)) {
      events.push({ date, label: item.name, type: "Bill", amountCents: -expensePlanningCents(item.actualAmountCents ?? item.expectedAmountCents), sourceType: "BillInstance", sourceId: item.id, canEdit: true, canDelete: true });
    }
    for (const item of args.transactions.filter((tx) => tx.date === date && tx.cashFlowTreatment === "CASH_DEBIT")) {
      events.push({ date, label: item.merchant, type: "Spending", amountCents: -expensePlanningCents(item.totalAmountCents), sourceType: "Transaction", sourceId: item.id, canEdit: true, canDelete: true });
    }
    for (const item of args.plannedExpenses.filter((expense) => expense.date === date)) {
      events.push({ date, label: item.description, type: "Planned", amountCents: -expensePlanningCents(item.actualAmountCents ?? item.expectedAmountCents), sourceType: "PlannedExpense", sourceId: item.id, canEdit: true, canDelete: true });
    }
    for (const item of args.savingsActivities.filter((activity) => activity.date === date)) {
      const amount = item.actualAmountCents ?? item.plannedAmountCents ?? 0;
      events.push({ date, label: item.description ?? "Savings activity", type: "Savings", amountCents: item.type === "WITHDRAWAL" ? incomePlanningCents(amount) : -expensePlanningCents(amount), sourceType: "SavingsActivity", sourceId: item.id, canEdit: true, canDelete: true });
    }
    for (const debt of args.debtAccounts) {
      const debtDate = `${args.month.id}-${String(debt.dueDay).padStart(2, "0")}`;
      const totalPaymentCents = debt.minimumPaymentCents + debt.extraPaymentCents;
      if (debtDate === date && totalPaymentCents > 0) {
        events.push({ date, label: `${debt.name} payment`, type: "Debt", amountCents: -expensePlanningCents(totalPaymentCents), sourceType: "DebtAccount", sourceId: debt.id, canEdit: true, canDelete: true });
      }
    }
    if (events.length === 0) {
      rows.push({ date, label: "No activity", type: "Transfer", amountCents: 0, balanceCents: balance, isNegative: balance < 0, isLowBalance: isLowBalance(balance, args.lowBalanceThresholdCents) });
    } else {
      for (const event of events) {
        balance += event.amountCents;
        rows.push({ ...event, balanceCents: balance, isNegative: balance < 0, isLowBalance: isLowBalance(balance, args.lowBalanceThresholdCents) });
      }
    }
  }
  return rows;
}
