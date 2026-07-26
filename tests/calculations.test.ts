import { describe, expect, it } from "vitest";
import { expensePlanningDollars, incomePlanningDollars, toCents } from "@/lib/money";
import { generatePaychecks } from "@/lib/calculations/recurrence";
import { activeCategories, canDeleteCategory, recentItems } from "@/lib/categories";
import { cashFlowActivityRows, getCashFlowSummary } from "@/lib/cash-flow-view";
import { dateInputValue } from "@/lib/dates";
import { buildCashFlowRows } from "@/lib/calculations/cash-flow";
import { canDeleteDebtAccount } from "@/lib/calculations/debt";
import { getZeroBasedSummary } from "@/lib/calculations/zero-based-budget";
import { getCategoryCarryover } from "@/lib/calculations/category-carryover";
import { calculateCustomSetAsideProgress, calculateEqualMonthlySetAside, getIncludedFutureExpenses } from "@/lib/calculations/future-expenses";
import { calculateShoppingGuardrailPreview, getEffectiveShoppingCheckStatus } from "@/lib/calculations/shopping-guardrail";
import { bills, categories, debtAccounts, income, months, plannedExpenses, savingsActivities, savingsFunds, transactions } from "@/lib/sample-data";
import { activeSavingsFunds, canDeleteSavingsFund, canWithdraw, getSavingsActivityAmount, getSavingsActivityKind, getSavingsBalance, getSavingsFundStatus } from "@/lib/calculations/savings";
import { billIdSchema, updateBillInstanceSchema, updateBillSchema } from "@/lib/validation/bills";
import { incomeEntryIdSchema, updateIncomeActualSchema } from "@/lib/validation/income";
import { categoryIdSchema, createCategorySchema, lowBalanceThresholdSchema, renameCategorySchema } from "@/lib/validation/setup";
import { createSavingsFundSchema, savingsFundIdSchema, updateSavingsFundSchema } from "@/lib/validation/savings";
import { createDebtAccountSchema, debtAccountIdSchema, debtPaymentSchema, updateDebtAccountSchema } from "@/lib/validation/debt";
import { noteSchema } from "@/lib/validation/notes";
import { createShoppingCheckSchema } from "@/lib/validation/shopping-guardrail";
import { parseFormOrThrow } from "@/lib/validation/form";
import type { BillInstance, BudgetMonth, CashFlowRow, FutureExpense, IncomeEntry, SavingsFund, SpendingTransaction } from "@/lib/types";

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

  it("marks real cash-flow activity rows with editable source metadata", () => {
    const month = months[0];
    const rows = buildCashFlowRows({ month, income: [income[0]], bills: [], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });
    const paycheckRow = rows.find((row) => row.sourceId === income[0].id);

    expect(paycheckRow?.sourceType).toBe("IncomeEntry");
    expect(paycheckRow?.canEdit).toBe(true);
    expect(paycheckRow?.canDelete).toBe(true);
  });

  it("keeps no-activity cash-flow rows read-only", () => {
    const month = months[0];
    const rows = buildCashFlowRows({ month, income: [], bills: [], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows[0].label).toBe("No activity");
    expect(rows[0].sourceId).toBeUndefined();
    expect(rows[0].canEdit).toBeUndefined();
    expect(rows[0].canDelete).toBeUndefined();
  });

  it("excludes skipped bills from cash flow", () => {
    const month = months[0];
    const skippedBill: BillInstance = { ...bills[0], id: "skipped-test", monthId: month.id, dueDate: "2026-07-02", isSkipped: true };
    const rows = buildCashFlowRows({ month, income: [], bills: [skippedBill], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows.find((row) => row.date === "2026-07-02")?.label).toBe("No activity");
    expect(rows.some((row) => row.label === skippedBill.name)).toBe(false);
  });

  it("includes an unskipped bill in cash flow again", () => {
    const month = months[0];
    const unskippedBill: BillInstance = { ...bills[0], id: "unskipped-test", monthId: month.id, dueDate: "2026-07-02", isSkipped: false };
    const rows = buildCashFlowRows({ month, income: [], bills: [unskippedBill], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows.find((row) => row.sourceId === unskippedBill.id)?.label).toBe(unskippedBill.name);
  });

  it("uses a saved bill actual in cash-flow forecasting", () => {
    const month = months[0];
    const bill: BillInstance = { ...bills[0], id: "actual-bill", monthId: month.id, dueDate: "2026-07-04", expectedAmountCents: 10000, actualAmountCents: 12550, isSkipped: false };
    const rows = buildCashFlowRows({ month, income: [], bills: [bill], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows.find((row) => row.sourceId === bill.id)?.amountCents).toBe(-12600);
  });

  it("falls back to expected bill amount after actual is cleared", () => {
    const month = months[0];
    const bill: BillInstance = { ...bills[0], id: "cleared-bill", monthId: month.id, dueDate: "2026-07-04", expectedAmountCents: 10000, actualAmountCents: null, isSkipped: false };
    const rows = buildCashFlowRows({ month, income: [], bills: [bill], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows.find((row) => row.sourceId === bill.id)?.amountCents).toBe(-10000);
  });

  it("moves a bill to the edited due date in cash flow", () => {
    const month = months[0];
    const bill: BillInstance = { ...bills[0], id: "moved-bill", monthId: month.id, dueDate: "2026-07-10", isSkipped: false };
    const rows = buildCashFlowRows({ month, income: [], bills: [bill], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows.find((row) => row.date === "2026-07-01" && row.sourceId === bill.id)).toBeUndefined();
    expect(rows.find((row) => row.date === "2026-07-10" && row.sourceId === bill.id)?.label).toBe(bill.name);
  });

  it("does not reduce checking cash flow for credit-card spending", () => {
    const month = months[0];
    const creditCardTransaction: SpendingTransaction = { ...transactions[0], id: "cc-test", monthId: month.id, date: "2026-07-03", cashFlowTreatment: "CREDIT_CARD" };
    const rows = buildCashFlowRows({ month, income: [], bills: [], transactions: [creditCardTransaction], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows.some((row) => row.label === creditCardTransaction.merchant)).toBe(false);
    expect(rows.find((row) => row.date === "2026-07-03")?.balanceCents).toBe(month.startingBalanceCents);
  });

  it("uses a saved income actual in cash-flow forecasting", () => {
    const month = months[0];
    const paycheck: IncomeEntry = { id: "actual-income", monthId: month.id, date: "2026-07-03", source: "CS", expectedAmountCents: 100000, actualAmountCents: 125050 };
    const rows = buildCashFlowRows({ month, income: [paycheck], bills: [], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });
    const paycheckRow = rows.find((row) => row.sourceId === paycheck.id);

    expect(paycheckRow?.amountCents).toBe(125000);
  });

  it("falls back to expected income after the saved actual is cleared", () => {
    const month = months[0];
    const paycheck: IncomeEntry = { id: "cleared-income", monthId: month.id, date: "2026-07-03", source: "CS", expectedAmountCents: 100000, actualAmountCents: null };
    const rows = buildCashFlowRows({ month, income: [paycheck], bills: [], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });
    const paycheckRow = rows.find((row) => row.sourceId === paycheck.id);

    expect(paycheckRow?.amountCents).toBe(100000);
    expect(paycheckRow?.amountCents).not.toBe(0);
  });

  it("flags negative projected cash-flow days", () => {
    const month: BudgetMonth = { ...months[0], startingBalanceCents: 10000 };
    const largeBill: BillInstance = { ...bills[0], id: "large-bill", monthId: month.id, dueDate: "2026-07-01", expectedAmountCents: 20000, actualAmountCents: null, isSkipped: false };
    const rows = buildCashFlowRows({ month, income: [], bills: [largeBill], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(rows[0].isNegative).toBe(true);
    expect(rows[0].balanceCents).toBeLessThan(0);
  });

  it("keeps low-balance warnings inactive without a household threshold", () => {
    const month: BudgetMonth = { ...months[0], startingBalanceCents: 40000 };
    const rows = buildCashFlowRows({ month, income: [], bills: [], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [], lowBalanceThresholdCents: null });

    expect(rows[0].isLowBalance).toBe(false);
    expect(getCashFlowSummary(rows, null).nextLowBalanceDate).toBeNull();
  });

  it("flags projected checking balances below the household threshold", () => {
    const month: BudgetMonth = { ...months[0], startingBalanceCents: 60000 };
    const bill: BillInstance = { ...bills[0], id: "low-balance-bill", monthId: month.id, dueDate: "2026-07-02", expectedAmountCents: 20000, actualAmountCents: null, isSkipped: false };
    const rows = buildCashFlowRows({ month, income: [], bills: [bill], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [], lowBalanceThresholdCents: 50000 });
    const summary = getCashFlowSummary(rows, 50000);

    expect(rows.find((row) => row.sourceId === bill.id)?.isLowBalance).toBe(true);
    expect(summary.nextLowBalanceDate).toBe("2026-07-02");
    expect(summary.lowBalanceThresholdCents).toBe(50000);
    expect(summary.majorLowBalanceCauses).toEqual(["Mortgage"]);
  });

  it("keeps negative balances more severe than low-balance warnings", () => {
    const month: BudgetMonth = { ...months[0], startingBalanceCents: 10000 };
    const largeBill: BillInstance = { ...bills[0], id: "negative-not-low", monthId: month.id, dueDate: "2026-07-01", expectedAmountCents: 20000, actualAmountCents: null, isSkipped: false };
    const rows = buildCashFlowRows({ month, income: [], bills: [largeBill], transactions: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [], lowBalanceThresholdCents: 50000 });

    expect(rows[0].isNegative).toBe(true);
    expect(rows[0].isLowBalance).toBe(false);
  });

  it("summarizes cash-flow rows for review cards", () => {
    const rows: CashFlowRow[] = [
      { date: "2026-07-01", label: "Rent", type: "Bill", amountCents: -10000, balanceCents: 90000, isNegative: false, sourceType: "BillInstance", sourceId: "bill-1" },
      { date: "2026-07-02", label: "Large draft", type: "Bill", amountCents: -100000, balanceCents: -10000, isNegative: true, sourceType: "BillInstance", sourceId: "bill-2" },
      { date: "2026-07-03", label: "Paycheck", type: "Income", amountCents: 50000, balanceCents: 40000, isNegative: false, sourceType: "IncomeEntry", sourceId: "income-1" }
    ];

    expect(getCashFlowSummary(rows)).toEqual({ startingBalanceCents: 100000, endingBalanceCents: 40000, lowestBalanceCents: -10000, negativeDayCount: 1, nextRiskDate: "2026-07-02", lowBalanceThresholdCents: null, lowBalanceDayCount: 0, nextLowBalanceDate: null, majorLowBalanceCauses: [] });
  });

  it("includes only active checked future expenses in previews", () => {
    const futureExpense: FutureExpense = { id: "future-1", monthId: "2026-07", description: "School supplies", expectedAmountCents: 45000, dueDate: "2026-07-20", categoryId: "school", priority: "HIGH", type: "ONE_TIME", status: "ACTIVE", setAsideMode: "EQUAL_MONTHLY", includeInPlanPreview: true, contributions: [] };

    expect(getIncludedFutureExpenses([futureExpense, { ...futureExpense, id: "future-2", includeInPlanPreview: false }, { ...futureExpense, id: "future-3", status: "CANCELLED" }])).toEqual([futureExpense]);
  });

  it("adds checked future expenses to preview cash flow without making them editable", () => {
    const month: BudgetMonth = { ...months[0], startingBalanceCents: 50000 };
    const futureExpense: FutureExpense = { id: "future-cash", monthId: month.id, description: "School supplies", expectedAmountCents: 45001, dueDate: "2026-07-04", categoryId: "school", priority: "HIGH", type: "ONE_TIME", status: "ACTIVE", setAsideMode: "EQUAL_MONTHLY", includeInPlanPreview: true, contributions: [] };
    const rows = buildCashFlowRows({ month, income: [], bills: [], transactions: [], plannedExpenses: [], futureExpenses: [futureExpense], includeFutureExpensePreview: true, savingsActivities: [], debtAccounts: [] });
    const row = rows.find((item) => item.sourceId === futureExpense.id);

    expect(row?.type).toBe("Future");
    expect(row?.amountCents).toBe(-45100);
    expect(row?.canEdit).toBeUndefined();
  });

  it("calculates equal monthly and custom future expense set-asides", () => {
    const futureExpense: FutureExpense = { id: "future-setaside", monthId: "2026-08", description: "School supplies", expectedAmountCents: 45000, dueDate: "2026-08-05", categoryId: "school", priority: "HIGH", type: "ONE_TIME", status: "ACTIVE", setAsideMode: "CUSTOM", includeInPlanPreview: true, contributions: [{ id: "c1", futureExpenseId: "future-setaside", monthId: "2026-07", date: "2026-07-15", plannedAmountCents: 20000 }, { id: "c2", futureExpenseId: "future-setaside", monthId: "2026-08", date: "2026-08-01", plannedAmountCents: 25000 }] };

    expect(calculateEqualMonthlySetAside(futureExpense, months, "2026-07")).toBe(22500);
    expect(calculateCustomSetAsideProgress(futureExpense, futureExpense.contributions)).toEqual({ scheduledTotalCents: 45000, remainingCents: 0, isFunded: true });
  });

  it("returns safe empty cash-flow summary values", () => {
    expect(getCashFlowSummary([])).toEqual({ startingBalanceCents: 0, endingBalanceCents: 0, lowestBalanceCents: 0, negativeDayCount: 0, nextRiskDate: null, lowBalanceThresholdCents: null, lowBalanceDayCount: 0, nextLowBalanceDate: null, majorLowBalanceCauses: [] });
  });

  it("keeps activity and risk rows in activity-only cash-flow view", () => {
    const rows: CashFlowRow[] = [
      { date: "2026-07-01", label: "No activity", type: "Transfer", amountCents: 0, balanceCents: 1000, isNegative: false },
      { date: "2026-07-02", label: "Paycheck", type: "Income", amountCents: 5000, balanceCents: 6000, isNegative: false, sourceType: "IncomeEntry", sourceId: "income-1" },
      { date: "2026-07-03", label: "No activity", type: "Transfer", amountCents: 0, balanceCents: -500, isNegative: true },
      { date: "2026-07-04", label: "No activity", type: "Transfer", amountCents: 0, balanceCents: 400, isNegative: false, isLowBalance: true }
    ];

    expect(cashFlowActivityRows(rows).map((row) => row.date)).toEqual(["2026-07-02", "2026-07-03", "2026-07-04"]);
  });

  it("excludes plain calculated no-activity rows from activity-only cash-flow view", () => {
    const rows: CashFlowRow[] = [{ date: "2026-07-01", label: "No activity", type: "Transfer", amountCents: 0, balanceCents: 1000, isNegative: false }];

    expect(cashFlowActivityRows(rows)).toEqual([]);
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

  it("formats today's date for savings date inputs", () => {
    expect(dateInputValue(new Date("2026-07-25T12:00:00.000Z"))).toBe("2026-07-25");
  });

  it("accepts valid savings fund creation and editing inputs", () => {
    expect(createSavingsFundSchema.parse({ name: " Vacation ", type: "SINKING", mode: "KNOWN_DUE_DATE", startingBalanceCents: "100", targetAmountCents: "1200", plannedContributionCents: "100", dueDate: "2026-12-01" })).toEqual({ name: "Vacation", type: "SINKING", mode: "KNOWN_DUE_DATE", startingBalanceCents: 10000, targetAmountCents: 120000, plannedContributionCents: 10000, dueDate: "2026-12-01" });
    expect(updateSavingsFundSchema.parse({ fundId: "fund-1", name: "Emergency", type: "EMERGENCY", mode: "OPEN_ENDED", startingBalanceCents: "0", targetAmountCents: "", plannedContributionCents: "25", dueDate: "" })).toEqual({ fundId: "fund-1", name: "Emergency", type: "EMERGENCY", mode: "OPEN_ENDED", startingBalanceCents: 0, targetAmountCents: undefined, plannedContributionCents: 2500, dueDate: undefined });
    expect(savingsFundIdSchema.parse({ fundId: "fund-1" })).toEqual({ fundId: "fund-1" });
  });

  it("parses open-ended savings fund saves without a due date", () => {
    expect(parseFormOrThrow(updateSavingsFundSchema, { fundId: "fund-1", name: "Emergency", type: "EMERGENCY", mode: "OPEN_ENDED", startingBalanceCents: "0", targetAmountCents: "", plannedContributionCents: "25", dueDate: "" })).toEqual({ fundId: "fund-1", name: "Emergency", type: "EMERGENCY", mode: "OPEN_ENDED", startingBalanceCents: 0, targetAmountCents: undefined, plannedContributionCents: 2500, dueDate: undefined });
  });

  it("rejects invalid savings fund inputs", () => {
    expect(() => createSavingsFundSchema.parse({ name: "", type: "SINKING", mode: "OPEN_ENDED", startingBalanceCents: "0", targetAmountCents: "100", plannedContributionCents: "10", dueDate: "" })).toThrow();
    expect(() => createSavingsFundSchema.parse({ name: "Car", type: "SINKING", mode: "KNOWN_DUE_DATE", startingBalanceCents: "0", targetAmountCents: "100", plannedContributionCents: "10", dueDate: "" })).toThrow();
    expect(() => createSavingsFundSchema.parse({ name: "Car", type: "SINKING", mode: "OPEN_ENDED", startingBalanceCents: "-1", targetAmountCents: "100", plannedContributionCents: "10", dueDate: "" })).toThrow();
    expect(() => savingsFundIdSchema.parse({ fundId: "" })).toThrow();
  });

  it("throws readable validation messages for invalid savings fund saves", () => {
    expect(() => parseFormOrThrow(updateSavingsFundSchema, { fundId: "fund-1", name: "Car", type: "SINKING", mode: "KNOWN_DUE_DATE", startingBalanceCents: "0", targetAmountCents: "100", plannedContributionCents: "10", dueDate: "" })).toThrow("Due date is required for known due date funds.");
    expect(() => parseFormOrThrow(updateSavingsFundSchema, { fundId: "fund-1", name: "Car", type: "SINKING", mode: "OPEN_ENDED", startingBalanceCents: "not money", targetAmountCents: "100", plannedContributionCents: "10", dueDate: "" })).toThrow("Amount must be a valid number.");
  });

  it("accepts valid debt card account and payment inputs", () => {
    expect(createDebtAccountSchema.parse({ name: " Travel Card ", startingBalanceCents: "500", currentBalanceCents: "450.25", interestRatePercent: "21.99%", minimumPaymentCents: "40", extraPaymentCents: "10", dueDay: "18" })).toEqual({ name: "Travel Card", startingBalanceCents: 50000, currentBalanceCents: 45025, interestRatePercent: 21.99, minimumPaymentCents: 4000, extraPaymentCents: 1000, dueDay: 18 });
    expect(updateDebtAccountSchema.parse({ debtAccountId: "card-1", name: "Main Card", startingBalanceCents: "", currentBalanceCents: "0", interestRatePercent: "0", minimumPaymentCents: "", extraPaymentCents: "", dueDay: "1" })).toEqual({ debtAccountId: "card-1", name: "Main Card", startingBalanceCents: 0, currentBalanceCents: 0, interestRatePercent: 0, minimumPaymentCents: 0, extraPaymentCents: 0, dueDay: 1 });
    expect(debtPaymentSchema.parse({ debtAccountId: "card-1", dueDate: "2026-07-20", minimumPaymentCents: "25", extraPaymentCents: "0", actualPaymentCents: "" })).toEqual({ debtAccountId: "card-1", dueDate: "2026-07-20", minimumPaymentCents: 2500, extraPaymentCents: 0, actualPaymentCents: undefined });
    expect(debtAccountIdSchema.parse({ debtAccountId: "card-1" })).toEqual({ debtAccountId: "card-1" });
  });

  it("rejects invalid debt card account inputs with readable messages", () => {
    expect(() => parseFormOrThrow(createDebtAccountSchema, { name: "", startingBalanceCents: "0", currentBalanceCents: "0", interestRatePercent: "10", minimumPaymentCents: "0", extraPaymentCents: "0", dueDay: "15" })).toThrow("Card name is required.");
    expect(() => parseFormOrThrow(createDebtAccountSchema, { name: "Card", startingBalanceCents: "0", currentBalanceCents: "0", interestRatePercent: "not apr", minimumPaymentCents: "0", extraPaymentCents: "0", dueDay: "15" })).toThrow("APR must be a valid number.");
    expect(() => parseFormOrThrow(createDebtAccountSchema, { name: "Card", startingBalanceCents: "0", currentBalanceCents: "0", interestRatePercent: "10", minimumPaymentCents: "0", extraPaymentCents: "0", dueDay: "32" })).toThrow("Due day must be between 1 and 31.");
    expect(() => parseFormOrThrow(createDebtAccountSchema, { name: "Card", startingBalanceCents: "0", currentBalanceCents: "-1", interestRatePercent: "10", minimumPaymentCents: "0", extraPaymentCents: "0", dueDay: "15" })).toThrow("Amount cannot be negative.");
    expect(() => parseFormOrThrow(debtPaymentSchema, { debtAccountId: "", dueDate: "2026-07-20", minimumPaymentCents: "25", extraPaymentCents: "0", actualPaymentCents: undefined })).toThrow("Choose a card before adding a payment.");
  });

  it("decides whether a debt card can be hard-deleted", () => {
    expect(canDeleteDebtAccount(0, 0)).toBe(true);
    expect(canDeleteDebtAccount(1, 0)).toBe(false);
    expect(canDeleteDebtAccount(0, 1)).toBe(false);
  });

  it("throws readable validation messages for common form failures", () => {
    expect(() => parseFormOrThrow(noteSchema, { body: "" })).toThrow("Note cannot be blank.");
    expect(() => parseFormOrThrow(updateBillInstanceSchema, { id: "bill-1", dueDate: "07/18/2026", actualAmountCents: "72.88" })).toThrow("Date must use YYYY-MM-DD.");
    expect(() => parseFormOrThrow(createCategorySchema, { name: "Pets", baseMonthlyBudgetCents: "-1.00" })).toThrow("Amount cannot be negative.");
    expect(() => parseFormOrThrow(createSavingsFundSchema, { name: "Car", type: "SINKING", mode: "OPEN_ENDED", startingBalanceCents: "", targetAmountCents: "", plannedContributionCents: "", dueDate: "" })).not.toThrow();
  });

  it("shows Shopping Guardrail category warnings", () => {
    const month = months[0];
    const category = { id: "guardrail-category", name: "Guardrail", baseMonthlyBudgetCents: 10000, isActive: true };
    const transaction: SpendingTransaction = { ...transactions[0], id: "guardrail-spent", monthId: month.id, totalAmountCents: 7000, splits: [{ categoryId: category.id, amountCents: 7000 }] };
    const preview = calculateShoppingGuardrailPreview({ check: { monthId: month.id, date: "2026-07-10", merchant: "Store", categoryId: category.id, amountCents: 1500, cashFlowTreatment: "CREDIT_CARD" }, month, categories: [category], transactions: [transaction], income: [], bills: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(preview.warnings).toContain("Near category limit");
    expect(preview.projectedBalanceAfterPurchaseCents).toBeNull();
  });

  it("shows Shopping Guardrail over-category warnings", () => {
    const month = months[0];
    const category = { id: "guardrail-over", name: "Guardrail", baseMonthlyBudgetCents: 10000, isActive: true };
    const preview = calculateShoppingGuardrailPreview({ check: { monthId: month.id, date: "2026-07-10", merchant: "Store", categoryId: category.id, amountCents: 11000, cashFlowTreatment: "CREDIT_CARD" }, month, categories: [category], transactions: [], income: [], bills: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(preview.warnings).toContain("Over category");
    expect(preview.requiresConfirmation).toBe(true);
  });

  it("shows Shopping Guardrail cash/debit cash-flow warnings", () => {
    const month: BudgetMonth = { ...months[0], startingBalanceCents: 10000 };
    const category = { id: "guardrail-cash", name: "Guardrail", baseMonthlyBudgetCents: 50000, isActive: true };
    const preview = calculateShoppingGuardrailPreview({ check: { monthId: month.id, date: "2026-07-03", merchant: "Store", categoryId: category.id, amountCents: 15000, cashFlowTreatment: "CASH_DEBIT" }, month, categories: [category], transactions: [], income: [], bills: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [] });

    expect(preview.warnings).toContain("Negative cash-flow risk");
    expect(preview.projectedBalanceAfterPurchaseCents).toBeLessThan(0);
  });

  it("keeps Shopping Guardrail credit-card checks out of cash-flow preview", () => {
    const month: BudgetMonth = { ...months[0], startingBalanceCents: 10000 };
    const category = { id: "guardrail-card", name: "Guardrail", baseMonthlyBudgetCents: 50000, isActive: true };
    const preview = calculateShoppingGuardrailPreview({ check: { monthId: month.id, date: "2026-07-03", merchant: "Store", categoryId: category.id, amountCents: 15000, cashFlowTreatment: "CREDIT_CARD" }, month, categories: [category], transactions: [], income: [], bills: [], plannedExpenses: [], savingsActivities: [], debtAccounts: [], lowBalanceThresholdCents: 50000 });

    expect(preview.warnings).not.toContain("Negative cash-flow risk");
    expect(preview.warnings).not.toContain("Low-balance risk");
    expect(preview.projectedBalanceAfterPurchaseCents).toBeNull();
  });

  it("expires open Shopping Guardrail requests after the purchase date", () => {
    expect(getEffectiveShoppingCheckStatus("PENDING_APPROVAL", "2026-07-01", "2026-07-02")).toBe("EXPIRED");
    expect(getEffectiveShoppingCheckStatus("APPROVED", "2026-07-01", "2026-07-02")).toBe("APPROVED");
  });

  it("accepts blank and non-negative low-balance thresholds", () => {
    expect(lowBalanceThresholdSchema.parse({ lowBalanceThresholdCents: "" })).toEqual({ lowBalanceThresholdCents: null });
    expect(lowBalanceThresholdSchema.parse({ lowBalanceThresholdCents: "500" })).toEqual({ lowBalanceThresholdCents: 50000 });
    expect(lowBalanceThresholdSchema.parse({ lowBalanceThresholdCents: "$1,250.25" })).toEqual({ lowBalanceThresholdCents: 125025 });
  });

  it("rejects invalid or negative low-balance thresholds", () => {
    expect(() => lowBalanceThresholdSchema.parse({ lowBalanceThresholdCents: "not money" })).toThrow();
    expect(() => lowBalanceThresholdSchema.parse({ lowBalanceThresholdCents: "-1" })).toThrow();
  });

  it("shows goal met without changing the monthly plan", () => {
    const fund: SavingsFund = { id: "fund-1", name: "Goal", type: "Sinking Fund", mode: "Known Due Date", startingBalanceCents: 0, currentBalanceCents: 100000, targetAmountCents: 100000, dueDate: "2026-12-01", plannedContributionCents: 2500, isActive: true };

    expect(getSavingsFundStatus(fund, 100000, "2026-07-25")).toEqual({ label: "Goal met", shortfallCents: 0, progressPercent: 100 });
    expect(fund.plannedContributionCents).toBe(2500);
  });

  it("flags overdue savings funds as short", () => {
    const fund: SavingsFund = { id: "fund-1", name: "Short", type: "Sinking Fund", mode: "Known Due Date", startingBalanceCents: 0, currentBalanceCents: 40000, targetAmountCents: 100000, dueDate: "2026-07-01", plannedContributionCents: 10000, isActive: true };

    expect(getSavingsFundStatus(fund, 40000, "2026-07-25")).toEqual({ label: "Short", shortfallCents: 60000, progressPercent: 40 });
  });

  it("shows due soon and open-ended savings statuses", () => {
    const dueSoon: SavingsFund = { id: "fund-1", name: "Soon", type: "Sinking Fund", mode: "Known Due Date", startingBalanceCents: 0, currentBalanceCents: 40000, targetAmountCents: 100000, dueDate: "2026-08-01", plannedContributionCents: 10000, isActive: true };
    const openEnded: SavingsFund = { id: "fund-2", name: "Emergency", type: "Emergency", mode: "Open Ended", startingBalanceCents: 0, currentBalanceCents: 40000, targetAmountCents: null, plannedContributionCents: 10000, isActive: true };

    expect(getSavingsFundStatus(dueSoon, 40000, "2026-07-25").label).toBe("Due soon");
    expect(getSavingsFundStatus(openEnded, 40000, "2026-07-25").label).toBe("Open ended");
  });

  it("hides inactive savings funds and blocks deleting used funds", () => {
    expect(activeSavingsFunds([{ ...savingsFunds[0], isActive: true }, { ...savingsFunds[1], isActive: false }]).map((fund) => fund.id)).toEqual([savingsFunds[0].id]);
    expect(canDeleteSavingsFund(0)).toBe(true);
    expect(canDeleteSavingsFund(1)).toBe(false);
  });

  it("classifies planned and actual savings activity", () => {
    expect(getSavingsActivityKind({ id: "planned", fundId: "fund", monthId: "2026-07", date: "2026-07-15", type: "CONTRIBUTION", plannedAmountCents: 1000, actualAmountCents: null })).toBe("Planned");
    expect(getSavingsActivityKind({ id: "actual", fundId: "fund", monthId: "2026-07", date: "2026-07-15", type: "CONTRIBUTION", plannedAmountCents: null, actualAmountCents: 1000 })).toBe("Actual");
  });

  it("uses actual savings activity amount first and falls back safely", () => {
    expect(getSavingsActivityAmount({ id: "actual", fundId: "fund", monthId: "2026-07", date: "2026-07-15", type: "CONTRIBUTION", plannedAmountCents: 2000, actualAmountCents: 1000 })).toBe(1000);
    expect(getSavingsActivityAmount({ id: "planned", fundId: "fund", monthId: "2026-07", date: "2026-07-15", type: "CONTRIBUTION", plannedAmountCents: 2000, actualAmountCents: null })).toBe(2000);
    expect(getSavingsActivityAmount({ id: "empty", fundId: "fund", monthId: "2026-07", date: "2026-07-15", type: "CONTRIBUTION", plannedAmountCents: null, actualAmountCents: null })).toBe(0);
  });

  it("keeps known sample categories active", () => {
    expect(categories.find((category) => category.name === "Groceries")?.baseMonthlyBudgetCents).toBe(100000);
    expect(categories.find((category) => category.name === "Fuel")?.baseMonthlyBudgetCents).toBe(25000);
  });

  it("accepts valid income actual updates and clear-actual ids", () => {
    expect(updateIncomeActualSchema.parse({ id: "income-1", actualAmountCents: "2456.78" })).toEqual({ id: "income-1", actualAmountCents: 245678 });
    expect(incomeEntryIdSchema.parse({ id: "income-1" })).toEqual({ id: "income-1" });
  });

  it("rejects income actual updates without an id", () => {
    expect(() => updateIncomeActualSchema.parse({ id: "", actualAmountCents: "2456.78" })).toThrow();
    expect(() => incomeEntryIdSchema.parse({ id: "" })).toThrow();
  });

  it("rejects invalid or negative income actual values", () => {
    expect(() => updateIncomeActualSchema.parse({ id: "income-1", actualAmountCents: "" })).toThrow();
    expect(() => updateIncomeActualSchema.parse({ id: "income-1", actualAmountCents: "-1.00" })).toThrow();
    expect(() => updateIncomeActualSchema.parse({ id: "income-1", actualAmountCents: "not money" })).toThrow();
  });

  it("accepts valid bill updates and status ids", () => {
    expect(updateBillInstanceSchema.parse({ id: "bill-1", dueDate: "2026-07-18", actualAmountCents: "72.88" })).toEqual({ id: "bill-1", dueDate: "2026-07-18", actualAmountCents: 7288 });
    expect(updateBillInstanceSchema.parse({ id: "bill-1", dueDate: "2026-07-18", actualAmountCents: "" })).toEqual({ id: "bill-1", dueDate: "2026-07-18", actualAmountCents: undefined });
    expect(updateBillSchema.parse({ id: "bill-1", paidDate: "2026-07-18", actualAmountCents: "" })).toEqual({ id: "bill-1", paidDate: "2026-07-18", actualAmountCents: undefined });
    expect(billIdSchema.parse({ id: "bill-1" })).toEqual({ id: "bill-1" });
  });

  it("rejects bill updates without ids or valid due dates", () => {
    expect(() => updateBillInstanceSchema.parse({ id: "", dueDate: "2026-07-18", actualAmountCents: "72.88" })).toThrow();
    expect(() => updateBillInstanceSchema.parse({ id: "bill-1", dueDate: "07/18/2026", actualAmountCents: "72.88" })).toThrow();
    expect(() => billIdSchema.parse({ id: "" })).toThrow();
  });

  it("rejects invalid or negative bill actual values", () => {
    expect(() => updateBillInstanceSchema.parse({ id: "bill-1", dueDate: "2026-07-18", actualAmountCents: "-1.00" })).toThrow();
    expect(() => updateBillInstanceSchema.parse({ id: "bill-1", dueDate: "2026-07-18", actualAmountCents: "not money" })).toThrow();
    expect(() => updateBillSchema.parse({ id: "bill-1", paidDate: "2026-07-18", actualAmountCents: "not money" })).toThrow();
  });

  it("accepts valid category creation and defaults blank budgets to zero", () => {
    expect(createCategorySchema.parse({ name: " Pets ", baseMonthlyBudgetCents: "75.25" })).toEqual({ name: "Pets", baseMonthlyBudgetCents: 7525 });
    expect(createCategorySchema.parse({ name: "Pets", baseMonthlyBudgetCents: "" })).toEqual({ name: "Pets", baseMonthlyBudgetCents: 0 });
  });

  it("accepts valid Shopping Guardrail inputs", () => {
    expect(createShoppingCheckSchema.parse({ date: "2026-08-04", merchant: " Target ", amountCents: "180", categoryId: "category-1", cashFlowTreatment: "CASH_DEBIT", requestNote: "Check first", intent: "ASK_SPOUSE" })).toEqual({ date: "2026-08-04", merchant: "Target", amountCents: 18000, categoryId: "category-1", cashFlowTreatment: "CASH_DEBIT", requestNote: "Check first", intent: "ASK_SPOUSE" });
  });

  it("rejects invalid Shopping Guardrail inputs", () => {
    expect(() => createShoppingCheckSchema.parse({ date: "2026-08-04", merchant: "", amountCents: "180", categoryId: "category-1", cashFlowTreatment: "CASH_DEBIT", intent: "ASK_SPOUSE" })).toThrow();
    expect(() => createShoppingCheckSchema.parse({ date: "2026-08-04", merchant: "Target", amountCents: "-1", categoryId: "category-1", cashFlowTreatment: "CASH_DEBIT", intent: "ASK_SPOUSE" })).toThrow();
  });

  it("rejects invalid category creation inputs", () => {
    expect(() => createCategorySchema.parse({ name: "   ", baseMonthlyBudgetCents: "10.00" })).toThrow();
    expect(() => createCategorySchema.parse({ name: "Pets", baseMonthlyBudgetCents: "-1.00" })).toThrow();
    expect(() => createCategorySchema.parse({ name: "Pets", baseMonthlyBudgetCents: "not money" })).toThrow();
  });

  it("accepts valid category rename and id actions", () => {
    expect(renameCategorySchema.parse({ categoryId: "category-1", name: " Travel " })).toEqual({ categoryId: "category-1", name: "Travel" });
    expect(categoryIdSchema.parse({ categoryId: "category-1" })).toEqual({ categoryId: "category-1" });
  });

  it("rejects category actions without required values", () => {
    expect(() => renameCategorySchema.parse({ categoryId: "category-1", name: "" })).toThrow();
    expect(() => renameCategorySchema.parse({ categoryId: "", name: "Travel" })).toThrow();
    expect(() => categoryIdSchema.parse({ categoryId: "" })).toThrow();
  });

  it("shows only active categories in normal category UI", () => {
    expect(activeCategories([
      { id: "active", name: "Active", baseMonthlyBudgetCents: 1000, isActive: true },
      { id: "inactive", name: "Inactive", baseMonthlyBudgetCents: 1000, isActive: false }
    ])).toEqual([{ id: "active", name: "Active", baseMonthlyBudgetCents: 1000, isActive: true }]);
  });

  it("allows deleting only unused categories", () => {
    expect(canDeleteCategory({ transactionSplits: 0, plannedExpenses: 0 })).toBe(true);
    expect(canDeleteCategory({ transactionSplits: 1, plannedExpenses: 0 })).toBe(false);
    expect(canDeleteCategory({ transactionSplits: 0, plannedExpenses: 1 })).toBe(false);
  });

  it("limits recent transaction-style lists to the requested count", () => {
    expect(recentItems(["one", "two", "three"], 2)).toEqual(["one", "two"]);
    expect(recentItems(["one", "two"], 12)).toEqual(["one", "two"]);
  });

  it("returns no recent items for invalid visible counts", () => {
    expect(recentItems(["one", "two"], 0)).toEqual([]);
    expect(recentItems(["one", "two"], -1)).toEqual([]);
  });
});
