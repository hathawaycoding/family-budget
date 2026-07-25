import type { BillInstance } from "@/lib/types";

export type BillStatusTone = "default" | "good" | "warn" | "bad" | "info";

export type BillStatusPill = {
  label: string;
  tone: BillStatusTone;
};

export function getBillsSummary(bills: BillInstance[]) {
  return {
    totalExpectedCents: bills.filter((bill) => !bill.isSkipped).reduce((sum, bill) => sum + bill.expectedAmountCents, 0),
    paidCount: bills.filter((bill) => bill.isPaid && !bill.isSkipped).length,
    unpaidCount: bills.filter((bill) => !bill.isPaid && !bill.isSkipped).length,
    skippedCount: bills.filter((bill) => bill.isSkipped).length
  };
}

export function getBillStatusPills(bill: BillInstance): BillStatusPill[] {
  const pills: BillStatusPill[] = [];

  if (bill.isSkipped) {
    pills.push({ label: "Skipped", tone: "warn" });
  } else if (bill.isPaid) {
    pills.push({ label: "Paid", tone: "good" });
  } else {
    pills.push({ label: "Unpaid", tone: "bad" });
  }

  pills.push(bill.isAutopay ? { label: "Autopay", tone: "info" } : { label: "Manual", tone: "default" });

  if (bill.paidDate) {
    pills.push({ label: `Paid ${bill.paidDate}`, tone: "default" });
  }

  if (bill.actualAmountCents != null && bill.actualAmountCents !== bill.expectedAmountCents) {
    pills.push({ label: "Changed", tone: "warn" });
  }

  return pills;
}

export function formatBillDisplayDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
}
