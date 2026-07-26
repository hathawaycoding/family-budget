import { z } from "zod";
import { dateString, positiveCents } from "./shared";

export const shoppingCheckIdSchema = z.object({ id: z.string().min(1, "Shopping check is required.") });

export const createShoppingCheckSchema = z.object({
  date: dateString,
  merchant: z.string().trim().min(1, "Merchant is required."),
  amountCents: positiveCents,
  categoryId: z.string().min(1, "Category is required."),
  cashFlowTreatment: z.enum(["CASH_DEBIT", "CREDIT_CARD"]),
  requestNote: z.string().trim().optional(),
  intent: z.enum(["SAVE", "ASK_SPOUSE"])
});

export const respondToShoppingCheckSchema = shoppingCheckIdSchema.extend({
  response: z.enum(["APPROVED", "WAIT_REQUESTED"]),
  responseNote: z.string().trim().optional()
});

export const convertShoppingCheckSchema = shoppingCheckIdSchema.extend({
  confirmOverride: z.boolean(),
  notes: z.string().trim().optional()
});
