import { NextResponse } from "next/server";
import { resolveAppEnvironment } from "@/lib/platform/env/validate";

/**
 * Readiness probe — required env present for serving traffic.
 * Does not open DB connections (keeps probe cheap and safe under load).
 * In production, also requires core ops secrets from the env contract.
 */
export async function GET() {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (resolveAppEnvironment() === "production") {
    if (!process.env.NEXT_PUBLIC_APP_URL) missing.push("NEXT_PUBLIC_APP_URL");
    if (!process.env.CRON_SECRET) missing.push("CRON_SECRET");
    if (!process.env.VAULT_ENCRYPTION_KEY) missing.push("VAULT_ENCRYPTION_KEY");
    if (!process.env.SENDGRID_API_KEY) missing.push("SENDGRID_API_KEY");
  }

  if (missing.length > 0) {
    return NextResponse.json(
      {
        status: "not_ready",
        probe: "readiness",
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
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
