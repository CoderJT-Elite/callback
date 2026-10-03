"use client";

import React from "react";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { PipelineStep } from "@/lib/types";

interface TraceProps {
  steps: PipelineStep[];
  isStreaming: boolean;
}

export function Trace({ steps, isStreaming }: TraceProps) {
  if (steps.length === 0 && !isStreaming) return null;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800/80 pb-2">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
          Live Investigation Trace
        </h3>
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analyzing...
          </span>
        )}
      </div>

      <div className="space-y-2 font-mono text-xs">
        {steps.map((step) => {
          let icon = <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
          let textColor = "text-slate-800 dark:text-slate-200";

          if (step.status === "fail") {
            icon = <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
            textColor = "text-red-700 dark:text-red-400 font-medium";
          } else if (step.status === "warn") {
            icon = <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
            textColor = "text-amber-800 dark:text-amber-300";
          } else if (step.status === "running") {
            icon = <Loader2 className="w-4 h-4 text-brand-500 animate-spin shrink-0" />;
            textColor = "text-brand-700 dark:text-brand-300";
          } else if (step.status === "skipped") {
            icon = <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />;
            textColor = "text-slate-500";
          }

          return (
            <div
              key={step.id}
              className="flex items-start gap-2.5 p-1.5 rounded transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 overflow-hidden">
                <span className={textColor}>{step.label}</span>
                {step.detail && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
