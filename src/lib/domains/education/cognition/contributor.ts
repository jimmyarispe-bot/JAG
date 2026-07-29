/**
 * Education Cognition contributor — registration placeholder.
 * gatherEvidence returns []; no analyze/recommend logic.
 */

import type { CognitiveContributor } from "@/lib/jag/runtime";
import { EDUCATION_CONTRIBUTOR_IDS } from "../types";

export function createEducationCognitiveContributor(): CognitiveContributor {
  return {
    id: EDUCATION_CONTRIBUTOR_IDS.cognition,
    priority: 10,
    capabilities: ["education"],
    gatherEvidence() {
      return [];
    },
  };
}
