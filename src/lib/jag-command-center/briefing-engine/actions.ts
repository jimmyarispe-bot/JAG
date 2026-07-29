"use server";

/**
 * Server actions for Executive Briefing Engine.
 * Application layer only — no Core / Runtime / Domain SDK changes.
 */

import { revalidatePath } from "next/cache";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { saveBriefing } from "./store";
import { synthesizeExecutiveBriefing } from "./synthesize";
import {
  JAG_BRIEFING_TIMELINES,
  type JagBriefingTimeline,
} from "./types";

export type GenerateBriefingResult =
  | { ok: true; briefingId: string }
  | { ok: false; error: string };

export async function generateExecutiveBriefing(input: {
  organizationId: string;
  timeline: string;
  customStart?: string;
  customEnd?: string;
}): Promise<GenerateBriefingResult> {
  const session = await getJagPlatformSession();
  if (!session) {
    return { ok: false, error: "Not authenticated." };
  }
  if (!input.organizationId.trim()) {
    return { ok: false, error: "Organization is required." };
  }
  if (
    !JAG_BRIEFING_TIMELINES.includes(input.timeline as JagBriefingTimeline)
  ) {
    return { ok: false, error: "Invalid timeline." };
  }

  const result = synthesizeExecutiveBriefing({
    session,
    organizationId: input.organizationId,
    timeline: input.timeline as JagBriefingTimeline,
    customStart: input.customStart,
    customEnd: input.customEnd,
    generatedBy: session.displayName || session.email,
  });

  if ("error" in result) {
    return { ok: false, error: result.error };
  }

  saveBriefing(result);
  revalidatePath("/jag/briefings");
  revalidatePath(`/jag/briefings/${result.id}`);
  revalidatePath("/jag");

  return { ok: true, briefingId: result.id };
}
