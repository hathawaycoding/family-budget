import { z } from "zod";
import { dateString, positiveCents } from "./shared";

export const createTransactionSchema = z.object({
  date: dateString,
  merchant: z.string().trim().min(1, "Merchant is required."),
  amountCents: positiveCents,
  categoryId: z.string().min(1, "Category is required."),
  cashFlowTreatment: z.enum(["CASH_DEBIT", "CREDIT_CARD"]),
  plannedStatus: z.enum(["PLANNED", "UNPLANNED"]),
  isReimbursable: z.boolean(),
  notes: z.string().trim().optional()
});
