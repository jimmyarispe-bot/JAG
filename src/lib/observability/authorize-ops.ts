/**
 * RC-1 — authorize ops metric scrape endpoints (cron secret or staff session).
 */

import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { requirePermission } from "@/lib/platform/identity/permissions";
import { authorizeBearerSecret } from "@/lib/security/timing-safe";

export async function authorizeObservabilityOps(
  req: Request
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const auth = req.headers.get("authorization");
  if (authorizeBearerSecret(auth, process.env.CRON_SECRET)) {
    return { ok: true };
  }

  try {
    const supabase = await createAuthClient();
    const gate = await requirePermission(supabase, "operations.view");
    if (gate.ok) return { ok: true };
    const configGate = await requirePermission(supabase, "configuration.admin");
    if (configGate.ok) return { ok: true };
  } catch {
    // fall through
  }

  return {
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };
}
