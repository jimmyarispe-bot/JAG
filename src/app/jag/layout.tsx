import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { headers } from "next/headers";
import { JagCommandShell } from "@/components/jag/command-center";
import "@/components/jag/command-center/command-center.css";
import {
  countUnreadJagNotifications,
  listJagNotifications,
  loadJagCommandCenterOverview,
  loadJagSearchCatalog,
} from "@/lib/jag-command-center";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

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
  title: "JAG Executive Command Center",
  description:
    "Executive Command Center for the JAG Organizational Intelligence Operating System.",
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
  const isLogin = pathname === "/jag/login" || pathname.startsWith("/jag/login/");
  const isSharedBriefing = pathname.startsWith("/jag/briefings/share/");

  if (isLogin || isSharedBriefing) {
    return (
      <div
        className={`${jagSans.variable} ${jagMono.variable}`}
        style={
          {
            "--font-jag-display": "var(--font-jag-sans)",
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

  const overview = loadJagCommandCenterOverview(session);
  const searchCatalog = loadJagSearchCatalog(session);
  const notifications = listJagNotifications(20);
  const unreadNotificationCount = countUnreadJagNotifications();

  return (
    <div
      className={`${jagSans.variable} ${jagMono.variable}`}
      style={
        {
          "--font-jag-display": "var(--font-jag-sans)",
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
      >
        {children}
      </JagCommandShell>
    </div>
  );
}
