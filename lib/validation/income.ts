import { z } from "zod";
import { nonNegativeCents } from "./shared";

export const incomeEntryIdSchema = z.object({ id: z.string().min(1) });
export const updateIncomeActualSchema = z.object({ id: z.string().min(1), actualAmountCents: nonNegativeCents });
