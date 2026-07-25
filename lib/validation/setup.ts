import { z } from "zod";
import { nonNegativeCents } from "./shared";

export const categoryBudgetSchema = z.object({ categoryId: z.string().min(1), baseMonthlyBudgetCents: nonNegativeCents });

const categoryName = z.string().trim().min(1, "Category name is required.");
const optionalCategoryBudget = z.preprocess((value) => value === "" ? "0" : value, nonNegativeCents);

export const createCategorySchema = z.object({ name: categoryName, baseMonthlyBudgetCents: optionalCategoryBudget });
export const renameCategorySchema = z.object({ categoryId: z.string().min(1), name: categoryName });
export const categoryIdSchema = z.object({ categoryId: z.string().min(1) });
