import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RuleTable } from "@/components/RuleTable";

const STAGES = [
  { n: "1", t: "Input", a: "Message or screenshot", b: "Links never opened" },
  { n: "2", t: "Reading", a: "Gemini + regex re-scan", b: "Invented items dropped" },
  { n: "3", t: "Grounding", a: "Checked list, Wikidata", b: "Never from the message" },
  { n: "4", t: "Receipts", a: "Official pages, domain age", b: "Phone vs. contact page" },
  { n: "5", t: "Verdict", a: "Seven fixed rules", b: "No AI judgment" },
  { n: "6", t: "Explanation", a: "Gemini, cites [E#]", b: "Uncited lines dropped" },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-5 sm:px-8 pt-12 md:pt-16 space-y-16">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-4">Method</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight font-medium leading-tight">How Callback Works</h1>
          <p className="mt-5 text-[17px] max-w-2xl">
            Most scam detectors give you a score like &quot;87% scam.&quot; Callback works like an investigator instead: it has to bring
            receipts from public records the sender doesn&apos;t control, and it says &quot;can&apos;t verify&quot; when it has none.
          </p>
        </header>

        <section aria-labelledby="pipeline">
          <h2 id="pipeline" className="font-display text-2xl mb-5">The pipeline</h2>
          <div className="overflow-x-auto">
            <svg
              viewBox="0 0 800 190"
              className="w-full min-w-[640px] h-auto"
              role="img"
              aria-label="Six stages: input, reading, grounding, receipts, verdict, explanation"
              fill="none"
            >
              <line x1="60" y1="40" x2="740" y2="40" stroke="rgb(var(--ink))" strokeWidth="1.5" />
              {STAGES.map((s, i) => {
                const x = 60 + i * 136;
                return (
                  <g key={s.n}>
                    <circle cx={x} cy="40" r="15" fill="rgb(var(--sheet))" stroke="rgb(var(--ink))" strokeWidth="1.5" />
                    <text x={x} y="45" textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill="rgb(var(--ink))" fontWeight="700">{s.n}</text>
                    <text x={x} y="84" textAnchor="middle" fontSize="16" fontFamily="var(--font-display)" fontWeight="600" fill="rgb(var(--ink))">{s.t}</text>
                    <text x={x} y="110" textAnchor="middle" fontSize="11" fontFamily="var(--font-sans)" fill="rgb(var(--muted))">{s.a}</text>
                    <text x={x} y="134" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={i === 4 ? "rgb(var(--stamp))" : "rgb(var(--ink))"}>{s.b}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <section className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl mb-3">What the AI does</h2>
            <ul className="space-y-2 border-t border-ink pt-3 list-disc pl-5">
              <li>Reads messy messages and picks out who they claim to be from.</li>
              <li>Reads text out of screenshots.</li>
              <li>Writes a short plain-English explanation of the evidence.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl mb-3">What it never does</h2>
            <ul className="space-y-2 border-t border-ink pt-3 list-disc pl-5">
              <li>Decide the verdict. That comes only from the seven rules.</li>
              <li>Supply official domains. Those come from a hand-checked list or Wikidata, with guards.</li>
              <li>Make a claim without a numbered check behind it. Uncited sentences are discarded.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl mb-2">The seven verdict rules</h2>
          <p className="text-muted mb-2">Checked in order. The first rule that applies decides.</p>
          <RuleTable />
        </section>

        <section className="grid gap-x-10 gap-y-8 md:grid-cols-2 text-[14px]">
          <h2 className="font-display text-2xl md:col-span-2 -mb-3">Security and privacy</h2>
          <div className="border-t border-ink pt-3">
            <h3 className="font-semibold mb-1">Safe fetching</h3>
            <p className="text-muted leading-relaxed">
              Links in messages are never opened. Callback only sends HEAD requests through a client that rejects private,
              loopback and cloud-metadata addresses, allows only ports 80 and 443, and re-checks every redirect.
            </p>
          </div>
          <div className="border-t border-ink pt-3">
            <h3 className="font-semibold mb-1">Prompt injection</h3>
            <p className="text-muted leading-relaxed">
              Message text is treated as data. The AI&apos;s output must fit a fixed JSON schema, every contact point it reports must
              appear in the original text, and the verdict comes from the rules. An injected instruction can still mislead the
              AI&apos;s reading, for example the claimed sender, but it can&apos;t write the verdict.
            </p>
          </div>
          <div className="border-t border-ink pt-3 md:col-span-2">
            <h3 className="font-semibold mb-1">Where your message goes</h3>
            <p className="text-muted leading-relaxed max-w-3xl">
              Callback doesn&apos;t store or log what you paste. When the AI service is on, the text or screenshot is sent to
              Google&apos;s Gemini API to be read and explained. On Gemini&apos;s free tier Google may use that data to improve its
              products (see the{" "}
              <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="underline">
                Gemini API terms
              </a>
              ). Don&apos;t paste passwords, full card numbers or ID numbers.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
