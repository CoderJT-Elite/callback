# Callback Devpost Screenshot Gallery & Guide

All screenshots below were rendered directly from the live application using Playwright (`scripts/capture-devpost-screenshots.ts`) at both **1280 × 800 (Desktop)** and **360 × 740 (Mobile)** resolutions.

## Submission Gallery Assets (`docs/devpost/`)

| File Name | Viewport | Description |
|---|---|---|
| `cover-art.png` | 1500 × 1000 (3:2) | Official Devpost project cover art compositing logo, pitch, and live app receipt |
| `00-landing-desktop.png` | 1280 × 800 | Landing page hero with instant sample chips and input card |
| `00-landing-mobile.png` | 360 × 740 | Responsive mobile layout showing clean touch targets with zero horizontal overflow |
| `01-sample1-bank-alert-desktop.png` | 1280 × 800 | Full verdict receipt for Bank Alert smishing scam (`RULE_4_PHONE_MISMATCH`) |
| `01-sample1-bank-alert-mobile.png` | 360 × 740 | Mobile verdict receipt with verified evidence receipts and official hotline |
| `02-sample2-package-delivery-desktop.png` | 1280 × 800 | USPS package delivery scam with lookalike domain analysis (`RULE_3_STRONG_MISMATCH`) |
| `03-sample3-job-offer-desktop.png` | 1280 × 800 | Fake Amazon recruiter telegram scam with red flags and payment cues |
| `04-sample4-legit-bank-desktop.png` | 1280 × 800 | Authentic Wells Fargo bank 2FA notification showing green `MATCHES` verdict (`RULE_5_ALL_OFFICIAL_MATCH`) |
| `05-sample5-screenshot-usps-desktop.png` | 1280 × 800 | Multimodal OCR analysis of uploaded smishing screenshot with full trace |
| `06-fresh-paste-apple-desktop.png` | 1280 × 800 | Live pasted iCloud phishing alert check with dynamic trace streaming |
| `07-how-it-works-desktop.png` | 1280 × 800 | Architecture methodology page showing interactive 7-step pipeline diagram |

## Recommended Devpost Upload Order
1. `cover-art.png` (Main project thumbnail)
2. `01-sample1-bank-alert-desktop.png` (Scam detection receipt)
3. `04-sample4-legit-bank-desktop.png` (Legitimate verification receipt)
4. `05-sample5-screenshot-usps-desktop.png` (Multimodal vision screenshot check)
5. `07-how-it-works-desktop.png` (Technical architecture)
6. `01-sample1-bank-alert-mobile.png` (Mobile experience)
