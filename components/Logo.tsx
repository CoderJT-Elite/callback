import React from "react";

/** A handset whose cord loops back on itself: "call back". */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="3" fill="rgb(var(--ink))" />
      <path
        d="M9.5 11.5c0-1.2 1-2 2.2-1.8l1.6.3c.8.2 1.3.9 1.2 1.7l-.2 1.5c-.1.6-.5 1-1 1.2l-.9.3c.9 2 2.2 3.3 4.2 4.2l.4-.9c.2-.5.7-.9 1.3-1l1.5-.1c.8 0 1.5.5 1.7 1.3l.3 1.6c.2 1.2-.7 2.3-1.9 2.3C15.2 23.9 9.5 18.3 9.5 11.5Z"
        fill="rgb(var(--paper))"
      />
      <path d="M21 9.5h2.5v2.5M23.5 9.5 19.5 13.5" stroke="rgb(var(--paper))" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[22px] font-semibold tracking-tight leading-none">Callback</span>
    </span>
  );
}
