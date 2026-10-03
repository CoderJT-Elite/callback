import { runPipeline } from "../lib/pipeline";

async function main() {
  const input = process.argv[2];

  if (!input) {
    console.log("Usage: npx tsx scripts/check.ts \"<suspicious message text>\"");
    process.exit(1);
  }

  console.log(`Checking message: "${input}"\n`);

  const result = await runPipeline(input, {
    onEvent: (e) => {
      if (e.event === "step") {
        const step = e.data as { id: string; label: string; status: string; detail?: string };
        const icon = step.status === "ok" ? "✓" : step.status === "fail" ? "✗" : step.status === "warn" ? "!" : "→";
        console.log(`${icon} [${step.id}] ${step.label}${step.detail ? ` (${step.detail})` : ""}`);
      }
    },
  });

  console.log("\n==================== VERDICT ====================");
  console.log(`TYPE:     ${result.verdict.type}`);
  console.log(`HEADLINE: ${result.verdict.headline}`);
  console.log(`COLOR:    ${result.verdict.color}`);
  console.log(`RULE:     ${result.verdict.rule_id}`);
  console.log(`DETAILS:  ${result.verdict.details}`);
  if (result.verdict.official_channel) {
    console.log(`OFFICIAL: ${result.verdict.official_channel.name} (${result.verdict.official_channel.domain || "N/A"})`);
    if (result.verdict.official_channel.phone) {
      console.log(`PHONE:    ${result.verdict.official_channel.phone}`);
    }
  }
  console.log("==================== RECEIPTS ===================");
  for (const ev of result.evidences) {
    console.log(`[${ev.id}] [${ev.kind.toUpperCase()}] ${ev.text}`);
  }
  console.log("================== EXPLANATION ==================");
  for (const s of result.explanation.sentences) {
    console.log(`- ${s.text}`);
  }
}

main().catch(err => {
  console.error("Error executing check:", err);
  process.exit(1);
});
