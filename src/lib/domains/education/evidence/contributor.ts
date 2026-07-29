/**
 * Education Evidence contributor — registration placeholder.
 */

import type { EvidenceContributor } from "@/lib/jag/runtime";
import { EDUCATION_CONTRIBUTOR_IDS } from "../types";

export function createEducationEvidenceContributor(): EvidenceContributor {
  return {
    id: EDUCATION_CONTRIBUTOR_IDS.evidence,
    priority: 10,
    collect() {
      return [];
    },
    publish() {
      return [];
    },
  };
}
