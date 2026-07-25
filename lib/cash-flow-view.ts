import type { CashFlowRow } from "@/lib/types";

export function cashFlowActivityRows(rows: CashFlowRow[]) {
  return rows.filter((row) => Boolean(row.sourceId && row.sourceType) || row.isNegative || row.isLowBalance);
}

export function getCashFlowSummary(rows: CashFlowRow[], lowBalanceThresholdCents?: number | null) {
  if (rows.length === 0) {
    return { startingBalanceCents: 0, endingBalanceCents: 0, lowestBalanceCents: 0, negativeDayCount: 0, nextRiskDate: null as string | null, lowBalanceThresholdCents: lowBalanceThresholdCents ?? null, lowBalanceDayCount: 0, nextLowBalanceDate: null as string | null, majorLowBalanceCauses: [] as string[] };
  }

  const first = rows[0];
  const startingBalanceCents = first.balanceCents - first.amountCents;
  const endingBalanceCents = rows.at(-1)?.balanceCents ?? 0;
  const lowestBalanceCents = Math.min(...rows.map((row) => row.balanceCents));
  const negativeRows = rows.filter((row) => row.isNegative);
  const lowBalanceRows = rows.filter((row) => row.isLowBalance);
  const nextLowBalanceDate = lowBalanceRows[0]?.date ?? null;
  const majorLowBalanceCauses = nextLowBalanceDate
    ? rows
      .filter((row) => row.date <= nextLowBalanceDate && row.amountCents < 0 && row.sourceType)
      .sort((a, b) => Math.abs(b.amountCents) - Math.abs(a.amountCents))
      .slice(0, 3)
      .map((row) => row.label)
    : [];

  return {
    startingBalanceCents,
    endingBalanceCents,
    lowestBalanceCents,
    negativeDayCount: negativeRows.length,
    nextRiskDate: negativeRows[0]?.date ?? null,
    lowBalanceThresholdCents: lowBalanceThresholdCents ?? null,
    lowBalanceDayCount: lowBalanceRows.length,
    nextLowBalanceDate,
    majorLowBalanceCauses
  };
}
