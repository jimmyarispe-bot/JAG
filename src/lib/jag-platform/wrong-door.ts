/**
 * When somebody signs in at the wrong door.
 *
 * WHAT HAPPENED. On 13 September 2026 a parent account tried to sign in at
 * `thejag.org/jag/login`. The password was correct — Supabase authenticated her
 * without complaint — and then `authorizeJagEntry` refused her for lacking
 * JAG_ACCESS, the session was signed straight back out, and she was told:
 *
 *     Invalid credentials for The JAG™ Platform.
 *
 * So she reset her password. "Password updated." Signed in. Same message. Reset
 * again. Three times, with no way to discover that her password had been right
 * every time and she was simply standing at the wrong entrance. That was the
 * founder of the company, who built it. A family would have given up and
 * assumed the school's system was broken.
 *
 * It is easy to arrive here: `/login` on the apex host redirects to
 * `/jag/login`, so anything that lands a parent on thejag.org sends them to a
 * door they can never pass.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY IT IS SAFE TO SAY MORE HERE, WHEN THE GENERIC MESSAGE IS RIGHT ELSEWHERE.
 *
 * The generic wording exists so a stranger cannot use the login form to find out
 * which email addresses have accounts. That reasoning holds absolutely for a
 * FAILED password check, and nothing in this file changes that path.
 *
 * This is the other case: the password was CORRECT. Whoever is reading the
 * screen has already proved they hold the credentials for that account. Telling
 * them the account exists reveals nothing they did not just demonstrate, and
 * telling them which door to use costs an attacker nothing they could not learn
 * by visiting the school's website.
 *
 * The distinction to keep, if this is ever edited: credentials failed -> say
 * nothing. Credentials passed, entitlement failed -> say where to go.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { BrandRegistry } from "@/lib/platform/branding";
import { DEFAULT_ROOT_DOMAIN } from "@/lib/platform/branding/types";

/** Where a school-facing account actually signs in. */
export const TENANT_SIGN_IN_PATH = "/login";

export type WrongDoorFailure = {
  readonly message: string;
  /** A full URL when we could work out the campus, otherwise null. */
  readonly helpHref: string | null;
  readonly helpLabel: string | null;
};

/**
 * The message, with or without an address.
 *
 * Deliberately says the password was fine. That is the single fact that stops
 * somebody resetting it for a fourth time.
 */
export function buildWrongDoorFailure(tenantHost: string | null): WrongDoorFailure {
  const base =
    "Your password is correct, but this account is not part of The JAG™ Platform. " +
    "Parents and school staff sign in at their school's own address, not here.";

  if (!tenantHost) {
    return {
      message: `${base} Use the link in the email your school sent you, or ask your school's admissions office for the sign-in address.`,
      helpHref: null,
      helpLabel: null,
    };
  }

  return {
    message: `${base} Sign in here instead:`,
    helpHref: `https://${tenantHost}${TENANT_SIGN_IN_PATH}`,
    helpLabel: tenantHost,
  };
}

type SchoolRow = { schools?: { organization_id?: string | null } | null };

/**
 * Which campus address this person should have used.
 *
 * BEST EFFORT, ON PURPOSE. Everything here is wrapped so that a failure to work
 * out the address can never turn into a failure to sign in, or into a worse
 * message than the one we already have. A null simply means the wording falls
 * back to "ask your school", which is still enormously better than being told
 * your password is wrong when it is not.
 *
 * Called only after a successful password check, so the reads run as a person
 * who has proved who they are.
 */
export async function resolveTenantSignInHost(
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          limit: (n: number) => PromiseLike<{
            data: unknown;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  },
  userId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("user_schools")
      .select("schools(organization_id)")
      .eq("user_id", userId)
      .limit(5);

    if (error) {
      console.error("[jag/login] could not resolve tenant host", error.message);
      return null;
    }

    const organizationId = ((data ?? []) as SchoolRow[])
      .map((row) => row.schools?.organization_id)
      .find((id): id is string => Boolean(id));

    if (!organizationId) return null;

    const brand = BrandRegistry.getByOrganizationId(organizationId);
    const subdomain = brand?.subdomain?.trim().toLowerCase();
    if (!subdomain) return null;

    return `${subdomain}.${DEFAULT_ROOT_DOMAIN}`;
  } catch (err) {
    console.error(
      "[jag/login] tenant host resolution threw",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}
