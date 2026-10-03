export type SenderKind = "company" | "government" | "person" | "unknown";

export interface ClaimedSender {
  name?: string | null;
  kind: SenderKind;
  evidence_quote?: string | null;
}

export type PaymentMethod = "card" | "gift_card" | "crypto" | "wire" | "p2p" | "other" | null;

export interface PaymentExtraction {
  method: PaymentMethod;
  quote?: string | null;
}

export interface Extraction {
  claimed_sender: ClaimedSender;
  asks: string[];
  urgency_quotes: string[];
  payment: PaymentExtraction;
  phones: string[];
  urls: string[];
  emails: string[];
  handles: string[];
  is_screenshot_text?: string | null;
  dropped_hallucinations?: {
    phones: string[];
    urls: string[];
    emails: string[];
    invalid_sender_quote?: boolean;
  };
}

export type EvidenceKind =
  | "phone"
  | "url"
  | "email"
  | "payment"
  | "urgency"
  | "sender"
  | "lookalike"
  | "advice";

export type EvidenceStatus = "ok" | "warn" | "fail" | "skipped" | "info";

export interface EvidenceSource {
  url?: string;
  snippet?: string;
  fetched_at?: string;
  snapshot?: boolean;
  rule_id?: string;
}

export interface Evidence {
  id: string; // e.g. "E1", "E2"
  kind: EvidenceKind;
  text: string;
  status: EvidenceStatus;
  source?: EvidenceSource;
  meta?: Record<string, unknown>;
}

export type VerdictType =
  | "MATCHES"
  | "DOESNT_MATCH"
  | "CANT_VERIFY"
  | "NO_ORGANIZATION_CLAIMED";

export interface OfficialChannel {
  name: string;
  domain?: string;
  contact_url?: string;
  phone?: string;
  source_note?: string;
  snapshot?: boolean;
}

export interface Verdict {
  type: VerdictType;
  org_name?: string;
  headline: string;
  details: string;
  color: "red" | "green" | "gray" | "amber";
  rule_id: string;
  official_channel?: OfficialChannel;
}

export type StepStatus = "running" | "ok" | "warn" | "fail" | "skipped";

export interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

export interface ExplanationSentence {
  text: string;
  cites: string[];
}

export interface Explanation {
  sentences: ExplanationSentence[];
  mode: "llm" | "template";
  dropped_count: number;
}

export interface CuratedOrg {
  id: string;
  name: string;
  aliases: string[];
  wikidata: string;
  official_domains: string[];
  contact_pages: string[];
  known_sms_shortcodes: string[];
  source_notes: string;
}

export interface SnapshotData {
  org_id: string;
  org_name: string;
  official_domains: string[];
  contact_pages: Array<{
    url: string;
    fetched_at: string;
    status: number;
    text_excerpt: string;
    phones: string[];
  }>;
}

export interface SSEEventData {
  event: "step" | "evidence" | "verdict" | "explanation" | "extraction" | "error" | "done";
  data: unknown;
}
