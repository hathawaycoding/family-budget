import type { SpendingCategory } from "@/lib/types";

export function activeCategories(categories: SpendingCategory[]) {
  return categories.filter((category) => category.isActive);
}

export function canDeleteCategory(usage: { transactionSplits: number; plannedExpenses: number }) {
  return usage.transactionSplits === 0 && usage.plannedExpenses === 0;
}

export function recentItems<T>(items: T[], limit = 12) {
  if (limit <= 0) return [];
  return items.slice(0, limit);
}
