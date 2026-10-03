import { Explanation, ExplanationSentence, Evidence, Verdict } from "../types";
import { generateTemplateExplanation } from "../explain/template";

/**
 * Validates that every sentence in an LLM explanation cites real, existing Evidence IDs.
 * Drops any uncited or invalidly-cited sentence.
 * If fewer than 1 sentence survives, falls back to the deterministic template explanation.
 */
export function validateAndCleanCitations(
  candidateSentences: Array<{ text: string; cites?: string[] }>,
  evidences: Evidence[],
  verdict: Verdict,
  orgName: string
): Explanation {
  const validIds = new Set(evidences.map(e => e.id));
  const surviving: ExplanationSentence[] = [];
  let droppedCount = 0;

  for (const item of candidateSentences) {
    if (!item.text || typeof item.text !== "string") {
      droppedCount++;
      continue;
    }

    // Extract citation tags like [E1], [E2] directly from the text
    const bracketMatches = item.text.match(/\[(E\d+)\]/gi) || [];
    const extractedIds = bracketMatches.map(m => m.replace(/[[\]]/g, "").toUpperCase());

    // Also include any IDs from the cites array
    const candidateIds = Array.from(
      new Set([...extractedIds, ...(item.cites || []).map(c => c.toUpperCase())])
    );

    // Rule: must have at least one citation
    if (candidateIds.length === 0) {
      droppedCount++;
      continue;
    }

    // Rule: ALL cited IDs must exist in the valid Evidence list
    const allValid = candidateIds.every(id => validIds.has(id));
    if (!allValid) {
      droppedCount++;
      continue;
    }

    surviving.push({
      text: item.text.trim(),
      cites: candidateIds,
    });
  }

  // If fewer than 1 sentence survives, fall back to deterministic template
  if (surviving.length < 1) {
    const template = generateTemplateExplanation(verdict, evidences, orgName);
    return {
      sentences: template.sentences,
      mode: "template",
      dropped_count: droppedCount,
    };
  }

  return {
    sentences: surviving,
    mode: "llm",
    dropped_count: droppedCount,
  };
}
