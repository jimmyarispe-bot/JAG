/**
 * Phase 3 — Evidence Center bulk upload constants.
 */

/** UI/API safety limit — not a Storage limit. */
export const MAX_BULK_EVIDENCE_FILES = 25;

/** Max concurrent authorize → PUT → complete pipelines. */
export const MAX_BULK_EVIDENCE_CONCURRENCY = 3;
