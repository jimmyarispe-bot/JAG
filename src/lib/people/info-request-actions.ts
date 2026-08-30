"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { canImportStudents } from "@/lib/platform/imports/access";
import { findFamiliesWithGaps } from "@/lib/people/completeness";
import { requestMissingInfo, type InfoRequestOutcome } from "@/lib/people/info-requests";

/**
 * Staff-triggered send. The weekly worker handles reminders on its own; this is
 * the button for "go now" and for the first send before the next cron tick.
 */
export async function sendMissingInfoRequests(input: {
  familyIds?: string[];
}): Promise<{ ok: true; outcome: InfoRequestOutcome } | { ok: false; error: string }> {
  const identity = await getIdentityContext();
  if (!identity) return { ok: false, error: "Not signed in" };
  if (!canImportStudents(identity)) {
    return { ok: false, error: "You do not have access to send these" };
  }

  const supabase = await createAuthClient();
  let gaps = await findFamiliesWithGaps();

  if (input.familyIds?.length) {
    const wanted = new Set(input.familyIds);
    gaps = gaps.filter((g) => wanted.has(g.familyId));
  }

  const outcome = await requestMissingInfo(
    supabase,
    gaps,
    identity.effectiveUserId ?? null
  );

  revalidatePath("/dashboard/people");
  return { ok: true, outcome };
}
