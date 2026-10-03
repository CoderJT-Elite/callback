import fs from "fs";
import path from "path";

/**
 * Loads GEMINI_* values from .env.local into process.env for CLI scripts (Next.js does this
 * itself for the app). Never prints values.
 */
export function loadLocalEnv(file = ".env.local"): void {
  const full = path.resolve(file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (key.startsWith("GEMINI_") && value && !process.env[key]) process.env[key] = value;
  }
}
