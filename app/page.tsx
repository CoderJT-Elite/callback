"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InputCard } from "@/components/InputCard";
import { Trace } from "@/components/Trace";
import { ResultReceipt } from "@/components/ResultReceipt";
import { ReplayPayload } from "@/components/SampleChips";
import {
  PipelineStep,
  Evidence,
  Verdict,
  Explanation,
  Extraction,
  OfficialChannel,
} from "@/lib/types";

export default function HomePage() {
  const [inputText, setInputText] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>();
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [officialChannel, setOfficialChannel] = useState<OfficialChannel | undefined>();
  const [isPrecomputed, setIsPrecomputed] = useState(false);
  const [precomputedDate, setPrecomputedDate] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processSSEBlock = (block: string) => {
    if (!block.trim()) return;
    const eventMatch = block.match(/event:\s*([^\r\n]+)/);
    const dataMatch = block.match(/data:\s*([\s\S]+)$/);

    if (eventMatch && dataMatch) {
      const eventType = eventMatch[1].trim();
      const rawData = dataMatch[1].trim();
      try {
        const eventData = JSON.parse(rawData);

        if (eventType === "step") {
          const newStep = eventData as PipelineStep;
          setSteps((prev) => {
            const filtered = prev.filter((s) => s.id !== newStep.id);
            return [...filtered, newStep];
          });
        } else if (eventType === "extraction") {
          setExtraction(eventData as Extraction);
        } else if (eventType === "evidence") {
          const newEvidence = eventData as Evidence;
          setEvidences((prev) => [...prev, newEvidence]);
        } else if (eventType === "verdict") {
          const newVerdict = eventData as Verdict;
          setVerdict(newVerdict);
          if (newVerdict.official_channel) {
            setOfficialChannel(newVerdict.official_channel);
          }
        } else if (eventType === "explanation") {
          setExplanation(eventData as Explanation);
        } else if (eventType === "error") {
          setErrorMessage(eventData.message || "An unexpected error occurred during check.");
        }
      } catch (err: unknown) {
        console.error("Failed to parse SSE data chunk for event", eventType, rawData, err);
      }
    }
  };

  // Handle live check via /api/check SSE stream
  const handleLiveCheck = async (payload: { text: string; imageBase64?: string }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSteps([]);
    setEvidences([]);
    setVerdict(null);
    setExplanation(null);
    setExtraction(null);
    setOfficialChannel(undefined);
    setIsPrecomputed(false);
    setInputText(payload.text);
    setScreenshotUrl(payload.imageBase64);

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: payload.text,
          image: payload.imageBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Could not initialize response stream reader.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          processSSEBlock(block);
        }
      }

      if (buffer.trim()) {
        processSSEBlock(buffer);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Instant precomputed sample replay with sequential timing
  const handleReplaySample = async (sample: ReplayPayload) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSteps([]);
    setEvidences([]);
    setVerdict(null);
    setExplanation(null);
    setExtraction(sample.extraction);
    setOfficialChannel(sample.verdict.official_channel);
    setIsPrecomputed(true);
    setPrecomputedDate(sample.precomputedDate);
    setInputText(sample.inputText);
    setScreenshotUrl(sample.screenshotUrl);

    // Replay steps sequentially with realistic 160ms delay
    for (const step of sample.steps) {
      setSteps((prev) => [...prev, step]);
      await new Promise((r) => setTimeout(r, 160));
    }

    setEvidences(sample.evidences);
    setVerdict(sample.verdict);
    setExplanation(sample.explanation);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Pitch Hero */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900 text-xs font-semibold tracking-wide">
            ForgeHacks 2026 · AI + Cybersecurity
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Don&apos;t trust the number in the message.{" "}
            <span className="text-brand-600 dark:text-brand-400">
              Callback finds the real one.
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            Paste a suspicious text, email, or screenshot. Callback finds the claimed sender&apos;s real contact channels from sources the scammer doesn&apos;t control, and checks the message against them.
          </p>
        </div>

        {/* Input Card */}
        <InputCard
          onCheck={handleLiveCheck}
          onReplaySample={handleReplaySample}
          isLoading={isLoading}
          externalText={inputText}
          externalScreenshotUrl={screenshotUrl}
        />

        {/* Error Alert */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
            <strong className="font-semibold">Check Error:</strong> {errorMessage}
          </div>
        )}

        {/* Investigation Live Trace */}
        <div className="max-w-2xl mx-auto">
          <Trace steps={steps} isStreaming={isLoading} />
        </div>

        {/* Verdict Result Receipt */}
        {verdict && explanation && (
          <ResultReceipt
            verdict={verdict}
            evidences={evidences}
            explanation={explanation}
            extraction={
              extraction || {
                claimed_sender: { kind: "unknown" },
                asks: [],
                urgency_quotes: [],
                payment: { method: null },
                phones: [],
                urls: [],
                emails: [],
                handles: [],
              }
            }
            inputText={inputText}
            officialChannel={officialChannel}
            isPrecomputed={isPrecomputed}
            precomputedDate={precomputedDate}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
