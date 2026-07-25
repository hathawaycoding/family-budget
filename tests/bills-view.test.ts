import { describe, expect, it } from "vitest";
import { formatBillDisplayDate, getBillStatusPills, getBillsSummary } from "@/lib/bills-view";
import type { BillInstance } from "@/lib/types";

function bill(overrides: Partial<BillInstance>): BillInstance {
  return {
    id: "bill-1",
    monthId: "2026-07",
    name: "Internet",
    category: "Utilities",
    expectedAmountCents: 7100,
    actualAmountCents: null,
    dueDate: "2026-07-18",
    paidDate: null,
    isPaid: false,
    isAutopay: false,
    isSkipped: false,
    ...overrides
  };
}

describe("bills view helpers", () => {
  it("summarizes active paid and unpaid bills", () => {
    const summary = getBillsSummary([
      bill({ id: "paid", expectedAmountCents: 434000, isPaid: true }),
      bill({ id: "unpaid", expectedAmountCents: 16000, isPaid: false })
    ]);

    expect(summary).toEqual({ totalExpectedCents: 450000, paidCount: 1, unpaidCount: 1, skippedCount: 0 });
  });

  it("does not count skipped bills as expected, paid, or unpaid", () => {
    const summary = getBillsSummary([
      bill({ id: "active", expectedAmountCents: 10000, isPaid: false, isSkipped: false }),
      bill({ id: "skipped-paid", expectedAmountCents: 50000, isPaid: true, isSkipped: true }),
      bill({ id: "skipped-unpaid", expectedAmountCents: 25000, isPaid: false, isSkipped: true })
    ]);

    expect(summary.totalExpectedCents).toBe(10000);
    expect(summary.paidCount).toBe(0);
    expect(summary.unpaidCount).toBe(1);
    expect(summary.skippedCount).toBe(2);
  });

  it("builds compact status pills for a paid autopay bill with a changed actual", () => {
    expect(getBillStatusPills(bill({ isPaid: true, isAutopay: true, paidDate: "2026-07-18", actualAmountCents: 7288 }))).toEqual([
      { label: "Paid", tone: "good" },
      { label: "Autopay", tone: "info" },
      { label: "Paid 2026-07-18", tone: "default" },
      { label: "Changed", tone: "warn" }
    ]);
  });

  it("does not show changed when actual matches expected", () => {
    const labels = getBillStatusPills(bill({ actualAmountCents: 7100 })).map((pill) => pill.label);

    expect(labels).toContain("Unpaid");
    expect(labels).toContain("Manual");
    expect(labels).not.toContain("Changed");
  });

  it("prefers skipped status over paid status", () => {
    const labels = getBillStatusPills(bill({ isPaid: true, isSkipped: true })).map((pill) => pill.label);

    expect(labels).toContain("Skipped");
    expect(labels).not.toContain("Paid");
    expect(labels).not.toContain("Unpaid");
  });

  it("formats bill dates for compact table display", () => {
    expect(formatBillDisplayDate("2026-07-18")).toBe("07/18/2026");
  });
});
