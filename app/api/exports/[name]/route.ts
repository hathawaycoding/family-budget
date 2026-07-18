import { NextResponse } from "next/server";
import { toCsv } from "@/lib/reports";
import { getBudgetData, getMonthBundle } from "@/lib/services/budget-data-service";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const key = name.replace(".csv", "");
  const [data, bundle] = await Promise.all([getBudgetData(), getMonthBundle("2026-07")]);
  const { auditEvents, bills, debtAccounts, savingsFunds, transactions } = data;
  const rows: Record<string, string | number | boolean | null | undefined>[] = key === "transactions" ? transactions.map((tx) => ({ date: tx.date, merchant: tx.merchant, amountCents: tx.totalAmountCents, treatment: tx.cashFlowTreatment }))
    : key === "bills" ? bills.map((bill) => ({ dueDate: bill.dueDate, name: bill.name, expectedAmountCents: bill.expectedAmountCents, paid: bill.isPaid, skipped: bill.isSkipped }))
    : key === "cash-flow" ? bundle.cashFlowRows.map((row) => ({ date: row.date, label: row.label, type: row.type, amountCents: row.amountCents, balanceCents: row.balanceCents }))
    : key === "debt-balances" ? debtAccounts.map((debt) => ({ name: debt.name, currentBalanceCents: debt.currentBalanceCents, interestRatePercent: debt.interestRatePercent }))
    : key === "savings-goals" ? savingsFunds.map((fund) => ({ name: fund.name, currentBalanceCents: fund.currentBalanceCents, targetAmountCents: fund.targetAmountCents, dueDate: fund.dueDate }))
    : key === "planned-vs-actual" ? [{ month: bundle.month.label, plannedIncomeCents: bundle.summary.expectedIncomeCents, assignedCents: bundle.summary.assignedCents, unassignedCents: bundle.summary.unassignedCents }]
    : key === "monthly-summary" ? [{ month: bundle.month.label, status: bundle.summary.status, incomeCents: bundle.summary.expectedIncomeCents, billsCents: bundle.summary.expectedBillsCents, assignedCents: bundle.summary.assignedCents }]
    : auditEvents;
  return new NextResponse(toCsv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${key}.csv"` } });
}
