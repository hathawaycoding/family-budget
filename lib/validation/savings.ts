import { z } from "zod";
import { dateString, positiveCents } from "./shared";

export const savingsActivitySchema = z.object({
  fundId: z.string().min(1),
  date: dateString,
  type: z.enum(["CONTRIBUTION", "WITHDRAWAL"]),
  amountCents: positiveCents,
  description: z.string().trim().optional()
});
