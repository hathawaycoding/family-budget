import { z } from "zod";
import { toCents } from "@/lib/money";

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD.");

const moneyInput = z.string().min(1, "Amount is required.").refine((value) => {
  const raw = value.replace(/[$,\s]/g, "");
  return raw !== "" && !Number.isNaN(Number(raw));
}, "Amount must be a valid number.").transform((value) => toCents(value));

export const positiveCents = moneyInput.pipe(z.number().int().positive("Amount must be greater than zero."));
export const nonNegativeCents = moneyInput.pipe(z.number().int().min(0, "Amount cannot be negative."));
