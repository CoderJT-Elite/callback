"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  PhoneCall,
  ExternalLink,
  Receipt,
  FileCheck2,
} from "lucide-react";
import { Verdict, Evidence, Explanation, Extraction, OfficialChannel } from "@/lib/types";
import { RespondPanel } from "./RespondPanel";
import { RuleTable } from "./RuleTable";

interface ResultReceiptProps {
  verdict: Verdict;
  evidences: Evidence[];
  explanation: Explanation;
  extraction: Extraction;
  inputText: string;
  officialChannel?: OfficialChannel;
  isPrecomputed?: boolean;
  precomputedDate?: string;
}

export function ResultReceipt({
  verdict,
  evidences,
  explanation,
  extraction,
  inputText,
  officialChannel,
  isPrecomputed,
  precomputedDate,
}: ResultReceiptProps) {
  // Verdict styling
  let bannerBg = "bg-red-500 text-white";
  let bannerIcon = <ShieldAlert className="w-6 h-6 shrink-0" />;

  if (verdict.type === "MATCHES") {
    bannerBg = "bg-emerald-600 text-white";
    bannerIcon = <ShieldCheck className="w-6 h-6 shrink-0" />;
  } else if (verdict.type === "NO_ORGANIZATION_CLAIMED") {
    bannerBg = "bg-amber-500 text-white";
    bannerIcon = <ShieldAlert className="w-6 h-6 shrink-0" />;
  } else if (verdict.type === "CANT_VERIFY") {
    bannerBg = "bg-slate-600 text-white";
    bannerIcon = <HelpCircle className="w-6 h-6 shrink-0" />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden animate-in fade-in duration-300">
      {/* Perforation header visual */}
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 receipt-perforation border-b border-dashed border-slate-300 dark:border-slate-700" />

      {/* Precomputed sample badge if applicable */}
      {isPrecomputed && (
        <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-1.5 border-b border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400 font-mono">
          Sample: pre-computed on {precomputedDate || "2026-10-03"}. Paste your own message to run a live check.
        </div>
      )}

      {/* 1. Verdict Banner */}
      <div className={`p-4 md:p-5 flex items-center gap-3.5 ${bannerBg}`}>
        {bannerIcon}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider opacity-85 block">
            Verification Verdict
          </span>
          <h2 className="text-lg md:text-xl font-bold tracking-tight">
            {verdict.headline}
          </h2>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-6">
        {/* Verdict Details & Rule */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 text-sm">
          <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
            {verdict.details}
          </p>
          <span className="inline-block mt-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Governing Rule: {verdict.rule_id}
          </span>
        </div>

        {/* 2. Official Channel: "Do this instead" */}
        {officialChannel && (
          <div className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
              <FileCheck2 className="w-4 h-4" />
              Do this instead (Official Verified Channels)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              Type the web address yourself or call the official directory line directly. Do not tap links or call callback numbers in suspicious messages.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              {officialChannel.contact_url && (
                <a
                  href={officialChannel.contact_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/80 rounded-lg hover:border-emerald-400 transition"
                >
                  <span className="truncate text-emerald-700 dark:text-emerald-300 font-medium">
                    {officialChannel.domain || "Official Website"}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                </a>
              )}
              {officialChannel.phone && (
                <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/80 rounded-lg text-emerald-800 dark:text-emerald-300 font-medium">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{officialChannel.phone}</span>
                </div>
              )}
            </div>
            {officialChannel.source_note && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono truncate">
                Source: {officialChannel.source_note}
              </p>
            )}
          </div>
        )}

        {/* 3. Receipts: Numbered Evidence List */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-3">
            <Receipt className="w-4 h-4" />
            Verified Evidence Receipts
          </h3>
          <div className="space-y-2">
            {evidences.map((ev) => (
              <div
                key={ev.id}
                className="font-mono text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850"
              >
                <div className="flex items-start gap-2">
                  <span className="font-bold text-brand-600 dark:text-brand-400 shrink-0">
                    [{ev.id}]
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-800 dark:text-slate-200">{ev.text}</p>
                    {ev.source?.url && (
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        Receipt source: {ev.source.url}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Plain-English Cited Explanation */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Explanation ({explanation.mode === "llm" ? "AI Analysis" : "Deterministic Rules"})
          </h3>
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {explanation.sentences.map((sentence, idx) => (
              <p key={idx}>{sentence.text}</p>
            ))}
          </div>
        </div>

        {/* 5. Already clicked or paid? */}
        <RespondPanel
          verdict={verdict}
          evidences={evidences}
          extraction={extraction}
          inputText={inputText}
          officialChannel={officialChannel}
        />

        {/* 6. How Callback decided rule table */}
        <RuleTable />
      </div>

      {/* Receipt footer */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 font-mono">
        CALLBACK REPORT RECEIPT · FORGEHACKS 2026
      </div>
    </div>
  );
}
