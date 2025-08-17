import { z } from "zod";
export declare const SignalRowSchema: z.ZodObject<{
    source: z.ZodString;
    entity_id: z.ZodString;
    entity_name: z.ZodOptional<z.ZodString>;
    topic: z.ZodOptional<z.ZodString>;
    metric: z.ZodString;
    value: z.ZodNumber;
    unit: z.ZodOptional<z.ZodString>;
    window: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    raw: z.ZodOptional<z.ZodAny>;
    captured_at: z.ZodOptional<z.ZodDate>;
    bucket_min: z.ZodOptional<z.ZodDate>;
}, z.core.$strip>;
export type SignalRow = z.infer<typeof SignalRowSchema>;
//# sourceMappingURL=types.d.ts.map