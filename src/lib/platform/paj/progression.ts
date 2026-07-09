import { getUlrCompetency } from "@/lib/platform/ulr/registry/registry";
import {
  PAJ_SL_DOMAIN_KEY,
  PAJ_SL_ENTRY_COMPETENCY_KEY,
  type CreateLearningJourneyInput,
} from "@/lib/platform/paj/types";

/** Resolve initial Structured Literacy placement competency (Doc 105 §4.1). */
export function resolveSlPlacementCompetency(
  input: Pick<CreateLearningJourneyInput, "placedCompetencyKey">
): string {
  if (input.placedCompetencyKey) {
    const competency = getUlrCompetency(input.placedCompetencyKey);
    if (!competency || competency.learningDomainKey !== PAJ_SL_DOMAIN_KEY) {
      throw new Error(`Invalid SL placement competency: ${input.placedCompetencyKey}`);
    }
    return input.placedCompetencyKey;
  }
  return PAJ_SL_ENTRY_COMPETENCY_KEY;
}

/** Verify ULR prerequisite chain for a target competency. */
export function evaluatePrerequisitesMet(
  targetCompetencyKey: string,
  proficientCompetencyKeys: Set<string>
): { ok: boolean; missing: string[] } {
  const competency = getUlrCompetency(targetCompetencyKey);
  if (!competency) {
    return { ok: false, missing: [targetCompetencyKey] };
  }

  const missing = competency.prerequisiteCompetencyKeys.filter(
    (key) => !proficientCompetencyKeys.has(key)
  );

  return { ok: missing.length === 0, missing };
}
