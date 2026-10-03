import { Evidence, PaymentExtraction } from "../types";
import { ResolvedOrg } from "../entity/resolve";

export interface PaymentCheckResult {
  is_flagged: boolean;
  evidence: Evidence | null;
}

const FTC_PAGES = {
  gift_card: "https://consumer.ftc.gov/articles/gift-card-scams",
  crypto: "https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams",
  wire: "https://consumer.ftc.gov/articles/what-do-if-you-were-scammed",
  p2p: "https://consumer.ftc.gov/articles/what-do-if-you-were-scammed",
  card: "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams",
  other: "https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams",
};

export function checkPayment(
  payment: PaymentExtraction,
  org: ResolvedOrg | null,
  evidenceId: string
): PaymentCheckResult {
  if (!payment.method || !payment.quote) {
    return { is_flagged: false, evidence: null };
  }

  const orgName = org?.name || "a company or agency";

  if (payment.method === "gift_card") {
    const evidence: Evidence = {
      id: evidenceId,
      kind: "payment",
      status: "fail",
      text: `Demands payment via gift card ("${payment.quote}"). Legitimate businesses and agencies never demand payment by gift card.`,
      source: {
        url: FTC_PAGES.gift_card,
        rule_id: "RULE_PAYMENT_GIFT_CARD",
      },
      meta: { method: "gift_card", quote: payment.quote },
    };
    return { is_flagged: true, evidence };
  }

  if (payment.method === "crypto") {
    const evidence: Evidence = {
      id: evidenceId,
      kind: "payment",
      status: "fail",
      text: `Requests cryptocurrency payment ("${payment.quote}"). Real organizations never demand cryptocurrency to resolve accounts or legal issues.`,
      source: {
        url: FTC_PAGES.crypto,
        rule_id: "RULE_PAYMENT_CRYPTO",
      },
      meta: { method: "crypto", quote: payment.quote },
    };
    return { is_flagged: true, evidence };
  }

  if (payment.method === "wire" || payment.method === "p2p") {
    const evidence: Evidence = {
      id: evidenceId,
      kind: "payment",
      status: "fail",
      text: `Instructs payment via wire transfer or peer-to-peer app ("${payment.quote}") to resolve an issue for ${orgName}.`,
      source: {
        url: FTC_PAGES.wire,
        rule_id: "RULE_PAYMENT_WIRE_P2P",
      },
      meta: { method: payment.method, quote: payment.quote },
    };
    return { is_flagged: true, evidence };
  }

  if (payment.method === "card") {
    const evidence: Evidence = {
      id: evidenceId,
      kind: "payment",
      status: "warn",
      text: `Asks for card details or fee payment ("${payment.quote}"). Imposter messages frequently demand small card fees to capture payment credentials.`,
      source: {
        url: FTC_PAGES.card,
        rule_id: "RULE_PAYMENT_CARD_FEE",
      },
      meta: { method: "card", quote: payment.quote },
    };
    return { is_flagged: true, evidence };
  }

  return { is_flagged: false, evidence: null };
}
