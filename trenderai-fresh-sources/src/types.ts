import { z } from "zod";

export const SignalRowSchema = z.object({
  source: z.string(),
  entity_id: z.string(),
  entity_name: z.string().optional(),
  topic: z.string().optional(),
  metric: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  window: z.string().optional(),
  region: z.string().optional(),
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  raw: z.any().optional(),
  captured_at: z.date().optional(),
  bucket_min: z.date().optional()
});

export type SignalRow = z.infer<typeof SignalRowSchema>;
