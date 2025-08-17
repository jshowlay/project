"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalRowSchema = void 0;
var zod_1 = require("zod");
exports.SignalRowSchema = zod_1.z.object({
    source: zod_1.z.string(),
    entity_id: zod_1.z.string(),
    entity_name: zod_1.z.string().optional(),
    topic: zod_1.z.string().optional(),
    metric: zod_1.z.string(),
    value: zod_1.z.number(),
    unit: zod_1.z.string().optional(),
    window: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
    url: zod_1.z.string().url().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    raw: zod_1.z.any().optional(),
    captured_at: zod_1.z.date().optional(),
    bucket_min: zod_1.z.date().optional()
});
