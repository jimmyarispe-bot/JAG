/**
 * Education Intent contributor — catalog + empty detect placeholder.
 * No inference / NLP in foundation phase.
 */

import type { IntentContributor } from "@/lib/jag/runtime";
import { EDUCATION_CONTRIBUTOR_IDS } from "../types";
import { EDUCATION_INTENT_CATALOG } from "./contracts";

export function createEducationIntentContributor(): IntentContributor {
  return {
    id: EDUCATION_CONTRIBUTOR_IDS.intent,
    priority: 10,
    catalog: EDUCATION_INTENT_CATALOG,
    detect() {
      return [];
    },
  };
}
