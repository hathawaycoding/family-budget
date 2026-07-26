import { buildCashFlowRows } from "@/lib/calculations/cash-flow";
import { getCategoryCarryover } from "@/lib/calculations/category-carryover";
import type { BillInstance, BudgetMonth, DebtAccount, IncomeEntry, PlannedExpense, SavingsActivity, ShoppingCheckStatus, ShoppingGuardrailWarning, SpendingCategory, SpendingTransaction } from "@/lib/types";

export type ShoppingGuardrailInput = {
  id?: string;
  monthId: string;
  date: string;
  merchant: string;
  categoryId: string;
  amountCents: number;
  cashFlowTreatment: "CASH_DEBIT" | "CREDIT_CARD";
  status?: ShoppingCheckStatus;
};

export type ShoppingGuardrailPreview = {
  warnings: ShoppingGuardrailWarning[];
  categoryName: string;
  categoryAvailableCents: number;
  categorySpentBeforeCents: number;
  categorySpentAfterCents: number;
  categoryRemainingAfterCents: number;
  projectedBalanceAfterPurchaseCents: number | null;
  lowestProjectedBalanceCents: number | null;
  riskDate: string | null;
  requiresConfirmation: boolean;
};

type PreviewArgs = {
  check: ShoppingGuardrailInput;
  month: BudgetMonth;
  categories: SpendingCategory[];
  transactions: SpendingTransaction[];
  income: IncomeEntry[];
  bills: BillInstance[];
  plannedExpenses: PlannedExpense[];
  savingsActivities: SavingsActivity[];
  debtAccounts: DebtAccount[];
  lowBalanceThresholdCents?: number | null;
  today?: string;
};

export function shoppingCheckIsExpired(status: ShoppingCheckStatus, date: string, today = new Date().toISOString().slice(0, 10)) {
  return (status === "DRAFT" || status === "PENDING_APPROVAL") && date < today;
}

export function getEffectiveShoppingCheckStatus(status: ShoppingCheckStatus, date: string, today?: string): ShoppingCheckStatus {
  return shoppingCheckIsExpired(status, date, today) ? "EXPIRED" : status;
}

export function calculateShoppingGuardrailPreview(args: PreviewArgs): ShoppingGuardrailPreview {
  const category = args.categories.find((item) => item.id === args.check.categoryId);
  const carryover = getCategoryCarryover(args.categories, args.transactions, args.check.monthId).find((item) => item.category.id === args.check.categoryId);
  const categoryAvailableCents = carryover?.availableBudgetCents ?? category?.baseMonthlyBudgetCents ?? 0;
  const categorySpentBeforeCents = carryover?.actualSpentCents ?? 0;
  const categorySpentAfterCents = categorySpentBeforeCents + args.check.amountCents;
  const categoryRemainingAfterCents = categoryAvailableCents - categorySpentAfterCents;
  const warnings: ShoppingGuardrailWarning[] = [];

  if (categoryAvailableCents > 0 && categorySpentAfterCents / categoryAvailableCents >= 0.8) warnings.push("Near category limit");
  if (categoryRemainingAfterCents < 0) warnings.push("Over category");

  let projectedBalanceAfterPurchaseCents: number | null = null;
  let lowestProjectedBalanceCents: number | null = null;
  let riskDate: string | null = null;

  if (args.check.cashFlowTreatment === "CASH_DEBIT") {
    const previewTransaction: SpendingTransaction = { id: args.check.id ?? "shopping-guardrail-preview", monthId: args.check.monthId, date: args.check.date, merchant: args.check.merchant || "Shopping check", totalAmountCents: args.check.amountCents, cashFlowTreatment: "CASH_DEBIT", plannedStatus: "UNPLANNED", isReimbursable: false, splits: [{ categoryId: args.check.categoryId, amountCents: args.check.amountCents }] };
    const rows = buildCashFlowRows({ month: args.month, income: args.income, bills: args.bills, transactions: [...args.transactions, previewTransaction], plannedExpenses: args.plannedExpenses, savingsActivities: args.savingsActivities, debtAccounts: args.debtAccounts, lowBalanceThresholdCents: args.lowBalanceThresholdCents });
    const previewRows = rows.filter((row) => row.sourceId === previewTransaction.id || row.date >= args.check.date);
    projectedBalanceAfterPurchaseCents = rows.find((row) => row.sourceId === previewTransaction.id)?.balanceCents ?? null;
    const lowestRow = previewRows.reduce<typeof rows[number] | null>((lowest, row) => lowest == null || row.balanceCents < lowest.balanceCents ? row : lowest, null);
    lowestProjectedBalanceCents = lowestRow?.balanceCents ?? null;
    const negativeRow = previewRows.find((row) => row.isNegative);
    const lowBalanceRow = previewRows.find((row) => row.isLowBalance);
    if (negativeRow) {
      warnings.push("Negative cash-flow risk");
      riskDate = negativeRow.date;
    } else if (lowBalanceRow) {
      warnings.push("Low-balance risk");
      riskDate = lowBalanceRow.date;
    }
  }

  const status = args.check.status ? getEffectiveShoppingCheckStatus(args.check.status, args.check.date, args.today) : undefined;
  if (status === "PENDING_APPROVAL") warnings.push("Approval pending");
  if (status === "WAIT_REQUESTED") warnings.push("Wait requested");
  if (status === "EXPIRED") warnings.push("Expired");
  if (warnings.length === 0) warnings.push("Looks okay");

  return { categoryName: category?.name ?? "Unknown category", categoryAvailableCents, categorySpentBeforeCents, categorySpentAfterCents, categoryRemainingAfterCents, projectedBalanceAfterPurchaseCents, lowestProjectedBalanceCents, riskDate, warnings, requiresConfirmation: warnings.some((warning) => warning !== "Looks okay") };
}
