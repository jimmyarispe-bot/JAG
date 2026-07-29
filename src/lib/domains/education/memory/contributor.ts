/**
 * Education Memory contributor — registration placeholder.
 */

import type { MemoryContributor } from "@/lib/jag/runtime";
import { EDUCATION_CONTRIBUTOR_IDS } from "../types";

export function createEducationMemoryContributor(): MemoryContributor {
  return {
    id: EDUCATION_CONTRIBUTOR_IDS.memory,
    priority: 10,
    publish() {
      return [];
    },
  };
}
