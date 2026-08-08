"use server";

/**
 * Phase 65E — Server action to load Command Center shell from searchParams.
 * Client may pass raw query strings only; mode/authority stay server-side.
 */

import { buildJagCommandShellModel } from "@/lib/jag-command-center/build-command-shell";
import { ensureDurableOrganizationIdentitiesLoaded } from "@/lib/jag-command-center/load-durable-organization-identity";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import {
  orgParamFromSearchParams,
  workspaceParamFromSearchParams,
} from "@/lib/jag-platform/workspace-request";

export async function loadJagCommandShellAction(input: {
  readonly workspace?: string | null;
  readonly org?: string | null;
  readonly pathname: string;
  readonly host?: string | null;
}) {
  const session = await getJagPlatformSession();
  if (!session) return null;

  const search = {
    workspace: input.workspace ?? undefined,
    org: input.org ?? undefined,
  };
  const preferredOrg = orgParamFromSearchParams(search);

  // Prime durable org_organizations identity for UUID-bound sessions before sync resolve.
  await ensureDurableOrganizationIdentitiesLoaded([
    session.organizationId,
    preferredOrg,
  ]);

  return buildJagCommandShellModel(session, {
    workspaceParam: workspaceParamFromSearchParams(search),
    preferredOrg,
    pathname: input.pathname?.trim() || "/jag",
    host: input.host?.trim() || undefined,
  });
}
