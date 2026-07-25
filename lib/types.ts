export type Actor = "CS" | "TCH";
export type MonthStatus = "Balanced" | "Needs Assignment" | "Underfunded" | "Cash-Flow Risk" | "Closed" | "Needs Review";
export type CashFlowType = "Income" | "Bill" | "Spending" | "Savings" | "Debt" | "Transfer" | "Planned";
export type CashFlowSourceType = "IncomeEntry" | "BillInstance" | "Transaction" | "PlannedExpense" | "SavingsActivity" | "DebtAccount";

export type BudgetMonth = {
  id: string;
  label: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  startingBalanceCents: number;
  isClosed?: boolean;
};

export type IncomeEntry = {
  id: string;
  monthId: string;
  date: string;
  source: Actor | string;
  expectedAmountCents: number;
  actualAmountCents?: number | null;
};

export type BillInstance = {
  id: string;
  monthId: string;
  name: string;
  category: string;
  expectedAmountCents: number;
  actualAmountCents?: number | null;
  dueDate: string;
  paidDate?: string | null;
  isPaid: boolean;
  isAutopay: boolean;
  isSkipped?: boolean;
};

export type SpendingCategory = {
  id: string;
  name: string;
  baseMonthlyBudgetCents: number;
  isActive: boolean;
};

export type TransactionSplit = {
  categoryId: string;
  amountCents: number;
};

export type SpendingTransaction = {
  id: string;
  monthId: string;
  date: string;
  merchant: string;
  totalAmountCents: number;
  cashFlowTreatment: "CASH_DEBIT" | "CREDIT_CARD";
  plannedStatus: "PLANNED" | "UNPLANNED";
  isReimbursable: boolean;
  receiptFileName?: string;
  notes?: string;
  splits: TransactionSplit[];
};

export type PlannedExpense = {
  id: string;
  monthId: string;
  date: string;
  description: string;
  categoryId: string;
  expectedAmountCents: number;
  actualAmountCents?: number | null;
  isPaid: boolean;
};

export type SavingsFund = {
  id: string;
  name: string;
  type: "Emergency" | "Sinking Fund";
  mode: "Known Due Date" | "Open Ended";
  startingBalanceCents: number;
  currentBalanceCents: number;
  targetAmountCents?: number | null;
  dueDate?: string | null;
  plannedContributionCents: number;
  isActive: boolean;
};

export type SavingsActivity = {
  id: string;
  fundId: string;
  monthId: string;
  date: string;
  type: "CONTRIBUTION" | "WITHDRAWAL";
  plannedAmountCents?: number | null;
  actualAmountCents?: number | null;
  description?: string;
};

export type DebtAccount = {
  id: string;
  name: string;
  startingBalanceCents: number;
  currentBalanceCents: number;
  interestRatePercent: number;
  minimumPaymentCents: number;
  dueDay: number;
  extraPaymentCents: number;
};

export type Note = {
  id: string;
  actor: Actor;
  body: string;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  actor: Actor;
  entityType: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
};

export type CashFlowRow = {
  date: string;
  label: string;
  type: CashFlowType;
  amountCents: number;
  balanceCents: number;
  isNegative: boolean;
  isLowBalance?: boolean;
  sourceType?: CashFlowSourceType;
  sourceId?: string;
  canEdit?: boolean;
  canDelete?: boolean;
};
