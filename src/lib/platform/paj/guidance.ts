import { getUlrCompetency, getUlrRelationships } from "@/lib/platform/ulr/registry/registry";
import type { PajGuidanceSnapshot } from "@/lib/platform/paj/types";

/** Retrieve parent and teacher guidance from ULR relationship registry. */
export function getCompetencyGuidance(competencyKey: string): PajGuidanceSnapshot {
  const competency = getUlrCompetency(competencyKey);
  const relationships = getUlrRelationships({ sourceKey: competencyKey });

  const parentActivities = competency?.parentActivities ?? [];
  const instructionalStrategies = competency?.instructionalStrategies ?? [];
  const interventionStrategies = competency?.interventionStrategies ?? [];

  for (const rel of relationships) {
    if (rel.relationshipType === "parent_support") {
      if (!parentActivities.includes(rel.targetKey)) parentActivities.push(rel.targetKey);
    }
    if (rel.relationshipType === "teacher_guidance") {
      const kind = (rel.metadata?.guidanceType as string | undefined) ?? "instructional";
      if (kind === "intervention") {
        if (!interventionStrategies.includes(rel.targetKey)) {
          interventionStrategies.push(rel.targetKey);
        }
      } else if (!instructionalStrategies.includes(rel.targetKey)) {
        instructionalStrategies.push(rel.targetKey);
      }
    }
  }

  const schedulingRuleKeys =
    (competency?.metadata?.schedulingRuleKeys as string[] | undefined) ?? [];
  const aiRuleKeys = competency?.aiMetadata.recommendation_rule_keys ?? [];

  for (const rel of relationships) {
    if (
      rel.relationshipType === "ai_rule" &&
      rel.metadata?.relationshipSubtype === "scheduling"
    ) {
      if (!schedulingRuleKeys.includes(rel.targetKey)) {
        schedulingRuleKeys.push(rel.targetKey);
      }
    }
  }

  return {
    competencyKey,
    parentActivities,
    instructionalStrategies,
    interventionStrategies,
    schedulingRuleKeys,
    aiRuleKeys,
  };
}
