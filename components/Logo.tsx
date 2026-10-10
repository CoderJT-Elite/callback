import React from "react";

/** A handset and a return arrow: "call back". */
export function LogoMark({ size = 28 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-mark.png" width={size} height={size} alt="" aria-hidden="true" />;
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[22px] font-semibold tracking-tight leading-none">Callback</span>
    </span>
  );
}
