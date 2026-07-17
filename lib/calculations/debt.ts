import type { DebtAccount } from "@/lib/types";

export function estimatedMonthlyInterestCents(debt: DebtAccount): number {
  return Math.round(debt.currentBalanceCents * (debt.interestRatePercent / 100) / 12);
}

export function projectedDebtTrend(debt: DebtAccount, months = 6) {
  let balance = debt.currentBalanceCents;
  return Array.from({ length: months }, (_, index) => {
    const interest = Math.round(balance * (debt.interestRatePercent / 100) / 12);
    balance = Math.max(0, balance + interest - debt.minimumPaymentCents - debt.extraPaymentCents);
    return { month: index + 1, balanceCents: balance };
  });
}
