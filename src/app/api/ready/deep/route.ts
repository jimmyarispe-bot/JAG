import { NextResponse } from "next/server";
import {
  httpStatusForHealth,
  runDeepHealthChecks,
} from "@/lib/observability";
import { authorizeObservabilityOps } from "@/lib/observability/authorize-ops";

/**
 * RC-1 — deep readiness: application + DB + Supabase + integrations + queue + cache.
 * Requires CRON_SECRET bearer or ops permission — not public reconnaissance.
 */
export async function GET(req: Request) {
  const authz = await authorizeObservabilityOps(req);
  if (!authz.ok) return authz.response;

  const report = await runDeepHealthChecks();
  return NextResponse.json(report, {
    status: httpStatusForHealth(report.status),
    headers: { "Cache-Control": "no-store" },
  });
}
