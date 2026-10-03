# Evaluation dataset: what it is and where the patterns come from

**Every item in `eval/dataset.jsonl` is synthetic.** The messages were written for this project by
the AI coding agent, modeled on scam patterns that the public consumer warnings below describe. None
is a verbatim quote from those pages, and none comes from a public dataset. (An earlier version of
this file and the dataset labeled some items `published_example` or `public_dataset` from the UCI SMS
Spam Collection. That was wrong; they have been relabeled `synthetic`.)

So the eval is a consistency check on our own examples, not a measurement of real-world accuracy.

## Item fields

- `source_type`: always `synthetic`.
- `source_ref`:
  - `modeled_on:<key>`: a scam written to follow a pattern described on the page for `<key>` below.
  - `synthetic_legit_brand_notice`: a legitimate-style notice from a curated organization.
  - `synthetic_personal_message`: an ordinary personal text with no organization.
  - `synthetic_personal_impersonation`, `synthetic_fluent_phish`, `synthetic_adversarial_prompt_injection`:
    edge cases (family-impersonation scam, fluent no-typo phish, prompt-injection attempt).
- `split`: 15 dev (used while debugging), 35 test (not used to tune rules).

Scam samples use fictional numbers (`555-01xx`) and lookalike domains. Contact details in the
legitimate items were written by the agent; we haven't checked each one against the organization's
own pages, so a "false alarm" on a legitimate item can mean the item itself is wrong.

## Pattern sources (US government works, public domain under 17 U.S.C. § 105)

All URLs checked on 2026-10-03.

| Key | Page | Status |
|---|---|---|
| `ftc_consumer_alerts_2025_2026` | https://consumer.ftc.gov/consumer-alerts | 200 |
| `uspis_package_tracking_smishing` | https://www.uspis.gov/news/scam-article/smishing-package-tracking-text-scams | 200 |
| `irs_smishing_phishing_alerts` | https://www.irs.gov/newsroom/tax-scams-consumer-alerts | 200 |
| `ssa_scam_advisory` | https://www.ssa.gov/scam/ | 403 to scripted requests (the page exists; it blocks automated fetches) |

## What would make it stronger (not done)

Real, licensed messages: for example ham messages from the UCI SMS Spam Collection (CC BY 4.0) as
"no organization" controls, and smishing examples quoted on official pages, each cited per item.

## Contact points in the legitimate messages (checked 2026-10-03)
Every phone number in a `label: legit` item appears in that organization's own snapshot under
`data/snapshots/`: Wells Fargo 1-800-869-3557, Capital One 1-877-383-4802, Bank of America
1-800-432-1000, Medicare 1-800-633-4227. Every domain is on the organization's `officialDomains`
list in `scripts/build-curated-orgs.ts` (usps.com, amazon.com, ups.com, paypal.com, bestbuy.com,
venmo.com, zellepay.com, netflix.com, wellsfargo.com, capitalone.com, bankofamerica.com,
medicare.gov). The message wording, order numbers and amounts are still invented; only the contact
points were checked, so "legit confirmed" tests contact-point matching, not realism of the prose.
