import fs from "fs";
import { runPipeline } from "../lib/pipeline";
import { geminiExtract, geminiExplain } from "../lib/llm/gemini";
import { getGeminiConfig } from "../lib/llm/config";

// Load .env.local into process.env if not already set (Next.js does this automatically in dev/prod)
if (!process.env.GEMINI_API_KEY && fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      const val = vals.join("=").trim();
      process.env[key.trim()] = val;
    }
  }
}

async function main() {
  const config = getGeminiConfig();
  console.log(`[Config] Model: ${config.model}, Key configured: ${config.hasKey ? "YES (hidden)" : "NO"}`);

  if (!config.hasKey) {
    console.log("No real GEMINI_API_KEY provided. Skipping live API call, verifying keyless fallback.");
  } else {
    console.log("\n--- LIVE GEMINI PIPELINE TEST ---");
    const testSample = "USPS Notification: Package #US8921 held at regional depot. Pay $1.99 redelivery fee within 24 hours at usps-redelivery-notice.xyz to release package.";

    console.log(`Input: "${testSample}"\n`);
    const liveResult = await runPipeline(testSample, {
      llmExtractor: (text) => geminiExtract(text),
      llmExplainer: (v, e, o) => geminiExplain(v, e, o),
    });

    console.log("1. Live Gemini Extraction:");
    console.log(JSON.stringify(liveResult.extraction, null, 2));

    console.log("\n2. Deterministic Verdict:");
    console.log(`${liveResult.verdict.headline} (${liveResult.verdict.rule_id})`);

    console.log("\n3. Live Gemini Cited Explanation:");
    console.log(`Mode: ${liveResult.explanation.mode}, Dropped uncited sentences: ${liveResult.explanation.dropped_count}`);
    for (const s of liveResult.explanation.sentences) {
      console.log(`- ${s.text} [cites: ${s.cites.join(", ")}]`);
    }
  }

  console.log("\n--- KEYLESS FALLBACK TEST ---");
  const fallbackResult = await runPipeline(
    "Wells Fargo Alert: Suspicious transaction detected. Call 888-555-0142 immediately.",
    { skipLLM: true }
  );
  console.log(`Fallback Verdict: ${fallbackResult.verdict.headline} (${fallbackResult.verdict.rule_id})`);
  console.log(`Fallback Explanation (${fallbackResult.explanation.mode}):`);
  for (const s of fallbackResult.explanation.sentences) {
    console.log(`- ${s.text}`);
  }
  console.log("\nLIVE & FALLBACK VERIFICATION COMPLETE.");
}

main().catch(err => {
  console.error("Live test failed:", err);
  process.exit(1);
});
