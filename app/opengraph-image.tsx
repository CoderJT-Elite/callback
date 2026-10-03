import { ImageResponse } from "next/og";

export const alt = "Callback: find the real number before you call the fake one";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F3EEE4", color: "#1C1A17", padding: 72, fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 52, height: 52, background: "#1C1A17", borderRadius: 4 }} />
          Callback
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, lineHeight: 1.04, letterSpacing: -2 }}>
          <span>The number in the message</span>
          <span style={{ color: "#C23B22" }}>isn&apos;t the real one.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontFamily: "monospace", color: "#6B655A" }}>
          <span>Checks a text against the sender&apos;s real contact channels</span>
          <span>ForgeHacks 2026</span>
        </div>
      </div>
    ),
    size
  );
}
