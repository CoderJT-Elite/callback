import fs from "fs";
import path from "path";
import { runPipeline } from "../lib/pipeline";
import { SSEEventData } from "../lib/types";

export interface SampleDefinition {
  id: string;
  chipLabel: string;
  category: "scam" | "legit";
  inputText: string;
  isScreenshot?: boolean;
}

export const SAMPLES: SampleDefinition[] = [
  {
    id: "bank-alert",
    chipLabel: "Bank alert text",
    category: "scam",
    inputText:
      "Wells Fargo Alert: Suspicious transaction detected. Call our fraud prevention line immediately at 888-555-0142 to secure your account.",
  },
  {
    id: "package-delivery",
    chipLabel: "Package delivery",
    category: "scam",
    inputText:
      "USPS: Your package #US9402283 could not be delivered due to an incorrect address. Pay $1.99 redelivery fee within 24 hours at usps-redelivery-notice.xyz to avoid return.",
  },
  {
    id: "recruiter-offer",
    chipLabel: "Recruiter job offer",
    category: "scam",
    inputText:
      "Hello! I am Sarah from Amazon Recruitment. We have a remote Data Entry position paying $45/hr. Contact me at amazon-hr-careers@gmail.com to start your interview.",
  },
  {
    id: "real-bank-alert",
    chipLabel: "Real bank alert",
    category: "legit",
    inputText:
      "Wells Fargo: Fraud alert! Did you attempt a $42.50 transaction at TARGET? Reply YES or NO. For customer service, visit https://www.wellsfargo.com/help/contact-us/ or call 1-800-869-3557.",
  },
  {
    id: "screenshot-sample",
    chipLabel: "Screenshot sample",
    category: "scam",
    isScreenshot: true,
    inputText:
      "USPS Notification: Parcel shipment on hold. Update billing information at usps-address-update.xyz to schedule redelivery. Ref #84920",
  },
];

async function main() {
  const dateStr = "2026-10-03";
  const outDir = path.resolve(process.cwd(), "data", "samples");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`Precomputing pipeline results for ${SAMPLES.length} sample chips...`);

  for (const sample of SAMPLES) {
    console.log(`Precomputing [${sample.id}] (${sample.chipLabel})...`);
    const events: SSEEventData[] = [];

    const result = await runPipeline(sample.inputText, {
      onEvent: (e) => events.push(e),
    });

    const sampleData = {
      sample_id: sample.id,
      chip_label: sample.chipLabel,
      category: sample.category,
      is_screenshot: !!sample.isScreenshot,
      input_text: sample.inputText,
      precomputed_at: dateStr,
      events,
      result: {
        extraction: result.extraction,
        resolved_org: result.resolved_org,
        evidences: result.evidences,
        verdict: result.verdict,
        explanation: result.explanation,
        steps: result.steps,
      },
    };

    const filePath = path.join(outDir, `${sample.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(sampleData, null, 2), "utf8");
    console.log(`Saved ${filePath} (Verdict: ${result.verdict.headline})`);
  }

  console.log("All sample events precomputed successfully!");
}

main().catch(err => {
  console.error("Failed to precompute samples:", err);
  process.exit(1);
});
