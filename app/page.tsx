"use client";

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    if (isLoading) {
      requestAnimationFrame(() =>
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  }, [isLoading]);

  const hasResult = steps.length > 0 || !!verdict || !!errorMessage;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 pt-10 md:pt-16">
        <div className="grid gap-12 lg:gap-16 lg:grid-cols-[5fr_7fr] items-start">
          <section>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-5">
              Scam checker · US messages
            </p>
            <h1 className="font-display text-[40px] sm:text-5xl lg:text-[56px] leading-[1.04] tracking-tight font-medium">
              Don&apos;t trust the number in the message.{" "}
              <em className="text-stamp italic font-medium">Callback finds the real one.</em>
            </h1>
            <p className="mt-6 text-[17px] leading-relaxed max-w-md">
              Paste a suspicious text, email or screenshot. Callback looks up who it claims to be from, finds that
              sender&apos;s real contact details in places a scammer can&apos;t edit, and compares them.
            </p>
            <ol className="mt-8 space-y-4 max-w-md border-t border-rule pt-6">
              {[
                ["Read", "who the message says it's from, and every phone, link and email in it."],
                ["Look up", "the real organization's official domain and contact page."],
                ["Compare", "and show each result with where it came from."],
              ].map(([k, v], i) => (
                <li key={k} className="flex gap-4">
                  <span className="font-display text-3xl leading-none text-muted w-6">{i + 1}</span>
                  <p>
                    <strong className="font-semibold">{k}</strong> {v}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <InputCard
              onCheck={handleLiveCheck}
              onReplaySample={handleReplaySample}
              isLoading={isLoading}
              externalText={inputText}
              externalScreenshotUrl={screenshotUrl}
            />
          </section>
        </div>

        {hasResult && (
          <div className="mt-16 max-w-3xl mx-auto space-y-8" id="result" aria-live="polite">
            {errorMessage && (
              <div role="alert" className="border-2 border-stamp text-stamp p-4 text-sm">
                <strong className="font-semibold">The check didn&apos;t finish.</strong> {errorMessage}
              </div>
            )}

            <Trace steps={steps} isStreaming={isLoading} />

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
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
