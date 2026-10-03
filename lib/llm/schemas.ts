import { z } from "zod";

export const ClaimedSenderSchema = z.object({
  name: z.string().nullable().optional(),
  kind: z.enum(["company", "government", "person", "unknown"]).default("unknown"),
  evidence_quote: z.string().nullable().optional(),
});

export const PaymentMethodSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (lower === "fee" || lower === "credit_card" || lower === "debit_card") return "card";
    if (["card", "gift_card", "crypto", "wire", "p2p", "other"].includes(lower)) return lower;
    return "other";
  }
  return val;
}, z.enum([
  "card",
  "gift_card",
  "crypto",
  "wire",
  "p2p",
  "other",
]).nullable());

export const PaymentExtractionSchema = z.object({
  method: PaymentMethodSchema.optional().default(null),
  quote: z.string().nullable().optional(),
});

export const LlmExtractionSchema = z.object({
  claimed_sender: ClaimedSenderSchema.nullable()
    .transform(v => v ?? { name: null, kind: "unknown" as const, evidence_quote: null })
    .default({ name: null, kind: "unknown", evidence_quote: null }),
  asks: z.array(z.string()).default([]),
  urgency_quotes: z.array(z.string()).default([]),
  // Models sometimes return payment: null when there is no payment ask; treat that as "none".
  payment: PaymentExtractionSchema.nullable()
    .transform(v => v ?? { method: null, quote: null })
    .default({ method: null, quote: null }),
  phones: z.array(z.string()).default([]),
  urls: z.array(z.string()).default([]),
  emails: z.array(z.string()).default([]),
  handles: z.array(z.string()).default([]),
  is_screenshot_text: z.string().nullable().optional(),
});

export const ExplanationSentenceSchema = z.object({
  text: z.string(),
  cites: z.array(z.string()),
});

export const LlmExplanationSchema = z.object({
  sentences: z.array(ExplanationSentenceSchema),
});

export type LlmExtractionOutput = z.infer<typeof LlmExtractionSchema>;
export type LlmExplanationOutput = z.infer<typeof LlmExplanationSchema>;
