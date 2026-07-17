import { NextResponse } from "next/server";

/**
 * Liveness probe — process is up. No dependency checks (Phase C.1 observability).
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      probe: "liveness",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
