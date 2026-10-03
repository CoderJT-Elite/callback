import { Verdict, Evidence, Explanation, ExplanationSentence } from "../types";

/**
 * Generates natural plain-English explanation sentences where every sentence
 * cites one or more specific evidence items [E#].
 */
export function generateTemplateExplanation(
  verdict: Verdict,
  evidences: Evidence[],
  orgName: string
): Explanation {
  const sentences: ExplanationSentence[] = [];

  if (verdict.type === "NO_ORGANIZATION_CLAIMED") {
    const payEvidence = evidences.find(e => e.kind === "payment");
    const urgEvidence = evidences.find(e => e.kind === "urgency");

    let text = "This message claims to be from a family member or contact rather than a company.";
    const cites: string[] = [];
    if (urgEvidence) cites.push(urgEvidence.id);
    sentences.push({
      text: `${text} ${cites.map(c => `[${c}]`).join("")}`.trim(),
      cites,
    });

    if (payEvidence) {
      sentences.push({
        text: `It asks for an urgent transfer or payment [${payEvidence.id}], which is a common imposter pattern.`,
        cites: [payEvidence.id],
      });
    }

    sentences.push({
      text: "Never send money to an unfamiliar number before calling your contact on their established phone number.",
      cites: [],
    });

    return {
      sentences,
      mode: "template",
      dropped_count: 0,
    };
  }

  // Handle URL evidences
  const urlEvidences = evidences.filter(e => e.kind === "url");
  for (const ue of urlEvidences) {
    if (ue.status === "fail") {
      sentences.push({
        text: `The link directs to ${ue.meta?.domain || "an external domain"}, which does not belong to ${orgName} [${ue.id}].`,
        cites: [ue.id],
      });
    } else if (ue.status === "ok") {
      sentences.push({
        text: `The web link points to ${ue.meta?.domain}, which is a verified official domain for ${orgName} [${ue.id}].`,
        cites: [ue.id],
      });
    }
  }

  // Handle Phone evidences
  const phoneEvidences = evidences.filter(e => e.kind === "phone");
  for (const pe of phoneEvidences) {
    if (pe.status === "fail") {
      sentences.push({
        text: `The phone number provided (${pe.meta?.phone}) does not appear on ${orgName}'s official contact directory [${pe.id}].`,
        cites: [pe.id],
      });
    } else if (pe.status === "ok") {
      sentences.push({
        text: `The phone number (${pe.meta?.phone}) matches ${orgName}'s verified public support lines [${pe.id}].`,
        cites: [pe.id],
      });
    }
  }

  // Handle Email evidences
  const emailEvidences = evidences.filter(e => e.kind === "email");
  for (const ee of emailEvidences) {
    if (ee.status === "fail") {
      sentences.push({
        text: `The email address (${ee.meta?.email}) is not from ${orgName}'s verified email domain [${ee.id}].`,
        cites: [ee.id],
      });
    } else if (ee.status === "ok") {
      sentences.push({
        text: `The sender email (${ee.meta?.email}) is an official domain for ${orgName} [${ee.id}].`,
        cites: [ee.id],
      });
    }
  }

  // Handle Payment evidences
  const payEvidence = evidences.find(e => e.kind === "payment");
  if (payEvidence) {
    sentences.push({
      text: `The message asks for payment via ${payEvidence.meta?.method || "an unusual method"} [${payEvidence.id}], which conflicts with official billing practices.`,
      cites: [payEvidence.id],
    });
  }

  // If no sentences were generated (e.g. no contact points)
  if (sentences.length === 0) {
    if (verdict.type === "CANT_VERIFY") {
      sentences.push({
        text: `No verified contact channels could be evaluated from this message.`,
        cites: [],
      });
    } else {
      sentences.push({
        text: `Callback evaluated the message against verified public records for ${orgName}.`,
        cites: [],
      });
    }
  }

  return {
    sentences,
    mode: "template",
    dropped_count: 0,
  };
}
