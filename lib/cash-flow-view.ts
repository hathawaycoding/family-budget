import type { CashFlowRow } from "@/lib/types";

export function cashFlowActivityRows(rows: CashFlowRow[]) {
  return rows.filter((row) => Boolean(row.sourceId && row.sourceType) || row.isNegative);
}

export function getCashFlowSummary(rows: CashFlowRow[]) {
  if (rows.length === 0) {
    return { startingBalanceCents: 0, endingBalanceCents: 0, lowestBalanceCents: 0, negativeDayCount: 0, nextRiskDate: null as string | null };
  }

  const first = rows[0];
  const startingBalanceCents = first.balanceCents - first.amountCents;
  const endingBalanceCents = rows.at(-1)?.balanceCents ?? 0;
  const lowestBalanceCents = Math.min(...rows.map((row) => row.balanceCents));
  const negativeRows = rows.filter((row) => row.isNegative);

  return {
    startingBalanceCents,
    endingBalanceCents,
    lowestBalanceCents,
    negativeDayCount: negativeRows.length,
    nextRiskDate: negativeRows[0]?.date ?? null
  };
}
