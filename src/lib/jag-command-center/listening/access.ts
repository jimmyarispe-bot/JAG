import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { resolveActiveWorkspaceOrganization } from "@/lib/jag-platform/active-organization";
import { assertSessionCanAccessOrganization } from "@/lib/jag-platform/data-plane";
import { createAuthClient } from "@/lib/supabase/server-auth";
import {
  requirePermission,
  userHasPermission,
} from "@/lib/platform/identity/permissions";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";

export type ListeningAccess =
  | {
      readonly ok: true;
      readonly session: JagPlatformSession;
      readonly organizationId: string;
      readonly organizationName: string;
      readonly canView: boolean;
      readonly canManage: boolean;
      readonly canAnalyze: boolean;
      readonly canRaw: boolean;
      readonly supabase: Awaited<ReturnType<typeof createAuthClient>>;
    }
  | { readonly ok: false; readonly error: string };

export async function resolveListeningAccess(
  preferredOrgId?: string | null
): Promise<ListeningAccess> {
  const session = await getJagPlatformSession();
  if (!session) {
    return {
      ok: false,
      error: `Sign in required (${JAG_PLATFORM_LOGIN_PATH}).`,
    };
  }

  const org = resolveActiveWorkspaceOrganization(session, preferredOrgId);
  if (!org) {
    return { ok: false, error: "No accessible organization for Listening." };
  }

  const denied = assertSessionCanAccessOrganization(session, org.id);
  if (denied) return { ok: false, error: denied };

  const supabase = await createAuthClient();
  const [canView, canManage, canAnalyze, canRaw] = await Promise.all([
    userHasPermission(supabase, "LISTENING_VIEW"),
    userHasPermission(supabase, "LISTENING_MANAGE"),
    userHasPermission(supabase, "LISTENING_ANALYZE"),
    userHasPermission(supabase, "LISTENING_RAW"),
  ]);
  if (!canView && !canManage && !canAnalyze) {
    return { ok: false, error: "Listening permission required." };
  }

  return {
    ok: true,
    session,
    organizationId: org.id,
    organizationName: org.name,
    canView: canView || canManage || canAnalyze,
    canManage,
    canAnalyze,
    canRaw,
    supabase,
  };
}

export async function requireListeningManage(
  organizationId: string
): Promise<ListeningAccess> {
  const access = await resolveListeningAccess(organizationId);
  if (!access.ok) return access;
  const gate = await requirePermission(access.supabase, "LISTENING_MANAGE");
  if (!gate.ok) {
    return { ok: false, error: "LISTENING_MANAGE required." };
  }
  return { ...access, canManage: true, canView: true };
}

export async function requireListeningAnalyze(
  organizationId: string
): Promise<ListeningAccess> {
  const access = await resolveListeningAccess(organizationId);
  if (!access.ok) return access;
  if (!access.canAnalyze) {
    return { ok: false, error: "LISTENING_ANALYZE required." };
  }
  if (!access.canRaw) {
    return { ok: false, error: "LISTENING_RAW required to run analysis." };
  }
  return access;
}
