import { GoogleGenAI } from "@google/genai";
import { getGeminiConfig } from "./config";
import { EXTRACTION_SYSTEM_PROMPT, EXPLANATION_SYSTEM_PROMPT } from "./prompts";
import { LlmExtractionSchema, LlmExplanationSchema, LlmExtractionOutput } from "./schemas";
import { validateAndCleanCitations } from "./validateCitations";
import { Verdict, Evidence, Explanation } from "../types";
import { generateTemplateExplanation } from "../explain/template";

const TIMEOUT_MS = 12000;

// JSON schemas enforced by the API (responseJsonSchema); zod re-validates the result.
const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    claimed_sender: {
      type: "object",
      properties: {
        name: { type: ["string", "null"] },
        kind: { type: "string", enum: ["company", "government", "person", "unknown"] },
        evidence_quote: { type: ["string", "null"] },
      },
      required: ["name", "kind", "evidence_quote"],
    },
    asks: { type: "array", items: { type: "string" } },
    urgency_quotes: { type: "array", items: { type: "string" } },
    payment: {
      type: "object",
      properties: {
        method: { type: ["string", "null"], enum: ["card", "gift_card", "crypto", "wire", "p2p", "other", null] },
        quote: { type: ["string", "null"] },
      },
      required: ["method", "quote"],
    },
    phones: { type: "array", items: { type: "string" } },
    urls: { type: "array", items: { type: "string" } },
    emails: { type: "array", items: { type: "string" } },
    handles: { type: "array", items: { type: "string" } },
    is_screenshot_text: { type: ["string", "null"] },
  },
  required: ["claimed_sender", "asks", "urgency_quotes", "payment", "phones", "urls", "emails", "handles", "is_screenshot_text"],
};

const EXPLANATION_JSON_SCHEMA = {
  type: "object",
  properties: {
    sentences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          cites: { type: "array", items: { type: "string" } },
        },
        required: ["text", "cites"],
      },
    },
  },
  required: ["sentences"],
};

type Content = string | { inlineData: { data: string; mimeType: string } };

function getClient(): { ai: GoogleGenAI; model: string } | null {
  const config = getGeminiConfig();
  if (!config.apiKey) return null;
  return { ai: new GoogleGenAI({ apiKey: config.apiKey }), model: config.model };
}

/**
 * One JSON-mode call with a hard timeout (the abort signal is passed to the SDK) and a single
 * retry on 503. Throws on any other failure so callers can fall back.
 */
async function callJson(
  contents: Content[],
  systemInstruction: string,
  responseJsonSchema: unknown,
  temperature: number
): Promise<unknown> {
  const clientInfo = getClient();
  if (!clientInfo) throw new Error("no_key");
  const { ai, model } = clientInfo;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseJsonSchema,
          temperature,
          abortSignal: controller.signal,
        },
      });
      const text = response.text?.trim();
      if (!text) throw new Error("empty_response");
      return JSON.parse(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const retryable = msg.includes("503") || msg.includes("UNAVAILABLE");
      if (attempt === 0 && retryable) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("unreachable");
}

/** Short, log-safe reason (never the message text or the key). */
function reason(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) return "quota (429)";
  if (msg.toLowerCase().includes("abort")) return "timeout";
  if (msg.includes("503")) return "unavailable (503)";
  return msg.slice(0, 80);
}

/**
 * Extracts claimed sender, asks, urgency, payment and contact points from text or a screenshot.
 * Returns null on missing key, timeout, quota, or schema failure (caller falls back to rules).
 */
export async function geminiExtract(
  inputText: string,
  imageBuffer?: Buffer,
  mimeType = "image/png"
): Promise<Partial<LlmExtractionOutput> | null> {
  if (!getClient()) return null;

  const contents: Content[] = [];
  if (imageBuffer) {
    contents.push({ inlineData: { data: imageBuffer.toString("base64"), mimeType } });
    contents.push(
      "Transcribe all visible text in this screenshot into is_screenshot_text, then extract the claimed sender, contact channels, payment asks, and urgency indicators into the requested JSON schema."
    );
  } else {
    contents.push(`Input message to analyze:\n"""\n${inputText}\n"""`);
  }

  try {
    const json = await callJson(contents, EXTRACTION_SYSTEM_PROMPT, EXTRACTION_JSON_SCHEMA, 0);
    const validated = LlmExtractionSchema.safeParse(json);
    if (validated.success) return validated.data;
    console.warn("Gemini extraction failed schema validation. Falling back to deterministic extraction.");
    return null;
  } catch (err) {
    console.warn(`Gemini extraction unavailable: ${reason(err)}. Falling back to deterministic extraction.`);
    return null;
  }
}

/**
 * Writes a plain-English explanation from the verdict and evidence list only (never the raw message).
 * Every sentence must cite an existing [E#]; uncited sentences are dropped by the validator.
 */
export async function geminiExplain(
  verdict: Verdict,
  evidences: Evidence[],
  orgName: string
): Promise<Explanation> {
  if (!getClient()) return generateTemplateExplanation(verdict, evidences, orgName);

  const promptText = `
Verdict: ${verdict.headline} (${verdict.type})
Claimed Sender: ${orgName}

Evidence receipts:
${evidences.map(e => `[${e.id}] (${e.kind.toUpperCase()} - ${e.status}): ${e.text}`).join("\n")}

Write 2 to 5 short plain-English explanation sentences. Every sentence MUST cite at least one evidence ID (e.g. [E1]).
`;

  try {
    const json = await callJson([promptText], EXPLANATION_SYSTEM_PROMPT, EXPLANATION_JSON_SCHEMA, 0.1);
    const validated = LlmExplanationSchema.safeParse(json);
    if (validated.success && validated.data.sentences.length > 0) {
      return validateAndCleanCitations(validated.data.sentences, evidences, verdict, orgName);
    }
    return generateTemplateExplanation(verdict, evidences, orgName);
  } catch (err) {
    console.warn(`Gemini explanation unavailable: ${reason(err)}. Falling back to template explanation.`);
    return generateTemplateExplanation(verdict, evidences, orgName);
  }
}
