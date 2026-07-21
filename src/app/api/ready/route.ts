import { NextResponse } from "next/server";
import { buildReadinessEnvChecks } from "@/lib/observability";

/**
 * Readiness probe — required env present for serving traffic.
 * Does not open DB connections (keeps probe cheap and safe under load).
 * Deep dependency checks: GET /api/ready/deep
 */
export async function GET() {
  const checks = buildReadinessEnvChecks();
  const env = checks.find((c) => c.name === "environment");
  const ready = env?.status === "healthy";

  if (!ready) {
    const missing =
      env?.detail.startsWith("Missing: ")
        ? env.detail.replace("Missing: ", "").split(", ").filter(Boolean)
        : [];
    return NextResponse.json(
      {
        status: "not_ready",
        probe: "readiness",
        checks,
        missing,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  return NextResponse.json(
    {
      status: "ready",
      probe: "readiness",
      checks,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
