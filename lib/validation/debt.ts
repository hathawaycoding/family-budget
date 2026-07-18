import { z } from "zod";
import { dateString, nonNegativeCents } from "./shared";

export const debtPaymentSchema = z.object({
  debtAccountId: z.string().min(1),
  dueDate: dateString,
  minimumPaymentCents: nonNegativeCents,
  extraPaymentCents: nonNegativeCents,
  actualPaymentCents: nonNegativeCents.optional()
});
