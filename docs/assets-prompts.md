# Callback Image Assets & Generation Prompts

This document records the exact prompts, tools, and visual constraints used to generate all artistic and branding assets for Callback, complying with the ForgeHacks 2026 guidelines and Section 8 of `docs/IMPLEMENTATION_PLAN.md`.

## Universal Style Prompt

```text
Modern minimalist editorial tech illustration, clean vector aesthetic, precise geometric lines, deep slate navy (#0f172a), electric cyan/sky blue (#0284c7), and verified emerald green (#10b981), high contrast, elegant, no text, no letters, no logos, no brand marks.
```

---

## 1. Logo Mark (`app/icon.png`, `app/apple-icon.png`, `public/favicon.ico`)
- **Generator:** the build agent `generate_image` (Gemini Imagefx / Imagen 3)
- **Aspect Ratio:** `1:1`
- **Output Dimensions:** 1024×1024 source → Resized to 512×512 (`app/icon.png`), 180×180 (`app/apple-icon.png`), 64×64 (`public/favicon.ico`).
- **Prompt:**
  ```text
  Minimalist modern vector logo mark for a security verification app. An abstract stylized phone handset seamlessly transforming into a verification checkmark shield. Clean flat geometric design, solid colors using deep navy blue and emerald green on pure white background. Minimal, crisp vector edges. Absolutely no text, no words, no letters, no numbers, no brand logos.
  ```
- **Constraints Checked:**
  - [x] Zero text, zero letters, zero numerals.
  - [x] No resemblance to any commercial brand or logo.
  - [x] Flat, two-tone vector geometry suitable for icon scaling.

---

## 2. Hero Illustration (`public/hero-illustration.png`)
- **Generator:** the build agent `generate_image`
- **Aspect Ratio:** `16:9`
- **Output Dimensions:** 1600×900
- **Prompt:**
  ```text
  Calm modern editorial tech illustration. A person from the side holding a sleek modern smartphone, from which a clean, paper verification receipt rolls out gracefully downwards. Minimalist vector art style, clean lines, elegant composition, muted slate background with emerald green and navy blue accents. Soft ambient lighting. Absolutely no readable text, no letters, no words, no numbers, no logos, no brand marks.
  ```
- **Constraints Checked:**
  - [x] Calm, non-alarmist editorial composition.
  - [x] Person holding phone with verification receipt unspooling.
  - [x] No readable text on screen or paper.
  - [x] No corporate branding or specific identity likeness.

---

## 3. Open Graph Social Card (`app/opengraph-image.png`)
- **Background Generator:** the build agent `generate_image` (16:9)
- **Composite Renderer:** Playwright headless browser at 1200×630.
- **Background Prompt:**
  ```text
  Abstract modern cybersecurity technology background. Subtle geometric cybersecurity grid patterns, soft gradient waves in dark midnight blue, deep slate navy, and glowing emerald green accents. Sleek data receipt line waves and verified shield motifs softly blurred in the background. Clean, modern, high tech, atmospheric. Absolutely no text, no words, no letters, no logos.
  ```
- **Composite Elements:**
  - High-resolution SVG logo mark.
  - Pixel-perfect system typography: "Don't trust the number in the message. Callback finds the real one."
  - Feature tags: Deterministic Verdict Rules · Wikidata P856 · Cited Evidence Receipts.

---

## 4. Devpost Cover Art (`docs/devpost/cover-art.png`)
- **Background Generator:** the build agent `generate_image` (3:2)
- **Composite Renderer:** Playwright headless browser at 1500×1000.
- **Background Prompt:**
  ```text
  Modern editorial cybersecurity illustration. A large glowing verification shield with clean digital receipts floating in an isometric perspective. Dark sleek slate background with subtle teal and emerald neon highlights. Clean minimalist vector 3D tech art style. Absolutely no text, no letters, no words, no numbers, no brand logos.
  ```
- **Composite Elements:**
  - Real Callback UI receipt screenshot captured during live test run.
  - Official submission track badge: "ForgeHacks 2026 Submission".
  - One-line pitch and verified feature checklist.

---

## 5. Sample SMS Screenshots (`data/samples/screens/*.png`)
- **Renderer:** Pure deterministic HTML/CSS via Playwright (`scripts/render-sample-screens.ts`).
- **Policy:** Never generated via AI text-to-image to prevent garbled text or hallucinated sender identities. Stamped with "SAMPLE - FORGEHACKS 2026".
