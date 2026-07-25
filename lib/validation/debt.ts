import { z } from "zod";
import { dateString, nonNegativeCents } from "./shared";

const requiredMoneyDefaultZero = z.preprocess((value) => value === "" ? "0" : value, nonNegativeCents);
const optionalMoney = z.preprocess((value) => value === "" ? undefined : value, nonNegativeCents.optional());

const interestRateInput = z.string().min(1, "APR is required.").refine((value) => {
  const raw = value.replace(/[%\s]/g, "");
  return raw !== "" && !Number.isNaN(Number(raw));
}, "APR must be a valid number.").transform((value) => Number(value.replace(/[%\s]/g, ""))).pipe(z.number().min(0, "APR cannot be negative.").max(100, "APR must be 100 or less."));

const dueDayInput = z.string().min(1, "Due day is required.").refine((value) => /^\d+$/.test(value), "Due day must be a whole number.").transform(Number).pipe(z.number().int().min(1, "Due day must be between 1 and 31.").max(31, "Due day must be between 1 and 31."));

const debtAccountBaseSchema = z.object({
  name: z.string().trim().min(1, "Card name is required."),
  startingBalanceCents: requiredMoneyDefaultZero,
  currentBalanceCents: requiredMoneyDefaultZero,
  interestRatePercent: interestRateInput,
  minimumPaymentCents: requiredMoneyDefaultZero,
  extraPaymentCents: requiredMoneyDefaultZero,
  dueDay: dueDayInput
});

export const debtPaymentSchema = z.object({
  debtAccountId: z.string().min(1, "Choose a card before adding a payment."),
  dueDate: dateString,
  minimumPaymentCents: nonNegativeCents,
  extraPaymentCents: nonNegativeCents,
  actualPaymentCents: optionalMoney
});

export const createDebtAccountSchema = debtAccountBaseSchema;
export const updateDebtAccountSchema = debtAccountBaseSchema.extend({ debtAccountId: z.string().min(1) });
export const debtAccountIdSchema = z.object({ debtAccountId: z.string().min(1) });
