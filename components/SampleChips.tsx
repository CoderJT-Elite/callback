"use client";

import React from "react";
import { MessageSquare, Package, Briefcase, CheckCircle2, Image as ImageIcon } from "lucide-react";
import bankAlertData from "../data/samples/bank-alert.json";
import packageDeliveryData from "../data/samples/package-delivery.json";
import recruiterOfferData from "../data/samples/recruiter-offer.json";
import realBankAlertData from "../data/samples/real-bank-alert.json";
import screenshotSampleData from "../data/samples/screenshot-sample.json";
import { PipelineStep, Evidence, Verdict, Explanation, Extraction } from "@/lib/types";

export interface ReplayPayload {
  inputText: string;
  isScreenshot?: boolean;
  screenshotUrl?: string;
  sampleId: string;
  precomputedDate: string;
  steps: PipelineStep[];
  evidences: Evidence[];
  verdict: Verdict;
  explanation: Explanation;
  extraction: Extraction;
}

interface SampleChipsProps {
  onSelectSample: (payload: ReplayPayload) => void;
  disabled?: boolean;
}

export function SampleChips({ onSelectSample, disabled }: SampleChipsProps) {
  const samples = [
    {
      id: "bank-alert",
      label: "Bank alert text",
      badge: "Scam",
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      data: bankAlertData,
    },
    {
      id: "package-delivery",
      label: "Package delivery",
      badge: "Scam",
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      icon: <Package className="w-3.5 h-3.5" />,
      data: packageDeliveryData,
    },
    {
      id: "recruiter-offer",
      label: "Recruiter job offer",
      badge: "Scam",
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      icon: <Briefcase className="w-3.5 h-3.5" />,
      data: recruiterOfferData,
    },
    {
      id: "real-bank-alert",
      label: "Real bank alert",
      badge: "Legit",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      data: realBankAlertData,
    },
    {
      id: "screenshot-sample",
      label: "Screenshot sample",
      badge: "Vision",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      icon: <ImageIcon className="w-3.5 h-3.5" />,
      data: screenshotSampleData,
      screenshotUrl: "/samples/sample-screenshot.png",
    },
  ];

  const handleClick = (sample: (typeof samples)[0]) => {
    const d = sample.data as unknown as {
      sample_id: string;
      precomputed_at: string;
      input_text: string;
      is_screenshot?: boolean;
      result: {
        steps: PipelineStep[];
        evidences: Evidence[];
        verdict: Verdict;
        explanation: Explanation;
        extraction: Extraction;
      };
    };

    onSelectSample({
      sampleId: d.sample_id,
      inputText: d.input_text,
      isScreenshot: !!sample.screenshotUrl,
      screenshotUrl: sample.screenshotUrl,
      precomputedDate: d.precomputed_at,
      steps: d.result.steps,
      evidences: d.result.evidences,
      verdict: d.result.verdict,
      explanation: d.result.explanation,
      extraction: d.result.extraction,
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Try a sample (instant pre-computed receipts):
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {samples.map((s) => (
          <button
            key={s.id}
            onClick={() => handleClick(s)}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-sm transition-all text-xs font-medium text-slate-800 dark:text-slate-200 disabled:opacity-50"
          >
            <span className="text-slate-500 dark:text-slate-400">{s.icon}</span>
            <span>{s.label}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${s.badgeColor}`}>
              {s.badge}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
