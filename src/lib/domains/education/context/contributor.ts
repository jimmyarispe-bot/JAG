/**
 * Education Context contributor — placeholder registration only.
 * discover() returns [] until a later domain phase implements SoR mapping.
 */

import type { ContextContributor } from "@/lib/jag/runtime";
import { EDUCATION_CONTRIBUTOR_IDS } from "../types";

export function createEducationContextContributor(): ContextContributor {
  return {
    id: EDUCATION_CONTRIBUTOR_IDS.context,
    priority: 10,
    discover() {
      return [];
    },
  };
}
