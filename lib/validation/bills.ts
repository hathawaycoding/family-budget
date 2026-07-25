import { z } from "zod";
import { toCents } from "@/lib/money";
import { dateString } from "./shared";

const optionalNonNegativeCents = z.string().optional().transform((value, ctx) => {
  if (value == null || value.trim() === "") return undefined;
  const raw = value.replace(/[$,\s]/g, "");
  if (raw === "" || Number.isNaN(Number(raw))) {
    ctx.addIssue({ code: "custom", message: "Amount must be a valid number." });
    return z.NEVER;
  }
  const cents = toCents(value);
  if (cents < 0) {
    ctx.addIssue({ code: "custom", message: "Amount must be zero or more." });
    return z.NEVER;
  }
  return cents;
});

export const billIdSchema = z.object({ id: z.string().min(1) });
export const updateBillSchema = z.object({ id: z.string().min(1), actualAmountCents: optionalNonNegativeCents, paidDate: dateString.optional() });
export const updateBillInstanceSchema = z.object({ id: z.string().min(1), dueDate: dateString, actualAmountCents: optionalNonNegativeCents });
