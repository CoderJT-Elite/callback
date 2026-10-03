"use client";

import React, { useState } from "react";
import { AlertOctagon, ExternalLink, Download, Printer, ChevronDown, ChevronUp } from "lucide-react";
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

  return (
    <div className="w-full mt-4 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left font-medium text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
          <AlertOctagon className="w-4 h-4" />
          Already clicked, replied, or paid? (Incident Response)
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Select how you responded or sent funds:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "card", label: "Credit / Debit Card" },
                { id: "gift_card", label: "Gift Card" },
                { id: "p2p", label: "Bank Transfer / Zelle" },
                { id: "crypto", label: "Cryptocurrency" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedMethod(btn.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedMethod === btn.id
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 mb-1">
              Immediate action: {responseSteps[selectedMethod]?.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              {responseSteps[selectedMethod]?.step}
            </p>
            <a
              href={responseSteps[selectedMethod]?.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-600 dark:text-brand-400 inline-flex items-center gap-1 hover:underline"
            >
              {responseSteps[selectedMethod]?.linkText}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-2">
              Download Pre-filled Incident Summary
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Use this summary to copy-paste exact timestamps, contact points, and receipts into ReportFraud.ftc.gov or ic3.gov.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded text-xs font-medium hover:bg-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download Incident Summary (.txt)
              </button>
              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
