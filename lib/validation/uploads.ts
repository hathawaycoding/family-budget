import { z } from "zod";

export const receiptMetadataSchema = z.object({
  originalFileName: z.string().min(1),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "application/pdf"]),
  sizeBytes: z.number().int().positive()
});
