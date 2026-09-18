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
 * Admissions opens on the Pipeline Board rather than Today's Work.
 *
 * For the two people who run the funnel rather than work a queue. A task list
 * answers "what is assigned to me"; the board answers "where is every family",
 * which is the question these two open the page with.
 */
export function admissionsOpensOnBoard(ctx: IdentityContext): boolean {
  const held = roles(ctx);
  return held.includes("FOUNDER") || held.includes("CEO");
}

/**
 * Signing in goes straight to the admissions board, with no home page first.
 *
 * Danni's morning is admissions, not money. She holds the finance keys and
 * keeps them - Finance is one click away in the sidebar and nothing here
 * changes what she may open - but the screen that greets her is children in a
 * pipeline rather than a revenue brief.
 *
 * FOUNDER is deliberately excluded: the founder dashboard leads with the
 * numbers, on purpose, and that is a different job.
 */
export function landsOnAdmissionsBoard(ctx: IdentityContext): boolean {
  const held = roles(ctx);
  return held.includes("CEO") && !held.includes("FOUNDER");
}

/** The board, as a URL, in one place so the two callers cannot drift. */
export const ADMISSIONS_BOARD_HREF = "/dashboard/admissions?view=pipeline";
