import { GoogleGenAI } from "@google/genai";
import { getGeminiConfig } from "./config";
import { EXTRACTION_SYSTEM_PROMPT, EXPLANATION_SYSTEM_PROMPT } from "./prompts";
import { LlmExtractionSchema, LlmExplanationSchema, LlmExtractionOutput } from "./schemas";
import { validateAndCleanCitations } from "./validateCitations";
import { Verdict, Evidence, Explanation } from "../types";
import { generateTemplateExplanation } from "../explain/template";

/**
 * Initializes GoogleGenAI client if API key is configured.
 */
function getClient(): { ai: GoogleGenAI; model: string } | null {
  const config = getGeminiConfig();
  if (!config.apiKey) {
    return null;
  }
  return {
    ai: new GoogleGenAI({ apiKey: config.apiKey }),
    model: config.model,
  };
}

/**
 * Calls Gemini with text or image input to extract claimed sender, asks, urgency, payment, and contact points.
 * Returns null if key is missing, call times out (>12s), or error occurs.
 */
export async function geminiExtract(
  inputText: string,
  imageBuffer?: Buffer,
  mimeType = "image/png"
): Promise<Partial<LlmExtractionOutput> | null> {
  const clientInfo = getClient();
  if (!clientInfo) {
    return null;
  }

  const { ai, model } = clientInfo;
  const timeoutMs = 12000;
  const contents: Array<string | { inlineData: { data: string; mimeType: string } }> = [];

  try {

    if (imageBuffer) {
      contents.push({
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType,
        },
      });
      contents.push(
        "Transcribe all visible text in this screenshot and extract the claimed sender, contact channels, payment asks, and urgency indicators into the requested JSON schema."
      );
    } else {
      contents.push(`Input message to analyze:\n"""\n${inputText}\n"""`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
    clearTimeout(timeout);

    const text = response.text?.trim();
    if (!text) return null;

    const parsedJson = JSON.parse(text);
    const validated = LlmExtractionSchema.safeParse(parsedJson);

    if (validated.success) {
      return validated.data;
    } else {
      console.warn("Gemini extraction schema validation failed:", validated.error);
      return null;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("503") || msg.includes("UNAVAILABLE")) {
      // Retry once after 1s
      try {
        await new Promise(r => setTimeout(r, 1000));
        const retryRes = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: EXTRACTION_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            temperature: 0,
          },
        });
        const retryText = retryRes.text?.trim();
        if (retryText) {
          const validated = LlmExtractionSchema.safeParse(JSON.parse(retryText));
          if (validated.success) return validated.data;
        }
      } catch {
        // Continue to fallback
      }
    }
    console.warn(`Gemini extraction failed (${msg}). Falling back to deterministic extraction.`);
    return null;
  }
}

/**
 * Calls Gemini to generate a plain-English, evidence-cited explanation.
 * Strictly constrained: raw message is NEVER passed, only the Verdict and Evidence list [E#].
 * Validates citations and drops any invalid claims.
 */
export async function geminiExplain(
  verdict: Verdict,
  evidences: Evidence[],
  orgName: string
): Promise<Explanation> {
  const clientInfo = getClient();
  if (!clientInfo) {
    return generateTemplateExplanation(verdict, evidences, orgName);
  }

  const { ai, model } = clientInfo;
  const timeoutMs = 12000;

  try {
    const evidenceListPrompt = evidences
      .map(e => `[${e.id}] (${e.kind.toUpperCase()} - ${e.status}): ${e.text}`)
      .join("\n");

    const promptText = `
Verdict: ${verdict.headline} (${verdict.type})
Claimed Sender: ${orgName}

Evidence receipts:
${evidenceListPrompt}

Write 2 to 5 short plain-English explanation sentences. Every sentence MUST cite at least one evidence ID (e.g. [E1]). Return strictly JSON: { "sentences": [ { "text": "...", "cites": ["E1"] } ] }
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await ai.models.generateContent({
      model,
      contents: [promptText],
      config: {
        systemInstruction: EXPLANATION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    clearTimeout(timeout);

    const text = response.text?.trim();
    if (!text) {
      return generateTemplateExplanation(verdict, evidences, orgName);
    }

    const parsedJson = JSON.parse(text);
    const validated = LlmExplanationSchema.safeParse(parsedJson);

    if (validated.success && validated.data.sentences.length > 0) {
      return validateAndCleanCitations(validated.data.sentences, evidences, verdict, orgName);
    } else {
      return generateTemplateExplanation(verdict, evidences, orgName);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("503") || msg.includes("UNAVAILABLE")) {
      try {
        await new Promise(r => setTimeout(r, 1000));
        const retryRes = await ai.models.generateContent({
          model,
          contents: [`
Verdict: ${verdict.headline} (${verdict.type})
Claimed Sender: ${orgName}

Evidence receipts:
${evidences.map(e => `[${e.id}] (${e.kind.toUpperCase()} - ${e.status}): ${e.text}`).join("\n")}

Write 2 to 5 short plain-English explanation sentences. Every sentence MUST cite at least one evidence ID (e.g. [E1]). Return strictly JSON: { "sentences": [ { "text": "...", "cites": ["E1"] } ] }
`],
          config: {
            systemInstruction: EXPLANATION_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });
        const retryText = retryRes.text?.trim();
        if (retryText) {
          const validated = LlmExplanationSchema.safeParse(JSON.parse(retryText));
          if (validated.success && validated.data.sentences.length > 0) {
            return validateAndCleanCitations(validated.data.sentences, evidences, verdict, orgName);
          }
        }
      } catch {
        // Fall back to template
      }
    }
    console.warn(`Gemini explanation failed (${msg}). Falling back to template explanation.`);
    return generateTemplateExplanation(verdict, evidences, orgName);
  }
}
