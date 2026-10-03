"use client";

import React from "react";
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
      kind: "scam",
      data: bankAlertData,
    },
    {
      id: "package-delivery",
      label: "Package delivery",
      kind: "scam",
      data: packageDeliveryData,
    },
    {
      id: "recruiter-offer",
      label: "Recruiter job offer",
      kind: "scam",
      data: recruiterOfferData,
    },
    {
      id: "real-bank-alert",
      label: "Real bank alert",
      kind: "legit",
      data: realBankAlertData,
    },
    {
      id: "screenshot-sample",
      label: "Screenshot sample",
      kind: "image",
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

  const dot: Record<string, string> = { scam: "bg-stamp", legit: "bg-pine", image: "bg-ink" };
  const word: Record<string, string> = { scam: "scam", legit: "genuine", image: "image" };

  return (
    <div className="w-full">
      <p className="font-mono text-[11px] uppercase tracking-widest mb-2">Try a saved example</p>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {samples.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => handleClick(s)}
              disabled={disabled}
              className="group inline-flex items-center gap-2 text-sm underline decoration-rule underline-offset-4 hover:decoration-ink disabled:opacity-50"
            >
              <span className={`inline-block h-2 w-2 ${dot[s.kind]}`} aria-hidden="true" />
              <span>{s.label}</span>
              <span className="font-mono text-[11px] text-muted no-underline">({word[s.kind]})</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
