import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { headers } from "next/headers";
import { JagCommandShell } from "@/components/jag/command-center";
import "@/components/jag/command-center/command-center.css";
import {
  countUnreadJagNotifications,
  listJagNotifications,
  loadJagBrandForHost,
  loadJagBrandForSession,
  loadJagCommandCenterOverview,
  loadJagSearchCatalog,
} from "@/lib/jag-command-center";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { themeToStyle, THE_JAG_MARK } from "@/lib/platform/branding";

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
    default: "Executive Intelligence Platform",
    template: `%s · Powered by ${THE_JAG_MARK}`,
  },
  description:
    "Executive Intelligence Platform powered by The JAG™ Organizational Intelligence Operating System.",
};

/**
 * JAG Executive Command Center root layout.
 * Login remains unshellled; authenticated routes use the command shell.
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

  const brandModel = loadJagBrandForSession(session, host);
  const overview = loadJagCommandCenterOverview(session);
  const searchCatalog = loadJagSearchCatalog(session);
  const notifications = listJagNotifications(20);
  const unreadNotificationCount = countUnreadJagNotifications();

  return (
    <div
      className={`${jagSans.variable} ${jagMono.variable}`}
      style={
        {
          "--font-jag-display": "var(--brand-heading-font, var(--font-jag-sans))",
          fontFamily: "var(--brand-body-font, var(--font-jag-sans))",
          ...themeToStyle(brandModel.theme),
          ...(brandModel.brand.dashboard_background_url
            ? {
                backgroundImage: `url("${brandModel.brand.dashboard_background_url}")`,
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
              }
            : {}),
        } as CSSProperties
      }
    >
      <JagCommandShell
        session={session}
        pathname={pathname}
        organizationOptions={overview.organizationOptions}
        domainOptions={overview.domainOptions}
        searchCatalog={searchCatalog}
        notifications={notifications}
        unreadNotificationCount={unreadNotificationCount}
        brand={brandModel.brand}
        pageTitle={brandModel.pageTitle}
      >
        {children}
      </JagCommandShell>
    </div>
  );
}
