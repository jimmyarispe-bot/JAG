import type { IdentityContext } from "@/lib/platform/identity/context";

/**
 * Where a person lands, and what their Admissions page opens on.
 *
 * Both rules live here rather than as role checks scattered through two page
 * components, because "who sees what first" is a policy and policies that are
 * spelled out in one file can be read, argued with and changed. The same
 * question answered in three places is how every workspace in the network ended
 * up titled The Academy FL.
 *
 * These decide a DEFAULT, never an access boundary. Every tab and route stays
 * reachable for anyone whose permissions already allow it; the only thing being
 * chosen is which one is already open when you arrive.
 */

function roles(ctx: IdentityContext): string[] {
  return (ctx.roles ?? []).map((role) => String(role).toUpperCase());
}

/**
 * The roles that run the admissions funnel rather than work a queue from it.
 *
 * These are role NAMES out of `roles.name`, which is what ctx.roles carries -
 * not display names, and not the strings used in RLS policies. Migration 289's
 * policy says has_role('CEO'), and CEO is not a role anybody in this network
 * actually holds; assuming it was Danni's cost a deploy. Hers are
 * EXECUTIVE_DIRECTOR, PLATFORM_OWNER and JAG_ORG_ADMIN.
 *
 * CEO stays in the list because the policy implies somebody could hold it, and
 * a name that matches nobody costs nothing.
 */
const FUNNEL_ROLES = ["FOUNDER", "CEO", "EXECUTIVE_DIRECTOR"];

/**
 * Admissions opens on the Pipeline Board rather than Today's Work.
 *
 * A task list answers "what is assigned to me"; the board answers "where is
 * every family", which is the question these people open the page with.
 */
export function admissionsOpensOnBoard(ctx: IdentityContext): boolean {
  return roles(ctx).some((role) => FUNNEL_ROLES.includes(role));
}

/**
 * Signing in goes straight to the admissions board, with no home page first.
 *
 * Danni's morning is admissions, not money. She holds the finance keys and
 * keeps them - Finance is one click away in the sidebar and nothing here
 * changes what she may open - but the screen that greets her is children in a
 * pipeline rather than a revenue brief.
 *
 * She is EXECUTIVE_DIRECTOR. The first version of this checked for CEO, which
 * is a role name that appears in an RLS policy and on nobody's account, so the
 * redirect matched no one and she kept landing on the founder dashboard - which
 * her PLATFORM_OWNER and JAG_ORG_ADMIN roles unlock through JAG_ACCESS.
 *
 * FOUNDER is deliberately excluded: the founder dashboard leads with the
 * numbers, on purpose, and that is a different job.
 */
export function landsOnAdmissionsBoard(ctx: IdentityContext): boolean {
  const held = roles(ctx);
  if (held.includes("FOUNDER")) return false;
  return held.includes("EXECUTIVE_DIRECTOR") || held.includes("CEO");
}

/** The board, as a URL, in one place so the two callers cannot drift. */
export const ADMISSIONS_BOARD_HREF = "/dashboard/admissions?view=pipeline";
