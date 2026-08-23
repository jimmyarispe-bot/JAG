import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { headers } from "next/headers";
import { JagWorkspaceShellGate } from "@/components/jag/command-center/JagWorkspaceShellGate";
import { JagLoadingSkeleton } from "@/components/jag/command-center";
import "@/components/jag/command-center/command-center.css";
import { loadJagBrandForHost } from "@/lib/jag-command-center";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { hydrateBrandRegistry } from "@/lib/platform/tenant/persistence";
import {
  POWERED_BY_LINE,
  themeToStyle,
  THE_JAG_MARK,
} from "@/lib/platform/branding";

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
  title: {
    default: "Overview",
    template: `%s · ${THE_JAG_MARK}`,
  },
  description: `${THE_JAG_MARK} Organizational Intelligence Operating System. ${POWERED_BY_LINE}.`,
  applicationName: THE_JAG_MARK,
  openGraph: {
    title: THE_JAG_MARK,
    description: `${THE_JAG_MARK} Organizational Intelligence Operating System.`,
    siteName: THE_JAG_MARK,
  },
  twitter: {
    card: "summary",
    title: THE_JAG_MARK,
    description: `${THE_JAG_MARK} Organizational Intelligence Operating System.`,
  },
};

/**
 * JAG Executive Command Center root layout.
 * Login remains unshellled; authenticated routes use the command shell.
 *
 * Phase 65E — workspace mode is resolved inside JagWorkspaceShellGate from
 * URL searchParams (not middleware x-url headers).
 */
export default async function JagRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "/jag";
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? undefined;
  const isLogin = pathname === "/jag/login" || pathname.startsWith("/jag/login/");
  const isSharedBriefing = pathname.startsWith("/jag/briefings/share/");

  if (isLogin || isSharedBriefing) {
    await hydrateBrandRegistry();
    const brandModel = loadJagBrandForHost(host);
    return (
      <div
        className={`${jagSans.variable} ${jagMono.variable}`}
        style={
          {
            "--font-jag-display": "var(--font-jag-sans)",
            ...themeToStyle(brandModel.theme),
          } as CSSProperties
        }
      >
        {children}
      </div>
    );
  }

  const session = await getJagPlatformSession();
  if (!session) {
    return children;
  }

  return (
    <div
      className={`${jagSans.variable} ${jagMono.variable}`}
      style={
        {
          "--font-jag-display": "var(--brand-heading-font, var(--font-jag-sans))",
          fontFamily: "var(--brand-body-font, var(--font-jag-sans))",
        } as CSSProperties
      }
    >
      <Suspense
        fallback={
          <JagLoadingSkeleton
            title={THE_JAG_MARK}
            description="Loading workspace…"
          />
        }
      >
        <JagWorkspaceShellGate host={host}>{children}</JagWorkspaceShellGate>
      </Suspense>
    </div>
  );
}
