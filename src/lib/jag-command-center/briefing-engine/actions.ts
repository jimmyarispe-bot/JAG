"use server";

/**
 * Server actions for Executive Briefing Engine.
 * Application layer only — no Core / Runtime / Domain SDK changes.
 */

import { revalidatePath } from "next/cache";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { setDecisionStatus } from "../decision-center/status-store";
import {
  addBriefingNote,
  enableBriefingShare,
  getBriefing,
  saveBriefing,
  scheduleBriefingReview,
} from "./store";
import { synthesizeExecutiveBriefing } from "./synthesize";
import {
  JAG_BRIEFING_KINDS,
  JAG_BRIEFING_SCOPES,
  JAG_BRIEFING_TIMELINES,
  type JagBriefingKind,
  type JagBriefingScope,
  type JagBriefingSectionId,
  type JagBriefingTimeline,
} from "./types";

export type GenerateBriefingResult =
  | { ok: true; briefingId: string }
  | { ok: false; error: string };

type ActionResult<T = void> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function revalidateBriefing(briefingId: string): void {
  revalidatePath("/jag/briefings");
  revalidatePath(`/jag/briefings/${briefingId}`);
  revalidatePath("/jag");
}

async function requireActor(): Promise<
  | { ok: true; actor: string; session: NonNullable<Awaited<ReturnType<typeof getJagPlatformSession>>> }
  | { ok: false; error: string }
> {
  const session = await getJagPlatformSession();
  if (!session) return { ok: false, error: "Not authenticated." };
  return { ok: true, actor: session.displayName || session.email, session };
}

export async function generateExecutiveBriefing(input: {
  scope: string;
  organizationId?: string;
  organizationIds?: string[];
  kind: string;
  timeline: string;
  customStart?: string;
  customEnd?: string;
}): Promise<GenerateBriefingResult> {
  const auth = await requireActor();
  if (!auth.ok) return auth;

  if (!JAG_BRIEFING_SCOPES.includes(input.scope as JagBriefingScope)) {
    return { ok: false, error: "Invalid organization scope." };
  }
  if (!JAG_BRIEFING_KINDS.includes(input.kind as JagBriefingKind)) {
    return { ok: false, error: "Invalid briefing type." };
  }
  if (
    !JAG_BRIEFING_TIMELINES.includes(input.timeline as JagBriefingTimeline)
  ) {
    return { ok: false, error: "Invalid timeline." };
  }

  const result = synthesizeExecutiveBriefing({
    session: auth.session,
    scope: input.scope as JagBriefingScope,
    organizationId: input.organizationId,
    organizationIds: input.organizationIds,
    kind: input.kind as JagBriefingKind,
    timeline: input.timeline as JagBriefingTimeline,
    customStart: input.customStart,
    customEnd: input.customEnd,
    generatedBy: auth.actor,
  });

  if ("error" in result) {
    return { ok: false, error: result.error };
  }

  saveBriefing(result);
  revalidateBriefing(result.id);
  return { ok: true, briefingId: result.id };
}

export async function approveBriefingDecision(input: {
  briefingId: string;
  decisionId: string;
}): Promise<ActionResult> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  if (!getBriefing(input.briefingId)) {
    return { ok: false, error: "Briefing not found." };
  }
  setDecisionStatus({
    decisionId: input.decisionId,
    status: "Approved",
    actor: auth.actor,
    message: `Approved from briefing ${input.briefingId}`,
  });
  revalidateBriefing(input.briefingId);
  revalidatePath(`/jag/decisions/${input.decisionId}`);
  return { ok: true };
}

export async function addExecutiveBriefingNote(input: {
  briefingId: string;
  text: string;
  sectionId?: JagBriefingSectionId;
}): Promise<ActionResult> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  if (!input.text.trim()) {
    return { ok: false, error: "Note text is required." };
  }
  const note = addBriefingNote({
    briefingId: input.briefingId,
    actor: auth.actor,
    text: input.text,
    sectionId: input.sectionId,
  });
  if (!note) return { ok: false, error: "Briefing not found." };
  revalidateBriefing(input.briefingId);
  return { ok: true };
}

export async function scheduleBriefingFollowUpReview(input: {
  briefingId: string;
  at: string;
  note: string;
}): Promise<ActionResult> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  if (!input.at.trim()) {
    return { ok: false, error: "Review date is required." };
  }
  const review = scheduleBriefingReview({
    briefingId: input.briefingId,
    actor: auth.actor,
    at: input.at,
    note: input.note || "Scheduled executive review",
  });
  if (!review) return { ok: false, error: "Briefing not found." };
  revalidateBriefing(input.briefingId);
  return { ok: true };
}

export async function createBriefingShareLink(input: {
  briefingId: string;
}): Promise<ActionResult<{ sharePath: string; token: string }>> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  const token = enableBriefingShare(input.briefingId);
  if (!token) return { ok: false, error: "Briefing not found." };
  revalidateBriefing(input.briefingId);
  return {
    ok: true,
    token,
    sharePath: `/jag/briefings/share/${token}`,
  };
}

export async function createFollowUpBriefing(input: {
  sourceBriefingId: string;
  kind: string;
}): Promise<GenerateBriefingResult> {
  const auth = await requireActor();
  if (!auth.ok) return auth;
  const source = getBriefing(input.sourceBriefingId);
  if (!source) return { ok: false, error: "Source briefing not found." };
  if (!JAG_BRIEFING_KINDS.includes(input.kind as JagBriefingKind)) {
    return { ok: false, error: "Invalid follow-up briefing type." };
  }

  return generateExecutiveBriefing({
    scope: source.scope,
    organizationId: source.organizationId,
    organizationIds: [...source.organizationIds],
    kind: input.kind,
    timeline: source.window.timeline,
    customStart:
      source.window.timeline === "custom"
        ? source.window.start.slice(0, 10)
        : undefined,
    customEnd:
      source.window.timeline === "custom"
        ? source.window.end.slice(0, 10)
        : undefined,
  });
}
