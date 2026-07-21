import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import { getGoogleWorkspaceStatus } from "@/lib/platform/integrations/connections";
import { CALENDAR_OBJECT_TYPES } from "@/lib/platform/integrations/google-workspace/calendar";
import { DRIVE_OBJECT_TYPES } from "@/lib/platform/integrations/google-workspace/drive";
import { GMAIL_OBJECT_TYPES } from "@/lib/platform/integrations/google-workspace/gmail";
import { runGoogleWorkspaceSync } from "@/lib/platform/integrations/google-workspace/sync";

async function guardIntegrations(supabase: Awaited<ReturnType<typeof createAuthClient>>) {
  let gate = await guardApiRoute(supabase, "integration.manage");
  if (gate instanceof NextResponse) {
    gate = await guardApiRoute(supabase, "integration.admin");
  }
  if (gate instanceof NextResponse) {
    gate = await guardApiRoute(supabase, "configuration.manage");
  }
  if (gate instanceof NextResponse) {
    gate = await guardApiRoute(supabase, "configuration.admin");
  }
  return gate;
}

/**
 * POST /api/integrations/google/sync
 * Manual "Run Now" — full sync by default; body.mode can request incremental.
 */
export async function POST(request: NextRequest) {
  const supabase = await createAuthClient();
  const gate = await guardIntegrations(supabase);
  if (gate instanceof NextResponse) return gate;

  const organizationId = await getPrimaryOrganizationId(supabase);
  if (!organizationId) {
    return NextResponse.json(
      { ok: false, message: "Organization not found." },
      { status: 400 }
    );
  }

  let body: {
    mode?: "manual" | "full" | "incremental";
    forceFull?: boolean;
    /** Domain module sync (RC-2.03–2.05). */
    module?: "gmail" | "calendar" | "drive" | "all";
    objectTypes?: string[];
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const objectTypes = body.objectTypes?.length
    ? body.objectTypes
    : body.module === "gmail"
      ? [...GMAIL_OBJECT_TYPES]
      : body.module === "calendar"
        ? [...CALENDAR_OBJECT_TYPES]
        : body.module === "drive"
          ? [...DRIVE_OBJECT_TYPES]
          : undefined;

  try {
    const result = await runGoogleWorkspaceSync(supabase, {
      organizationId,
      mode: body.mode ?? "manual",
      triggeredBy: "manual",
      forceFull: body.forceFull ?? body.mode !== "incremental",
      objectTypes,
    });
    const status = await getGoogleWorkspaceStatus(supabase, organizationId);
    return NextResponse.json({
      ok: result.ok,
      message: result.ok
        ? `Synced ${result.recordsImported} records in ${result.durationMs}ms.`
        : result.run.error ?? "Sync failed.",
      result: {
        recordsImported: result.recordsImported,
        durationMs: result.durationMs,
        mode: result.run.mode,
        status: result.run.status,
        nextIncrementalAt: result.nextIncrementalAt,
        nextFullAt: result.nextFullAt,
      },
      status,
    }, { status: result.ok ? 200 : 502 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
