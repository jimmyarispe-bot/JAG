import "server-only";

/**
 * Turning the token in an invitation link into a lead.
 *
 * The invitation says "You can begin here" and carries a token minted for that
 * one family. This is the only thing that reads it. Nothing else in the
 * codebase accepts a lead id from a browser.
 *
 * RULES, enforced here rather than by callers:
 *   - exactly 64 lowercase hex characters, checked before the database is
 *     touched, so the column is never queried with attacker-shaped input
 *   - one lead, or null; no list, no search, no second family
 *   - null for every failure - unknown, malformed, revoked - and deliberately
 *     not saying which, because telling somebody guessing tokens that they are
 *     getting warm is the only thing this could get badly wrong
 */

import { createServiceRoleClient } from "@/lib/supabase/server";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export async function leadIdForApplicationToken(
  token: string
): Promise<string | null> {
  if (!TOKEN_PATTERN.test(token)) return null;

  const admin = createServiceRoleClient() as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (
          column: string,
          value: string
        ) => {
          maybeSingle: () => PromiseLike<{
            data: unknown;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };

  const { data, error } = await admin
    .from("admissions_leads")
    .select("id")
    .eq("application_access_token", token)
    .maybeSingle();

  if (error) {
    console.error("[apply-link] token lookup failed:", error.message);
    return null;
  }

  const id = (data as { id?: string } | null)?.id;
  return id ?? null;
}
