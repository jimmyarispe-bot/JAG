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
 * ── DO NOT RE-EXPORT ANYTHING FROM THIS FILE, NOT EVEN A TYPE ───────────────
 *
 * This file carried `export type { DecisionType };` for exactly one deploy, on
 * 14 October 2026, and that deploy failed with 252 errors - one for every route
 * in the JAG:
 *
 *   Export DecisionType doesn't exist in target module
 *   The export DecisionType was not found in module .../decisions.ts [app-rsc]
 *
 * WHY, and it is not obvious: Next's server-actions transform reads the export
 * NAMES of a "use server" module and registers one action id for each, BEFORE
 * TypeScript erases the types. So it wrote an action binding for DecisionType,
 * the type then vanished as types do, and every route's generated actions.js
 * pointed at an export that was not there.
 *
 * A green typecheck cannot see this. tsc erases the type and is satisfied; the
 * ship script's typecheck and all 200 tests passed and it still would not
 * build. tests/unit/admissions/no-type-reexport-from-an-action.test.ts is the
 * guard, because the next person to do this will have the same good reason.
 *
 * `export type Foo = ...` - a type DECLARATION - is fine and twelve other
 * "use server" files in the JAG use it. It is the re-export SPECIFIER LIST,
 * `export { X }` or `export type { X }`, that the transform picks up.
 *
 * So DecisionType is imported from decisions-core.ts by anything that needs it.
 */

import { assertAnyPermission } from "@/lib/platform/identity/action-guards";
import {
  applyAdmissionsDecision,
  type DecisionType,
} from "@/lib/admissions/decisions-core";

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
