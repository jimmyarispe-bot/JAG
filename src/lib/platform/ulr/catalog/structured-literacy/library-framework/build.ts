/**
 * Structured Literacy competency library framework (Doc 25 / Doc 98 pattern).
 */
import type {
  UlrAiMetadata,
  UlrAtomicSkillDefinition,
  UlrCompetencyDefinition,
  UlrRelationship,
} from "@/lib/platform/ulr/types";

export const SL_DOMAIN_KEY = "domain.structured_literacy";

export interface SlCompetencyGroupSpec {
  groupKey: string;
  subStrandKey: string;
  competencies: Array<{
    title: string;
    description: string;
    titleEducator?: string;
  }>;
}

export interface SlLibrarySpec {
  libraryKey: string;
  documentRef: string;
  conceptKey: string;
  strandKey: string;
  keyPrefix: string;
  playbookVersion: string;
  aiNamespace: string;
  entryPrerequisiteKeys: string[];
  handoffTargetStrandKey?: string;
  groups: SlCompetencyGroupSpec[];
  skillsPerCompetency?: number;
}

export interface SlGeneratedLibrary {
  libraryKey: string;
  documentRef: string;
  conceptKey: string;
  strandKey: string;
  keyPrefix: string;
  competencyCount: number;
  competencies: UlrCompetencyDefinition[];
  atomicSkills: UlrAtomicSkillDefinition[];
  relationships: UlrRelationship[];
}

function competencyKey(prefix: string, seq: number): string {
  return `AW-SL-${prefix}-${String(seq).padStart(3, "0")}-v1.0.0`;
}

function skillKey(compKey: string, skillNum: number): string {
  const base = compKey.replace(/-v[\d.]+$/, "");
  return `${base}-AS-${String(skillNum).padStart(3, "0")}-v1.0.0`;
}

export function buildSlAiMetadata(
  namespace: string,
  overrides?: { masteryMin?: number; capstone?: boolean }
): UlrAiMetadata {
  return {
    recommendation_rule_keys: [
      `sl.aic.${namespace}.strategy`,
      `sl.aic.${namespace}.assess`,
      `sl.aic.${namespace}.intervention`,
    ],
    confidence_thresholds: {
      recommendation_surface_min: 0.6,
      recommendation_prominent_min: 0.8,
      mastery_suggestion_min: overrides?.masteryMin ?? 0.75,
      parent_coach_min: 0.7,
      auto_action_ceiling: 0,
    },
    human_review_triggers: overrides?.capstone
      ? ["hr.mastery_validation", "hr.cross_domain_unlock"]
      : ["hr.mastery_validation", "hr.tier2_intervention"],
    parent_coaching_rules: [`sl.aic.${namespace}.parent`],
    scheduling_preferences: {
      min_duration_minutes: 10,
      max_duration_minutes: 15,
      optimal_frequency_per_week: overrides?.capstone ? 1 : 4,
      virtual_eligible: true,
      requires_certified_teacher: false,
      review_ratio_new_to_cumulative: "70:30",
      group_size_min: 2,
      group_size_max: 6,
    },
    version: "1.0.0",
  };
}

export function buildSlLibrary(spec: SlLibrarySpec): SlGeneratedLibrary {
  const competencies: UlrCompetencyDefinition[] = [];
  const atomicSkills: UlrAtomicSkillDefinition[] = [];
  const keysInOrder: string[] = [];
  let seq = 0;
  const skillsPerComp = spec.skillsPerCompetency ?? 3;

  for (const group of spec.groups) {
    for (const item of group.competencies) {
      seq += 1;
      const key = competencyKey(spec.keyPrefix, seq);
      keysInOrder.push(key);

      const prerequisiteCompetencyKeys: string[] = [];
      if (seq === 1) {
        prerequisiteCompetencyKeys.push(...spec.entryPrerequisiteKeys);
      } else {
        prerequisiteCompetencyKeys.push(keysInOrder[seq - 2]!);
      }

      const nextCompetencyKeys =
        seq < countCompetencies(spec) ? [competencyKey(spec.keyPrefix, seq + 1)] : [];

      const isCapstone =
        !!spec.handoffTargetStrandKey && seq === countCompetencies(spec);

      const crossDomainLinks: UlrCompetencyDefinition["crossDomainLinks"] = [];
      if (isCapstone && spec.handoffTargetStrandKey) {
        crossDomainLinks.push({
          targetKey: spec.handoffTargetStrandKey,
          linkType: "cross_domain",
          rationale: `${spec.libraryKey} capstone handoff`,
        });
      }

      competencies.push({
        competencyKey: key,
        version: "1.0.0",
        status: "published",
        learningDomainKey: SL_DOMAIN_KEY,
        strandKey: spec.strandKey,
        subStrandKey: group.subStrandKey,
        title: item.title,
        titleEducator: item.titleEducator,
        description: item.description,
        purpose: `Develop ${item.title.toLowerCase()} within ${spec.conceptKey}.`,
        whyItMatters: item.description,
        developmentalNotes:
          "Mastery-based progression — placement uses evidence, not age (Doc 6, Doc 45).",
        prerequisiteCompetencyKeys,
        prerequisiteSkillKeys: [],
        relatedCompetencyKeys: [],
        nextCompetencyKeys,
        crossDomainLinks,
        evidenceTypes: [
          "observation.instructional",
          "observation.checklist",
          "measurement.progress",
        ],
        minimumEvidenceCount: isCapstone ? 3 : 2,
        assessmentMethods: [
          `assess.sl.probe.${spec.aiNamespace}`,
          "assess.sl.observation",
        ],
        instructionalStrategies: [
          "instr.explicit",
          "instr.modeling",
          "instr.multisensory",
        ],
        interventionStrategies: [
          "intervention.tier1_boost",
          "intervention.micro.reteach",
          ...(isCapstone ? ["intervention.tier2_plan"] : []),
        ],
        parentActivities: [`${spec.aiNamespace}.parent.reinforce`],
        portfolioEligible: true,
        transcriptEligible: false,
        aiMetadata: buildSlAiMetadata(spec.aiNamespace, {
          masteryMin: isCapstone ? 0.8 : 0.75,
          capstone: isCapstone,
        }),
        decisionEngineReferences: isCapstone
          ? ["ref_platform_escalation_priority"]
          : ["ref_platform_risk_signal"],
        ruleSetKeys: ["ref_student_placement"],
        metadata: {
          libraryKey: spec.libraryKey,
          documentRef: spec.documentRef,
          conceptKeys: [spec.conceptKey],
          competencyGroupKey: group.groupKey,
          executiveFunctionDemand: spec.keyPrefix === "PM" ? "high" : "moderate",
          schedulingRuleKeys: [
            `sl.schedule.${spec.aiNamespace}.daily_burst`,
            `sl.schedule.${spec.aiNamespace}.review_cluster`,
          ],
          playbookTemplateVersion: spec.playbookVersion,
          graduationReadinessDomainKeys: ["readiness.academic.literacy"],
          wilsonCrosswalk: { sessionLinkOnly: true, proprietaryContent: false },
          fidelityIndicatorKeys: ["sl.fidelity.explicit", "sl.fidelity.cumulative"],
          successCriteria: [
            `Demonstrates ${item.title.toLowerCase()} on ≥ 4/5 trials across two sessions`,
          ],
          futureAtomicSkillRefs: Array.from({ length: skillsPerComp }, (_, i) =>
            skillKey(key, i + 1)
          ),
        },
      });

      for (let s = 1; s <= skillsPerComp; s += 1) {
        const sk = skillKey(key, s);
        atomicSkills.push({
          skillKey: sk,
          competencyKey: key,
          learningDomainKey: SL_DOMAIN_KEY,
          strandKey: spec.strandKey,
          subStrandKey: group.subStrandKey,
          title: `${item.title} — Skill ${s}`,
          description: `Atomic skill placeholder for ${item.title} (${spec.documentRef})`,
          version: "1.0.0",
          status: "draft",
          prerequisites: [],
          relatedSkills: [],
          nextSkills: [],
          crossDomainLinks: [],
          difficulty: "foundational",
          masteryCriteria: "≥ 4/5 trials per Doc 51 probe threshold (placeholder)",
          evidenceTypes: ["observation.instructional", "measurement.progress"],
          minimumEvidenceCount: 2,
          assessmentMethods: [`assess.sl.probe.${spec.aiNamespace}`],
          aiMetadata: buildSlAiMetadata(spec.aiNamespace),
          portfolioEligible: false,
          transcriptEligible: false,
          metadata: {
            placeholder: true,
            documentRef: spec.documentRef,
            libraryKey: spec.libraryKey,
          },
        });
      }
    }
  }

  return {
    libraryKey: spec.libraryKey,
    documentRef: spec.documentRef,
    conceptKey: spec.conceptKey,
    strandKey: spec.strandKey,
    keyPrefix: spec.keyPrefix,
    competencyCount: competencies.length,
    competencies,
    atomicSkills,
    relationships: buildSlRelationships(competencies),
  };
}

function countCompetencies(spec: SlLibrarySpec): number {
  return spec.groups.reduce((n, g) => n + g.competencies.length, 0);
}

function pushUnique(relationships: UlrRelationship[], rel: UlrRelationship): void {
  if (
    relationships.some(
      (r) =>
        r.relationshipType === rel.relationshipType &&
        r.sourceKey === rel.sourceKey &&
        r.targetKey === rel.targetKey
    )
  ) {
    return;
  }
  relationships.push(rel);
}

export function buildSlRelationships(
  competencies: UlrCompetencyDefinition[]
): UlrRelationship[] {
  const relationships: UlrRelationship[] = [];

  for (const competency of competencies) {
    for (const prereq of competency.prerequisiteCompetencyKeys) {
      pushUnique(relationships, {
        relationshipType: "prerequisite",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: prereq,
        targetKind: "competency",
        weight: 1,
      });
    }
    for (const next of competency.nextCompetencyKeys) {
      pushUnique(relationships, {
        relationshipType: "next_in_sequence",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: next,
        targetKind: "competency",
        weight: 1,
      });
    }
    for (const link of competency.crossDomainLinks) {
      pushUnique(relationships, {
        relationshipType: "cross_domain",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: link.targetKey,
        targetKind: link.targetKey.startsWith("domain.") ? "strand" : "competency",
        weight: 1,
        metadata: { linkType: link.linkType, rationale: link.rationale },
      });
    }
    for (const evidenceType of competency.evidenceTypes) {
      pushUnique(relationships, {
        relationshipType: "evidence",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: evidenceType,
        targetKind: "evidence_type",
        weight: 1,
      });
    }
    for (const method of competency.assessmentMethods) {
      pushUnique(relationships, {
        relationshipType: "assessment",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: method,
        targetKind: "assessment_method",
        weight: 1,
      });
    }
    for (const parentActivity of competency.parentActivities) {
      pushUnique(relationships, {
        relationshipType: "parent_support",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: parentActivity,
        targetKind: "resource",
        weight: 1,
      });
    }
    for (const strategy of competency.instructionalStrategies) {
      pushUnique(relationships, {
        relationshipType: "teacher_guidance",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: strategy,
        targetKind: "resource",
        weight: 1,
        metadata: { guidanceType: "instructional" },
      });
    }
    for (const intervention of competency.interventionStrategies) {
      pushUnique(relationships, {
        relationshipType: "teacher_guidance",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: intervention,
        targetKind: "resource",
        weight: 1,
        metadata: { guidanceType: "intervention" },
      });
    }
    for (const ruleKey of competency.aiMetadata.recommendation_rule_keys ?? []) {
      pushUnique(relationships, {
        relationshipType: "ai_rule",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: ruleKey,
        targetKind: "rule_set",
        weight: 1,
      });
    }
    const schedulingKeys =
      (competency.metadata?.schedulingRuleKeys as string[] | undefined) ?? [];
    for (const schedKey of schedulingKeys) {
      pushUnique(relationships, {
        relationshipType: "ai_rule",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: schedKey,
        targetKind: "rule_set",
        weight: 1,
        metadata: { relationshipSubtype: "scheduling" },
      });
    }
    for (const ruleSet of competency.ruleSetKeys) {
      pushUnique(relationships, {
        relationshipType: "ai_rule",
        sourceKey: competency.competencyKey,
        sourceKind: "competency",
        targetKey: ruleSet,
        targetKind: "rule_set",
        weight: 1,
        metadata: { relationshipSubtype: "decision" },
      });
    }
  }

  return relationships;
}

export function mergeSlLibraries(libraries: SlGeneratedLibrary[]): {
  competencies: UlrCompetencyDefinition[];
  atomicSkills: UlrAtomicSkillDefinition[];
  relationships: UlrRelationship[];
} {
  const competencies: UlrCompetencyDefinition[] = [];
  const atomicSkills: UlrAtomicSkillDefinition[] = [];
  const relationships: UlrRelationship[] = [];

  for (const lib of libraries) {
    competencies.push(...lib.competencies);
    atomicSkills.push(...lib.atomicSkills);
    relationships.push(...lib.relationships);
  }

  return { competencies, atomicSkills, relationships };
}

/** Build three competencies for a concept-library stage group. */
export function stageGroup(
  groupKey: string,
  subStrandKey: string,
  stageTitle: string,
  tasks: [string, string, string]
): SlCompetencyGroupSpec {
  return {
    groupKey,
    subStrandKey,
    competencies: tasks.map((task) => ({
      title: `${stageTitle} — ${task}`,
      description: `The learner ${task.charAt(0).toLowerCase()}${task.slice(1)} as part of ${stageTitle.toLowerCase()} instruction (${groupKey}).`,
    })),
  };
}
