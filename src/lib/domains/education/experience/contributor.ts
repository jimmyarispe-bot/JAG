/**
 * Education Experience contributor — empty fragment placeholder.
 * No UI composition in foundation phase.
 */

import type { ExperienceContributor } from "@/lib/jag/runtime";
import { EDUCATION_CONTRIBUTOR_IDS } from "../types";

export function createEducationExperienceContributor(): ExperienceContributor {
  return {
    id: EDUCATION_CONTRIBUTOR_IDS.experience,
    priority: 10,
    widgets() {
      return [];
    },
    briefing() {
      return null;
    },
    nextActions() {
      return [];
    },
    navigation() {
      return [];
    },
  };
}
