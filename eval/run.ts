import fs from "fs";
import path from "path";
import crypto from "crypto";
import { loadLocalEnv } from "../scripts/loadEnv";
import { runPipeline, PipelineResult } from "../lib/pipeline";
import { GoogleGenAI } from "@google/genai";
import { getGeminiConfig } from "../lib/llm/config";

loadLocalEnv();

interface EvalItem {
  id: string;
  text: string;
  label: "scam" | "legit";
  claimed_org: string | null;
  source_type: "public_dataset" | "published_example" | "synthetic";
  source_ref: string;
  split: "dev" | "test";
}

interface SystemResult {
  itemId: string;
  verdict: string;
  isScamPredicted: boolean;
  isLegitPredicted: boolean;
  isAbstain: boolean;
  latencyMs: number;
  llmUsed?: boolean;
  sentences?: number;
  citedSentences?: number;
  droppedSentences?: number;
  droppedExtractions?: number;
}

// Bump when pipeline behavior changes so cached System A/B answers aren't reused across versions.
const CACHE_VERSION = "v2";
const GEMINI_SPACING_MS = 8000; // free tier has a per-minute request cap; B makes 2 calls per item
const CACHE_DIR = path.resolve("eval/cache");
const RESULTS_DIR = path.resolve("eval/results");

fs.mkdirSync(CACHE_DIR, { recursive: true });
fs.mkdirSync(RESULTS_DIR, { recursive: true });

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function cacheKey(system: string, model: string, text: string): string {
  return crypto.createHash("sha256").update(`${CACHE_VERSION}:${system}:${model}:${text}`).digest("hex");
}

function readCache<T>(key: string): T | null {
  const file = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: unknown) {
  fs.writeFileSync(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(data, null, 2), "utf-8");
}

function fromPipeline(item: EvalItem, out: PipelineResult, latencyMs: number): SystemResult {
  const extractStep = out.steps.find(s => s.id === "extract");
  const dropped = out.extraction.dropped_hallucinations;
  return {
    itemId: item.id,
    verdict: out.verdict.type,
    isScamPredicted: out.verdict.type === "DOESNT_MATCH",
    isLegitPredicted: out.verdict.type === "MATCHES",
    isAbstain: out.verdict.type === "CANT_VERIFY" || out.verdict.type === "NO_ORGANIZATION_CLAIMED",
    latencyMs,
    llmUsed: extractStep?.status === "ok" && extractStep.label.startsWith("AI"),
    sentences: out.explanation.sentences.length,
    citedSentences: out.explanation.sentences.filter(s => s.cites.length > 0).length,
    droppedSentences: out.explanation.dropped_count ?? 0,
    droppedExtractions: dropped
      ? dropped.phones.length + dropped.urls.length + dropped.emails.length + (dropped.invalid_sender_quote ? 1 : 0)
      : 0,
  };
}

async function runSystemA(item: EvalItem, ai: GoogleGenAI, model: string): Promise<SystemResult | null> {
  const key = cacheKey("A", model, item.text);
  const cached = readCache<SystemResult>(key);
  if (cached) return cached;

  const prompt = `Is this message a scam? Answer SCAM or LEGIT on the first line and give one sentence of reasoning on the second line.\n\nMessage:\n"""\n${item.text}\n"""`;
  const t0 = Date.now();
  try {
    const res = await ai.models.generateContent({ model, contents: [prompt], config: { temperature: 0 } });
    const firstLine = (res.text || "").trim().split("\n")[0].trim().toUpperCase();
    const isScam = firstLine.includes("SCAM");
    const isLegit = !isScam && firstLine.includes("LEGIT");
    const result: SystemResult = {
      itemId: item.id,
      verdict: isScam ? "SCAM" : isLegit ? "LEGIT" : "UNPARSEABLE",
      isScamPredicted: isScam,
      isLegitPredicted: isLegit,
      isAbstain: !isScam && !isLegit,
      latencyMs: Date.now() - t0,
    };
    writeCache(key, result);
    await sleep(GEMINI_SPACING_MS);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  [A] ${item.id} failed: ${msg.includes("429") ? "quota (429)" : msg.slice(0, 80)}`);
    return null;
  }
}

async function runSystemB(item: EvalItem, model: string): Promise<SystemResult> {
  const key = cacheKey("B", model, item.text);
  const cached = readCache<SystemResult>(key);
  if (cached) return cached;
  const t0 = Date.now();
  const out = await runPipeline(item.text, {});
  const result = fromPipeline(item, out, Date.now() - t0);
  // Only cache runs where the AI actually answered, so a quota hit doesn't freeze a fallback result.
  if (result.llmUsed) writeCache(key, result);
  await sleep(GEMINI_SPACING_MS);
  return result;
}

async function runSystemC(item: EvalItem): Promise<SystemResult> {
  const t0 = Date.now();
  const out = await runPipeline(item.text, { skipLLM: true });
  return fromPipeline(item, out, Date.now() - t0);
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1)];
}

function pct(n: number, d: number): string {
  return d > 0 ? `${((n / d) * 100).toFixed(1)}% (${n}/${d})` : "n/a";
}

function metrics(items: EvalItem[], results: SystemResult[]) {
  const scams = items.filter(i => i.label === "scam");
  const legit = items.filter(i => i.label === "legit");
  const byId = new Map(results.map(r => [r.itemId, r]));
  const get = (i: EvalItem) => byId.get(i.id)!;
  const sum = (f: (r: SystemResult) => number | undefined) => results.reduce((a, r) => a + (f(r) ?? 0), 0);
  return {
    n: results.length,
    caught: pct(scams.filter(i => get(i).isScamPredicted).length, scams.length),
    falseAlarms: pct(legit.filter(i => get(i).isScamPredicted).length, legit.length),
    legitConfirmed: pct(legit.filter(i => get(i).isLegitPredicted).length, legit.length),
    abstain: pct(results.filter(r => r.isAbstain).length, results.length),
    receiptBacked: pct(sum(r => r.citedSentences), sum(r => r.sentences)),
    droppedSentences: sum(r => r.droppedSentences),
    droppedExtractions: sum(r => r.droppedExtractions),
    llmUsed: results.filter(r => r.llmUsed).length,
    p50: percentile(results.map(r => r.latencyMs), 50),
    p95: percentile(results.map(r => r.latencyMs), 95),
  };
}

type Metrics = ReturnType<typeof metrics>;

async function main() {
  const datasetPath = path.resolve("eval/dataset.jsonl");
  // Normalize line endings so the hash matches on Windows and Linux checkouts.
  const raw = fs.readFileSync(datasetPath, "utf-8").replace(/\r\n/g, "\n");
  const dataset: EvalItem[] = raw.trim().split("\n").map(l => JSON.parse(l));
  const datasetHash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 12);
  const test = dataset.filter(d => d.split === "test");
  const dev = dataset.filter(d => d.split === "dev");

  console.log(`=== CALLBACK EVALUATION ===`);
  console.log(`Dataset: ${dataset.length} items (dev ${dev.length}, test ${test.length}), hash ${datasetHash}`);

  const config = getGeminiConfig();
  const ai = config.apiKey ? new GoogleGenAI({ apiKey: config.apiKey }) : null;
  console.log(ai ? `Gemini model: ${config.model}` : `No GEMINI_API_KEY: running System C only.`);

  console.log(`System C (keyless)...`);
  const cResults: SystemResult[] = [];
  for (const item of test) cResults.push(await runSystemC(item));

  let aResults: SystemResult[] | null = null;
  let bResults: SystemResult[] | null = null;
  let aMissing = 0;
  if (ai) {
    console.log(`System A (Gemini alone)...`);
    aResults = [];
    for (const item of test) {
      const r = await runSystemA(item, ai, config.model);
      if (r) aResults.push(r);
      else aMissing++;
    }
    console.log(`System B (Callback with Gemini)...`);
    bResults = [];
    for (const item of test) bResults.push(await runSystemB(item, config.model));
  }

  const mC = metrics(test, cResults);
  const mA = aResults && aResults.length === test.length ? metrics(test, aResults) : null;
  const mB = bResults ? metrics(test, bResults) : null;
  const bComplete = !!mB && mB.llmUsed === test.length;

  const cell = (m: Metrics | null, k: keyof Metrics, pending: string) => (m ? String(m[k]) : pending);
  const pendA = ai ? `INCOMPLETE (${aMissing} calls failed)` : "PENDING: needs GEMINI_API_KEY";
  const pendB = "PENDING: needs GEMINI_API_KEY";
  const today = new Date().toISOString().split("T")[0];

  const summary = `# Callback evaluation summary

- **Date:** ${today}
- **Dataset:** \`eval/dataset.jsonl\`, ${dataset.length} items (dev ${dev.length}, test ${test.length}), hash \`${datasetHash}\`
- **Test split:** ${test.filter(i => i.label === "scam").length} scams, ${test.filter(i => i.label === "legit").length} legitimate
- **All items are synthetic:** written for this project, modeled on patterns in FTC, USPIS, IRS and SSA consumer warnings (see \`eval/SOURCES.md\`). Treat these numbers as a check on our own examples, not a real-world accuracy rate.
- **Model:** \`${config.model}\` (Systems A and B)${mB ? `; Gemini answered the extraction step for ${mB.llmUsed}/${test.length} System B items${bComplete ? "" : " (the rest fell back to the built-in rules, so System B is partly keyless)"}` : ""}
- **Rule tuning:** none against the test split. Before this run, the curated official-domain list was corrected by hand (Citi, Medicare, Zelle, Norton, Chase contact page); see \`docs/STATUS.md\`.

## Test split (N = ${test.length})

| Metric | A: Gemini alone | B: Callback (Gemini + rules) | C: Callback keyless |
|---|---|---|---|
| Scams caught (A: said SCAM; B/C: DOESN'T MATCH) | ${cell(mA, "caught", pendA)} | ${cell(mB, "caught", pendB)} | ${mC.caught} |
| False alarms on legitimate messages | ${cell(mA, "falseAlarms", pendA)} | ${cell(mB, "falseAlarms", pendB)} | ${mC.falseAlarms} |
| Legitimate messages confirmed (A: LEGIT; B/C: MATCHES) | ${cell(mA, "legitConfirmed", pendA)} | ${cell(mB, "legitConfirmed", pendB)} | ${mC.legitConfirmed} |
| Abstained (A: unparseable; B/C: CAN'T VERIFY / NO ORGANIZATION CLAIMED) | ${cell(mA, "abstain", pendA)} | ${cell(mB, "abstain", pendB)} | ${mC.abstain} |
| Explanation sentences that cite evidence | n/a (no evidence) | ${cell(mB, "receiptBacked", pendB)} | ${mC.receiptBacked} |
| Uncited AI sentences dropped by the validator | n/a | ${cell(mB, "droppedSentences", pendB)} | n/a |
| AI-extracted contact points rejected (not in the text) | n/a | ${cell(mB, "droppedExtractions", pendB)} | n/a |
| Latency p50 / p95 (ms) | ${mA ? `${mA.p50} / ${mA.p95}` : pendA} | ${mB ? `${mB.p50} / ${mB.p95}` : pendB} | ${mC.p50} / ${mC.p95} |

How to read it: A must answer SCAM or LEGIT for every message, so it rarely abstains, but it shows no
evidence. B and C only say DOESN'T MATCH or MATCHES when they can point to the organization's own
channels; otherwise they abstain. B and C latency includes live fetches of official pages and RDAP
lookups. The template explanation adds an uncited safety tip for personal messages, so its cited
share can be below 100%.

## Per-item results (test split)

| Item | Label | A | B | C |
|---|---|---|---|---|
${test
  .map(i => {
    const a = aResults?.find(r => r.itemId === i.id);
    const b = bResults?.find(r => r.itemId === i.id);
    const c = cResults.find(r => r.itemId === i.id)!;
    return `| ${i.id} | ${i.label} | ${a ? a.verdict : "-"} | ${b ? `${b.verdict}${b.llmUsed ? "" : " (rules only)"}` : "-"} | ${c.verdict} |`;
  })
  .join("\n")}
`;

  fs.writeFileSync(path.join(RESULTS_DIR, "summary.md"), summary, "utf-8");
  fs.writeFileSync(
    path.join(RESULTS_DIR, "results.json"),
    JSON.stringify(
      { date: today, datasetHash, model: config.model, metrics: { A: mA, B: mB, C: mC }, results: { A: aResults, B: bResults, C: cResults } },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`\nWrote eval/results/summary.md and eval/results/results.json\n`);
  console.log(summary.split("## Per-item")[0]);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
