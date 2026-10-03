export interface RDAPResult {
  domain: string;
  is_registered: boolean;
  registration_date: string | null;
  age_days: number | null;
  status: "active" | "not_registered" | "unavailable";
}

const USER_AGENT = "CallbackSecurityBot/1.0 (+https://github.com/CoderJT-Elite/callback; ForgeHacks 2026)";

/**
 * Queries RDAP for domain registration date and computes domain age in days.
 * 3-second timeout.
 */
export async function checkDomainAge(domain: string): Promise<RDAPResult> {
  if (!domain || typeof domain !== "string") {
    return {
      domain,
      is_registered: false,
      registration_date: null,
      age_days: null,
      status: "unavailable",
    };
  }

  const cleanDomain = domain.toLowerCase().trim();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(cleanDomain)}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rdap+json,application/json",
      },
    });
    clearTimeout(timeout);

    if (res.status === 404) {
      return {
        domain: cleanDomain,
        is_registered: false,
        registration_date: null,
        age_days: null,
        status: "not_registered",
      };
    }

    if (!res.ok) {
      return {
        domain: cleanDomain,
        is_registered: true,
        registration_date: null,
        age_days: null,
        status: "unavailable",
      };
    }

    const data = await res.json();
    const events = (data.events || []) as Array<{ eventAction?: string; eventDate?: string }>;
    const regEvent = events.find(
      e => e.eventAction === "registration" || e.eventAction === "created"
    );

    if (regEvent && regEvent.eventDate) {
      const regTime = new Date(regEvent.eventDate).getTime();
      const now = Date.now();
      const diffDays = Math.max(0, Math.floor((now - regTime) / (1000 * 60 * 60 * 24)));

      return {
        domain: cleanDomain,
        is_registered: true,
        registration_date: regEvent.eventDate.split("T")[0],
        age_days: diffDays,
        status: "active",
      };
    }

    return {
      domain: cleanDomain,
      is_registered: true,
      registration_date: null,
      age_days: null,
      status: "unavailable",
    };
  } catch {
    return {
      domain: cleanDomain,
      is_registered: true, // assume potentially registered if network timeout occurs
      registration_date: null,
      age_days: null,
      status: "unavailable",
    };
  }
}
