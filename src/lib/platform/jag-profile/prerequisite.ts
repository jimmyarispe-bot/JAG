import { evaluatePrerequisitesMet } from "@/lib/platform/paj/progression";
import { getUlrCompetency } from "@/lib/platform/ulr/registry/registry";
import type { JagProfilePrerequisiteItem } from "@/lib/platform/jag-profile/types";

export function buildPrerequisiteGraph(
  targetKey: string,
  proficientKeys: Set<string>
): { ok: boolean; missing: string[]; chain: JagProfilePrerequisiteItem[] } {
  const competency = getUlrCompetency(targetKey);
  if (!competency) {
    return { ok: false, missing: [targetKey], chain: [] };
  }

  const chain: JagProfilePrerequisiteItem[] = competency.prerequisiteCompetencyKeys.map((key) => {
    const prereq = getUlrCompetency(key);
    return {
      competencyKey: key,
      title: prereq?.title ?? key,
      met: proficientKeys.has(key),
    };
  });

  chain.push({
    competencyKey: targetKey,
    title: competency.title,
    met: proficientKeys.has(targetKey),
  });

  const evalResult = evaluatePrerequisitesMet(targetKey, proficientKeys);
  return { ...evalResult, chain };
}
