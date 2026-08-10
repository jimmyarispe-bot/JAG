import type { CSSProperties } from "react";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import type { JagWorkspaceMode } from "@/lib/jag-platform/workspace-mode";
import type { JagNotification } from "@/lib/jag-command-center/notifications";
import type { JagSearchItem } from "@/lib/jag-command-center/search-filter";
import type { OrganizationBrand } from "@/lib/platform/branding";
import { JagHeader } from "./JagHeader";
import { JagOrganizationHandoff } from "./JagOrganizationHandoff";
import { JagSidebar } from "./JagSidebar";
import { JagContextualHelp, JagFirstLoginWelcome } from "./learn";
import type { JagNavItem } from "./nav";

export function JagCommandShell({
  session,
  pathname,
  navItems,
  workspaceMode,
  workspaceParam = null,
  organizationOptions,
  activeOrganizationId,
  activeOrganizationLabel,
  needsOrganizationRebind,
  domainOptions,
  searchCatalog,
  notifications,
  unreadNotificationCount,
  brand,
  pageTitle,
  themeStyle,
  dashboardBackgroundUrl = null,
  children,
}: {
  readonly session: JagPlatformSession;
  readonly pathname: string;
  readonly navItems: readonly JagNavItem[];
  readonly workspaceMode: JagWorkspaceMode;
  /** `?workspace=` value as seen by the server shell composer. */
  readonly workspaceParam?: string | null;
  readonly organizationOptions: readonly { id: string; label: string }[];
  readonly activeOrganizationId: string | null;
  readonly activeOrganizationLabel: string | null;
  readonly needsOrganizationRebind: boolean;
  readonly domainOptions: readonly { id: string; label: string }[];
  readonly searchCatalog: readonly JagSearchItem[];
  readonly notifications: readonly JagNotification[];
  readonly unreadNotificationCount: number;
  readonly brand: OrganizationBrand;
  readonly pageTitle: string;
  readonly themeStyle?: CSSProperties;
  readonly dashboardBackgroundUrl?: string | null;
  readonly children: React.ReactNode;
}) {
  return (
    <div
      className="jag-command-center flex min-h-screen bg-[var(--jag-bg)] text-[var(--jag-text)]"
      data-jag-workspace-mode={workspaceMode}
      data-jag-workspace-param={workspaceParam ?? ""}
      style={
        {
          ...themeStyle,
          ...(dashboardBackgroundUrl
            ? {
                backgroundImage: `url("${dashboardBackgroundUrl}")`,
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
              }
            : {}),
        } as CSSProperties
      }
    >
      <a href="#jag-main" className="jag-skip-link">
        Skip to main content
      </a>
      <JagOrganizationHandoff
        activeOrganizationId={activeOrganizationId}
        sessionOrganizationId={session.organizationId}
        needsRebind={needsOrganizationRebind}
      />
      <JagSidebar
        pathname={pathname}
        brand={brand}
        pageTitle={pageTitle}
        navItems={navItems}
        workspaceMode={workspaceMode}
        activeOrganizationId={activeOrganizationId}
        activeOrganizationLabel={activeOrganizationLabel}
        canEnterPlatformAdmin={session.authority === "platform"}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <JagHeader
          session={session}
          organizationOptions={organizationOptions}
          activeOrganizationId={activeOrganizationId}
          activeOrganizationLabel={activeOrganizationLabel}
          domainOptions={domainOptions}
          searchCatalog={searchCatalog}
          notifications={notifications}
          unreadNotificationCount={unreadNotificationCount}
          brand={brand}
        />
        <main
          id="jag-main"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 xl:px-8"
        >
          <div className="mx-auto w-full max-w-[90rem]">{children}</div>
        </main>
      </div>
      <JagFirstLoginWelcome />
      <JagContextualHelp />
    </div>
  );
}
