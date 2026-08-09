"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { JagCommandShell } from "./JagCommandShell";
import { JagLoadingSkeleton } from "./JagLoadingSkeleton";
import type { JagCommandShellModel } from "@/lib/jag-command-center/build-command-shell";
import { loadJagCommandShellAction } from "@/lib/jag-command-center/load-command-shell";
import { JAG_WORKSPACE_QUERY_PARAM } from "@/lib/jag-platform/workspace-mode";
import { THE_JAG_MARK } from "@/lib/platform/branding";

/**
 * SearchParams-capable shell gate.
 * Reads `workspace` / `org` from the URL via useSearchParams (soft nav + hard
 * load), then loads shell props through a server action so
 * resolveJagWorkspaceMode + composeWorkspaceNavigation remain authoritative.
 */
export function JagWorkspaceShellGate({
  host,
  children,
}: {
  readonly host?: string;
  readonly children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/jag";
  const workspace = searchParams.get(JAG_WORKSPACE_QUERY_PARAM);
  const org = searchParams.get("org");
  const [shell, setShell] = useState<JagCommandShellModel | null>(null);
  const [loadKey, setLoadKey] = useState<string | null>(null);

  const requestKey = `${pathname}|${workspace ?? ""}|${org ?? ""}|${host ?? ""}`;

  useEffect(() => {
    let cancelled = false;
    void loadJagCommandShellAction({
      workspace: workspace ?? null,
      org: org ?? null,
      pathname,
      host: host ?? null,
    }).then((model) => {
      if (cancelled) return;
      setShell(model);
      setLoadKey(requestKey);
    });
    return () => {
      cancelled = true;
    };
  }, [workspace, org, pathname, host, requestKey]);

  if (!shell || loadKey !== requestKey) {
    return (
      <JagLoadingSkeleton
        title={THE_JAG_MARK}
        description="Loading workspace…"
      />
    );
  }

  return (
    <JagCommandShell
      session={shell.session}
      pathname={shell.pathname}
      navItems={shell.navItems}
      workspaceMode={shell.workspaceMode}
      workspaceParam={shell.workspaceParam}
      organizationOptions={shell.organizationOptions}
      activeOrganizationId={shell.activeOrganizationId}
      activeOrganizationLabel={shell.activeOrganizationLabel}
      needsOrganizationRebind={shell.needsOrganizationRebind}
      domainOptions={shell.domainOptions}
      searchCatalog={shell.searchCatalog}
      notifications={shell.notifications}
      unreadNotificationCount={shell.unreadNotificationCount}
      brand={shell.brand}
      pageTitle={shell.pageTitle}
      themeStyle={shell.themeStyle}
      dashboardBackgroundUrl={shell.dashboardBackgroundUrl}
    >
      {children}
    </JagCommandShell>
  );
}
