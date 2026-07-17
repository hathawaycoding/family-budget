import type { SpendingCategory, SpendingTransaction } from "@/lib/types";

export function getCategoryCarryover(categories: SpendingCategory[], transactions: SpendingTransaction[], monthId: string) {
  return categories.filter((category) => category.isActive).map((category) => {
    const actualSpentCents = transactions
      .filter((tx) => tx.monthId <= monthId)
      .flatMap((tx) => tx.splits)
      .filter((split) => split.categoryId === category.id)
      .reduce((sum, split) => sum + split.amountCents, 0);
    const monthsElapsed = monthId === "2026-07" ? 1 : Number(monthId.slice(5, 7)) - 6;
    const availableBudgetCents = category.baseMonthlyBudgetCents * monthsElapsed;
    const remainingCents = availableBudgetCents - actualSpentCents;
    const usage = availableBudgetCents === 0 ? 0 : actualSpentCents / availableBudgetCents;
    return {
      category,
      priorCarryoverCents: monthId === "2026-07" ? 0 : remainingCents - category.baseMonthlyBudgetCents,
      availableBudgetCents,
      actualSpentCents,
      remainingCents,
      carryoverToNextCents: remainingCents,
      isWarning: usage >= 0.8
    };
  });
}
