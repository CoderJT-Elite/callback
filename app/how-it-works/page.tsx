import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RuleTable } from "@/components/RuleTable";
import { ShieldCheck, Cpu, Database, EyeOff, Lock } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12 space-y-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Architecture & Transparency
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-white">
            How Callback Works
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Most scam detectors are black-box machine learning classifiers that predict a score like &quot;87% scam.&quot; Callback is an investigator that must bring verified receipts from public records the sender doesn&apos;t control.
          </p>
        </div>

        {/* Pipeline Diagram (SVG) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Pipeline Architecture Flow
          </h2>
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 800 240"
              className="w-full min-w-[700px] h-auto font-mono text-[11px]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Box 1: Input */}
              <rect x="10" y="20" width="130" height="90" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
              <text x="75" y="45" textAnchor="middle" fill="#0f172a" fontWeight="bold">1. Input</text>
              <text x="75" y="65" textAnchor="middle" fill="#64748b">Raw Message</text>
              <text x="75" y="80" textAnchor="middle" fill="#64748b">or Screenshot</text>
              <text x="75" y="95" textAnchor="middle" fill="#0284c7">SSRF Safe</text>

              {/* Arrow 1 */}
              <path d="M140 65 H170" stroke="#0284c7" strokeWidth="2" markerEnd="url(#arrow)" />

              {/* Box 2: Extraction */}
              <rect x="170" y="20" width="140" height="90" rx="8" fill="#f0f7ff" stroke="#0284c7" strokeWidth="2" />
              <text x="240" y="45" textAnchor="middle" fill="#0369a1" fontWeight="bold">2. Extraction</text>
              <text x="240" y="65" textAnchor="middle" fill="#0284c7">Gemini Flash</text>
              <text x="240" y="80" textAnchor="middle" fill="#64748b">+ Regex Re-scan</text>
              <text x="240" y="95" textAnchor="middle" fill="#16a34a">Anti-Hallucination</text>

              {/* Arrow 2 */}
              <path d="M310 65 H340" stroke="#0284c7" strokeWidth="2" />

              {/* Box 3: Resolution */}
              <rect x="340" y="20" width="140" height="90" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
              <text x="410" y="45" textAnchor="middle" fill="#0f172a" fontWeight="bold">3. Grounding</text>
              <text x="410" y="65" textAnchor="middle" fill="#64748b">Curated List</text>
              <text x="410" y="80" textAnchor="middle" fill="#64748b">+ Wikidata P856</text>
              <text x="410" y="95" textAnchor="middle" fill="#dc2626">Never Msg Links</text>

              {/* Arrow 3 */}
              <path d="M480 65 H510" stroke="#0284c7" strokeWidth="2" />

              {/* Box 4: Evidence & Checks */}
              <rect x="510" y="20" width="130" height="90" rx="8" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
              <text x="575" y="45" textAnchor="middle" fill="#0f172a" fontWeight="bold">4. Receipts</text>
              <text x="575" y="65" textAnchor="middle" fill="#64748b">Public Pages</text>
              <text x="575" y="80" textAnchor="middle" fill="#64748b">PSL + RDAP Age</text>
              <text x="575" y="95" textAnchor="middle" fill="#64748b">Phone Direct</text>

              {/* Arrow 4 */}
              <path d="M640 65 H665" stroke="#0284c7" strokeWidth="2" />

              {/* Box 5: Verdict Rules */}
              <rect x="665" y="20" width="125" height="90" rx="8" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
              <text x="727" y="45" textAnchor="middle" fill="#991b1b" fontWeight="bold">5. Verdict</text>
              <text x="727" y="65" textAnchor="middle" fill="#dc2626">7 Exact Rules</text>
              <text x="727" y="80" textAnchor="middle" fill="#dc2626">Deterministic</text>
              <text x="727" y="95" textAnchor="middle" fill="#dc2626">No LLM Guess</text>

              {/* Lower Path: Explanation with Validator */}
              <path d="M727 110 V160 H340" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
              <rect x="200" y="145" width="280" height="70" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
              <text x="340" y="170" textAnchor="middle" fill="#166534" fontWeight="bold">6. Cited Explanation</text>
              <text x="340" y="188" textAnchor="middle" fill="#15803d">Gemini + Strict Citation Validator [E#]</text>
              <text x="340" y="204" textAnchor="middle" fill="#64748b">Uncited sentences are automatically dropped</text>
            </svg>
          </div>
        </div>

        {/* What the AI Does vs Doesn't Do */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-sm">
              <Cpu className="w-4 h-4" />
              What the AI Does (Gemini Flash)
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-4 leading-relaxed">
              <li>Reads messy messages and extracts claimed sender names even when phrased casually.</li>
              <li>Performs multimodal optical character recognition (OCR) on screenshots.</li>
              <li>Drafts 2-5 sentence plain-English summaries explaining the evidence to consumers.</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
              <Database className="w-4 h-4" />
              What the AI Never Does (Deterministic Code)
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-4 leading-relaxed">
              <li>The AI <strong>never</strong> determines the verdict (verdicts come exclusively from 7 deterministic rules).</li>
              <li>The AI <strong>never</strong> invents official domains (domains come strictly from Wikidata P856 or curated records).</li>
              <li>The AI <strong>never</strong> makes claims without proof; every sentence must cite an evidence ID like [E1] or it is discarded.</li>
            </ul>
          </div>
        </div>

        {/* Deterministic Rule Engine */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            The 7 Deterministic Verdict Rules
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Rules are evaluated in strict order from Rule 1 to Rule 7. The first matching rule decides the outcome:
          </p>
          <RuleTable />
        </div>

        {/* Privacy, SSRF and Security */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-base">
            <Lock className="w-5 h-5 text-emerald-600" />
            Security & Privacy Protections
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">SSRF-Safe Network Client (`safeFetch`)</h4>
              <p className="leading-relaxed">
                Rejects private IP ranges (10/8, 172.16/12, 192.168/16), loopback (127/8), CGNAT, and cloud metadata endpoints (169.254.169.254). Only ports 80/443 and http/https protocols are permitted. Manual redirect inspection prevents bypasses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Prompt Injection Handling</h4>
              <p className="leading-relaxed">
                Message text is treated as data. The AI&apos;s output must fit a fixed JSON schema, every contact point it reports must appear in the original text, and the verdict comes from the rules, not the AI. An injected instruction can still mislead the AI&apos;s reading (for example, the claimed sender), but it can&apos;t write the verdict.
              </p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Where your message goes</h4>
              <p className="leading-relaxed">
                Callback doesn&apos;t store or log what you paste. When the AI service is on, the text (or screenshot) is sent to Google&apos;s Gemini API to read it and write the explanation; on Gemini&apos;s free tier Google may use that data to improve its products (see the{" "}
                <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="underline">Gemini API terms</a>). Don&apos;t paste passwords, full card numbers or ID numbers.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
