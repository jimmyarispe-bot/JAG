/**
 * SUPERSEDED, 25 September 2026. See weekly-work.ts.
 *
 * Admin hours were built first and tutoring sessions arrived twenty minutes
 * later with the same shape. Rather than keep two near-identical files that
 * would drift, both moved into weekly-work.ts as entries in one list.
 *
 * This file remains only so nothing imports a missing module. It can be
 * deleted; Claude cannot delete files over the device bridge.
 */
export {
  WEEKLY_WORK_KINDS,
  weeklyWorkKind,
  checkWeeklyWorkClaim,
  weeklyWorkGross,
  weeklyWorkOptions,
} from "@/lib/finance/weekly-work";
