import { dateOnly } from "@/lib/dates";
import { generateBudgetMonths, generatePaychecks } from "@/lib/calculations/recurrence";
import type { AuditEvent, BillInstance, DebtAccount, Note, PlannedExpense, SavingsActivity, SavingsFund, SpendingCategory, SpendingTransaction } from "@/lib/types";

export const months = generateBudgetMonths();
export const categories: SpendingCategory[] = [
  { id: "groceries", name: "Groceries", baseMonthlyBudgetCents: 100000, isActive: true },
  { id: "restaurants", name: "Restaurants", baseMonthlyBudgetCents: 15000, isActive: true },
  { id: "fuel", name: "Fuel", baseMonthlyBudgetCents: 25000, isActive: true },
  { id: "household", name: "Household Supplies", baseMonthlyBudgetCents: 20000, isActive: true },
  { id: "clothing", name: "Clothing", baseMonthlyBudgetCents: 10000, isActive: true },
  { id: "kids", name: "Kids", baseMonthlyBudgetCents: 15000, isActive: true },
  { id: "entertainment", name: "Entertainment", baseMonthlyBudgetCents: 8000, isActive: true },
  { id: "medical", name: "Medical", baseMonthlyBudgetCents: 10000, isActive: true },
  { id: "gifts", name: "Gifts", baseMonthlyBudgetCents: 7500, isActive: true },
  { id: "personal", name: "Personal Care", baseMonthlyBudgetCents: 6000, isActive: true },
  { id: "school", name: "School", baseMonthlyBudgetCents: 7500, isActive: true },
  { id: "transportation", name: "Transportation", baseMonthlyBudgetCents: 10000, isActive: true },
  { id: "taxes", name: "Taxes", baseMonthlyBudgetCents: 2000, isActive: true }
];

export const income = [
  ...generatePaychecks("CS", "2026-07-03", 245678),
  ...generatePaychecks("TCH", "2026-07-09", 221050)
];

const billTemplates = [
  ["Mortgage", "Housing", 434000, 1, true],
  ["Cell phone", "Utilities", 16000, 12, false],
  ["Internet", "Utilities", 7087, 18, true],
  ["Student loans", "Education", 159500, 22, false]
] as const;

export const bills: BillInstance[] = months.flatMap((month) =>
  billTemplates.map(([name, category, amount, dueDay, autopay]) => ({
    id: `${month.id}-${name.toLowerCase().replaceAll(" ", "-")}`,
    monthId: month.id,
    name,
    category,
    expectedAmountCents: amount,
    actualAmountCents: month.month === 7 && name === "Internet" ? 7288 : null,
    dueDate: dateOnly(2026, month.month, dueDay),
    paidDate: month.month === 7 && dueDay < 15 ? dateOnly(2026, month.month, dueDay) : null,
    isPaid: month.month === 7 && dueDay < 15,
    isAutopay: autopay,
    isSkipped: false
  }))
);

export const transactions: SpendingTransaction[] = [
  { id: "tx-1", monthId: "2026-07", date: "2026-07-05", merchant: "Neighborhood Market", totalAmountCents: 18432, cashFlowTreatment: "CASH_DEBIT", plannedStatus: "UNPLANNED", isReimbursable: false, splits: [{ categoryId: "groceries", amountCents: 18432 }] },
  { id: "tx-2", monthId: "2026-07", date: "2026-07-06", merchant: "Fuel Stop", totalAmountCents: 7020, cashFlowTreatment: "CASH_DEBIT", plannedStatus: "PLANNED", isReimbursable: false, splits: [{ categoryId: "fuel", amountCents: 7020 }] },
  { id: "tx-3", monthId: "2026-07", date: "2026-07-08", merchant: "Target", totalAmountCents: 17500, cashFlowTreatment: "CASH_DEBIT", plannedStatus: "UNPLANNED", isReimbursable: false, receiptFileName: "target-receipt.jpg", splits: [{ categoryId: "groceries", amountCents: 8000 }, { categoryId: "household", amountCents: 6500 }, { categoryId: "kids", amountCents: 3000 }] },
  { id: "tx-4", monthId: "2026-08", date: "2026-08-03", merchant: "School Supply Store", totalAmountCents: 14201, cashFlowTreatment: "CREDIT_CARD", plannedStatus: "PLANNED", isReimbursable: false, splits: [{ categoryId: "school", amountCents: 14201 }] }
];

export const plannedExpenses: PlannedExpense[] = [
  { id: "plan-1", monthId: "2026-08", date: "2026-08-10", description: "Back to school clothes", categoryId: "clothing", expectedAmountCents: 30000, actualAmountCents: null, isPaid: false },
  { id: "plan-2", monthId: "2026-12", date: "2026-12-15", description: "Christmas gifts", categoryId: "gifts", expectedAmountCents: 50000, actualAmountCents: null, isPaid: false }
];

export const savingsFunds: SavingsFund[] = [
  { id: "car-insurance", name: "Car Insurance", type: "Sinking Fund", mode: "Known Due Date", startingBalanceCents: 0, currentBalanceCents: 24500, targetAmountCents: 140000, dueDate: "2027-01-30", plannedContributionCents: 24500 },
  { id: "emergency", name: "Emergency Fund", type: "Emergency", mode: "Open Ended", startingBalanceCents: 120000, currentBalanceCents: 140000, targetAmountCents: 1000000, plannedContributionCents: 20000 },
  { id: "christmas", name: "Christmas", type: "Sinking Fund", mode: "Known Due Date", startingBalanceCents: 10000, currentBalanceCents: 25000, targetAmountCents: 80000, dueDate: "2026-12-20", plannedContributionCents: 15000 }
];

export const savingsActivities: SavingsActivity[] = months.flatMap((month) =>
  savingsFunds.map((fund) => ({ id: `${month.id}-${fund.id}`, fundId: fund.id, monthId: month.id, date: dateOnly(2026, month.month, 15), type: "CONTRIBUTION", plannedAmountCents: fund.plannedContributionCents, actualAmountCents: null, description: `${fund.name} monthly set-aside` }))
);

export const debtAccounts: DebtAccount[] = [
  { id: "card-1", name: "Family Rewards Card", currentBalanceCents: 620000, interestRatePercent: 23.99, minimumPaymentCents: 18500, dueDay: 20, extraPaymentCents: 5000 },
  { id: "card-2", name: "Home Project Card", currentBalanceCents: 320000, interestRatePercent: 19.99, minimumPaymentCents: 9500, dueDay: 27, extraPaymentCents: 0 }
];

export const notes: Note[] = [
  { id: "note-1", actor: "CS", body: "Please do not pay electric yet; autopay is scheduled.", createdAt: "2026-07-12T20:35:00.000Z" },
  { id: "note-2", actor: "TCH", body: "Added school supply estimate for August.", createdAt: "2026-07-13T09:10:00.000Z" }
];

export const auditEvents: AuditEvent[] = [
  { id: "audit-1", actor: "CS", entityType: "Transaction", action: "created", fieldName: "amount", oldValue: "", newValue: "$184.32", createdAt: "2026-07-05T18:20:00.000Z" },
  { id: "audit-2", actor: "TCH", entityType: "PlannedExpense", action: "created", fieldName: "description", oldValue: "", newValue: "Back to school clothes", createdAt: "2026-07-13T09:11:00.000Z" },
  { id: "audit-3", actor: "CS", entityType: "Bill", action: "updated", fieldName: "actualAmount", oldValue: "$70.87", newValue: "$72.88", createdAt: "2026-07-18T10:02:00.000Z" }
];
