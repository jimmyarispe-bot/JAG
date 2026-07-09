import type { UlrAiMetadata, UlrCompetencyDefinition } from "@/lib/platform/ulr/types";

/** Document 98 Part II — library-wide shared parameters. */
export const PA_LIBRARY_KEY = "competency_library.foundational_phonological_awareness";
export const PA_STRAND_KEY = "domain.structured_literacy.strand.phonological_awareness";
export const PA_DOMAIN_KEY = "domain.structured_literacy";
export const PA_PLAYBOOK_VERSION = "playbook.sl.pa.v1.0.0";

export const PA_SHARED_RESEARCH_SOURCES = [
  "research.sl.pa.nrp2000",
  "research.sl.pa.og_principles",
  "research.sl.pa.meta_analytic",
  "research.sl.pa.dyslexia",
  "research.sl.pa.multilingual",
  "research.sl.pa.working_memory",
];

export function buildPaAiMetadata(overrides?: {
  ruleKeys?: string[];
  masteryMin?: number;
  humanReviewTriggers?: string[];
  sessionType?: string;
}): UlrAiMetadata {
  return {
    recommendation_rule_keys: overrides?.ruleKeys ?? [
      "sl.aic.pa.strategy",
      "sl.aic.pa.assess",
      "sl.aic.pa.intervention",
    ],
    confidence_thresholds: {
      recommendation_surface_min: 0.6,
      recommendation_prominent_min: 0.8,
      mastery_suggestion_min: overrides?.masteryMin ?? 0.75,
      parent_coach_min: 0.7,
      auto_action_ceiling: 0,
    },
    human_review_triggers: overrides?.humanReviewTriggers ?? [
      "hr.mastery_validation",
      "hr.tier2_intervention",
    ],
    parent_coaching_rules: ["sl.aic.pa.parent"],
    scheduling_preferences: {
      min_duration_minutes: 10,
      max_duration_minutes: 15,
      optimal_frequency_per_week: overrides?.sessionType === "capstone_validation" ? 1 : 4,
      virtual_eligible: true,
      requires_certified_teacher: false,
      session_type: overrides?.sessionType ?? "oral_pa_burst",
      review_ratio_new_to_cumulative: "70:30",
      group_size_min: 2,
      group_size_max: 6,
    },
    version: "1.0.0",
  };
}

export function defaultPaDecisionRefs(): string[] {
  return ["ref_platform_risk_signal"];
}

export function defaultPaRuleSetKeys(): string[] {
  return ["ref_student_placement"];
}

export type Doc98CompetencyImport = {
  competencyKey: string;
  title: string;
  titleEducator?: string;
  description: string;
  purpose: string;
  whyItMatters: string;
  developmentalNotes: string;
  competencyGroupKey: string;
  subStrandKey: string;
  conceptKeys: string[];
  prerequisiteCompetencyKeys: string[];
  prerequisiteRationale?: string;
  nextCompetencyKeys: string[];
  evidenceTypes: string[];
  assessmentMethods: string[];
  minimumEvidenceCount: number;
  instructionalStrategies: string[];
  interventionStrategies: string[];
  parentActivities: string[];
  aiCoachingRuleKeys: string[];
  schedulingRuleKeys: string[];
  cumulativeReviewKeys: string[];
  executiveFunctionDemand: string;
  portfolioEligible: boolean;
  transcriptEligible: boolean;
  futureAtomicSkillRefs: Array<{ key: string; title: string }>;
  successCriteria: string[];
};

export function buildPaCompetencyFromImport(record: Doc98CompetencyImport): UlrCompetencyDefinition {
  const isCapstone = record.competencyKey === "AW-SL-PA-024-v1.0.0";

  const crossDomainLinks: UlrCompetencyDefinition["crossDomainLinks"] = [];
  if (isCapstone) {
    crossDomainLinks.push({
      targetKey: "domain.structured_literacy.strand.phonemic_awareness",
      linkType: "cross_domain",
      rationale: "PA capstone handoff to Phonemic Awareness Competency Library (CLIB-PA-6)",
    });
  }

  return {
    competencyKey: record.competencyKey,
    version: "1.0.0",
    status: "published",
    learningDomainKey: PA_DOMAIN_KEY,
    strandKey: PA_STRAND_KEY,
    subStrandKey: record.subStrandKey,
    title: record.title,
    titleEducator: record.titleEducator,
    description: record.description,
    purpose: record.purpose,
    whyItMatters: record.whyItMatters,
    developmentalNotes:
      record.developmentalNotes ||
      "Mastery-based progression — placement uses evidence, not age (Doc 98 PA-SEQ-8).",
    prerequisiteCompetencyKeys: record.prerequisiteCompetencyKeys,
    prerequisiteSkillKeys: [],
    prerequisiteRationale: record.prerequisiteRationale,
    relatedCompetencyKeys: [],
    nextCompetencyKeys: record.nextCompetencyKeys,
    crossDomainLinks,
    evidenceTypes: record.evidenceTypes.length
      ? record.evidenceTypes
      : ["observation.instructional", "measurement.progress"],
    minimumEvidenceCount: record.minimumEvidenceCount,
    assessmentMethods: record.assessmentMethods.length
      ? record.assessmentMethods
      : ["assess.sl.probe.pa", "assess.sl.observation"],
    instructionalStrategies: record.instructionalStrategies.length
      ? record.instructionalStrategies
      : ["instr.explicit", "instr.modeling", "instr.multisensory"],
    interventionStrategies: record.interventionStrategies.length
      ? record.interventionStrategies
      : ["intervention.tier1_boost", "intervention.micro.reteach"],
    parentActivities: record.parentActivities,
    portfolioEligible: record.portfolioEligible,
    transcriptEligible: record.transcriptEligible,
    aiMetadata: buildPaAiMetadata({
      ruleKeys: record.aiCoachingRuleKeys,
      masteryMin: isCapstone ? 0.8 : 0.75,
      humanReviewTriggers: isCapstone
        ? ["hr.mastery_validation", "hr.cross_domain_unlock"]
        : undefined,
      sessionType: isCapstone ? "capstone_validation" : undefined,
    }),
    decisionEngineReferences: isCapstone
      ? ["ref_platform_escalation_priority"]
      : defaultPaDecisionRefs(),
    ruleSetKeys: defaultPaRuleSetKeys(),
    metadata: {
      libraryKey: PA_LIBRARY_KEY,
      documentRef: "DOCUMENT-98",
      conceptKeys: record.conceptKeys.length
        ? record.conceptKeys
        : ["SL-CONCEPT-PHONOLOGICAL_AWARENESS"],
      competencyGroupKey: record.competencyGroupKey,
      successCriteria: record.successCriteria,
      executiveFunctionDemand: record.executiveFunctionDemand,
      schedulingRuleKeys: record.schedulingRuleKeys,
      cumulativeReviewKeys: record.cumulativeReviewKeys,
      futureAtomicSkillRefs: record.futureAtomicSkillRefs.map((s) => s.key),
      researchSources: PA_SHARED_RESEARCH_SOURCES,
      playbookTemplateVersion: PA_PLAYBOOK_VERSION,
      graduationReadinessDomainKeys: ["readiness.academic.literacy"],
      graduationWeight: isCapstone ? 0.05 : 0.02,
      wilsonCrosswalk: { sessionLinkOnly: true, proprietaryContent: false },
      fidelityIndicatorKeys: ["sl.fidelity.explicit", "sl.fidelity.cumulative"],
      dosageMinutesWeek: { min: 40, max: 75 },
      groupSizeMin: 2,
      evidenceBundleRules: "Doc 51 §52 — ≥2 types; ≥1 educator-sourced; confidence ≥0.75",
    },
  };
}
