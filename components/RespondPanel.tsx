"use client";

import React, { useState } from "react";
import { Verdict, Evidence, Extraction, OfficialChannel } from "@/lib/types";

interface RespondPanelProps {
  verdict: Verdict;
  evidences: Evidence[];
  extraction: Extraction;
  inputText: string;
  officialChannel?: OfficialChannel;
}

export function RespondPanel({
  verdict,
  evidences,
  extraction,
  inputText,
  officialChannel,
}: RespondPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("card");

  const responseSteps: Record<
    string,
    { title: string; step: string; link: string; linkText: string }
  > = {
    card: {
      title: "Credit or Debit Card",
      step: "Call the customer service phone number printed directly on the back of your card immediately. Tell them you suspect a fraudulent transaction or shared your card number with a scammer, and request a new card with a new number.",
      link: "https://consumer.ftc.gov/articles/what-do-if-you-were-scammed#card",
      linkText: "FTC Guidance: What to do if you paid by credit or debit card",
    },
    gift_card: {
      title: "Gift Card",
      step: "Contact the company that issued the gift card right away (e.g. Apple, Google Play, Target, Walmart). Have the card and receipt handy. Ask if the funds can be frozen or refunded.",
      link: "https://consumer.ftc.gov/articles/gift-card-scams",
      linkText: "FTC Guidance: How to report gift card scams",
    },
    p2p: {
      title: "Zelle / Venmo / Wire / Bank Transfer",
      step: "Contact your financial institution immediately and report an unauthorized or fraudulent transfer. Ask them to reverse the wire or transfer if possible.",
      link: "https://consumer.ftc.gov/articles/what-do-if-you-were-scammed#bank",
      linkText: "FTC Guidance: What to do if you paid by bank transfer",
    },
    crypto: {
      title: "Cryptocurrency",
      step: "Report the incident immediately to the cryptocurrency exchange or platform used to send the payment. Cryptocurrency transactions cannot be reversed, but flagging the recipient address helps exchanges blacklist known illicit wallets.",
      link: "https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-and-scams",
      linkText: "FTC Guidance: Cryptocurrency scam response",
    },
  };

  const generateSummaryText = () => {
    const timestamp = new Date().toISOString();
    return `=====================================================
CALLBACK INCIDENT REPORT SUMMARY
Generated: ${timestamp}
Source: Callback Imposter Verification Engine (ForgeHacks 2026)
Notice: A summary to help you file a report; not a legal document.
=====================================================

1. VERDICT:
   Headline: ${verdict.headline}
   Verdict Type: ${verdict.type}
   Deterministic Rule: ${verdict.rule_id}
   Details: ${verdict.details}

2. CLAIMED SENDER:
   Name: ${extraction?.claimed_sender?.name || "Unknown"}
   Kind: ${extraction?.claimed_sender?.kind || "unknown"}
   Evidence Quote: "${extraction?.claimed_sender?.evidence_quote || "N/A"}"

3. CONTACT DETAILS IN MESSAGE:
   Phone Numbers: ${extraction?.phones?.length ? extraction.phones.join(", ") : "None detected"}
   Links & Domains: ${extraction?.urls?.length ? extraction.urls.join(", ") : "None detected"}
   Emails: ${extraction?.emails?.length ? extraction.emails.join(", ") : "None detected"}
   Payment Ask: ${extraction?.payment?.method ? `${extraction.payment.method} ("${extraction.payment.quote || ""}")` : "None"}
   Urgency Flags: ${extraction?.urgency_quotes?.length ? extraction.urgency_quotes.join("; ") : "None"}

4. VERIFIED OFFICIAL CHANNELS (INDEPENDENT SOURCES):
   Official Organization: ${officialChannel?.name || "N/A"}
   Official Domain: ${officialChannel?.domain || "N/A"}
   Official Contact URL: ${officialChannel?.contact_url || "N/A"}
   Official Support Phone: ${officialChannel?.phone || "N/A"}
   Source Verification: ${officialChannel?.source_note || "N/A"}

5. VERIFIED EVIDENCE RECEIPTS:
${evidences.map((e) => `   [${e.id}] [${e.kind.toUpperCase()} - ${e.status}] ${e.text}`).join("\n")}

6. WHERE TO REPORT THIS INCIDENT:
   - Federal Trade Commission (FTC): ReportFraud.ftc.gov
   - FBI Internet Crime Complaint Center: ic3.gov
   - SMS Spam Forwarding: Forward suspicious text messages to 7726 (SPAM)

7. ORIGINAL MESSAGE EXCERPT:
"""
${inputText}
"""
=====================================================`;
  };

  const handleDownloadTxt = () => {
    const text = generateSummaryText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `callback-incident-report-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    const reportData = {
      timestamp: new Date().toLocaleString(),
      verdict,
      evidences,
      extraction,
      inputText,
      officialChannel,
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem("callback_report_data", JSON.stringify(reportData));
      window.open("/report", "_blank");
    }
  };

  const methods = [
    { id: "card", label: "Credit / debit card" },
    { id: "gift_card", label: "Gift card" },
    { id: "p2p", label: "Bank transfer / Zelle" },
    { id: "crypto", label: "Cryptocurrency" },
  ];

  return (
    <section className="border-t border-ink no-print">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full py-3 text-left flex items-center justify-between font-display text-xl"
      >
        <span>Already clicked, replied or paid?</span>
        <span className="font-mono text-sm" aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && (
        <div className="pb-2 space-y-6 text-sm">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-2">How did you respond?</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="How you responded">
              {methods.map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setSelectedMethod(btn.id)}
                  aria-pressed={selectedMethod === btn.id}
                  className={`px-3 py-1.5 border border-ink text-[13px] ${
                    selectedMethod === btn.id ? "bg-ink text-paper" : "hover:bg-paper"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-l-4 border-ochre pl-4">
            <h4 className="font-semibold mb-1">Do this now: {responseSteps[selectedMethod]?.title}</h4>
            <p className="text-muted leading-relaxed mb-2 max-w-xl">{responseSteps[selectedMethod]?.step}</p>
            <a
              href={responseSteps[selectedMethod]?.link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 text-[13px]"
            >
              {responseSteps[selectedMethod]?.linkText} ↗
            </a>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Incident summary to paste into a report</h4>
            <p className="text-muted mb-3 max-w-xl">
              Timestamps, contact points and receipts, ready for ReportFraud.ftc.gov or ic3.gov.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={handleDownloadTxt} className="bg-ink text-paper px-4 py-2 text-[13px] font-semibold hover:bg-stamp transition-colors">
                Download summary (.txt)
              </button>
              <button type="button" onClick={handlePrintPdf} className="border border-ink px-4 py-2 text-[13px] hover:bg-paper">
                Print or save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
