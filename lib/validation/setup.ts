import { z } from "zod";
import { nonNegativeCents } from "./shared";

export const categoryBudgetSchema = z.object({ categoryId: z.string().min(1), baseMonthlyBudgetCents: nonNegativeCents });
