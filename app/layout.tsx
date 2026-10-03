import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Newsreader({ variable: "--font-display", subsets: ["latin"], style: ["normal", "italic"] });
const sans = IBM_Plex_Sans({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Callback: find the real number before you call the fake one",
  description:
    "Paste or screenshot a suspicious message. Callback looks up the claimed sender's real contact channels from sources the scammer doesn't control and checks whether the phone, link or email in the message belongs to them.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col font-sans text-[15px] leading-relaxed">
        <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
          <filter id="ink-rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
