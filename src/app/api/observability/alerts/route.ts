import { NextResponse } from "next/server";
import { authorizeObservabilityOps } from "@/lib/observability/authorize-ops";
import { evaluateAlerts, getTriggeredAlerts } from "@/lib/observability";

/**
 * RC-1 — current alert evaluations (threshold-based).
 */
export async function GET(req: Request) {
  const auth = await authorizeObservabilityOps(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    {
      alerts: evaluateAlerts(),
      triggered: getTriggeredAlerts(),
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
