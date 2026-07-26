import { PrismaClient, type ActorLabel } from "@prisma/client";
import { generateBudgetMonths, generatePaychecks } from "../lib/calculations/recurrence";

const prisma = new PrismaClient();
const householdId = "seed-household";

const billTemplates = [
  { name: "Mortgage", category: "Housing", amount: 434000, dueDay: 1, autopay: true },
  { name: "Cell phone", category: "Utilities", amount: 16000, dueDay: 12, autopay: false },
  { name: "Internet", category: "Utilities", amount: 7087, dueDay: 18, autopay: true },
  { name: "Student loans", category: "Education", amount: 159500, dueDay: 22, autopay: false }
];

const spendingCategories = [
  ["Groceries", 100000], ["Restaurants", 15000], ["Fuel", 25000], ["Household Supplies", 20000],
  ["Clothing", 10000], ["Kids", 15000], ["Entertainment", 8000], ["Medical", 10000], ["Gifts", 7500],
  ["Personal Care", 6000], ["School", 7500], ["Transportation", 10000], ["Taxes", 2000]
] as const;

function date(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function monthIdForDate(value: string) {
  return value.slice(0, 7);
}

function monthlyDate(month: number, day: number) {
  return date(`2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
}

async function main() {
  await prisma.auditEvent.deleteMany({ where: { householdId } });
  await prisma.transactionSplit.deleteMany({ where: { transaction: { householdId } } });
  await prisma.transaction.deleteMany({ where: { householdId } });
  await prisma.receipt.deleteMany({ where: { householdId } });
  await prisma.savingsActivity.deleteMany({ where: { householdId } });
  await prisma.futureExpenseContribution.deleteMany({ where: { householdId } });
  await prisma.debtPayment.deleteMany({ where: { householdId } });
  await prisma.debtSnapshot.deleteMany({ where: { householdId } });
  await prisma.plannedExpense.deleteMany({ where: { householdId } });
  await prisma.futureExpense.deleteMany({ where: { householdId } });
  await prisma.billInstance.deleteMany({ where: { householdId } });
  await prisma.incomeEntry.deleteMany({ where: { householdId } });
  await prisma.note.deleteMany({ where: { householdId } });
  await prisma.reminder.deleteMany({ where: { householdId } });
  await prisma.transfer.deleteMany({ where: { householdId } });
  await prisma.billTemplate.deleteMany({ where: { householdId } });
  await prisma.incomeSource.deleteMany({ where: { householdId } });
  await prisma.recurrenceRule.deleteMany({ where: { householdId } });
  await prisma.spendingCategory.deleteMany({ where: { householdId } });
  await prisma.savingsFund.deleteMany({ where: { householdId } });
  await prisma.debtAccount.deleteMany({ where: { householdId } });
  await prisma.account.deleteMany({ where: { householdId } });
  await prisma.budgetMonth.deleteMany({ where: { householdId } });
  await prisma.householdMember.deleteMany({ where: { householdId } });

  const household = await prisma.household.upsert({ where: { id: householdId }, update: { name: "Family Budget Household" }, create: { id: householdId, name: "Family Budget Household" } });
  const members = new Map<ActorLabel, string>();
  for (const label of ["CS", "TCH"] as const) {
    const member = await prisma.householdMember.create({ data: { householdId: household.id, label, displayName: label } });
    members.set(label, member.id);
  }
  const actorId = members.get("CS")!;

  const months = generateBudgetMonths();
  const monthIds = new Map<string, string>();
  for (const month of months) {
    const row = await prisma.budgetMonth.create({ data: { householdId, year: month.year, month: month.month, startDate: date(month.startDate), endDate: date(month.endDate), startingCheckingBalanceCents: month.startingBalanceCents } });
    monthIds.set(month.id, row.id);
  }

  await prisma.account.create({ data: { householdId, name: "Main checking", type: "CHECKING", startingBalanceCents: 541469, currentBalanceCents: 541469 } });
  await prisma.account.create({ data: { householdId, name: "Goal savings", type: "SAVINGS", startingBalanceCents: 130000, currentBalanceCents: 165000 } });

  const csRule = await prisma.recurrenceRule.create({ data: { householdId, frequency: "EVERY_14_DAYS", interval: 14, startDate: date("2026-07-03") } });
  const tchRule = await prisma.recurrenceRule.create({ data: { householdId, frequency: "EVERY_14_DAYS", interval: 14, startDate: date("2026-07-09") } });
  const csSource = await prisma.incomeSource.create({ data: { householdId, name: "CS", defaultExpectedAmountCents: 245678, recurrenceRuleId: csRule.id } });
  const tchSource = await prisma.incomeSource.create({ data: { householdId, name: "TCH", defaultExpectedAmountCents: 221050, recurrenceRuleId: tchRule.id } });
  for (const entry of [...generatePaychecks("CS", "2026-07-03", 245678), ...generatePaychecks("TCH", "2026-07-09", 221050)]) {
    await prisma.incomeEntry.create({ data: { householdId, budgetMonthId: monthIds.get(entry.monthId)!, incomeSourceId: entry.source === "CS" ? csSource.id : tchSource.id, date: date(entry.date), expectedAmountCents: entry.expectedAmountCents, actualAmountCents: entry.actualAmountCents ?? null, isRecurringGenerated: true, recurrenceGroupId: entry.source, createdByMemberId: members.get(entry.source as ActorLabel)! } });
  }

  const monthlyRule = await prisma.recurrenceRule.create({ data: { householdId, frequency: "MONTHLY", interval: 1, startDate: date("2026-07-01") } });
  for (const template of billTemplates) {
    const billTemplate = await prisma.billTemplate.create({ data: { householdId, name: template.name, category: template.category, expectedAmountCents: template.amount, dueDay: template.dueDay, recurrenceRuleId: monthlyRule.id, isAutopay: template.autopay } });
    for (const month of months) {
      await prisma.billInstance.create({ data: { householdId, budgetMonthId: monthIds.get(month.id)!, templateId: billTemplate.id, name: template.name, category: template.category, expectedAmountCents: template.amount, actualAmountCents: month.month === 7 && template.name === "Internet" ? 7288 : null, dueDate: monthlyDate(month.month, template.dueDay), paidDate: month.month === 7 && template.dueDay < 15 ? monthlyDate(month.month, template.dueDay) : null, isPaid: month.month === 7 && template.dueDay < 15, isAutopay: template.autopay, createdByMemberId: actorId } });
    }
  }

  const categoryIds = new Map<string, string>();
  let sortOrder = 0;
  for (const [name, budget] of spendingCategories) {
    const category = await prisma.spendingCategory.create({ data: { householdId, name, baseMonthlyBudgetCents: budget, sortOrder: sortOrder++ } });
    categoryIds.set(name, category.id);
  }

  const sampleTransactions = [
    { date: "2026-07-05", merchant: "Neighborhood Market", amount: 18432, treatment: "CASH_DEBIT" as const, planned: "UNPLANNED" as const, splits: [["Groceries", 18432] as const] },
    { date: "2026-07-06", merchant: "Fuel Stop", amount: 7020, treatment: "CASH_DEBIT" as const, planned: "PLANNED" as const, splits: [["Fuel", 7020] as const] },
    { date: "2026-07-08", merchant: "Target", amount: 17500, treatment: "CASH_DEBIT" as const, planned: "UNPLANNED" as const, splits: [["Groceries", 8000] as const, ["Household Supplies", 6500] as const, ["Kids", 3000] as const] },
    { date: "2026-08-03", merchant: "School Supply Store", amount: 14201, treatment: "CREDIT_CARD" as const, planned: "PLANNED" as const, splits: [["School", 14201] as const] }
  ];
  for (const tx of sampleTransactions) {
    const created = await prisma.transaction.create({ data: { householdId, budgetMonthId: monthIds.get(monthIdForDate(tx.date))!, date: date(tx.date), merchant: tx.merchant, totalAmountCents: tx.amount, cashFlowTreatment: tx.treatment, plannedStatus: tx.planned, isReimbursable: false, createdByMemberId: actorId } });
    for (const [category, amount] of tx.splits) {
      await prisma.transactionSplit.create({ data: { transactionId: created.id, categoryId: categoryIds.get(category)!, amountCents: amount } });
    }
  }

  await prisma.plannedExpense.create({ data: { householdId, budgetMonthId: monthIds.get("2026-08")!, date: date("2026-08-10"), description: "Back to school clothes", categoryId: categoryIds.get("Clothing")!, expectedAmountCents: 30000, createdByMemberId: actorId } });
  await prisma.plannedExpense.create({ data: { householdId, budgetMonthId: monthIds.get("2026-12")!, date: date("2026-12-15"), description: "Christmas gifts", categoryId: categoryIds.get("Gifts")!, expectedAmountCents: 50000, createdByMemberId: actorId } });

  await prisma.futureExpense.create({ data: { householdId, budgetMonthId: monthIds.get("2026-08")!, description: "School supplies", expectedAmountCents: 45000, dueDate: date("2026-08-05"), categoryId: categoryIds.get("School")!, priority: "HIGH", notes: "Review backpack, notebooks, shoes, and teacher list before shopping.", type: "ONE_TIME", setAsideMode: "EQUAL_MONTHLY", includeInPlanPreview: true, createdByMemberId: actorId } });
  const holidayTravel = await prisma.futureExpense.create({ data: { householdId, budgetMonthId: monthIds.get("2026-11")!, description: "Holiday travel", expectedAmountCents: 80000, dueDate: date("2026-11-20"), categoryId: categoryIds.get("Travel") ?? categoryIds.get("Transportation")!, priority: "MEDIUM", notes: "Estimate gas, one hotel night, and meals on the road.", type: "ONE_TIME", setAsideMode: "CUSTOM", includeInPlanPreview: true, createdByMemberId: members.get("TCH")! } });
  await prisma.futureExpenseContribution.create({ data: { householdId, futureExpenseId: holidayTravel.id, budgetMonthId: monthIds.get("2026-08")!, date: date("2026-08-15"), plannedAmountCents: 20000, createdByMemberId: actorId } });
  await prisma.futureExpenseContribution.create({ data: { householdId, futureExpenseId: holidayTravel.id, budgetMonthId: monthIds.get("2026-09")!, date: date("2026-09-15"), plannedAmountCents: 25000, createdByMemberId: actorId } });

  const carInsurance = await prisma.savingsFund.create({ data: { householdId, name: "Car Insurance", type: "SINKING", mode: "KNOWN_DUE_DATE", startingBalanceCents: 0, currentBalanceCents: 24500, targetAmountCents: 140000, dueDate: date("2027-01-30"), plannedContributionCents: 24500 } });
  const emergency = await prisma.savingsFund.create({ data: { householdId, name: "Emergency Fund", type: "EMERGENCY", mode: "OPEN_ENDED", startingBalanceCents: 120000, currentBalanceCents: 140000, targetAmountCents: 1000000, plannedContributionCents: 20000 } });
  for (const month of months) {
    for (const fund of [carInsurance, emergency]) {
      await prisma.savingsActivity.create({ data: { householdId, fundId: fund.id, budgetMonthId: monthIds.get(month.id)!, date: monthlyDate(month.month, 15), type: "CONTRIBUTION", plannedAmountCents: fund.plannedContributionCents, description: `${fund.name} monthly set-aside`, createdByMemberId: actorId } });
    }
  }

  const card1 = await prisma.debtAccount.create({ data: { householdId, name: "Family Rewards Card", startingBalanceCents: 620000, currentBalanceCents: 620000, interestRatePercent: 23.99, minimumPaymentCents: 18500, dueDay: 20, extraPaymentCents: 5000 } });
  const card2 = await prisma.debtAccount.create({ data: { householdId, name: "Home Project Card", startingBalanceCents: 320000, currentBalanceCents: 320000, interestRatePercent: 19.99, minimumPaymentCents: 9500, dueDay: 27 } });
  for (const month of months.slice(0, 3)) {
    await prisma.debtSnapshot.create({ data: { householdId, debtAccountId: card1.id, budgetMonthId: monthIds.get(month.id)!, statementBalanceCents: Math.max(0, card1.currentBalanceCents - (month.month - 7) * 24000), interestRatePercent: card1.interestRatePercent, minimumPaymentCents: card1.minimumPaymentCents, estimatedInterestCents: Math.round((card1.currentBalanceCents * Number(card1.interestRatePercent)) / 100 / 12), createdByMemberId: actorId } });
  }
  await prisma.debtPayment.create({ data: { householdId, debtAccountId: card1.id, budgetMonthId: monthIds.get("2026-07")!, dueDate: date("2026-07-20"), minimumPaymentCents: 18500, extraPaymentCents: 5000, actualPaymentCents: 23500, createdByMemberId: actorId } });
  await prisma.debtPayment.create({ data: { householdId, debtAccountId: card2.id, budgetMonthId: monthIds.get("2026-07")!, dueDate: date("2026-07-27"), minimumPaymentCents: 9500, extraPaymentCents: 0, createdByMemberId: actorId } });

  await prisma.note.create({ data: { householdId, body: "Please do not pay electric yet; autopay is scheduled.", createdByMemberId: actorId } });
  await prisma.note.create({ data: { householdId, body: "Added school supply estimate for August.", createdByMemberId: members.get("TCH")! } });
  await prisma.auditEvent.create({ data: { householdId, actorMemberId: actorId, entityType: "Seed", entityId: householdId, action: "created", fieldName: "mvp2Data", newValueJson: { message: "Seeded MVP2 starter household data" } } });
}

main().finally(async () => prisma.$disconnect());
