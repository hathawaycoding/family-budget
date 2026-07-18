import { z } from "zod";
import { toCents } from "@/lib/money";

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const positiveCents = z.string().min(1).transform((value) => toCents(value)).pipe(z.number().int().positive());
export const nonNegativeCents = z.string().min(1).transform((value) => toCents(value)).pipe(z.number().int().min(0));
