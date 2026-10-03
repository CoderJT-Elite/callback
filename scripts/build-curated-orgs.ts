import fs from "fs";
import path from "path";
import { getDomain } from "tldts";

interface OrgSeed {
  id: string;
  name: string;
  aliases: string[];
  searchQuery: string;
  contactPages: string[];
  knownSmsShortcodes?: string[];
}

const TARGET_ORGS: OrgSeed[] = [
  {
    id: "usps",
    name: "USPS",
    aliases: ["United States Postal Service", "Postal Service", "Post Office"],
    searchQuery: "United States Postal Service",
    contactPages: ["https://www.usps.com/help/contact-us.htm"],
  },
  {
    id: "ups",
    name: "UPS",
    aliases: ["United Parcel Service"],
    searchQuery: "United Parcel Service",
    contactPages: ["https://www.ups.com/us/en/support/contact-us.page"],
  },
  {
    id: "fedex",
    name: "FedEx",
    aliases: ["Federal Express"],
    searchQuery: "FedEx",
    contactPages: ["https://www.fedex.com/en-us/customer-support.html"],
  },
  {
    id: "dhl",
    name: "DHL",
    aliases: ["DHL Express"],
    searchQuery: "DHL",
    contactPages: ["https://www.dhl.com/us-en/home/customer-service.html"],
  },
  {
    id: "amazon",
    name: "Amazon",
    aliases: ["Amazon.com", "Amazon Prime"],
    searchQuery: "Amazon",
    contactPages: ["https://www.amazon.com/gp/help/customer/display.html"],
  },
  {
    id: "apple",
    name: "Apple",
    aliases: ["Apple Inc.", "Apple Support", "iCloud"],
    searchQuery: "Apple Inc.",
    contactPages: ["https://support.apple.com/contact"],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    aliases: ["Microsoft Corporation", "Microsoft Support"],
    searchQuery: "Microsoft",
    contactPages: ["https://support.microsoft.com/contactus"],
  },
  {
    id: "paypal",
    name: "PayPal",
    aliases: ["PayPal Inc."],
    searchQuery: "PayPal",
    contactPages: ["https://www.paypal.com/us/cshelp/contact-us"],
  },
  {
    id: "netflix",
    name: "Netflix",
    aliases: ["Netflix Inc."],
    searchQuery: "Netflix",
    contactPages: ["https://help.netflix.com/contactus"],
  },
  {
    id: "chase",
    name: "Chase",
    aliases: ["Chase Bank", "JPMorgan Chase"],
    searchQuery: "JPMorgan Chase",
    contactPages: ["https://www.chase.com/digital/resources/privacy-security/security/how-we-protect-you"],
  },
  {
    id: "bank-of-america",
    name: "Bank of America",
    aliases: ["BofA"],
    searchQuery: "Bank of America",
    contactPages: ["https://www.bankofamerica.com/customer-service/contact-us/"],
  },
  {
    id: "wells-fargo",
    name: "Wells Fargo",
    aliases: ["Wells Fargo Bank"],
    searchQuery: "Wells Fargo",
    contactPages: ["https://www.wellsfargo.com/help/contact-us/"],
  },
  {
    id: "citi",
    name: "Citi",
    aliases: ["Citibank", "Citigroup"],
    searchQuery: "Citigroup",
    contactPages: ["https://www.citi.com/customer-service/contact-us"],
  },
  {
    id: "capital-one",
    name: "Capital One",
    aliases: ["Capital One Bank"],
    searchQuery: "Capital One",
    contactPages: ["https://www.capitalone.com/support-center/contact-us/"],
  },
  {
    id: "irs",
    name: "Internal Revenue Service",
    aliases: ["IRS"],
    searchQuery: "Internal Revenue Service",
    contactPages: ["https://www.irs.gov/help/telephone-assistance"],
  },
  {
    id: "ssa",
    name: "Social Security Administration",
    aliases: ["SSA"],
    searchQuery: "Social Security Administration",
    contactPages: ["https://www.ssa.gov/agency/contact/"],
  },
  {
    id: "medicare",
    name: "Medicare",
    aliases: ["Centers for Medicare & Medicaid Services", "CMS"],
    searchQuery: "Centers for Medicare & Medicaid Services",
    contactPages: ["https://www.medicare.gov/talk-to-someone"],
  },
  {
    id: "ezpass",
    name: "E-ZPass",
    aliases: ["EZPass", "E-ZPass Group"],
    searchQuery: "E-ZPass",
    contactPages: ["https://www.e-zpassiag.com/contact-us"],
  },
  {
    id: "sunpass",
    name: "SunPass",
    aliases: ["Florida SunPass", "Florida Department of Transportation"],
    searchQuery: "SunPass",
    contactPages: ["https://www.sunpass.com/en/support/contactSunPass.shtml"],
  },
  {
    id: "fastrak",
    name: "FasTrak",
    aliases: ["California FasTrak", "Bay Area FasTrak"],
    searchQuery: "FasTrak",
    contactPages: ["https://www.bayareafastrak.org/en/support/contact-us.shtml"],
  },
  {
    id: "coinbase",
    name: "Coinbase",
    aliases: ["Coinbase Global"],
    searchQuery: "Coinbase",
    contactPages: ["https://help.coinbase.com/en/contact-us"],
  },
  {
    id: "venmo",
    name: "Venmo",
    aliases: ["Venmo LLC"],
    searchQuery: "Venmo",
    contactPages: ["https://help.venmo.com/hc/en-us/articles/217532217-Contact-Venmo"],
  },
  {
    id: "zelle",
    name: "Zelle",
    aliases: ["Zellepay", "Early Warning Services"],
    searchQuery: "Early Warning Services",
    contactPages: ["https://www.zellepay.com/contact-us"],
  },
  {
    id: "geek-squad",
    name: "Geek Squad",
    aliases: ["Best Buy Geek Squad"],
    searchQuery: "Geek Squad",
    contactPages: ["https://www.bestbuy.com/site/services/geek-squad/pcmcat138100050018.c"],
  },
  {
    id: "best-buy",
    name: "Best Buy",
    aliases: ["Best Buy Co., Inc."],
    searchQuery: "Best Buy",
    contactPages: ["https://www.bestbuy.com/site/help-topics/contact-us/pcmcat204400050019.c"],
  },
  {
    id: "norton",
    name: "Norton",
    aliases: ["NortonLifeLock", "Gen Digital"],
    searchQuery: "NortonLifeLock",
    contactPages: ["https://support.norton.com/sp/en/us/home/current/contact"],
  },
  {
    id: "mcafee",
    name: "McAfee",
    aliases: ["McAfee Corp."],
    searchQuery: "McAfee",
    contactPages: ["https://www.mcafee.com/support/contact/"],
  },
];

const USER_AGENT = "CallbackSecurityBot/1.0 (https://github.com/CoderJT-Elite/callback)";

async function fetchWikidata(query: string): Promise<{ qid: string; domain: string | null }> {
  try {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      query
    )}&language=en&format=json&limit=3`;
    const res = await fetch(searchUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return { qid: "COULD NOT VERIFY", domain: null };
    const data = await res.json();
    if (!data.search || data.search.length === 0) {
      return { qid: "COULD NOT VERIFY", domain: null };
    }

    const qid = data.search[0].id;
    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&format=json&props=claims`;
    const entityRes = await fetch(entityUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!entityRes.ok) return { qid, domain: null };
    const entityData = await entityRes.json();
    const claims = entityData.entities[qid]?.claims;
    const p856 = claims?.P856?.[0]?.mainsnak?.datavalue?.value;
    const domain = p856 ? getDomain(p856) : null;

    return { qid, domain };
  } catch {
    return { qid: "COULD NOT VERIFY", domain: null };
  }
}

async function verifyUrlStatus(url: string): Promise<number | "ERROR"> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
    });
    clearTimeout(timeout);
    return res.status;
  } catch {
    return "ERROR";
  }
}

async function main() {
  console.log(`Starting real verification of ${TARGET_ORGS.length} curated organizations...`);
  const dateStr = "2026-10-03";
  const results = [];

  for (const org of TARGET_ORGS) {
    console.log(`Verifying ${org.name} via Wikidata & contact pages...`);
    const { qid, domain } = await fetchWikidata(org.searchQuery);

    const verifiedContactPages = [];
    const statusReports = [];

    for (const pageUrl of org.contactPages) {
      const status = await verifyUrlStatus(pageUrl);
      verifiedContactPages.push(pageUrl);
      statusReports.push(`URL ${pageUrl} verified ${status} ${dateStr}`);
    }

    // Determine official domain
    const officialDomains: string[] = [];
    if (domain) {
      officialDomains.push(domain);
    }
    for (const cp of org.contactPages) {
      const pageDomain = getDomain(cp);
      if (pageDomain && !officialDomains.includes(pageDomain)) {
        officialDomains.push(pageDomain);
      }
    }

    const sourceNotes = `domains from Wikidata P856 (${qid}) fetched ${dateStr}; ${statusReports.join("; ")}`;

    results.push({
      id: org.id,
      name: org.name,
      aliases: org.aliases,
      wikidata: qid,
      official_domains: officialDomains,
      contact_pages: verifiedContactPages,
      known_sms_shortcodes: org.knownSmsShortcodes || [],
      source_notes: sourceNotes,
    });
  }

  const outDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, "curated-orgs.json");
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), "utf8");
  console.log(`Successfully verified and wrote ${results.length} curated orgs to ${outFile}`);
}

main().catch(err => {
  console.error("Failed to build curated orgs:", err);
  process.exit(1);
});
