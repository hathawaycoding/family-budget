import { bills, categories, debtAccounts, income, months, plannedExpenses, savingsActivities, transactions } from "@/lib/sample-data";
import { buildCashFlowRows } from "@/lib/calculations/cash-flow";
import { getZeroBasedSummary } from "@/lib/calculations/zero-based-budget";

export function getMonthBundle(monthId: string) {
  const month = months.find((item) => item.id === monthId) ?? months[0];
  const monthIncome = income.filter((item) => item.monthId === month.id);
  const monthBills = bills.filter((item) => item.monthId === month.id);
  const monthTransactions = transactions.filter((item) => item.monthId === month.id);
  const monthPlanned = plannedExpenses.filter((item) => item.monthId === month.id);
  const monthSavings = savingsActivities.filter((item) => item.monthId === month.id);
  const cashFlowRows = buildCashFlowRows({ month, income: monthIncome, bills: monthBills, transactions: monthTransactions, plannedExpenses: monthPlanned, savingsActivities: monthSavings, debtAccounts });
  const summary = getZeroBasedSummary({ month, income: monthIncome, bills: monthBills, categories, plannedExpenses: monthPlanned, savingsActivities: monthSavings, debtAccounts, hasCashFlowRisk: cashFlowRows.some((row) => row.isNegative) });
  return { month, income: monthIncome, bills: monthBills, transactions: monthTransactions, plannedExpenses: monthPlanned, savingsActivities: monthSavings, cashFlowRows, summary };
}

export function toCsv(rows: Array<Record<string, string | number | boolean | null | undefined>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}
