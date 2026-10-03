import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-8 mt-16 text-center text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        <p className="font-medium text-slate-600 dark:text-slate-300">
          Callback helps you check. It can be wrong, and it does not replace your personal judgment.
        </p>
        <p className="text-[11px] leading-relaxed max-w-xl mx-auto">
          Built for <strong className="text-slate-700 dark:text-slate-200">ForgeHacks Online 2026</strong> (AI + Cybersecurity Track) with AI coding agents under John Tewolde&apos;s direction. Primary verification uses deterministic public suffix math, RDAP, and Wikidata P856 records.
        </p>
        <div className="pt-2 flex justify-center items-center gap-4 text-[11px]">
          <Link href="/how-it-works" className="hover:underline">
            Methodology & Rules
          </Link>
          <span>·</span>
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Gemini Terms
          </a>
          <span>·</span>
          <a
            href="https://github.com/CoderJT-Elite/callback"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            GitHub Source
          </a>
        </div>
      </div>
    </footer>
  );
}
