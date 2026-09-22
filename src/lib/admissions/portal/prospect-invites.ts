/**
 * Giving a prospective parent a way in.
 *
 * THE GAP THIS CLOSES. A family submits the interest form, receives the
 * thank-you email, and then hits a wall: `/apply/portal` opens with
 * `if (!sessionUser) redirect("/login")`, and nothing in JAG has ever created an
 * account for somebody who is not already enrolled. The existing invite tool
 * (`lib/portal/parent-invites.ts`) reads `guardians` joined to `families` —
 * enrolled families only. A prospect lives in `admissions_lead_guardians` and is
 * invisible to it.
 *
 * Measured 12 September 2026: zero applications have ever been started, and the
 * one lead-guardian email in the database has no matching account. The form even
 * tells them "use the email you will sign in with to access your admissions
 * portal". Nothing made that true.
 *
 * WHAT THE LINK ACTUALLY IS, and why it differs from the enrolled path. The
 * enrolled portal finds a parent's children through `guardians.user_id`, so
 * inviting an enrolled parent means writing that column. The admissions portal
 * does not work that way — `is_guardian_of_lead` (migration 052) matches on
 * email:
 *
 *     lower(lg.email) = lower(u.email)
 *
 * So the link is the email address, and `createManagedUser` establishes it by
 * upserting the `public.users` row. There is no column to write afterwards, and
 * inventing one would add a second thing that can disagree with the first.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE GUARD THAT MATTERS MOST, and which the enrolled path does not need.
 *
 * `createManagedUser` clears a user's existing roles before assigning the one
 * requested:
 *
 *     delete from user_roles where user_id = ...   then insert the new role
 *
 * That is correct for somebody being created. It is catastrophic for somebody
 * who already exists. Lead guardian emails are typed by whoever filled in the
 * form, and a staff member testing the public form puts their own address in
 * that column — jimmy.arispe@gmail.com is the standing test address for this
 * product. Inviting that row would strip the founder's roles and leave him a
 * PARENT, locked out of the JAG he runs.
 *
 * So: any email that already has an account is refused outright, never
 * "upgraded", never re-invited. The result says which, so a refusal is visible
 * rather than a silent skip.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * THIS SENDS REAL EMAIL TO REAL FAMILIES. Every function here is either a
 * preview or requires the caller to have confirmed, and the send is capped per
 * call. There is deliberately no "invite every lead" path — the same reasoning
 * that keeps `automation_started_at` off by default for imported leads.
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { createManagedUser } from "@/lib/platform/identity/user-management";
import {
  PROSPECT_INVITE_SUBJECT,
  PROSPECT_PORTAL_PATH,
  buildProspectInviteBody,
} from "@/lib/admissions/portal/prospect-invite-email";

/** One call, one family. Higher than this and a mistake stops being recoverable. */
export const PROSPECT_INVITE_BATCH_LIMIT = 4;

export type ProspectInviteSkip =
  | "no_email"
  /** The address belongs to somebody with staff roles. Never invite. */
  | "staff_account"
  /** The address already has a parent account — usually one we just created. */
  | "already_invited";

export type ProspectInviteCandidate = {
  readonly guardianId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly isPrimary: boolean;
  /** Set when this guardian will NOT be invited, and why. */
  readonly skip: ProspectInviteSkip | null;
  /** Plain-language reason, shown to staff rather than a code. */
  readonly skipReason: string | null;
};

export type ProspectInviteOutcome = {
  readonly guardianId: string;
  readonly email: string;
  readonly ok: boolean;
  readonly error?: string;
};

type LeadGuardianRow = {
  id: string;
  lead_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  primary_guardian: boolean | null;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Which emails already have an account, and what kind.
 *
 * WHY THE KIND MATTERS. Both cases are reasons not to send, and they are not the
 * same sentence. A staff address must never be invited, because
 * `createManagedUser` would replace that person's roles. A parent address that
 * already has an account is simply done — and the commonest way to reach that
 * state is to have pressed the button a moment ago, since the page revalidates
 * and the list re-runs against an account that did not exist when it last
 * rendered.
 *
 * Conflating them produced a card that said "Invitation sent" and, directly
 * above it, that the invitation was refused. Somebody reading that assumes they
 * broke something and presses it again.
 *
 * PARENT-only is treated as a parent account. Any other role, or no role at all,
 * is treated as staff — an account with no roles is an unknown, and the safe
 * reading of an unknown is the one that refuses.
 *
 * Reads `public.users` rather than `auth.users`: that is the table
 * `is_guardian_of_lead` joins and the one `createManagedUser` would collide with.
 */
type ExistingAccount = { isStaff: boolean };

async function existingAccounts(
  admin: ReturnType<typeof createServiceRoleClient>,
  emails: readonly string[]
): Promise<Map<string, ExistingAccount>> {
  const wanted = [...new Set(emails.map((e) => e.toLowerCase()))].filter(Boolean);
  if (!wanted.length) return new Map();

  const { data, error } = await admin
    .from("users")
    .select("id, email")
    .in("email", wanted);

  if (error) {
    // Fail closed. Not knowing whether an account exists is the one state in
    // which inviting is unsafe, so treat every address as taken AND as staff —
    // the reading that refuses.
    console.error("[prospect-invites] could not check existing accounts", error.message);
    return new Map(wanted.map((e) => [e, { isStaff: true }]));
  }

  const rows = (data ?? []) as unknown as { id: string; email: string | null }[];
  if (!rows.length) return new Map();

  const { data: roleRows, error: roleError } = await admin
    .from("user_roles")
    .select("user_id, roles(name)")
    .in("user_id", rows.map((r) => r.id));

  if (roleError) {
    console.error("[prospect-invites] could not read roles", roleError.message);
    return new Map(rows.map((r) => [(r.email ?? "").toLowerCase(), { isStaff: true }]));
  }

  const rolesByUser = new Map<string, string[]>();
  for (const row of (roleRows ?? []) as unknown as {
    user_id: string;
    roles: { name: string } | { name: string }[] | null;
  }[]) {
    const names = Array.isArray(row.roles)
      ? row.roles.map((r) => r.name)
      : row.roles
        ? [row.roles.name]
        : [];
    rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), ...names]);
  }

  const out = new Map<string, ExistingAccount>();
  for (const row of rows) {
    const email = (row.email ?? "").toLowerCase();
    if (!email) continue;
    const names = rolesByUser.get(row.id) ?? [];
    const parentOnly = names.length > 0 && names.every((n) => n === "PARENT");
    out.set(email, { isStaff: !parentOnly });
  }
  return out;
}

/**
 * Everyone on one lead, with the reason anybody is being skipped stated rather
 * than filtered away. A list that quietly omits a parent is a list nobody can
 * check.
 */
export async function listProspectInviteCandidates(
  leadId: string
): Promise<ProspectInviteCandidate[]> {
  const admin = createServiceRoleClient();

  const { data, error } = await admin
    .from("admissions_lead_guardians")
    .select("id, lead_id, first_name, last_name, email, primary_guardian")
    .eq("lead_id", leadId)
    .order("primary_guardian", { ascending: false });

  if (error) {
    console.error("[prospect-invites] could not list lead guardians", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as LeadGuardianRow[];
  const taken = await existingAccounts(
    admin,
    rows.map((r) => clean(r.email) ?? "").filter(Boolean)
  );

  return rows.map((row) => {
    const email = clean(row.email);
    const lower = email?.toLowerCase() ?? "";
    const account = lower ? taken.get(lower) : undefined;

    let skip: ProspectInviteSkip | null = null;
    let skipReason: string | null = null;

    if (!email) {
      skip = "no_email";
      skipReason = "No email address on this guardian, so there is nothing to send to.";
    } else if (account?.isStaff) {
      skip = "staff_account";
      skipReason =
        "This address belongs to a staff account. Inviting it would replace that person's roles, so it is refused. If this parent needs portal access, use a different address.";
    } else if (account) {
      skip = "already_invited";
      skipReason =
        "Already has a parent account and can sign in — nothing more to send.";
    }

    return {
      guardianId: row.id,
      firstName: clean(row.first_name) ?? "Parent/Guardian",
      lastName: clean(row.last_name) ?? "Household",
      email,
      isPrimary: Boolean(row.primary_guardian),
      skip,
      skipReason,
    };
  });
}

/**
 * Create the accounts and send the invitations.
 *
 * Every check from the preview is repeated here. The list a person looked at may
 * be minutes old, and the two decisions that must not be made on stale data are
 * "does this address already belong to somebody" and "have they been invited
 * already".
 */
export async function inviteProspectGuardians(input: {
  leadId: string;
  guardianIds: readonly string[];
  organizationId: string;
  schoolId: string;
  /** The child this family enquired about — the letter is about them. */
  childName: string;
  /** Campus admissions contact, who signs it. */
  signatory: string;
  /** The campus name, printed under the signatory. */
  schoolName?: string;
  /**
   * Set when this is being done BY a decision rather than by a user manager.
   *
   * A school leader answering invite_to_apply holds `admissions.accept` and not
   * `users.manage`, so without this the account cannot be created and the
   * family is emailed a link to a password box. See ManagedUserInput.authority.
   */
  authority?: { readonly kind: "admissions_gate"; readonly leadId: string };
}): Promise<{ invited: ProspectInviteOutcome[]; skipped: number }> {
  const admin = createServiceRoleClient();
  const ids = input.guardianIds.slice(0, PROSPECT_INVITE_BATCH_LIMIT);
  if (!ids.length) return { invited: [], skipped: 0 };

  const { data, error } = await admin
    .from("admissions_lead_guardians")
    .select("id, lead_id, first_name, last_name, email, primary_guardian")
    .eq("lead_id", input.leadId)
    .in("id", ids);

  if (error) {
    console.error("[prospect-invites] could not load lead guardians", error.message);
    return { invited: [], skipped: ids.length };
  }

  const rows = (data ?? []) as unknown as LeadGuardianRow[];
  const taken = await existingAccounts(
    admin,
    rows.map((r) => clean(r.email) ?? "").filter(Boolean)
  );

  const invited: ProspectInviteOutcome[] = [];
  let skipped = 0;

  for (const row of rows) {
    const email = clean(row.email);

    if (!email) {
      skipped += 1;
      continue;
    }

    const account = taken.get(email.toLowerCase());
    if (account?.isStaff) {
      invited.push({
        guardianId: row.id,
        email,
        ok: false,
        error:
          "Refused: that address belongs to a staff account, and inviting it would replace the roles on it.",
      });
      continue;
    }
    if (account) {
      invited.push({
        guardianId: row.id,
        email,
        ok: false,
        error: "Already has a parent account — nothing sent.",
      });
      continue;
    }

    const result = await createManagedUser({
      firstName: clean(row.first_name) ?? "Parent/Guardian",
      lastName: clean(row.last_name) ?? "Household",
      email,
      organizationId: input.organizationId,
      schoolIds: [input.schoolId],
      role: "PARENT",
      status: "pending_invite",
      ...(input.authority ? { authority: input.authority } : {}),
      /**
       * Where the link actually ends.
       *
       * The letter says "create your JAG account and complete your admissions
       * application", so it has to finish on the application. Without this the
       * activation flow falls back to /dashboard, which needs ACADEMYOS_ACCESS
       * — a parent sets a password and is bounced off a staff route, having
       * been promised their child's application.
       */
      activationNext: PROSPECT_PORTAL_PATH,
      // The parent letter, in place of the staff onboarding copy. See
      // prospect-invite-email.ts for why that default is wrong here.
      invitation: {
        subject: PROSPECT_INVITE_SUBJECT,
        buildBody: (inviteLink) =>
          buildProspectInviteBody({
            // The greeting. clean() returns null when the guardian row has no
            // first name, and the builder drops the greeting rather than
            // opening a letter home with a placeholder.
            parentName: clean(row.first_name) ?? "",
            childName: input.childName,
            signatory: input.signatory,
            schoolName: input.schoolName,
            inviteLink,
          }),
      },
    });

    if (!result.success) {
      invited.push({ guardianId: row.id, email, ok: false, error: result.error });
      continue;
    }

    /**
     * No link step, deliberately. The admissions portal matches a guardian to a
     * lead by email, and `createManagedUser` has just written the `public.users`
     * row that makes that match succeed. See the note at the top of this file.
     */
    invited.push({ guardianId: row.id, email, ok: true });
  }

  return { invited, skipped };
}
