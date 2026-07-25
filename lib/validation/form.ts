import { z } from "zod";

export function formatValidationError(error: z.ZodError) {
  const messages = error.issues.map((issue) => issue.message).filter(Boolean);
  return messages.length > 0 ? messages.join(" ") : "Please check the form and try again.";
}

export function parseFormOrThrow<T>(schema: z.ZodType<T>, value: unknown) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new Error(formatValidationError(parsed.error));
  return parsed.data;
}
