import { NextResponse } from "next/server";
import { buildLivenessReport } from "@/lib/observability";

/**
 * Liveness probe — process is up. No dependency checks.
 */
export async function GET() {
  const report = buildLivenessReport();
  return NextResponse.json(
    {
      status: "ok",
      health: report.status,
      probe: report.probe,
      checks: report.checks,
      timestamp: report.timestamp,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
