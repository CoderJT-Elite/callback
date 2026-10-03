"use client";

import React from "react";
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

const VERDICT_STYLE: Record<string, { color: string; glyph: string; word: string }> = {
  DOESNT_MATCH: { color: "text-stamp", glyph: "✗", word: "Mismatch" },
  MATCHES: { color: "text-pine", glyph: "✓", word: "Match" },
  NO_ORGANIZATION_CLAIMED: { color: "text-ochre", glyph: "!", word: "No organization" },
  CANT_VERIFY: { color: "text-graphite", glyph: "?", word: "Can't verify" },
};

const STATUS_MARK: Record<string, { glyph: string; cls: string; label: string }> = {
  ok: { glyph: "✓", cls: "text-pine", label: "matches" },
  info: { glyph: "i", cls: "text-muted", label: "info" },
  fail: { glyph: "✗", cls: "text-stamp", label: "mismatch" },
  warn: { glyph: "!", cls: "text-ochre", label: "warning" },
};

function prettyPhone(p: string) {
  const m = p.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return m ? `1-${m[1]}-${m[2]}-${m[3]}` : p;
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
  const vs = VERDICT_STYLE[verdict.type] ?? VERDICT_STYLE.CANT_VERIFY;

  return (
    <article className="bg-sheet border border-ink paper-shadow">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 md:px-7 py-2.5 border-b border-ink font-mono text-[11px] uppercase tracking-widest text-muted">
        <span>Case file · {verdict.rule_id}</span>
        <span>{isPrecomputed ? `Saved example, run ${precomputedDate || "2026-10-03"}` : "Live check"}</span>
      </div>

      <div className="px-5 md:px-7 pt-8 pb-6">
        <div className={`mb-6 ${vs.color}`}>
          <span className="stamp text-sm md:text-base">
            <span aria-hidden="true">{vs.glyph} </span>
            {vs.word}
          </span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl leading-tight tracking-tight font-medium">
          {verdict.headline}
        </h2>
        <p className="mt-4 max-w-2xl">{verdict.details}</p>
      </div>

      <div className="px-5 md:px-7 pb-8 space-y-10">
        {officialChannel && (
          <section className="border-2 border-pine p-5">
            <h3 className="font-display text-xl text-pine">Do this instead</h3>
            <p className="text-[13px] text-muted mt-1 mb-4 max-w-xl">
              Type the web address yourself, or call this number from the organization&apos;s own site. Don&apos;t use
              links or numbers from the message.
            </p>
            <dl className="grid gap-4 sm:grid-cols-2 font-mono text-sm">
              {officialChannel.contact_url && (
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-muted">Official site</dt>
                  <dd>
                    <a
                      href={officialChannel.contact_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 break-all"
                    >
                      {officialChannel.domain || "Official website"}
                    </a>
                  </dd>
                </div>
              )}
              {officialChannel.phone && (
                <div>
                  <dt className="text-[11px] uppercase tracking-widest text-muted">Official phone</dt>
                  <dd className="text-lg font-medium">{prettyPhone(officialChannel.phone)}</dd>
                </div>
              )}
            </dl>
            {officialChannel.source_note && (
              <p className="text-[12px] text-muted mt-4 font-mono break-words">Source: {officialChannel.source_note}</p>
            )}
          </section>
        )}

        <section>
          <h3 className="font-display text-xl mb-3">What we checked</h3>
          <ol className="border-t border-ink divide-y divide-rule font-mono text-[13px]">
            {evidences.map((ev) => {
              const m = STATUS_MARK[ev.status] ?? STATUS_MARK.info;
              return (
                <li key={ev.id} className="grid grid-cols-[2.5rem_1.25rem_1fr] gap-x-2 py-3">
                  <span className="text-muted">[{ev.id}]</span>
                  <span className={`font-bold ${m.cls}`} aria-label={m.label}>
                    {m.glyph}
                  </span>
                  <div className="min-w-0">
                    <p>{ev.text}</p>
                    {ev.source?.url && (
                      <p className="text-[12px] text-muted mt-1 break-all">
                        {ev.kind === "url" && ev.status !== "ok"
                          ? `Link in the message (not opened): ${ev.source.url}`
                          : `Source: ${ev.source.url}`}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <h3 className="font-display text-xl mb-1">In plain English</h3>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-3">
            Written by {explanation.mode === "llm" ? "Gemini, every sentence tied to a numbered check" : "fixed templates, no AI"}
          </p>
          <div className="space-y-3 max-w-2xl">
            {explanation.sentences.map((sentence, idx) => (
              <p key={idx}>{sentence.text}</p>
            ))}
          </div>
        </section>

        <RespondPanel
          verdict={verdict}
          evidences={evidences}
          extraction={extraction}
          inputText={inputText}
          officialChannel={officialChannel}
        />

        <RuleTable />
      </div>

      <div className="border-t border-ink px-5 md:px-7 py-3 font-mono text-[11px] uppercase tracking-widest text-muted">
        Callback · ForgeHacks 2026 · Can be wrong
      </div>
    </article>
  );
}
