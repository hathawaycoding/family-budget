export function toCents(input: string | number): number {
  const raw = typeof input === "number" ? input.toString() : input.replace(/[$,\s]/g, "");
  if (!raw || Number.isNaN(Number(raw))) return 0;
  return Math.round(Number(raw) * 100);
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatWholeMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

export function expensePlanningDollars(cents: number): number {
  return Math.ceil(cents / 100);
}

export function incomePlanningDollars(cents: number): number {
  return Math.floor(cents / 100);
}

export function balanceDisplayDollars(cents: number): number {
  return Math.round(cents / 100);
}

export function expensePlanningCents(cents: number): number {
  return expensePlanningDollars(cents) * 100;
}

export function incomePlanningCents(cents: number): number {
  return incomePlanningDollars(cents) * 100;
}
