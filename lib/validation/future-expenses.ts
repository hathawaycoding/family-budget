import { z } from "zod";
import { dateString, positiveCents } from "@/lib/validation/shared";

export const futureExpenseIdSchema = z.object({ id: z.string().min(1) });

const baseFutureExpenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required."),
  expectedAmountCents: positiveCents,
  dueDate: dateString,
  categoryId: z.string().min(1, "Category is required."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "MUST_PAY"]),
  notes: z.string().trim().optional(),
  type: z.enum(["ONE_TIME", "RECURRING"]),
  setAsideMode: z.enum(["EQUAL_MONTHLY", "CUSTOM"]),
  includeInPlanPreview: z.boolean()
});

export const createFutureExpenseSchema = baseFutureExpenseSchema;
export const updateFutureExpenseSchema = baseFutureExpenseSchema.extend({ id: z.string().min(1) });

export const futureExpenseContributionSchema = z.object({
  futureExpenseId: z.string().min(1),
  date: dateString,
  plannedAmountCents: positiveCents
});

export const deleteFutureExpenseContributionSchema = z.object({ id: z.string().min(1) });
