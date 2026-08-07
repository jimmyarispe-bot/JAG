import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "@/components/listening-public/listening-public.css";

const jagSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jag-sans",
  display: "swap",
});

const jagMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jag-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Listening",
  description: "Share your perspective through Organizational Listening.",
  robots: { index: false, follow: false },
};

export default function ListenLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`listening-public ${jagSans.variable} ${jagMono.variable}`}
      style={
        {
          "--font-jag-display": "var(--font-jag-sans)",
        } as CSSProperties
      }
    >
      <div className="lp-shell">{children}</div>
    </div>
  );
}
