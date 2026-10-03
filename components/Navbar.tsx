import React from "react";
import Link from "next/link";
import { Wordmark } from "./Logo";

export function Navbar() {
  return (
    <header className="no-print w-full double-rule">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Callback home">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/how-it-works" className="underline-offset-4 hover:underline">
            How it works
          </Link>
          <a
            href="https://github.com/CoderJT-Elite/callback"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted underline-offset-4 hover:underline hover:text-ink"
          >
            Source
          </a>
        </nav>
      </div>
    </header>
  );
}
