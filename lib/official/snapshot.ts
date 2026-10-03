import fs from "fs";
import path from "path";
import { SnapshotData } from "../types";

/**
 * Loads a cached official evidence snapshot for a curated organization.
 */
export function getSnapshotForOrg(orgId: string): SnapshotData | null {
  try {
    const snapshotPath = path.resolve(process.cwd(), "data", "snapshots", `${orgId}.json`);
    if (!fs.existsSync(snapshotPath)) {
      return null;
    }
    const content = fs.readFileSync(snapshotPath, "utf8");
    return JSON.parse(content) as SnapshotData;
  } catch {
    return null;
  }
}
