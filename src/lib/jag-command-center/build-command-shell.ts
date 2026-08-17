/**
 * Phase 65E — Pure shell model builder (not a Server Action file).
 */

import { getJagCommandNav, type JagNavItem } from "@/components/jag/command-center/nav";
import {
  resolveActiveWorkspaceOrganization,
  shouldRebindSessionToActiveOrganization,
} from "@/lib/jag-platform/active-organization";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  resolveJagWorkspaceMode,
  type JagWorkspaceMode,
} from "@/lib/jag-platform/workspace-mode";
import { loadJagBrandForSession } from "@/lib/jag-command-center/branding/load-branding";
import { loadJagCommandCenterOverview } from "@/lib/jag-command-center/load-overview";
import type { JagNotification } from "@/lib/jag-command-center/notifications";
import {
  countUnreadJagNotifications,
  listJagNotifications,
} from "@/lib/jag-command-center/notifications/store";
import { loadJagSearchCatalog } from "@/lib/jag-command-center/search-catalog";
import type { JagSearchItem } from "@/lib/jag-command-center/search-filter";
import {
  themeToStyle,
  type OrganizationBrand,
} from "@/lib/platform/branding";
import type { CSSProperties } from "react";

export type JagCommandShellModel = {
  readonly session: JagPlatformSession;
  readonly pathname: string;
  readonly navItems: readonly JagNavItem[];
  readonly workspaceMode: JagWorkspaceMode;
  readonly workspaceParam: string | null;
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
  readonly themeStyle: CSSProperties;
  readonly dashboardBackgroundUrl: string | null;
};

export function buildJagCommandShellModel(
  session: JagPlatformSession,
  input: {
    readonly workspaceParam?: string | null;
    readonly preferredOrg?: string | null;
    readonly pathname: string;
    readonly host?: string;
  }
): JagCommandShellModel {
  const workspaceParam = input.workspaceParam?.trim() || null;
  const preferredOrg = input.preferredOrg?.trim() || null;

  const workspaceModePreview = resolveJagWorkspaceMode({
    session,
    activeOrganizationId: session.organizationId,
    workspaceParam,
    explicitOrganizationParam: preferredOrg,
  });

  const active = resolveActiveWorkspaceOrganization(session, preferredOrg, {
    allowSoftPick: workspaceModePreview === "platform",
  });

  const workspaceMode = resolveJagWorkspaceMode({
    session,
    activeOrganizationId: active?.id ?? null,
    workspaceParam,
    explicitOrganizationParam: preferredOrg,
  });

  const brandModel = loadJagBrandForSession(
    session,
    input.host,
    workspaceMode === "customer" ? preferredOrg ?? active?.id : preferredOrg
  );
  const overview = loadJagCommandCenterOverview(
    session,
    workspaceMode === "customer" ? preferredOrg ?? active?.id : preferredOrg
  );
  const searchCatalog = loadJagSearchCatalog(session, workspaceMode);
  const notifications = listJagNotifications(session, 20);
  const unreadNotificationCount = countUnreadJagNotifications(session);
  const needsOrganizationRebind = shouldRebindSessionToActiveOrganization(
    session,
    active
  );

  const navItems = getJagCommandNav({
    mode: workspaceMode,
    organizationId:
      workspaceMode === "customer"
        ? (active?.id ?? null)
        : (active?.id ?? session.organizationId),
  });

  return {
    session,
    pathname: input.pathname,
    navItems,
    workspaceMode,
    workspaceParam,
    organizationOptions: overview.organizationOptions,
    activeOrganizationId: overview.activeOrganizationId ?? active?.id ?? null,
    activeOrganizationLabel:
      overview.activeOrganizationLabel ?? active?.name ?? null,
    needsOrganizationRebind,
    domainOptions: overview.domainOptions,
    searchCatalog,
    notifications,
    unreadNotificationCount,
    brand: brandModel.brand,
    pageTitle: brandModel.pageTitle,
    themeStyle: themeToStyle(brandModel.theme),
    dashboardBackgroundUrl: brandModel.brand.dashboard_background_url ?? null,
  };
}
