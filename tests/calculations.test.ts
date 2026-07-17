import { describe, expect, it } from "vitest";
import { expensePlanningDollars, incomePlanningDollars, toCents } from "@/lib/money";
import { generatePaychecks } from "@/lib/calculations/recurrence";
import { buildCashFlowRows } from "@/lib/calculations/cash-flow";
import { getZeroBasedSummary } from "@/lib/calculations/zero-based-budget";
import { getCategoryCarryover } from "@/lib/calculations/category-carryover";
import { bills, categories, debtAccounts, income, months, plannedExpenses, savingsActivities, savingsFunds, transactions } from "@/lib/sample-data";
import { canWithdraw, getSavingsBalance } from "@/lib/calculations/savings";
import type { BillInstance, BudgetMonth, IncomeEntry, SpendingTransaction } from "@/lib/types";

describe("budget calculations", () => {
  it("rounds conservatively", () => {
    expect(expensePlanningDollars(7087)).toBe(71);
    expect(expensePlanningDollars(14201)).toBe(143);
    expect(incomePlanningDollars(245678)).toBe(2456);
  });

  it("does not over-round exact whole dollar values", () => {
    expect(expensePlanningDollars(16000)).toBe(160);
    expect(incomePlanningDollars(16000)).toBe(160);
    expect(toCents("$5,414.69")).toBe(541469);
  });

  it("generates 14-day paycheck recurrence", () => {
    const paychecks = generatePaychecks("CS", "2026-07-03", 100000);
    expect(paychecks[0].date).toBe("2026-07-03");
    expect(paychecks[1].date).toBe("2026-07-17");
    expect((paychecks.at(-1)?.date ?? "") <= "2026-12-31").toBe(true);
  });

  it("does not generate paycheck instances after December 2026", () => {
    const paychecks = generatePaychecks("TCH", "2026-07-09", 100000);
    expect(paychecks.some((paycheck) => paycheck.date > "2026-12-31")).toBe(false);
  });

  it("shows every cash-flow calendar day", () => {
    const month = months[0];
    const rows = buildCashFlowRows({ month, income: income.filter((item) => item.monthId === month.id), bills: bills.filter((item) => item.monthId === month.id), transactions: transactions.filter((item) => item.monthId === month.id), plannedExpenses: plannedExpenses.filter((item) => item.monthId === month.id), savingsActivities: savingsActivities.filter((item) => item.monthId === month.id), debtAccounts });
    expect(new Set(rows.map((row) => row.date)).size).toBe(31);
  });

  it("excludes skipped bills from cash flow", () => {
    const month = months[0];
    const skippedBill: BillInstance = { ...bills[0], id: "skipped-test", monthId: month.id, dueDate: "2026-07-02", isSkipped: true };
    const rows = buildCashFlowRows({ month, income: [], bills: [skippedBill], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows.find((row) => row.date === "2026-07-02")?.label).toBe("No activity");
    expect(rows.some((row) => row.label === skippedBill.name)).toBe(false);
  });

  it("does not reduce checking cash flow for credit-card spending", () => {
    const month = months[0];
    const creditCardTransaction: SpendingTransaction = { ...transactions[0], id: "cc-test", monthId: month.id, date: "2026-07-03", cashFlowTreatment: "CREDIT_CARD" };
    const rows = buildCashFlowRows({ month, income: [], bills: [], transactions: [creditCardTransaction], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows.some((row) => row.label === creditCardTransaction.merchant)).toBe(false);
    expect(rows.find((row) => row.date === "2026-07-03")?.balanceCents).toBe(month.startingBalanceCents);
  });

  it("flags negative projected cash-flow days", () => {
    const month: BudgetMonth = { ...months[0], startingBalanceCents: 10000 };
    const largeBill: BillInstance = { ...bills[0], id: "large-bill", monthId: month.id, dueDate: "2026-07-01", expectedAmountCents: 20000, actualAmountCents: null, isSkipped: false };
    const rows = buildCashFlowRows({ month, income: [], bills: [largeBill], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows[0].isNegative).toBe(true);
    expect(rows[0].balanceCents).toBeLessThan(0);
  });

  it("classifies a balanced zero-based month", () => {
    const month = months[0];
    const monthIncome: IncomeEntry[] = [{ id: "income-test", monthId: month.id, date: month.startDate, source: "CS", expectedAmountCents: 100000 }];
    const monthBill: BillInstance = { ...bills[0], id: "bill-test", monthId: month.id, expectedAmountCents: 100000, actualAmountCents: null, isSkipped: false };
    const summary = getZeroBasedSummary({ month, income: monthIncome, bills: [monthBill], categories: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [], hasCashFlowRisk: false });

    expect(summary.unassignedCents).toBe(0);
    expect(summary.status).toBe("Balanced");
  });

  it("classifies underfunded and cash-flow-risk months", () => {
    const month = months[0];
    const monthIncome: IncomeEntry[] = [{ id: "income-test", monthId: month.id, date: month.startDate, source: "CS", expectedAmountCents: 50000 }];
    const monthBill: BillInstance = { ...bills[0], id: "bill-test", monthId: month.id, expectedAmountCents: 100000, actualAmountCents: null, isSkipped: false };

    const underfunded = getZeroBasedSummary({ month, income: monthIncome, bills: [monthBill], categories: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [], hasCashFlowRisk: false });
    const risk = getZeroBasedSummary({ month, income: monthIncome, bills: [], categories: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [], hasCashFlowRisk: true });

    expect(underfunded.status).toBe("Underfunded");
    expect(risk.status).toBe("Cash-Flow Risk");
  });

  it("raises category warning at 80 percent usage", () => {
    const monthId = "2026-07";
    const category = { id: "test-category", name: "Test", baseMonthlyBudgetCents: 10000, isActive: true };
    const transaction: SpendingTransaction = { ...transactions[0], id: "category-warning", monthId, totalAmountCents: 8000, splits: [{ categoryId: category.id, amountCents: 8000 }] };
    const [carryover] = getCategoryCarryover([category], [transaction], monthId);

    expect(carryover.isWarning).toBe(true);
    expect(carryover.remainingCents).toBe(2000);
  });

  it("does not warn categories below 80 percent usage", () => {
    const monthId = "2026-07";
    const category = { id: "test-category", name: "Test", baseMonthlyBudgetCents: 10000, isActive: true };
    const transaction: SpendingTransaction = { ...transactions[0], id: "category-ok", monthId, totalAmountCents: 7900, splits: [{ categoryId: category.id, amountCents: 7900 }] };
    const [carryover] = getCategoryCarryover([category], [transaction], monthId);

    expect(carryover.isWarning).toBe(false);
  });

  it("blocks savings withdrawal beyond balance", () => {
    expect(canWithdraw(savingsFunds[0], [], 1)).toBe(false);
  });

  it("allows savings withdrawal within available balance", () => {
    expect(canWithdraw(savingsFunds[1], [], 50000)).toBe(true);
    expect(getSavingsBalance(savingsFunds[1], [])).toBe(120000);
  });

  it("keeps known sample categories active", () => {
    expect(categories.find((category) => category.name === "Groceries")?.baseMonthlyBudgetCents).toBe(100000);
    expect(categories.find((category) => category.name === "Fuel")?.baseMonthlyBudgetCents).toBe(25000);
  });
});
