/**
 * Opening the door the invitation points at.
 *
 * WHAT WENT WRONG, 22 September 2026. Nina Gaddy answered the invite_to_apply
 * gate for Jayden Roy at 3:11pm. The invitation composed correctly and reached
 * Lisa Roy's inbox - the first application invitation this platform has ever
 * delivered. It said "You can begin here" and linked to /apply/portal, which
 * opens with:
 *
 *     if (!sessionUser) redirect("/login?next=/apply/portal")
 *
 * Lisa has no account. She was sent to a sign-in page headed "School Platform",
 * asked for a password she has never had, by an organisation whose name was not
 * on the screen. The email promised she would not need to repeat anything she
 * had already told us; she could not get far enough to find out.
 *
 * THE DOOR ALREADY EXISTED. inviteProspectGuardians() was written on
 * 12 September for exactly this - creating an account for a prospective parent
 * so the admissions portal will open for them. Nothing called it when a gate
 * was answered. The invitation and the means of accepting it were built
 * separately and never introduced.
 *
 * WHY THIS RUNS BEFORE THE FAMILY IS EMAILED. A parent who clicks within
 * seconds must find a door, not a lock. If provisioning fails, the caller is
 * told and the invitation is not sent - a family that hears nothing can be
 * written to tomorrow, a family sent to a dead end has already formed their
 * impression of us.
 *
 * WHAT IT WILL NOT DO. It never touches an address that already has an
 * account - not to "upgrade" it, not to re-invite it. That guard exists because
 * lead guardian emails are typed by whoever filled in the form, and the
 * standing test address for this product is the founder's own. Provisioning
 * that row would strip his roles and leave him a PARENT of the platform he
 * runs. Refusal is the correct outcome and is reported, never swallowed.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  inviteProspectGuardians,
  listProspectInviteCandidates,
} from "@/lib/admissions/portal/prospect-invites";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface PortalDoorResult {
  /** Accounts created and invitations sent. */
  readonly invited: number;
  /** Guardians who already had an account, or had no email. Not a failure. */
  readonly alreadyIn: number;
  /**
   * Set when provisioning was attempted and failed. The caller must NOT send
   * the family an invitation when this is present.
   */
  readonly error: string | null;
}

/**
 * Make sure this lead's guardians can sign in to the application portal.
 *
 * Safe to call more than once: a guardian who already has an account is
 * skipped, so answering a gate twice cannot send two sets of credentials.
 */
export async function openPortalDoorForLead(
  supabase: AuthClient,
  leadId: string
): Promise<PortalDoorResult> {
  const { data: lead, error: leadError } = await supabase
    .from("admissions_leads")
    .select(
      "id, school_id, first_name, preferred_name, schools(name, organization_id, admissions_contact_name)"
    )
    .eq("id", leadId)
    .maybeSingle();

  if (leadError) return { invited: 0, alreadyIn: 0, error: leadError.message };
  if (!lead) return { invited: 0, alreadyIn: 0, error: "That case could not be found." };

  const row = lead as unknown as {
    school_id: string | null;
    first_name?: string | null;
    preferred_name?: string | null;
    schools?: {
      name?: string | null;
      organization_id?: string | null;
      admissions_contact_name?: string | null;
    } | null;
  };

  const organizationId = row.schools?.organization_id ?? null;
  if (!organizationId || !row.school_id) {
    return {
      invited: 0,
      alreadyIn: 0,
      error:
        "That campus has no organization set, so a parent account cannot be created. Fix the campus first.",
    };
  }

  const candidates = await listProspectInviteCandidates(leadId);

  /*
   * `skip` covers three different situations and only one of them is a
   * problem: no email at all, a staff address, or an account that already
   * exists. The last two mean the family can already get in - or that we must
   * not touch that address - so both count as the door being open.
   */
  const toInvite = candidates.filter((c) => !c.skip).map((c) => c.guardianId);
  const alreadyIn = candidates.filter((c) => c.skip === "already_invited").length;
  const noEmail = candidates.filter((c) => c.skip === "no_email").length;

  if (toInvite.length === 0) {
    /*
     * Nobody to provision. If somebody can already sign in, that is a success.
     * If the only reason is that we hold no email address, the invitation has
     * nowhere to go either and the caller needs to know before sending it.
     */
    if (alreadyIn > 0) return { invited: 0, alreadyIn, error: null };
    if (noEmail > 0 || candidates.length === 0) {
      return {
        invited: 0,
        alreadyIn: 0,
        error:
          "No guardian on this case has an email address we can create an account for, so the application link would not open for them.",
      };
    }
    return { invited: 0, alreadyIn, error: null };
  }

  const childName =
    (row.preferred_name ?? "").trim() || (row.first_name ?? "").trim();

  const result = await inviteProspectGuardians({
    leadId,
    guardianIds: toInvite,
    organizationId,
    schoolId: String(row.school_id),
    childName,
    signatory:
      (row.schools?.admissions_contact_name ?? "").trim() || "The Admissions Team",
    schoolName: (row.schools?.name ?? "").trim(),
    /*
     * The authority is the decision that was just made. The person answering
     * the gate holds `admissions.accept`, not `users.manage`, and this path
     * can only ever create a PARENT for a guardian already on this lead.
     */
    authority: { kind: "admissions_gate", leadId },
  });

  const sent = result.invited.filter((r) => r.ok);
  const failed = result.invited.filter((r) => !r.ok);

  if (sent.length === 0 && failed.length > 0) {
    return {
      invited: 0,
      alreadyIn,
      error: failed.map((f) => `${f.email}: ${f.error}`).join(" · "),
    };
  }

  return { invited: sent.length, alreadyIn, error: null };
}
