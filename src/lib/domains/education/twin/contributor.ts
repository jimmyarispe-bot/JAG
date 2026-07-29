/**
 * Education Twin contributor — registration placeholder.
 */

import type { TwinContributor } from "@/lib/jag/runtime";
import { EDUCATION_CONTRIBUTOR_IDS } from "../types";

export function createEducationTwinContributor(): TwinContributor {
  return {
    id: EDUCATION_CONTRIBUTOR_IDS.twin,
    priority: 10,
    publish() {
      return [];
    },
  };
}
