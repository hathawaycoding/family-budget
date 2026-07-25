import type { SavingsActivity, SavingsFund } from "@/lib/types";

export type SavingsFundStatus = {
  label: "Goal met" | "Short" | "Due soon" | "On track" | "Open ended" | "No target";
  shortfallCents: number;
  progressPercent: number | null;
};

export function getSavingsBalance(fund: SavingsFund, activities: SavingsActivity[]) {
  return activities.filter((activity) => activity.fundId === fund.id).reduce((balance, activity) => {
    const amount = activity.actualAmountCents ?? activity.plannedAmountCents ?? 0;
    return activity.type === "WITHDRAWAL" ? balance - amount : balance + amount;
  }, fund.startingBalanceCents);
}

export function canWithdraw(fund: SavingsFund, activities: SavingsActivity[], amountCents: number) {
  return getSavingsBalance(fund, activities) - amountCents >= 0;
}

export function activeSavingsFunds(funds: SavingsFund[]) {
  return funds.filter((fund) => fund.isActive);
}

export function canDeleteSavingsFund(activityCount: number) {
  return activityCount === 0;
}

export function getSavingsActivityAmount(activity: SavingsActivity) {
  return activity.actualAmountCents ?? activity.plannedAmountCents ?? 0;
}

export function getSavingsActivityKind(activity: SavingsActivity) {
  return activity.actualAmountCents == null && activity.plannedAmountCents != null ? "Planned" : "Actual";
}

export function getSavingsFundStatus(fund: SavingsFund, balanceCents: number, today: string): SavingsFundStatus {
  const target = fund.targetAmountCents ?? null;
  const shortfallCents = target == null ? 0 : Math.max(target - balanceCents, 0);
  const progressPercent = target == null || target <= 0 ? null : Math.min(100, Math.round((balanceCents / target) * 100));

  if (target != null && target > 0 && balanceCents >= target) return { label: "Goal met", shortfallCents: 0, progressPercent };
  if (target == null || target <= 0) return { label: fund.mode === "Open Ended" ? "Open ended" : "No target", shortfallCents: 0, progressPercent };
  if (fund.dueDate && fund.dueDate <= today) return { label: "Short", shortfallCents, progressPercent };
  if (fund.dueDate) {
    const due = new Date(`${fund.dueDate}T00:00:00.000Z`).getTime();
    const current = new Date(`${today}T00:00:00.000Z`).getTime();
    if (due - current <= 30 * 24 * 60 * 60 * 1000) return { label: "Due soon", shortfallCents, progressPercent };
    return { label: "On track", shortfallCents, progressPercent };
  }

  return { label: "On track", shortfallCents, progressPercent };
}
