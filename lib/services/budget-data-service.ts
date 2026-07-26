import { prisma } from "@/lib/db/prisma";
import { buildCashFlowRows } from "@/lib/calculations/cash-flow";
import { getZeroBasedSummary } from "@/lib/calculations/zero-based-budget";
import type { AuditEvent, BillInstance, BudgetMonth, DebtAccount, FutureExpense, IncomeEntry, Note, PlannedExpense, SavingsActivity, SavingsFund, SpendingCategory, SpendingTransaction } from "@/lib/types";

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function monthLabel(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function mapMonth(row: { id: string; year: number; month: number; startDate: Date; endDate: Date; startingCheckingBalanceCents: number; status: string }): BudgetMonth {
  return { id: `${row.year}-${String(row.month).padStart(2, "0")}`, label: monthLabel(row.year, row.month), year: row.year, month: row.month, startDate: dateOnly(row.startDate), endDate: dateOnly(row.endDate), startingBalanceCents: row.startingCheckingBalanceCents, isClosed: row.status === "CLOSED" };
}

function mapFundType(value: string): SavingsFund["type"] {
  return value === "EMERGENCY" ? "Emergency" : "Sinking Fund";
}

function mapFundMode(value: string): SavingsFund["mode"] {
  return value === "KNOWN_DUE_DATE" ? "Known Due Date" : "Open Ended";
}

export async function getBudgetData() {
  const household = await prisma.household.findFirst({ orderBy: { createdAt: "asc" } });
  if (!household) throw new Error("No household has been seeded yet. Run npm run prisma:seed.");
  const [monthRows, incomeRows, billRows, categoryRows, transactionRows, plannedRows, futureExpenseRows, savingsFundRows, savingsActivityRows, debtRows, noteRows, auditRows] = await Promise.all([
    prisma.budgetMonth.findMany({ where: { householdId: household.id }, orderBy: [{ year: "asc" }, { month: "asc" }] }),
    prisma.incomeEntry.findMany({ where: { householdId: household.id }, include: { incomeSource: true }, orderBy: { date: "asc" } }),
    prisma.billInstance.findMany({ where: { householdId: household.id }, orderBy: { dueDate: "asc" } }),
    prisma.spendingCategory.findMany({ where: { householdId: household.id }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.transaction.findMany({ where: { householdId: household.id }, include: { splits: true, receipt: true }, orderBy: { date: "desc" } }),
    prisma.plannedExpense.findMany({ where: { householdId: household.id }, orderBy: { date: "asc" } }),
    prisma.futureExpense.findMany({ where: { householdId: household.id }, include: { contributions: true }, orderBy: { dueDate: "asc" } }),
    prisma.savingsFund.findMany({ where: { householdId: household.id }, orderBy: { name: "asc" } }),
    prisma.savingsActivity.findMany({ where: { householdId: household.id }, orderBy: { date: "asc" } }),
    prisma.debtAccount.findMany({ where: { householdId: household.id, isActive: true }, orderBy: { name: "asc" } }),
    prisma.note.findMany({ where: { householdId: household.id, deletedAt: null }, include: { createdBy: true }, orderBy: { createdAt: "desc" } }),
    prisma.auditEvent.findMany({ where: { householdId: household.id }, include: { actorMember: true }, orderBy: { createdAt: "desc" }, take: 200 })
  ]);
  const monthRowsByDbId = new Map(monthRows.map((month) => [month.id, mapMonth(month)]));
  const months = monthRows.map(mapMonth);
  const categories: SpendingCategory[] = categoryRows.map((category) => ({ id: category.id, name: category.name, baseMonthlyBudgetCents: category.baseMonthlyBudgetCents, isActive: category.isActive }));
  const income: IncomeEntry[] = incomeRows.map((entry) => ({ id: entry.id, monthId: monthRowsByDbId.get(entry.budgetMonthId)?.id ?? "", date: dateOnly(entry.date), source: entry.incomeSource.name, expectedAmountCents: entry.expectedAmountCents, actualAmountCents: entry.actualAmountCents }));
  const bills: BillInstance[] = billRows.map((bill) => ({ id: bill.id, monthId: monthRowsByDbId.get(bill.budgetMonthId)?.id ?? "", name: bill.name, category: bill.category, expectedAmountCents: bill.expectedAmountCents, actualAmountCents: bill.actualAmountCents, dueDate: dateOnly(bill.dueDate), paidDate: bill.paidDate ? dateOnly(bill.paidDate) : null, isPaid: bill.isPaid, isAutopay: bill.isAutopay, isSkipped: bill.isSkipped }));
  const transactions: SpendingTransaction[] = transactionRows.map((tx) => ({ id: tx.id, monthId: monthRowsByDbId.get(tx.budgetMonthId)?.id ?? "", date: dateOnly(tx.date), merchant: tx.merchant, totalAmountCents: tx.totalAmountCents, cashFlowTreatment: tx.cashFlowTreatment, plannedStatus: tx.plannedStatus, isReimbursable: tx.isReimbursable, notes: tx.notes ?? undefined, receiptFileName: tx.receipt?.originalFileName, splits: tx.splits.map((split) => ({ categoryId: split.categoryId, amountCents: split.amountCents })) }));
  const plannedExpenses: PlannedExpense[] = plannedRows.map((expense) => ({ id: expense.id, monthId: monthRowsByDbId.get(expense.budgetMonthId)?.id ?? "", date: dateOnly(expense.date), description: expense.description, categoryId: expense.categoryId, expectedAmountCents: expense.expectedAmountCents, actualAmountCents: expense.actualAmountCents, isPaid: expense.isPaid, sourceFutureExpenseId: expense.sourceFutureExpenseId }));
  const futureExpenses: FutureExpense[] = futureExpenseRows.map((expense) => ({ id: expense.id, monthId: expense.budgetMonthId ? monthRowsByDbId.get(expense.budgetMonthId)?.id ?? null : null, description: expense.description, expectedAmountCents: expense.expectedAmountCents, dueDate: dateOnly(expense.dueDate), categoryId: expense.categoryId, priority: expense.priority, notes: expense.notes, type: expense.type, status: expense.status, setAsideMode: expense.setAsideMode, includeInPlanPreview: expense.includeInPlanPreview, convertedPlannedExpenseId: expense.convertedPlannedExpenseId, convertedSavingsFundId: expense.convertedSavingsFundId, contributions: expense.contributions.map((item) => ({ id: item.id, futureExpenseId: item.futureExpenseId, monthId: monthRowsByDbId.get(item.budgetMonthId)?.id ?? "", date: item.date ? dateOnly(item.date) : null, plannedAmountCents: item.plannedAmountCents })) }));
  const savingsFunds: SavingsFund[] = savingsFundRows.map((fund) => ({ id: fund.id, name: fund.name, type: mapFundType(fund.type), mode: mapFundMode(fund.mode), startingBalanceCents: fund.startingBalanceCents, currentBalanceCents: fund.currentBalanceCents, targetAmountCents: fund.targetAmountCents, dueDate: fund.dueDate ? dateOnly(fund.dueDate) : null, plannedContributionCents: fund.plannedContributionCents, isActive: fund.isActive, linkedFutureExpenseId: fund.linkedFutureExpenseId }));
  const savingsActivities: SavingsActivity[] = savingsActivityRows.map((activity) => ({ id: activity.id, fundId: activity.fundId, monthId: monthRowsByDbId.get(activity.budgetMonthId)?.id ?? "", date: dateOnly(activity.date), type: activity.type, plannedAmountCents: activity.plannedAmountCents, actualAmountCents: activity.actualAmountCents, description: activity.description ?? undefined }));
  const debtAccounts: DebtAccount[] = debtRows.map((debt) => ({ id: debt.id, name: debt.name, startingBalanceCents: debt.startingBalanceCents, currentBalanceCents: debt.currentBalanceCents, interestRatePercent: Number(debt.interestRatePercent), minimumPaymentCents: debt.minimumPaymentCents, dueDay: debt.dueDay, extraPaymentCents: debt.extraPaymentCents }));
  const notes: Note[] = noteRows.map((note) => ({ id: note.id, actor: note.createdBy.label, body: note.body, createdAt: note.createdAt.toISOString() }));
  const auditEvents: AuditEvent[] = auditRows.map((event) => ({ id: event.id, actor: event.actorMember.label, entityType: event.entityType, action: event.action, fieldName: event.fieldName ?? undefined, oldValue: event.oldValueJson == null ? "" : JSON.stringify(event.oldValueJson), newValue: event.newValueJson == null ? "" : JSON.stringify(event.newValueJson), createdAt: event.createdAt.toISOString() }));
  return { household, months, income, bills, categories, transactions, plannedExpenses, futureExpenses, savingsFunds, savingsActivities, debtAccounts, notes, auditEvents };
}

export async function getMonthBundle(monthId: string) {
  const data = await getBudgetData();
  const month = data.months.find((item) => item.id === monthId) ?? data.months[0];
  const monthIncome = data.income.filter((item) => item.monthId === month.id);
  const monthBills = data.bills.filter((item) => item.monthId === month.id);
  const monthTransactions = data.transactions.filter((item) => item.monthId === month.id);
  const monthPlanned = data.plannedExpenses.filter((item) => item.monthId === month.id);
  const monthFutureExpenses = data.futureExpenses.filter((item) => item.monthId === month.id);
  const monthSavings = data.savingsActivities.filter((item) => item.monthId === month.id);
  const cashFlowRows = buildCashFlowRows({ month, income: monthIncome, bills: monthBills, transactions: monthTransactions, plannedExpenses: monthPlanned, savingsActivities: monthSavings, debtAccounts: data.debtAccounts, lowBalanceThresholdCents: data.household.lowBalanceThresholdCents });
  const previewCashFlowRows = buildCashFlowRows({ month, income: monthIncome, bills: monthBills, transactions: monthTransactions, plannedExpenses: monthPlanned, futureExpenses: monthFutureExpenses, includeFutureExpensePreview: true, savingsActivities: monthSavings, debtAccounts: data.debtAccounts, lowBalanceThresholdCents: data.household.lowBalanceThresholdCents });
  const summary = getZeroBasedSummary({ month, income: monthIncome, bills: monthBills, categories: data.categories, plannedExpenses: monthPlanned, savingsActivities: monthSavings, debtAccounts: data.debtAccounts, hasCashFlowRisk: cashFlowRows.some((row) => row.isNegative) });
  return { ...data, month, income: monthIncome, bills: monthBills, transactions: monthTransactions, plannedExpenses: monthPlanned, futureExpenses: monthFutureExpenses, savingsActivities: monthSavings, cashFlowRows, previewCashFlowRows, summary };
}
