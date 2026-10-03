import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="no-print w-full mt-20 border-t border-ink">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr] text-[13px] text-muted">
        <div className="space-y-2">
          <p className="font-display text-lg text-ink">Callback helps you check. It can be wrong.</p>
          <p className="max-w-md leading-relaxed">
            Verdicts come from fixed rules: a hand-checked list of official channels, domain checks and RDAP,
            not from the AI. It doesn&apos;t replace your own judgment.
          </p>
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink">Read more</p>
          <ul className="space-y-1">
            <li><Link href="/how-it-works" className="underline underline-offset-2 hover:text-ink">Methodology and rules</Link></li>
            <li><a href="https://github.com/CoderJT-Elite/callback" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">GitHub source</a></li>
            <li><a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">Gemini API terms</a></li>
          </ul>
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink">Made for</p>
          <p className="leading-relaxed">
            ForgeHacks Online 2026, Cybersecurity track. Built with AI coding agents under John Tewolde&apos;s direction.
          </p>
        </div>
      </div>
    </footer>
  );
}
