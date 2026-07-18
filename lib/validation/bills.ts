import { z } from "zod";
import { dateString, nonNegativeCents } from "./shared";

export const updateBillSchema = z.object({ id: z.string().min(1), actualAmountCents: nonNegativeCents.optional(), paidDate: dateString.optional() });
export const billIdSchema = z.object({ id: z.string().min(1) });
