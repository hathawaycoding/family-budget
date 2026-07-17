import { addDays, dateOnly, daysInMonth, monthNames } from "@/lib/dates";
import type { BudgetMonth, IncomeEntry } from "@/lib/types";

export function generateBudgetMonths(): BudgetMonth[] {
  let rollingBalance = 541469;
  return [7, 8, 9, 10, 11, 12].map((month) => {
    const id = `2026-${String(month).padStart(2, "0")}`;
    const item = {
      id,
      label: `${monthNames[month - 1]} 2026`,
      year: 2026,
      month,
      startDate: dateOnly(2026, month, 1),
      endDate: dateOnly(2026, month, daysInMonth(2026, month)),
      startingBalanceCents: rollingBalance,
      isClosed: false
    } satisfies BudgetMonth;
    rollingBalance = rollingBalance - 10000;
    return item;
  });
}

export function generatePaychecks(source: "CS" | "TCH", startDate: string, expectedAmountCents: number): IncomeEntry[] {
  const entries: IncomeEntry[] = [];
  let cursor = startDate;
  while (cursor <= "2026-12-31") {
    entries.push({
      id: `${source}-${cursor}`,
      source,
      date: cursor,
      monthId: cursor.slice(0, 7),
      expectedAmountCents,
      actualAmountCents: null
    });
    cursor = addDays(cursor, 14);
  }
  return entries;
}
