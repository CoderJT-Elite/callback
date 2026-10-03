"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Info } from "lucide-react";

export function Navbar() {
  return (
    <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="Callback Logo"
            className="w-9 h-9 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 object-cover"
          />
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white block leading-none">
              Callback
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Imposter Verification
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-4 text-xs font-medium">
          <Link
            href="/how-it-works"
            className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition"
          >
            <Info className="w-4 h-4" />
            <span>How it works</span>
          </Link>
          <a
            href="https://github.com/CoderJT-Elite/callback"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
