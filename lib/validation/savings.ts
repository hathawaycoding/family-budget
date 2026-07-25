import { z } from "zod";
import { dateString, nonNegativeCents, positiveCents } from "./shared";

const optionalMoney = z.preprocess((value) => value === "" ? undefined : value, nonNegativeCents.optional());
const requiredMoneyDefaultZero = z.preprocess((value) => value === "" ? "0" : value, nonNegativeCents);
const optionalDate = z.preprocess((value) => value === "" ? undefined : value, dateString.optional());
const savingsFundBaseSchema = z.object({
  name: z.string().trim().min(1, "Fund name is required."),
  type: z.enum(["EMERGENCY", "SINKING"]),
  mode: z.enum(["OPEN_ENDED", "KNOWN_DUE_DATE"]),
  startingBalanceCents: requiredMoneyDefaultZero,
  targetAmountCents: optionalMoney,
  plannedContributionCents: requiredMoneyDefaultZero,
  dueDate: optionalDate
}).superRefine((value, ctx) => {
  if (value.mode === "KNOWN_DUE_DATE" && !value.dueDate) {
    ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Due date is required for known due date funds." });
  }
});

export const savingsActivitySchema = z.object({
  fundId: z.string().min(1),
  date: dateString,
  type: z.enum(["CONTRIBUTION", "WITHDRAWAL"]),
  amountCents: positiveCents,
  description: z.string().trim().optional()
});

export const createSavingsFundSchema = savingsFundBaseSchema;
export const updateSavingsFundSchema = savingsFundBaseSchema.extend({ fundId: z.string().min(1) });
export const savingsFundIdSchema = z.object({ fundId: z.string().min(1) });
