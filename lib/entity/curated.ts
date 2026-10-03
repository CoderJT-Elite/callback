import curatedOrgsData from "../../data/curated-orgs.json";
import { CuratedOrg } from "../types";

const curatedOrgs: CuratedOrg[] = curatedOrgsData as CuratedOrg[];

/**
 * Searches curated organizations by name or alias.
 * Case-insensitive, trimmed, and word-boundary aware.
 */
export function findCuratedOrg(nameOrQuery: string): CuratedOrg | null {
  if (!nameOrQuery || typeof nameOrQuery !== "string") return null;

  const normalized = nameOrQuery.trim().toLowerCase();
  if (!normalized) return null;

  // 1. Direct name match
  for (const org of curatedOrgs) {
    if (org.name.toLowerCase() === normalized) {
      return org;
    }
  }

  // 2. Alias exact match
  for (const org of curatedOrgs) {
    for (const alias of org.aliases) {
      if (alias.toLowerCase() === normalized) {
        return org;
      }
    }
  }

  // 3. Substring / word boundary match
  for (const org of curatedOrgs) {
    const allNames = [org.name, ...org.aliases];
    for (const n of allNames) {
      const lower = n.toLowerCase();
      // Word boundary regex
      const re = new RegExp(`\\b${escapeRegExp(lower)}\\b`, "i");
      if (re.test(normalized) || re.test(nameOrQuery)) {
        return org;
      }
    }
  }

  return null;
}

export function getAllCuratedOrgs(): CuratedOrg[] {
  return curatedOrgs;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
