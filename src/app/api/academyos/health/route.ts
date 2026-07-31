import { NextResponse } from "next/server";
import { ensureAcademyOSBooted } from "@/applications/academyos/runtime/boot";
import { getAcademyOSDiagnosticsSnapshot } from "@/applications/academyos/runtime/diagnostics";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { hasPermission, toAuthzSnapshot } from "@/lib/platform/identity/authorization-service";

const DIAGNOSTICS_PERMISSIONS = [
  "configuration.admin",
  "configuration.manage",
  "certification.admin",
  "JAG_ACCESS",
] as const;

/** Developer health endpoint — AcademyOS startup / composition diagnostics. */
export async function GET() {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await getIdentityContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authz = toAuthzSnapshot({
    userId: ctx.effectiveUserId,
    roles: ctx.roles,
    permissions: ctx.permissions,
  });
  const allowed = DIAGNOSTICS_PERMISSIONS.some((key) => hasPermission(authz, key));
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    ensureAcademyOSBooted();
    const snapshot = getAcademyOSDiagnosticsSnapshot({ ensureBooted: false });
    return NextResponse.json(
      { ok: snapshot.healthOk && snapshot.compositionReady, snapshot },
      { status: snapshot.healthOk ? 200 : 503 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AcademyOS startup failed";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
