import type { SavingsActivity, SavingsFund } from "@/lib/types";

export function getSavingsBalance(fund: SavingsFund, activities: SavingsActivity[]) {
  return activities.filter((activity) => activity.fundId === fund.id).reduce((balance, activity) => {
    const amount = activity.actualAmountCents ?? activity.plannedAmountCents ?? 0;
    return activity.type === "WITHDRAWAL" ? balance - amount : balance + amount;
  }, fund.startingBalanceCents);
}

export function canWithdraw(fund: SavingsFund, activities: SavingsActivity[], amountCents: number) {
  return getSavingsBalance(fund, activities) - amountCents >= 0;
}
