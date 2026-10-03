"use client";

import React from "react";
import { PipelineStep } from "@/lib/types";

interface TraceProps {
  steps: PipelineStep[];
  isStreaming: boolean;
}

const MARK: Record<string, { glyph: string; cls: string; label: string }> = {
  ok: { glyph: "✓", cls: "text-pine", label: "ok" },
  fail: { glyph: "✗", cls: "text-stamp", label: "mismatch" },
  warn: { glyph: "!", cls: "text-ochre", label: "warning" },
  running: { glyph: "…", cls: "text-ink", label: "running" },
  skipped: { glyph: "–", cls: "text-muted", label: "skipped" },
};

export function Trace({ steps, isStreaming }: TraceProps) {
  if (steps.length === 0 && !isStreaming) return null;

  return (
    <section aria-label="Investigation trace" className="border-t border-ink pt-3">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-mono text-[11px] uppercase tracking-widest">Live Investigation Trace</h3>
        {isStreaming && <span className="font-mono text-xs text-muted">working…</span>}
      </div>
      <ol className="font-mono text-[13px] divide-y divide-rule">
        {steps.map((step) => {
          const m = MARK[step.status] ?? MARK.ok;
          return (
            <li key={step.id} className="line-in flex gap-3 py-1.5">
              <span className={`w-4 shrink-0 text-center font-bold ${m.cls}`} aria-label={m.label}>
                {m.glyph}
              </span>
              <div className="min-w-0">
                <span>{step.label}</span>
                {step.detail && <p className="text-[12px] text-muted break-words">{step.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
