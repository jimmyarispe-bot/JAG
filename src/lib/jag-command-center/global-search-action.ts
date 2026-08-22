"use server";

/**
 * Server action — JAG Global Search.
 * Session + optional authz snapshot; never returns results without JAG entry.
 */

import { createAuthClient } from "@/lib/supabase/server-auth";
import { loadAuthzSnapshot } from "@/lib/platform/identity/load-authz-snapshot";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { resolveJagWorkspaceMode } from "@/lib/jag-platform/workspace-mode";
import {
  searchJagGlobal,
  type JagGlobalSearchResponse,
} from "./global-search";

export async function searchJagGlobalAction(input: {
  readonly query: string;
  readonly workspace?: string | null;
  readonly organizationId?: string | null;
}): Promise<JagGlobalSearchResponse> {
  const session = await getJagPlatformSession();
  if (!session) {
    return { ok: false, error: "unauthorized" };
  }

  let authz = null;
  try {
    const supabase = await createAuthClient();
    authz = await loadAuthzSnapshot(supabase, session.userId);
  } catch {
    // Fail closed on finance via null authz; JAG session still required above.
    authz = null;
  }

  const preferredOrg = input.organizationId?.trim() || null;
  const workspaceMode = resolveJagWorkspaceMode({
    session,
    activeOrganizationId: preferredOrg ?? session.organizationId,
    workspaceParam: input.workspace ?? undefined,
  });

  return searchJagGlobal({
    session,
    query: input.query ?? "",
    workspaceMode,
    authz,
  });
}
