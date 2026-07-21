import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { processCommunicationQueue } from "@/lib/admissions/communications/engine";
import { processWorkflowQueue } from "@/lib/admissions/automation/queue";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { authorizeBearerSecret } from "@/lib/security/timing-safe";

async function authorize(req: Request): Promise<true | NextResponse> {
  if (authorizeBearerSecret(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return true;
  }
  const supabase = await createAuthClient();
  const gate = await guardApiRoute(supabase, "admissions.manage");
  if (gate instanceof NextResponse) return gate;
  return true;
}

/** Queue processor — POST only (cron bearer or admissions.manage session). */
export async function POST(req: Request) {
  const authz = await authorize(req);
  if (authz instanceof NextResponse) return authz;

  const supabase = await createAuthClient();
  await processWorkflowQueue(supabase);
  await processCommunicationQueue(supabase);
  return NextResponse.json({ success: true });
}
