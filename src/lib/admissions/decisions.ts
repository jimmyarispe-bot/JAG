"use server";

/**
 * The decisions board's door onto an admissions decision.
 *
 * ── WHAT MOVED ON 14 OCTOBER 2026, AND WHAT DID NOT ─────────────────────
 *
 * The work is now in decisions-core.ts, word for word. This file keeps the
 * three things that belong to a form submitted by a signed-in person: the
 * permission check, reading the fields out of the FormData, and knowing who
 * pressed the button.
 *
 * NOTHING ABOUT THE DECISION ITSELF CHANGED. Same decision row, same letter,
 * same stage move, same enrollment packet, same audit, same revalidations, in
 * the same order. The reason for the move is written at the top of the core:
 * the shadow day's notes letter has a button in it, and the page behind that
 * button has no session to check.
 *
 * DecisionType is re-exported so every existing importer of
 * "@/lib/admissions/decisions" keeps working. It is a type, so it erases and
 * does not become a server action.
 */

import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import {
  applyAdmissionsDecision,
  type DecisionType,
} from "@/lib/admissions/decisions-core";

export type { DecisionType };

export async function submitAdmissionsDecision(formData: FormData) {
  const auth = await assertAnyPermission("admissions.manage", "admissions.accept");
  if ("error" in auth) return { error: auth.error };

  const supabase = auth.supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return applyAdmissionsDecision(supabase, {
    leadId: formData.get("lead_id") as string,
    applicationId: (formData.get("application_id") as string) || null,
    decisionType: formData.get("decision_type") as DecisionType,
    customNotes: (formData.get("decision_notes") as string) || "",
    sendEmail: formData.get("send_email") === "true",
    actorUserId: user?.id ?? null,
  });
}
