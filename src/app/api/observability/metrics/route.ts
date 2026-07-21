import { NextResponse } from "next/server";
import { authorizeObservabilityOps } from "@/lib/observability/authorize-ops";
import { buildObservabilityDashboard, metricsRegistry } from "@/lib/observability";

/**
 * RC-1 — metrics snapshot for scrapers / ops dashboards.
 */
export async function GET(req: Request) {
  const auth = await authorizeObservabilityOps(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    {
      metrics: metricsRegistry.snapshot(),
      dashboard: buildObservabilityDashboard(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
