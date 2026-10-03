# Callback evaluation summary

- **Date:** 2026-10-03
- **Dataset:** `eval/dataset.jsonl`, 50 items (dev 15, test 35), hash `38eb73eb419c`
- **Test split:** 20 scams, 15 legitimate
- **All items are synthetic:** written for this project, modeled on patterns in FTC, USPIS, IRS and SSA consumer warnings (see `eval/SOURCES.md`). Treat these numbers as a check on our own examples, not a real-world accuracy rate.
- **Model:** `gemini-3.5-flash-lite` (Systems A and B); Gemini answered the extraction step for 35/35 System B items
- **Rule tuning:** none against the test split. Before this run, the curated official-domain list was corrected by hand (Citi, Medicare, Zelle, Norton, Chase contact page); see `docs/STATUS.md`.

## Test split (N = 35)

| Metric | A: Gemini alone | B: Callback (Gemini + rules) | C: Callback keyless |
|---|---|---|---|
| Scams caught (A: said SCAM; B/C: DOESN'T MATCH) | 100.0% (20/20) | 75.0% (15/20) | 75.0% (15/20) |
| False alarms on legitimate messages | 6.7% (1/15) | 0.0% (0/15) | 0.0% (0/15) |
| Legitimate messages confirmed (A: LEGIT; B/C: MATCHES) | 93.3% (14/15) | 66.7% (10/15) | 66.7% (10/15) |
| Abstained (A: unparseable; B/C: CAN'T VERIFY / NO ORGANIZATION CLAIMED) | 0.0% (0/35) | 28.6% (10/35) | 28.6% (10/35) |
| Explanation sentences that cite evidence | n/a (no evidence) | 92.5% (74/80) | 83.7% (41/49) |
| Uncited AI sentences dropped by the validator | n/a | 5 | n/a |
| AI-extracted contact points rejected (not in the text) | n/a | 1 | n/a |
| Latency p50 / p95 (ms) | 746 / 3405 | 2488 / 4514 | 260 / 2647 |

How to read it: A must answer SCAM or LEGIT for every message, so it rarely abstains, but it shows no
evidence. B and C only say DOESN'T MATCH or MATCHES when they can point to the organization's own
channels; otherwise they abstain. B and C latency includes live fetches of official pages and RDAP
lookups. The template explanation adds an uncited safety tip for personal messages, so its cited
share can be below 100%.

## Per-item results (test split)

| Item | Label | A | B | C |
|---|---|---|---|---|
| eval-test-01 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-02 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-03 | scam | SCAM | CANT_VERIFY | CANT_VERIFY |
| eval-test-04 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-05 | legit | LEGIT | MATCHES | MATCHES |
| eval-test-06 | legit | LEGIT | CANT_VERIFY | CANT_VERIFY |
| eval-test-07 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-08 | scam | SCAM | NO_ORGANIZATION_CLAIMED | NO_ORGANIZATION_CLAIMED |
| eval-test-09 | legit | LEGIT | MATCHES | MATCHES |
| eval-test-10 | scam | SCAM | CANT_VERIFY | CANT_VERIFY |
| eval-test-11 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-12 | legit | LEGIT | MATCHES | MATCHES |
| eval-test-13 | legit | LEGIT | MATCHES | MATCHES |
| eval-test-14 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-15 | legit | LEGIT | CANT_VERIFY | CANT_VERIFY |
| eval-test-16 | legit | LEGIT | MATCHES | MATCHES |
| eval-test-17 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-18 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-19 | legit | LEGIT | MATCHES | MATCHES |
| eval-test-20 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-21 | legit | LEGIT | CANT_VERIFY | CANT_VERIFY |
| eval-test-22 | scam | SCAM | CANT_VERIFY | CANT_VERIFY |
| eval-test-23 | legit | SCAM | MATCHES | MATCHES |
| eval-test-24 | scam | SCAM | CANT_VERIFY | CANT_VERIFY |
| eval-test-25 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-26 | legit | LEGIT | MATCHES | MATCHES |
| eval-test-27 | legit | LEGIT | CANT_VERIFY | CANT_VERIFY |
| eval-test-28 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-29 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-30 | legit | LEGIT | MATCHES | MATCHES |
| eval-test-31 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-32 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-33 | scam | SCAM | DOESNT_MATCH | DOESNT_MATCH |
| eval-test-34 | legit | LEGIT | CANT_VERIFY | CANT_VERIFY |
| eval-test-35 | legit | LEGIT | MATCHES | MATCHES |
