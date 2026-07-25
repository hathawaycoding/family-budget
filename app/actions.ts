"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentMember } from "@/lib/auth/session";
import { createTransactionSchema } from "@/lib/validation/spending";
import { billIdSchema, updateBillInstanceSchema, updateBillSchema } from "@/lib/validation/bills";
import { incomeEntryIdSchema, updateIncomeActualSchema } from "@/lib/validation/income";
import { createSavingsFundSchema, savingsActivitySchema, savingsFundIdSchema, updateSavingsFundSchema } from "@/lib/validation/savings";
import { createDebtAccountSchema, debtAccountIdSchema, debtPaymentSchema, updateDebtAccountSchema } from "@/lib/validation/debt";
import { noteSchema } from "@/lib/validation/notes";
import { categoryBudgetSchema, categoryIdSchema, createCategorySchema, lowBalanceThresholdSchema, renameCategorySchema } from "@/lib/validation/setup";
import { parseFormOrThrow } from "@/lib/validation/form";
import { canDeleteCategory } from "@/lib/categories";
import { canDeleteSavingsFund } from "@/lib/calculations/savings";
import { canDeleteDebtAccount } from "@/lib/calculations/debt";
import { dateString, nonNegativeCents, positiveCents } from "@/lib/validation/shared";
import { z } from "zod";

const idSchema = z.object({ id: z.string().min(1) });
const cashFlowIncomeSchema = z.object({ id: z.string().min(1), date: dateString, actualAmountCents: nonNegativeCents });
const cashFlowTransactionSchema = z.object({ id: z.string().min(1), date: dateString, merchant: z.string().trim().min(1), amountCents: positiveCents, cashFlowTreatment: z.enum(["CASH_DEBIT", "CREDIT_CARD"]) });
const cashFlowPlannedExpenseSchema = z.object({ id: z.string().min(1), date: dateString, description: z.string().trim().min(1), actualAmountCents: nonNegativeCents });
const cashFlowSavingsActivitySchema = z.object({ id: z.string().min(1), date: dateString, description: z.string().trim().optional(), amountCents: positiveCents });
const cashFlowDebtAccountSchema = z.object({ id: z.string().min(1), dueDate: dateString, minimumPaymentCents: nonNegativeCents, extraPaymentCents: nonNegativeCents });

export type FormActionState = { error: string; success?: string };

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function date(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

async function budgetMonthIdForDate(householdId: string, value: string) {
  const parsed = date(value);
  const month = await prisma.budgetMonth.findFirst({ where: { householdId, startDate: { lte: parsed }, endDate: { gte: parsed } } });
  if (!month) throw new Error("Date must be inside the July-Dec 2026 budget period.");
  return month.id;
}

async function audit(householdId: string, actorMemberId: string, entityType: string, entityId: string, action: string, fieldName: string | null, oldValueJson: object | null, newValueJson: object | null) {
  await prisma.auditEvent.create({ data: { householdId, actorMemberId, entityType, entityId, action, fieldName, oldValueJson: oldValueJson ?? undefined, newValueJson: newValueJson ?? undefined } });
}

function revalidateBudgetPages() {
  for (const path of ["/dashboard", "/cash-flow", "/calendar", "/income", "/bills", "/spending", "/savings", "/debt", "/reports", "/setup", "/notes", "/audit-history"]) revalidatePath(path);
}

async function handledFormAction(action: () => Promise<string>): Promise<FormActionState> {
  try {
    return { error: "", success: await action() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong. Please try again." };
  }
}

export async function createTransactionAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(createTransactionSchema, { date: formString(formData, "date"), merchant: formString(formData, "merchant"), amountCents: formString(formData, "amount"), categoryId: formString(formData, "categoryId"), cashFlowTreatment: formString(formData, "cashFlowTreatment"), plannedStatus: formString(formData, "plannedStatus"), isReimbursable: formData.get("isReimbursable") === "on", notes: formString(formData, "notes") });
  const budgetMonthId = await budgetMonthIdForDate(household.id, parsed.date);
  await prisma.$transaction(async (db) => {
    const created = await db.transaction.create({ data: { householdId: household.id, budgetMonthId, date: date(parsed.date), merchant: parsed.merchant, totalAmountCents: parsed.amountCents, cashFlowTreatment: parsed.cashFlowTreatment, plannedStatus: parsed.plannedStatus, isReimbursable: parsed.isReimbursable, notes: parsed.notes || null, createdByMemberId: member.id } });
    await db.transactionSplit.create({ data: { transactionId: created.id, categoryId: parsed.categoryId, amountCents: parsed.amountCents } });
    await db.auditEvent.create({ data: { householdId: household.id, actorMemberId: member.id, entityType: "Transaction", entityId: created.id, action: "created", newValueJson: { merchant: parsed.merchant, amountCents: parsed.amountCents } } });
  });
  revalidateBudgetPages();
}

export async function deleteTransactionAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const id = formString(formData, "id");
  const existing = await prisma.transaction.findFirstOrThrow({ where: { id, householdId: household.id }, include: { splits: true } });
  await prisma.$transaction(async (db) => {
    await db.transaction.delete({ where: { id } });
    await db.auditEvent.create({ data: { householdId: household.id, actorMemberId: member.id, entityType: "Transaction", entityId: id, action: "deleted", oldValueJson: { merchant: existing.merchant, amountCents: existing.totalAmountCents } } });
  });
  revalidateBudgetPages();
}

export async function updateCashFlowIncomeAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(cashFlowIncomeSchema, { id: formString(formData, "id"), date: formString(formData, "date"), actualAmountCents: formString(formData, "amount") });
  const existing = await prisma.incomeEntry.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  const budgetMonthId = await budgetMonthIdForDate(household.id, parsed.date);
  await prisma.incomeEntry.update({ where: { id: parsed.id }, data: { budgetMonthId, date: date(parsed.date), actualAmountCents: parsed.actualAmountCents, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "IncomeEntry", parsed.id, "updated", "cashFlow", { date: dateOnly(existing.date), actualAmountCents: existing.actualAmountCents }, { date: parsed.date, actualAmountCents: parsed.actualAmountCents });
  revalidateBudgetPages();
}

export async function deleteIncomeEntryAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(idSchema, { id: formString(formData, "id") });
  const existing = await prisma.incomeEntry.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id }, include: { incomeSource: true } });
  await prisma.incomeEntry.delete({ where: { id: parsed.id } });
  await audit(household.id, member.id, "IncomeEntry", parsed.id, "deleted", null, { source: existing.incomeSource.name, expectedAmountCents: existing.expectedAmountCents, actualAmountCents: existing.actualAmountCents }, null);
  revalidateBudgetPages();
}

export async function updateCashFlowBillAction(formData: FormData) {
  await updateBillInstanceAction(formData);
}

export async function updateBillInstanceAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(updateBillInstanceSchema, { id: formString(formData, "id"), dueDate: formString(formData, "date"), actualAmountCents: formString(formData, "amount") });
  const existing = await prisma.billInstance.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  const budgetMonthId = await budgetMonthIdForDate(household.id, parsed.dueDate);
  const actualAmountCents = parsed.actualAmountCents ?? existing.actualAmountCents;
  await prisma.billInstance.update({ where: { id: parsed.id }, data: { budgetMonthId, dueDate: date(parsed.dueDate), actualAmountCents, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "BillInstance", parsed.id, "updated", "cashFlow", { dueDate: dateOnly(existing.dueDate), actualAmountCents: existing.actualAmountCents }, { dueDate: parsed.dueDate, actualAmountCents });
  revalidateBudgetPages();
}

export async function deleteBillInstanceAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(idSchema, { id: formString(formData, "id") });
  const existing = await prisma.billInstance.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  await prisma.$transaction(async (db) => {
    await db.debtPayment.deleteMany({ where: { billInstanceId: parsed.id, householdId: household.id } });
    await db.billInstance.delete({ where: { id: parsed.id } });
    await db.auditEvent.create({ data: { householdId: household.id, actorMemberId: member.id, entityType: "BillInstance", entityId: parsed.id, action: "deleted", oldValueJson: { name: existing.name, expectedAmountCents: existing.expectedAmountCents, actualAmountCents: existing.actualAmountCents } } });
  });
  revalidateBudgetPages();
}

export async function updateCashFlowTransactionAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(cashFlowTransactionSchema, { id: formString(formData, "id"), date: formString(formData, "date"), merchant: formString(formData, "label"), amountCents: formString(formData, "amount"), cashFlowTreatment: formString(formData, "cashFlowTreatment") });
  const existing = await prisma.transaction.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id }, include: { splits: true } });
  const budgetMonthId = await budgetMonthIdForDate(household.id, parsed.date);
  await prisma.$transaction(async (db) => {
    await db.transaction.update({ where: { id: parsed.id }, data: { budgetMonthId, date: date(parsed.date), merchant: parsed.merchant, totalAmountCents: parsed.amountCents, cashFlowTreatment: parsed.cashFlowTreatment, updatedByMemberId: member.id } });
    if (existing.splits.length === 1) await db.transactionSplit.update({ where: { id: existing.splits[0].id }, data: { amountCents: parsed.amountCents } });
    await db.auditEvent.create({ data: { householdId: household.id, actorMemberId: member.id, entityType: "Transaction", entityId: parsed.id, action: "updated", fieldName: "cashFlow", oldValueJson: { date: dateOnly(existing.date), merchant: existing.merchant, amountCents: existing.totalAmountCents, cashFlowTreatment: existing.cashFlowTreatment }, newValueJson: { date: parsed.date, merchant: parsed.merchant, amountCents: parsed.amountCents, cashFlowTreatment: parsed.cashFlowTreatment } } });
  });
  revalidateBudgetPages();
}

export async function updateCashFlowPlannedExpenseAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(cashFlowPlannedExpenseSchema, { id: formString(formData, "id"), date: formString(formData, "date"), description: formString(formData, "label"), actualAmountCents: formString(formData, "amount") });
  const existing = await prisma.plannedExpense.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  const budgetMonthId = await budgetMonthIdForDate(household.id, parsed.date);
  await prisma.plannedExpense.update({ where: { id: parsed.id }, data: { budgetMonthId, date: date(parsed.date), description: parsed.description, actualAmountCents: parsed.actualAmountCents, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "PlannedExpense", parsed.id, "updated", "cashFlow", { date: dateOnly(existing.date), description: existing.description, actualAmountCents: existing.actualAmountCents }, { date: parsed.date, description: parsed.description, actualAmountCents: parsed.actualAmountCents });
  revalidateBudgetPages();
}

export async function deletePlannedExpenseAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(idSchema, { id: formString(formData, "id") });
  const existing = await prisma.plannedExpense.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  await prisma.plannedExpense.delete({ where: { id: parsed.id } });
  await audit(household.id, member.id, "PlannedExpense", parsed.id, "deleted", null, { description: existing.description, expectedAmountCents: existing.expectedAmountCents, actualAmountCents: existing.actualAmountCents }, null);
  revalidateBudgetPages();
}

function savingsSignedAmount(type: "CONTRIBUTION" | "WITHDRAWAL", amountCents: number) {
  return type === "WITHDRAWAL" ? -amountCents : amountCents;
}

export async function updateCashFlowSavingsActivityAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(cashFlowSavingsActivitySchema, { id: formString(formData, "id"), date: formString(formData, "date"), description: formString(formData, "label"), amountCents: formString(formData, "amount") });
  const existing = await prisma.savingsActivity.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id }, include: { fund: true } });
  const budgetMonthId = await budgetMonthIdForDate(household.id, parsed.date);
  const oldAmount = existing.actualAmountCents ?? existing.plannedAmountCents ?? 0;
  const adjustment = savingsSignedAmount(existing.type, parsed.amountCents) - savingsSignedAmount(existing.type, oldAmount);
  if (existing.fund.currentBalanceCents + adjustment < 0) throw new Error("Savings fund cannot go negative.");
  await prisma.$transaction(async (db) => {
    await db.savingsActivity.update({ where: { id: parsed.id }, data: { budgetMonthId, date: date(parsed.date), actualAmountCents: parsed.amountCents, description: parsed.description || null, updatedByMemberId: member.id } });
    await db.savingsFund.update({ where: { id: existing.fundId }, data: { currentBalanceCents: { increment: adjustment } } });
    await db.auditEvent.create({ data: { householdId: household.id, actorMemberId: member.id, entityType: "SavingsActivity", entityId: parsed.id, action: "updated", fieldName: "cashFlow", oldValueJson: { date: dateOnly(existing.date), amountCents: oldAmount, description: existing.description }, newValueJson: { date: parsed.date, amountCents: parsed.amountCents, description: parsed.description || null } } });
  });
  revalidateBudgetPages();
}

export async function deleteSavingsActivityAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(idSchema, { id: formString(formData, "id") });
  const existing = await prisma.savingsActivity.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id }, include: { fund: true } });
  const amount = existing.actualAmountCents ?? existing.plannedAmountCents ?? 0;
  const adjustment = -savingsSignedAmount(existing.type, amount);
  if (existing.fund.currentBalanceCents + adjustment < 0) throw new Error("Savings fund cannot go negative.");
  await prisma.$transaction(async (db) => {
    await db.savingsActivity.delete({ where: { id: parsed.id } });
    await db.savingsFund.update({ where: { id: existing.fundId }, data: { currentBalanceCents: { increment: adjustment } } });
    await db.auditEvent.create({ data: { householdId: household.id, actorMemberId: member.id, entityType: "SavingsActivity", entityId: parsed.id, action: "deleted", oldValueJson: { type: existing.type, amountCents: amount, description: existing.description } } });
  });
  revalidateBudgetPages();
}

export async function updateCashFlowDebtAccountAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(cashFlowDebtAccountSchema, { id: formString(formData, "id"), dueDate: formString(formData, "date"), minimumPaymentCents: formString(formData, "minimumPayment"), extraPaymentCents: formString(formData, "extraPayment") });
  const existing = await prisma.debtAccount.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  const dueDay = Number(parsed.dueDate.slice(-2));
  await prisma.debtAccount.update({ where: { id: parsed.id }, data: { dueDay, minimumPaymentCents: parsed.minimumPaymentCents, extraPaymentCents: parsed.extraPaymentCents } });
  await audit(household.id, member.id, "DebtAccount", parsed.id, "updated", "cashFlow", { dueDay: existing.dueDay, minimumPaymentCents: existing.minimumPaymentCents, extraPaymentCents: existing.extraPaymentCents }, { dueDay, minimumPaymentCents: parsed.minimumPaymentCents, extraPaymentCents: parsed.extraPaymentCents });
  revalidateBudgetPages();
}

export async function deleteCashFlowDebtAccountAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(idSchema, { id: formString(formData, "id") });
  const existing = await prisma.debtAccount.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  await prisma.debtAccount.update({ where: { id: parsed.id }, data: { minimumPaymentCents: 0, extraPaymentCents: 0 } });
  await audit(household.id, member.id, "DebtAccount", parsed.id, "deleted", "cashFlowPayment", { dueDay: existing.dueDay, minimumPaymentCents: existing.minimumPaymentCents, extraPaymentCents: existing.extraPaymentCents }, { minimumPaymentCents: 0, extraPaymentCents: 0 });
  revalidateBudgetPages();
}

export async function updateIncomeActualAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(updateIncomeActualSchema, { id: formString(formData, "id"), actualAmountCents: formString(formData, "actualAmount") });
  const existing = await prisma.incomeEntry.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  await prisma.incomeEntry.update({ where: { id: parsed.id }, data: { actualAmountCents: parsed.actualAmountCents, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "IncomeEntry", parsed.id, "updated", "actualAmountCents", { actualAmountCents: existing.actualAmountCents }, { actualAmountCents: parsed.actualAmountCents });
  revalidateBudgetPages();
}

export async function clearIncomeActualAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(incomeEntryIdSchema, { id: formString(formData, "id") });
  const existing = await prisma.incomeEntry.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  await prisma.incomeEntry.update({ where: { id: parsed.id }, data: { actualAmountCents: null, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "IncomeEntry", parsed.id, "updated", "actualAmountCents", { actualAmountCents: existing.actualAmountCents }, { actualAmountCents: null });
  revalidateBudgetPages();
}

export async function markBillPaidAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(updateBillSchema, { id: formString(formData, "id"), actualAmountCents: formString(formData, "actualAmount"), paidDate: formString(formData, "paidDate") || new Date().toISOString().slice(0, 10) });
  const existing = await prisma.billInstance.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  const actualAmountCents = parsed.actualAmountCents ?? existing.actualAmountCents;
  await prisma.billInstance.update({ where: { id: parsed.id }, data: { actualAmountCents, paidDate: date(parsed.paidDate!), isPaid: true, isSkipped: false, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "BillInstance", parsed.id, "paid", "isPaid", { isPaid: existing.isPaid, paidDate: existing.paidDate ? dateOnly(existing.paidDate) : null, actualAmountCents: existing.actualAmountCents }, { isPaid: true, paidDate: parsed.paidDate, actualAmountCents });
  revalidateBudgetPages();
}

export async function markBillUnpaidAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(billIdSchema, { id: formString(formData, "id") });
  const existing = await prisma.billInstance.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  await prisma.billInstance.update({ where: { id: parsed.id }, data: { isPaid: false, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "BillInstance", parsed.id, "unpaid", "isPaid", { isPaid: existing.isPaid, paidDate: existing.paidDate ? dateOnly(existing.paidDate) : null }, { isPaid: false, paidDate: existing.paidDate ? dateOnly(existing.paidDate) : null });
  revalidateBudgetPages();
}

export async function clearBillActualAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(billIdSchema, { id: formString(formData, "id") });
  const existing = await prisma.billInstance.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  await prisma.billInstance.update({ where: { id: parsed.id }, data: { actualAmountCents: null, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "BillInstance", parsed.id, "updated", "actualAmountCents", { actualAmountCents: existing.actualAmountCents }, { actualAmountCents: null });
  revalidateBudgetPages();
}

export async function toggleBillAutopayAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(billIdSchema, { id: formString(formData, "id") });
  const existing = await prisma.billInstance.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  await prisma.billInstance.update({ where: { id: parsed.id }, data: { isAutopay: !existing.isAutopay, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "BillInstance", parsed.id, "updated", "isAutopay", { isAutopay: existing.isAutopay }, { isAutopay: !existing.isAutopay });
  revalidateBudgetPages();
}

export async function skipBillAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(billIdSchema, { id: formString(formData, "id") });
  await prisma.billInstance.update({ where: { id: parsed.id }, data: { isSkipped: true, isPaid: false, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "BillInstance", parsed.id, "skipped", "isSkipped", { isSkipped: false }, { isSkipped: true });
  revalidateBudgetPages();
}

export async function unskipBillAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(billIdSchema, { id: formString(formData, "id") });
  await prisma.billInstance.update({ where: { id: parsed.id }, data: { isSkipped: false, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "BillInstance", parsed.id, "unskipped", "isSkipped", { isSkipped: true }, { isSkipped: false });
  revalidateBudgetPages();
}

export async function createSavingsActivityAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(savingsActivitySchema, { fundId: formString(formData, "fundId"), date: formString(formData, "date"), type: formString(formData, "type"), amountCents: formString(formData, "amount"), description: formString(formData, "description") });
  const budgetMonthId = await budgetMonthIdForDate(household.id, parsed.date);
  const fund = await prisma.savingsFund.findFirstOrThrow({ where: { id: parsed.fundId, householdId: household.id } });
  if (parsed.type === "WITHDRAWAL" && parsed.amountCents > fund.currentBalanceCents) throw new Error("Withdrawal cannot exceed available fund balance.");
  const delta = parsed.type === "WITHDRAWAL" ? -parsed.amountCents : parsed.amountCents;
  await prisma.$transaction(async (db) => {
    const created = await db.savingsActivity.create({ data: { householdId: household.id, fundId: fund.id, budgetMonthId, date: date(parsed.date), type: parsed.type, actualAmountCents: parsed.amountCents, description: parsed.description || null, createdByMemberId: member.id } });
    await db.savingsFund.update({ where: { id: fund.id }, data: { currentBalanceCents: { increment: delta } } });
    await db.auditEvent.create({ data: { householdId: household.id, actorMemberId: member.id, entityType: "SavingsActivity", entityId: created.id, action: "created", newValueJson: { fund: fund.name, type: parsed.type, amountCents: parsed.amountCents } } });
  });
  revalidateBudgetPages();
}

function savingsFundType(value: "EMERGENCY" | "SINKING") {
  return value === "EMERGENCY" ? "EMERGENCY" as const : "SINKING" as const;
}

function savingsFundMode(value: "OPEN_ENDED" | "KNOWN_DUE_DATE") {
  return value === "KNOWN_DUE_DATE" ? "KNOWN_DUE_DATE" as const : "OPEN_ENDED" as const;
}

async function assertUniqueSavingsFundName(householdId: string, name: string, exceptFundId?: string) {
  const existing = await prisma.savingsFund.findFirst({
    where: {
      householdId,
      name: { equals: name, mode: "insensitive" },
      ...(exceptFundId ? { id: { not: exceptFundId } } : {})
    }
  });
  if (existing) throw new Error("A savings fund with this name already exists.");
}

function savingsFundPayload(parsed: z.infer<typeof createSavingsFundSchema>) {
  const mode = savingsFundMode(parsed.mode);
  return {
    name: parsed.name,
    type: savingsFundType(parsed.type),
    mode,
    targetAmountCents: parsed.targetAmountCents ?? null,
    plannedContributionCents: parsed.plannedContributionCents,
    dueDate: mode === "KNOWN_DUE_DATE" && parsed.dueDate ? date(parsed.dueDate) : null
  };
}

export async function createSavingsFundAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(createSavingsFundSchema, { name: formString(formData, "name"), type: formString(formData, "type"), mode: formString(formData, "mode"), startingBalanceCents: formString(formData, "startingBalance"), targetAmountCents: formString(formData, "targetAmount"), plannedContributionCents: formString(formData, "plannedContribution"), dueDate: formString(formData, "dueDate") });
  await assertUniqueSavingsFundName(household.id, parsed.name);
  const payload = savingsFundPayload(parsed);
  const fund = await prisma.savingsFund.create({ data: { householdId: household.id, ...payload, startingBalanceCents: parsed.startingBalanceCents, currentBalanceCents: parsed.startingBalanceCents } });
  await audit(household.id, member.id, "SavingsFund", fund.id, "created", null, null, { name: fund.name, targetAmountCents: fund.targetAmountCents, plannedContributionCents: fund.plannedContributionCents });
  revalidateBudgetPages();
}

export async function updateSavingsFundAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(updateSavingsFundSchema, { fundId: formString(formData, "fundId"), name: formString(formData, "name"), type: formString(formData, "type"), mode: formString(formData, "mode"), startingBalanceCents: formString(formData, "startingBalance"), targetAmountCents: formString(formData, "targetAmount"), plannedContributionCents: formString(formData, "plannedContribution"), dueDate: formString(formData, "dueDate") });
  const existing = await prisma.savingsFund.findFirstOrThrow({ where: { id: parsed.fundId, householdId: household.id } });
  await assertUniqueSavingsFundName(household.id, parsed.name, parsed.fundId);
  const payload = savingsFundPayload(parsed);
  const startingDelta = parsed.startingBalanceCents - existing.startingBalanceCents;
  await prisma.savingsFund.update({ where: { id: parsed.fundId }, data: { ...payload, startingBalanceCents: parsed.startingBalanceCents, currentBalanceCents: { increment: startingDelta } } });
  await audit(household.id, member.id, "SavingsFund", parsed.fundId, "updated", null, { name: existing.name, startingBalanceCents: existing.startingBalanceCents, targetAmountCents: existing.targetAmountCents, plannedContributionCents: existing.plannedContributionCents, dueDate: existing.dueDate ? dateOnly(existing.dueDate) : null }, { name: parsed.name, startingBalanceCents: parsed.startingBalanceCents, targetAmountCents: parsed.targetAmountCents ?? null, plannedContributionCents: parsed.plannedContributionCents, dueDate: parsed.dueDate ?? null });
  revalidateBudgetPages();
}

export async function disableSavingsFundAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(savingsFundIdSchema, { fundId: formString(formData, "fundId") });
  const existing = await prisma.savingsFund.findFirstOrThrow({ where: { id: parsed.fundId, householdId: household.id } });
  await prisma.savingsFund.update({ where: { id: parsed.fundId }, data: { isActive: false } });
  await audit(household.id, member.id, "SavingsFund", parsed.fundId, "disabled", "isActive", { isActive: existing.isActive }, { isActive: false });
  revalidateBudgetPages();
}

export async function deleteSavingsFundAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(savingsFundIdSchema, { fundId: formString(formData, "fundId") });
  const existing = await prisma.savingsFund.findFirstOrThrow({ where: { id: parsed.fundId, householdId: household.id } });
  const activityCount = await prisma.savingsActivity.count({ where: { fundId: parsed.fundId, householdId: household.id } });
  if (!canDeleteSavingsFund(activityCount)) throw new Error("Used savings funds cannot be deleted. Disable this fund instead.");
  await prisma.savingsFund.delete({ where: { id: parsed.fundId } });
  await audit(household.id, member.id, "SavingsFund", parsed.fundId, "deleted", null, { name: existing.name, currentBalanceCents: existing.currentBalanceCents }, null);
  revalidateBudgetPages();
}

async function assertUniqueDebtAccountName(householdId: string, name: string, exceptDebtAccountId?: string) {
  const existing = await prisma.debtAccount.findFirst({
    where: {
      householdId,
      name: { equals: name, mode: "insensitive" },
      ...(exceptDebtAccountId ? { id: { not: exceptDebtAccountId } } : {})
    }
  });
  if (existing) throw new Error("A debt card with this name already exists.");
}

function debtAccountPayload(parsed: z.infer<typeof createDebtAccountSchema>) {
  return {
    name: parsed.name,
    startingBalanceCents: parsed.startingBalanceCents,
    currentBalanceCents: parsed.currentBalanceCents,
    interestRatePercent: parsed.interestRatePercent,
    minimumPaymentCents: parsed.minimumPaymentCents,
    extraPaymentCents: parsed.extraPaymentCents,
    dueDay: parsed.dueDay
  };
}

export async function createDebtAccountAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(createDebtAccountSchema, { name: formString(formData, "name"), startingBalanceCents: formString(formData, "startingBalance"), currentBalanceCents: formString(formData, "currentBalance"), interestRatePercent: formString(formData, "interestRate"), minimumPaymentCents: formString(formData, "minimumPayment"), extraPaymentCents: formString(formData, "extraPayment"), dueDay: formString(formData, "dueDay") });
  await assertUniqueDebtAccountName(household.id, parsed.name);
  const debt = await prisma.debtAccount.create({ data: { householdId: household.id, ...debtAccountPayload(parsed) } });
  await audit(household.id, member.id, "DebtAccount", debt.id, "created", null, null, { name: debt.name, currentBalanceCents: debt.currentBalanceCents, interestRatePercent: Number(debt.interestRatePercent), minimumPaymentCents: debt.minimumPaymentCents, extraPaymentCents: debt.extraPaymentCents, dueDay: debt.dueDay });
  revalidateBudgetPages();
}

export async function createDebtAccountFormAction(_state: FormActionState, formData: FormData): Promise<FormActionState> {
  return handledFormAction(async () => {
    await createDebtAccountAction(formData);
    return "Card added.";
  });
}

export async function updateDebtAccountAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(updateDebtAccountSchema, { debtAccountId: formString(formData, "debtAccountId"), name: formString(formData, "name"), startingBalanceCents: formString(formData, "startingBalance"), currentBalanceCents: formString(formData, "currentBalance"), interestRatePercent: formString(formData, "interestRate"), minimumPaymentCents: formString(formData, "minimumPayment"), extraPaymentCents: formString(formData, "extraPayment"), dueDay: formString(formData, "dueDay") });
  const existing = await prisma.debtAccount.findFirstOrThrow({ where: { id: parsed.debtAccountId, householdId: household.id } });
  await assertUniqueDebtAccountName(household.id, parsed.name, parsed.debtAccountId);
  await prisma.debtAccount.update({ where: { id: parsed.debtAccountId }, data: { ...debtAccountPayload(parsed), isActive: true } });
  await audit(household.id, member.id, "DebtAccount", parsed.debtAccountId, "updated", null, { name: existing.name, startingBalanceCents: existing.startingBalanceCents, currentBalanceCents: existing.currentBalanceCents, interestRatePercent: Number(existing.interestRatePercent), minimumPaymentCents: existing.minimumPaymentCents, extraPaymentCents: existing.extraPaymentCents, dueDay: existing.dueDay }, { name: parsed.name, startingBalanceCents: parsed.startingBalanceCents, currentBalanceCents: parsed.currentBalanceCents, interestRatePercent: parsed.interestRatePercent, minimumPaymentCents: parsed.minimumPaymentCents, extraPaymentCents: parsed.extraPaymentCents, dueDay: parsed.dueDay });
  revalidateBudgetPages();
}

export async function updateDebtAccountFormAction(_state: FormActionState, formData: FormData): Promise<FormActionState> {
  return handledFormAction(async () => {
    await updateDebtAccountAction(formData);
    return "Card updated.";
  });
}

export async function disableDebtAccountAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(debtAccountIdSchema, { debtAccountId: formString(formData, "debtAccountId") });
  const existing = await prisma.debtAccount.findFirstOrThrow({ where: { id: parsed.debtAccountId, householdId: household.id } });
  await prisma.debtAccount.update({ where: { id: parsed.debtAccountId }, data: { isActive: false } });
  await audit(household.id, member.id, "DebtAccount", parsed.debtAccountId, "disabled", "isActive", { name: existing.name, isActive: existing.isActive }, { isActive: false });
  revalidateBudgetPages();
}

export async function disableDebtAccountFormAction(_state: FormActionState, formData: FormData): Promise<FormActionState> {
  return handledFormAction(async () => {
    await disableDebtAccountAction(formData);
    return "Card removed from active cards.";
  });
}

export async function deleteDebtAccountAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(debtAccountIdSchema, { debtAccountId: formString(formData, "debtAccountId") });
  const existing = await prisma.debtAccount.findFirstOrThrow({ where: { id: parsed.debtAccountId, householdId: household.id } });
  const [paymentCount, snapshotCount] = await Promise.all([
    prisma.debtPayment.count({ where: { debtAccountId: parsed.debtAccountId, householdId: household.id } }),
    prisma.debtSnapshot.count({ where: { debtAccountId: parsed.debtAccountId, householdId: household.id } })
  ]);
  if (!canDeleteDebtAccount(paymentCount, snapshotCount)) {
    await prisma.debtAccount.update({ where: { id: parsed.debtAccountId }, data: { isActive: false } });
    await audit(household.id, member.id, "DebtAccount", parsed.debtAccountId, "disabled", "isActive", { name: existing.name, isActive: existing.isActive, paymentCount, snapshotCount }, { isActive: false });
    revalidateBudgetPages();
    return;
  }
  await prisma.debtAccount.delete({ where: { id: parsed.debtAccountId } });
  await audit(household.id, member.id, "DebtAccount", parsed.debtAccountId, "deleted", null, { name: existing.name, currentBalanceCents: existing.currentBalanceCents }, null);
  revalidateBudgetPages();
}

export async function deleteDebtAccountFormAction(_state: FormActionState, formData: FormData): Promise<FormActionState> {
  return handledFormAction(async () => {
    await deleteDebtAccountAction(formData);
    return "Card removed.";
  });
}

export async function createDebtPaymentAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(debtPaymentSchema, { debtAccountId: formString(formData, "debtAccountId"), dueDate: formString(formData, "dueDate"), minimumPaymentCents: formString(formData, "minimumPayment"), extraPaymentCents: formString(formData, "extraPayment"), actualPaymentCents: formString(formData, "actualPayment") || undefined });
  const budgetMonthId = await budgetMonthIdForDate(household.id, parsed.dueDate);
  const payment = await prisma.debtPayment.create({ data: { householdId: household.id, debtAccountId: parsed.debtAccountId, budgetMonthId, dueDate: date(parsed.dueDate), minimumPaymentCents: parsed.minimumPaymentCents, extraPaymentCents: parsed.extraPaymentCents, actualPaymentCents: parsed.actualPaymentCents ?? null, createdByMemberId: member.id } });
  await audit(household.id, member.id, "DebtPayment", payment.id, "created", null, null, { minimumPaymentCents: parsed.minimumPaymentCents, extraPaymentCents: parsed.extraPaymentCents, actualPaymentCents: parsed.actualPaymentCents ?? null });
  revalidateBudgetPages();
}

export async function createDebtPaymentFormAction(_state: FormActionState, formData: FormData): Promise<FormActionState> {
  return handledFormAction(async () => {
    await createDebtPaymentAction(formData);
    return "Payment added.";
  });
}

export async function createNoteAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(noteSchema, { body: formString(formData, "body") });
  const note = await prisma.note.create({ data: { householdId: household.id, body: parsed.body, createdByMemberId: member.id } });
  await audit(household.id, member.id, "Note", note.id, "created", "body", null, { body: parsed.body });
  revalidateBudgetPages();
}

async function assertUniqueCategoryName(householdId: string, name: string, exceptCategoryId?: string) {
  const existing = await prisma.spendingCategory.findFirst({
    where: {
      householdId,
      name: { equals: name, mode: "insensitive" },
      ...(exceptCategoryId ? { id: { not: exceptCategoryId } } : {})
    }
  });
  if (existing) throw new Error("A category with this name already exists.");
}

export async function createSpendingCategoryAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(createCategorySchema, { name: formString(formData, "name"), baseMonthlyBudgetCents: formString(formData, "baseMonthlyBudget") });
  await assertUniqueCategoryName(household.id, parsed.name);
  const maxSort = await prisma.spendingCategory.aggregate({ where: { householdId: household.id }, _max: { sortOrder: true } });
  const category = await prisma.spendingCategory.create({ data: { householdId: household.id, name: parsed.name, baseMonthlyBudgetCents: parsed.baseMonthlyBudgetCents, sortOrder: (maxSort._max.sortOrder ?? 0) + 1 } });
  await audit(household.id, member.id, "SpendingCategory", category.id, "created", null, null, { name: category.name, baseMonthlyBudgetCents: category.baseMonthlyBudgetCents });
  revalidateBudgetPages();
}

export async function updateLowBalanceThresholdAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(lowBalanceThresholdSchema, { lowBalanceThresholdCents: formString(formData, "lowBalanceThreshold") });
  const existing = await prisma.household.findFirstOrThrow({ where: { id: household.id } });
  await prisma.household.update({ where: { id: household.id }, data: { lowBalanceThresholdCents: parsed.lowBalanceThresholdCents } });
  await audit(household.id, member.id, "Household", household.id, "updated", "lowBalanceThresholdCents", { lowBalanceThresholdCents: existing.lowBalanceThresholdCents }, { lowBalanceThresholdCents: parsed.lowBalanceThresholdCents });
  revalidateBudgetPages();
}

export async function renameSpendingCategoryAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(renameCategorySchema, { categoryId: formString(formData, "categoryId"), name: formString(formData, "name") });
  const existing = await prisma.spendingCategory.findFirstOrThrow({ where: { id: parsed.categoryId, householdId: household.id } });
  await assertUniqueCategoryName(household.id, parsed.name, parsed.categoryId);
  await prisma.spendingCategory.update({ where: { id: parsed.categoryId }, data: { name: parsed.name } });
  await audit(household.id, member.id, "SpendingCategory", parsed.categoryId, "renamed", "name", { name: existing.name }, { name: parsed.name });
  revalidateBudgetPages();
}

export async function disableSpendingCategoryAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(categoryIdSchema, { categoryId: formString(formData, "categoryId") });
  const existing = await prisma.spendingCategory.findFirstOrThrow({ where: { id: parsed.categoryId, householdId: household.id } });
  await prisma.spendingCategory.update({ where: { id: parsed.categoryId }, data: { isActive: false } });
  await audit(household.id, member.id, "SpendingCategory", parsed.categoryId, "disabled", "isActive", { isActive: existing.isActive }, { isActive: false });
  revalidateBudgetPages();
}

export async function deleteSpendingCategoryAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(categoryIdSchema, { categoryId: formString(formData, "categoryId") });
  const existing = await prisma.spendingCategory.findFirstOrThrow({ where: { id: parsed.categoryId, householdId: household.id } });
  const [transactionSplits, plannedExpenses] = await Promise.all([
    prisma.transactionSplit.count({ where: { categoryId: parsed.categoryId } }),
    prisma.plannedExpense.count({ where: { categoryId: parsed.categoryId, householdId: household.id } })
  ]);
  if (!canDeleteCategory({ transactionSplits, plannedExpenses })) throw new Error("Used categories cannot be deleted. Disable this category instead.");
  await prisma.spendingCategory.delete({ where: { id: parsed.categoryId } });
  await audit(household.id, member.id, "SpendingCategory", parsed.categoryId, "deleted", null, { name: existing.name, baseMonthlyBudgetCents: existing.baseMonthlyBudgetCents }, null);
  revalidateBudgetPages();
}

export async function updateCategoryBudgetAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = parseFormOrThrow(categoryBudgetSchema, { categoryId: formString(formData, "categoryId"), baseMonthlyBudgetCents: formString(formData, "baseMonthlyBudget") });
  const existing = await prisma.spendingCategory.findFirstOrThrow({ where: { id: parsed.categoryId, householdId: household.id } });
  await prisma.spendingCategory.update({ where: { id: parsed.categoryId }, data: { baseMonthlyBudgetCents: parsed.baseMonthlyBudgetCents } });
  await audit(household.id, member.id, "SpendingCategory", parsed.categoryId, "updated", "baseMonthlyBudgetCents", { baseMonthlyBudgetCents: existing.baseMonthlyBudgetCents }, { baseMonthlyBudgetCents: parsed.baseMonthlyBudgetCents });
  revalidateBudgetPages();
}
