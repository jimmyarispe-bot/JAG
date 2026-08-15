import { NextResponse } from "next/server";

/**
 * Legacy metadata-only upload path retired in Phase 2.
 * Use POST /api/jag-platform/evidence/uploads/authorize → storage → complete.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Metadata-only evidence upload is retired. Use /api/jag-platform/evidence/uploads/authorize.",
    },
    { status: 410 }
  );
}
