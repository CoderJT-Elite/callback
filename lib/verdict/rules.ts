import { Verdict, Evidence, ClaimedSender, OfficialChannel } from "../types";
import { ResolvedOrg } from "../entity/resolve";
import { OfficialEvidenceResult } from "../official/pages";

export interface RuleEvaluationInput {
  claimed_sender: ClaimedSender;
  resolved_org: ResolvedOrg | null;
  official_evidence: OfficialEvidenceResult | null;
  evidences: Evidence[];
  has_contact_points: boolean;
}

export function evaluateVerdictRules(input: RuleEvaluationInput): Verdict {
  const { claimed_sender, resolved_org, official_evidence, evidences, has_contact_points } = input;
  const orgName = resolved_org?.name || claimed_sender.name || "the claimed organization";

  const officialChannel: OfficialChannel | undefined = resolved_org
    ? {
        name: resolved_org.name,
        domain: resolved_org.official_domains[0],
        contact_url: resolved_org.contact_pages[0],
        phone: official_evidence?.all_phones[0],
        source_note: official_evidence?.source_note || resolved_org.source_note,
        snapshot: official_evidence?.pages.some(p => p.is_snapshot),
      }
    : undefined;

  // Rule 1: No org resolved and kind !== person
  if (!resolved_org && claimed_sender.kind !== "person") {
    return {
      type: "CANT_VERIFY",
      org_name: claimed_sender.name || undefined,
      headline: "CAN'T VERIFY CLAIMED SENDER",
      details: `Callback could not independently resolve "${claimed_sender.name || "the sender"}" to a verified organization or public agency.`,
      color: "gray",
      rule_id: "RULE_1_NO_ORG",
      official_channel: officialChannel,
    };
  }

  // Rule 2: kind === person (personal impersonation)
  if (claimed_sender.kind === "person") {
    return {
      type: "NO_ORGANIZATION_CLAIMED",
      org_name: claimed_sender.name || "Person",
      headline: "NO ORGANIZATION CLAIMED",
      details: `This message claims to be from an individual ("${claimed_sender.name || "family / friend"}"), not an organization. Verify their identity by calling a number you already have saved.`,
      color: "amber",
      rule_id: "RULE_2_PERSONAL_PATH",
    };
  }

  // Check strong mismatch indicators
  const linkFail = evidences.find(
    e => e.kind === "url" && e.status === "fail"
  );
  const emailFail = evidences.find(
    e => e.kind === "email" && e.status === "fail"
  );
  const highLookalike = evidences.find(
    e => e.kind === "url" && (e.meta?.lookalike_score as number) >= 0.7
  );
  const dangerousPayment = evidences.find(
    e => e.kind === "payment" && (e.meta?.method === "gift_card" || e.meta?.method === "crypto")
  );

  // Rule 3: Strong mismatch
  if (linkFail || emailFail || highLookalike || dangerousPayment) {
    let reason = "The message contains channels or payment asks that do not belong to the real organization.";
    if (linkFail) reason = linkFail.text;
    else if (emailFail) reason = emailFail.text;
    else if (dangerousPayment) reason = dangerousPayment.text;

    return {
      type: "DOESNT_MATCH",
      org_name: orgName,
      headline: `DOESN'T MATCH THE REAL ${orgName.toUpperCase()}`,
      details: reason,
      color: "red",
      rule_id: "RULE_3_STRONG_MISMATCH",
      official_channel: officialChannel,
    };
  }

  // Rule 4: Phone mismatch
  const phoneFail = evidences.find(e => e.kind === "phone" && e.status === "fail");
  if (phoneFail) {
    return {
      type: "DOESNT_MATCH",
      org_name: orgName,
      headline: `DOESN'T MATCH THE REAL ${orgName.toUpperCase()}`,
      details: phoneFail.text,
      color: "red",
      rule_id: "RULE_4_PHONE_MISMATCH",
      official_channel: officialChannel,
    };
  }

  // Rule 5: All contact points official / listed_on_official
  const contactEvidences = evidences.filter(e => ["url", "phone", "email"].includes(e.kind));
  const hasContacts = contactEvidences.length > 0;
  const allContactsOk = hasContacts && contactEvidences.every(e => e.status === "ok");

  if (allContactsOk && !evidences.some(e => e.status === "fail")) {
    return {
      type: "MATCHES",
      org_name: orgName,
      headline: `MATCHES THE REAL ${orgName.toUpperCase()}`,
      details: `The contact channels in this message match verified public records for ${orgName}. Always verify directly on the official site before submitting credentials or payments.`,
      color: "green",
      rule_id: "RULE_5_ALL_OFFICIAL_MATCH",
      official_channel: officialChannel,
    };
  }

  // Rule 6: Message has no contact points at all
  if (!has_contact_points) {
    return {
      type: "CANT_VERIFY",
      org_name: orgName,
      headline: "CAN'T VERIFY: NO CONTACT POINTS",
      details: `No links, phone numbers or email addresses were found in this message to verify. If you're unsure, contact ${orgName} through their official channels.`,
      color: "gray",
      rule_id: "RULE_6_NO_CONTACT_POINTS",
      official_channel: officialChannel,
    };
  }

  // Rule 7: Otherwise -> CAN'T VERIFY with reasons
  const unconfirmed = evidences.filter(e => e.status === "warn" || e.status === "fail");
  const reasons = unconfirmed.map(e => e.text).join(" ");

  return {
    type: "CANT_VERIFY",
    org_name: orgName,
    headline: `CAN'T FULLY VERIFY ${orgName.toUpperCase()}`,
    details: reasons || `Callback could not definitively verify or refute all contact details in this message.`,
    color: "gray",
    rule_id: "RULE_7_INCONCLUSIVE",
    official_channel: officialChannel,
  };
}
