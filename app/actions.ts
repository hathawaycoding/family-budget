"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getCurrentMember } from "@/lib/auth/session";
import { createTransactionSchema } from "@/lib/validation/spending";
import { billIdSchema, updateBillSchema } from "@/lib/validation/bills";
import { updateIncomeActualSchema } from "@/lib/validation/income";
import { savingsActivitySchema } from "@/lib/validation/savings";
import { debtPaymentSchema } from "@/lib/validation/debt";
import { noteSchema } from "@/lib/validation/notes";
import { categoryBudgetSchema } from "@/lib/validation/setup";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function date(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
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

export async function createTransactionAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = createTransactionSchema.parse({ date: formString(formData, "date"), merchant: formString(formData, "merchant"), amountCents: formString(formData, "amount"), categoryId: formString(formData, "categoryId"), cashFlowTreatment: formString(formData, "cashFlowTreatment"), plannedStatus: formString(formData, "plannedStatus"), isReimbursable: formData.get("isReimbursable") === "on", notes: formString(formData, "notes") });
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

export async function updateIncomeActualAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = updateIncomeActualSchema.parse({ id: formString(formData, "id"), actualAmountCents: formString(formData, "actualAmount") });
  const existing = await prisma.incomeEntry.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  await prisma.incomeEntry.update({ where: { id: parsed.id }, data: { actualAmountCents: parsed.actualAmountCents, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "IncomeEntry", parsed.id, "updated", "actualAmountCents", { actualAmountCents: existing.actualAmountCents }, { actualAmountCents: parsed.actualAmountCents });
  revalidateBudgetPages();
}

export async function markBillPaidAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = updateBillSchema.parse({ id: formString(formData, "id"), actualAmountCents: formString(formData, "actualAmount"), paidDate: formString(formData, "paidDate") || new Date().toISOString().slice(0, 10) });
  const existing = await prisma.billInstance.findFirstOrThrow({ where: { id: parsed.id, householdId: household.id } });
  await prisma.billInstance.update({ where: { id: parsed.id }, data: { actualAmountCents: parsed.actualAmountCents, paidDate: date(parsed.paidDate!), isPaid: true, isSkipped: false, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "BillInstance", parsed.id, "paid", "isPaid", { isPaid: existing.isPaid }, { isPaid: true, actualAmountCents: parsed.actualAmountCents });
  revalidateBudgetPages();
}

export async function skipBillAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = billIdSchema.parse({ id: formString(formData, "id") });
  await prisma.billInstance.update({ where: { id: parsed.id }, data: { isSkipped: true, isPaid: false, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "BillInstance", parsed.id, "skipped", "isSkipped", { isSkipped: false }, { isSkipped: true });
  revalidateBudgetPages();
}

export async function unskipBillAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = billIdSchema.parse({ id: formString(formData, "id") });
  await prisma.billInstance.update({ where: { id: parsed.id }, data: { isSkipped: false, updatedByMemberId: member.id } });
  await audit(household.id, member.id, "BillInstance", parsed.id, "unskipped", "isSkipped", { isSkipped: true }, { isSkipped: false });
  revalidateBudgetPages();
}

export async function createSavingsActivityAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = savingsActivitySchema.parse({ fundId: formString(formData, "fundId"), date: formString(formData, "date"), type: formString(formData, "type"), amountCents: formString(formData, "amount"), description: formString(formData, "description") });
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

export async function createDebtPaymentAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = debtPaymentSchema.parse({ debtAccountId: formString(formData, "debtAccountId"), dueDate: formString(formData, "dueDate"), minimumPaymentCents: formString(formData, "minimumPayment"), extraPaymentCents: formString(formData, "extraPayment"), actualPaymentCents: formString(formData, "actualPayment") || undefined });
  const budgetMonthId = await budgetMonthIdForDate(household.id, parsed.dueDate);
  const payment = await prisma.debtPayment.create({ data: { householdId: household.id, debtAccountId: parsed.debtAccountId, budgetMonthId, dueDate: date(parsed.dueDate), minimumPaymentCents: parsed.minimumPaymentCents, extraPaymentCents: parsed.extraPaymentCents, actualPaymentCents: parsed.actualPaymentCents ?? null, createdByMemberId: member.id } });
  await audit(household.id, member.id, "DebtPayment", payment.id, "created", null, null, { minimumPaymentCents: parsed.minimumPaymentCents, extraPaymentCents: parsed.extraPaymentCents, actualPaymentCents: parsed.actualPaymentCents ?? null });
  revalidateBudgetPages();
}

export async function createNoteAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = noteSchema.parse({ body: formString(formData, "body") });
  const note = await prisma.note.create({ data: { householdId: household.id, body: parsed.body, createdByMemberId: member.id } });
  await audit(household.id, member.id, "Note", note.id, "created", "body", null, { body: parsed.body });
  revalidateBudgetPages();
}

export async function updateCategoryBudgetAction(formData: FormData) {
  const { household, member } = await getCurrentMember();
  const parsed = categoryBudgetSchema.parse({ categoryId: formString(formData, "categoryId"), baseMonthlyBudgetCents: formString(formData, "baseMonthlyBudget") });
  const existing = await prisma.spendingCategory.findFirstOrThrow({ where: { id: parsed.categoryId, householdId: household.id } });
  await prisma.spendingCategory.update({ where: { id: parsed.categoryId }, data: { baseMonthlyBudgetCents: parsed.baseMonthlyBudgetCents } });
  await audit(household.id, member.id, "SpendingCategory", parsed.categoryId, "updated", "baseMonthlyBudgetCents", { baseMonthlyBudgetCents: existing.baseMonthlyBudgetCents }, { baseMonthlyBudgetCents: parsed.baseMonthlyBudgetCents });
  revalidateBudgetPages();
}
