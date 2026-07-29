/**
 * Normalized Education intents — catalog contracts only.
 * No detection algorithms or NLP.
 */

import type { IntentCatalogEntry } from "@/lib/jag/runtime";
import { EDUCATION_ACTION_IDS, EDUCATION_INTENT_IDS } from "../types";

export type EducationIntentId =
  (typeof EDUCATION_INTENT_IDS)[keyof typeof EDUCATION_INTENT_IDS];

/** Canonical Education intent catalog (declaration only). */
export const EDUCATION_INTENT_CATALOG: readonly IntentCatalogEntry[] = [
  {
    intentId: EDUCATION_INTENT_IDS.teach,
    label: "Teach",
    domainHints: ["education"],
    actionCandidates: [EDUCATION_ACTION_IDS.scheduleSession],
  },
  {
    intentId: EDUCATION_INTENT_IDS.learn,
    label: "Learn",
    domainHints: ["education"],
    actionCandidates: [],
  },
  {
    intentId: EDUCATION_INTENT_IDS.assess,
    label: "Assess",
    domainHints: ["education"],
    actionCandidates: [EDUCATION_ACTION_IDS.publishProgress],
  },
  {
    intentId: EDUCATION_INTENT_IDS.enroll,
    label: "Enroll",
    domainHints: ["education"],
    actionCandidates: [EDUCATION_ACTION_IDS.approveEnrollment],
  },
  {
    intentId: EDUCATION_INTENT_IDS.support,
    label: "Support",
    domainHints: ["education"],
    actionCandidates: [],
  },
  {
    intentId: EDUCATION_INTENT_IDS.communicate,
    label: "Communicate",
    domainHints: ["education"],
    actionCandidates: [],
  },
  {
    intentId: EDUCATION_INTENT_IDS.plan,
    label: "Plan",
    domainHints: ["education"],
    actionCandidates: [EDUCATION_ACTION_IDS.scheduleSession],
  },
  {
    intentId: EDUCATION_INTENT_IDS.review,
    label: "Review",
    domainHints: ["education"],
    actionCandidates: [
      EDUCATION_ACTION_IDS.recordAttendance,
      EDUCATION_ACTION_IDS.publishProgress,
    ],
  },
] as const;
