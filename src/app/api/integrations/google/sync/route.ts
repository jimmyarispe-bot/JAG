import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { guardApiRoute } from "@/lib/platform/identity/api-guard";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import { getGoogleWorkspaceStatus } from "@/lib/platform/integrations/connections";
import { CALENDAR_OBJECT_TYPES } from "@/lib/platform/integrations/google-workspace/calendar";
import { DRIVE_OBJECT_TYPES } from "@/lib/platform/integrations/google-workspace/drive";
import { GMAIL_OBJECT_TYPES } from "@/lib/platform/integrations/google-workspace/gmail";
import { runGoogleWorkspaceSync } from "@/lib/platform/integrations/google-workspace/sync";

/**
 * Ask for the longest execution window the plan allows. The default on this
 * project is far shorter than a Google sync, and a killed function leaves the
 * run row stuck at 'running' with no error to explain it.
 */
export const maxDuration = 60;

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

  /**
   * The default is Gmail plus Calendar, not everything.
   *
   * Left unset, runGoogleWorkspaceSync walks all seventeen object types, and
   * Gmail alone is an N+1: the list endpoint returns ids and each message needs
   * a second call for its metadata. On a real mailbox that is hundreds of round
   * trips before Drive, Docs, Sheets, Slides, Contacts, Tasks and three
   * directory types have even started. The serverless function is killed long
   * before that finishes, and because nothing writes a terminal state when a
   * process is killed, the run row sits at 'running' forever — a status that
   * means "we have no idea" while reading as "in progress".
   *
   * Gmail and Calendar are the two that serve admissions today. The rest stay
   * reachable: `module: "all"` asks for the full set, `objectTypes` for anything
   * specific.
   */
  const objectTypes = body.objectTypes?.length
    ? body.objectTypes
    : body.module === "gmail"
      ? [...GMAIL_OBJECT_TYPES]
      : body.module === "calendar"
        ? [...CALENDAR_OBJECT_TYPES]
        : body.module === "drive"
          ? [...DRIVE_OBJECT_TYPES]
          : body.module === "all"
            ? undefined
            : [...GMAIL_OBJECT_TYPES, ...CALENDAR_OBJECT_TYPES];

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
