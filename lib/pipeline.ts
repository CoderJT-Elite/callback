import {
  Extraction,
  Verdict,
  Evidence,
  PipelineStep,
  Explanation,
  SSEEventData,
} from "./types";
import { deterministicExtract, mergeWithAntiHallucination } from "./extract/rescan";
import { resolveOrganization, ResolvedOrg } from "./entity/resolve";
import { gatherOfficialEvidence, OfficialEvidenceResult } from "./official/pages";
import { checkUrl } from "./checks/url";
import { checkPhone } from "./checks/phone";
import { checkEmail } from "./checks/email";
import { checkPayment } from "./checks/payment";
import { evaluateVerdictRules } from "./verdict/rules";
import { generateTemplateExplanation } from "./explain/template";
import { geminiExtract, geminiExplain } from "./llm/gemini";
import { hasGeminiKey } from "./llm/config";

export interface PipelineOptions {
  onEvent?: (event: SSEEventData) => void;
  llmExtractor?: (text: string, imageBuffer?: Buffer) => Promise<Partial<Extraction> | null>;
  llmExplainer?: (verdict: Verdict, evidences: Evidence[], orgName: string) => Promise<Explanation>;
  imageBuffer?: Buffer;
  mimeType?: string;
  skipLLM?: boolean;
}

export interface PipelineResult {
  extraction: Extraction;
  resolved_org: ResolvedOrg | null;
  official_evidence: OfficialEvidenceResult | null;
  evidences: Evidence[];
  verdict: Verdict;
  explanation: Explanation;
  steps: PipelineStep[];
  duration_ms: number;
}

export async function runPipeline(
  inputText: string,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  const startTime = Date.now();
  const steps: PipelineStep[] = [];
  const evidences: Evidence[] = [];
  let evidenceCounter = 1;

  const emit = (event: SSEEventData) => {
    if (options.onEvent) {
      options.onEvent(event);
    }
  };

  const addStep = (step: PipelineStep) => {
    steps.push(step);
    emit({ event: "step", data: step });
  };

  // 1. Ingest
  addStep({ id: "ingest", label: "Read message input", status: "ok", detail: `${inputText.length} characters` });

  // 2. Extraction
  let extraction: Extraction;
  const extractor = options.llmExtractor || (!options.skipLLM && hasGeminiKey() ? (t: string) => geminiExtract(t, options.imageBuffer, options.mimeType) : null);

  if (extractor) {
    try {
      const llmOutput = await extractor(inputText, options.imageBuffer);
      if (llmOutput) {
        extraction = mergeWithAntiHallucination(llmOutput, inputText);
        addStep({ id: "extract", label: "AI extracted contact points and claimed sender", status: "ok" });
      } else {
        extraction = deterministicExtract(inputText);
        addStep({ id: "extract", label: "AI reading unavailable; used deterministic extractors", status: "warn" });
      }
    } catch {
      extraction = deterministicExtract(inputText);
      addStep({ id: "extract", label: "AI reading unavailable; used deterministic extractors", status: "warn" });
    }
  } else {
    extraction = deterministicExtract(inputText);
    addStep({ id: "extract", label: "Deterministic extraction of contact points", status: "ok" });
  }

  emit({ event: "extraction" as any, data: extraction });

  // 3. Resolve Organization
  const claimedName = extraction.claimed_sender.name;
  let resolvedOrg: ResolvedOrg | null = null;

  if (claimedName) {
    resolvedOrg = await resolveOrganization(claimedName);
    if (resolvedOrg) {
      addStep({
        id: "resolve_org",
        label: `Identified claimed sender: ${resolvedOrg.name}`,
        status: "ok",
        detail: `Official domain: ${resolvedOrg.official_domains[0]} (${resolvedOrg.source})`,
      });
    } else {
      addStep({
        id: "resolve_org",
        label: `Could not resolve organization "${claimedName}"`,
        status: "warn",
        detail: "Queried curated directory and Wikidata P856",
      });
    }
  } else {
    addStep({
      id: "resolve_org",
      label: "No specific organization claimed",
      status: extraction.claimed_sender.kind === "person" ? "ok" : "skipped",
      detail: extraction.claimed_sender.kind === "person" ? "Personal impersonation message" : undefined,
    });
  }

  // 4. Gather Official Evidence Pages
  let officialEvidence: OfficialEvidenceResult | null = null;
  if (resolvedOrg) {
    officialEvidence = await gatherOfficialEvidence(resolvedOrg);
    addStep({
      id: "official_pages",
      label: `Official evidence channels for ${resolvedOrg.name}`,
      status: officialEvidence.pages.length > 0 ? "ok" : "warn",
      detail: officialEvidence.source_note,
    });
  }

  // 5. Run Checks (URLs, Phones, Emails, Payments)
  // 5a. URLs
  for (const url of extraction.urls) {
    const eId = `E${evidenceCounter++}`;
    const urlRes = await checkUrl(url, resolvedOrg, eId);
    evidences.push(urlRes.evidence);
    emit({ event: "evidence", data: urlRes.evidence });
    addStep({
      id: `check_url_${eId}`,
      label: `Checked link: ${urlRes.registrable_domain || url}`,
      status: urlRes.is_official ? "ok" : "fail",
      detail: urlRes.evidence.text,
    });
  }

  // 5b. Phones
  for (const phone of extraction.phones) {
    const eId = `E${evidenceCounter++}`;
    const phoneRes = checkPhone(phone, officialEvidence, resolvedOrg, eId);
    evidences.push(phoneRes.evidence);
    emit({ event: "evidence", data: phoneRes.evidence });
    addStep({
      id: `check_phone_${eId}`,
      label: `Checked phone: ${phone}`,
      status: phoneRes.status === "listed_on_official" ? "ok" : phoneRes.status === "not_listed" ? "fail" : "warn",
      detail: phoneRes.evidence.text,
    });
  }

  // 5c. Emails
  for (const email of extraction.emails) {
    const eId = `E${evidenceCounter++}`;
    const emailRes = checkEmail(email, resolvedOrg, eId);
    evidences.push(emailRes.evidence);
    emit({ event: "evidence", data: emailRes.evidence });
    addStep({
      id: `check_email_${eId}`,
      label: `Checked email: ${email}`,
      status: emailRes.is_official ? "ok" : "fail",
      detail: emailRes.evidence.text,
    });
  }

  // 5d. Payment
  if (extraction.payment.method) {
    const eId = `E${evidenceCounter++}`;
    const payRes = checkPayment(extraction.payment, resolvedOrg, eId);
    if (payRes.evidence) {
      evidences.push(payRes.evidence);
      emit({ event: "evidence", data: payRes.evidence });
      addStep({
        id: `check_payment_${eId}`,
        label: `Payment demand flagged: ${extraction.payment.method}`,
        status: payRes.evidence.status === "fail" ? "fail" : payRes.evidence.status === "warn" ? "warn" : "ok",
        detail: payRes.evidence.text,
      });
    }
  }

  // 5e. Urgency cues
  if (extraction.urgency_quotes.length > 0) {
    const eId = `E${evidenceCounter++}`;
    const urgencyEvidence: Evidence = {
      id: eId,
      kind: "urgency",
      status: "warn",
      text: `Contains artificial urgency phrases: "${extraction.urgency_quotes.join('", "')}". High urgency is standard in imposter scams to force hurried decisions.`,
      source: { rule_id: "RULE_URGENCY_CUES" },
    };
    evidences.push(urgencyEvidence);
    emit({ event: "evidence", data: urgencyEvidence });
  }

  const hasContactPoints = extraction.urls.length > 0 || extraction.phones.length > 0 || extraction.emails.length > 0;

  // 6. Verdict Rules
  const verdict = evaluateVerdictRules({
    claimed_sender: extraction.claimed_sender,
    resolved_org: resolvedOrg,
    official_evidence: officialEvidence,
    evidences,
    has_contact_points: hasContactPoints,
  });

  emit({ event: "verdict", data: verdict });
  addStep({
    id: "verdict",
    label: `Verdict: ${verdict.headline}`,
    status: verdict.type === "MATCHES" ? "ok" : verdict.type === "DOESNT_MATCH" ? "fail" : "warn",
    detail: verdict.details,
  });

  // 7. Explanation
  let explanation: Explanation;
  const explainer = options.llmExplainer || (!options.skipLLM && hasGeminiKey() ? geminiExplain : null);

  if (explainer) {
    try {
      explanation = await explainer(verdict, evidences, resolvedOrg?.name || "the sender");
    } catch {
      explanation = generateTemplateExplanation(verdict, evidences, resolvedOrg?.name || "the sender");
    }
  } else {
    explanation = generateTemplateExplanation(verdict, evidences, resolvedOrg?.name || "the sender");
  }

  emit({ event: "explanation", data: explanation });
  addStep({
    id: "explanation",
    label: "Generated evidence-backed explanation",
    status: "ok",
    detail: `${explanation.sentences.length} cited sentences (${explanation.mode})`,
  });

  const durationMs = Date.now() - startTime;
  emit({ event: "done", data: { ms: durationMs } });

  return {
    extraction,
    resolved_org: resolvedOrg,
    official_evidence: officialEvidence,
    evidences,
    verdict,
    explanation,
    steps,
    duration_ms: durationMs,
  };
}
