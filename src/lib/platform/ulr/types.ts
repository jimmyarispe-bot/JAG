/** Universal Learning Registry (ULR) — Wave 2 foundation types (Doc 12, 25, 47) */

export const ULR_DOMAIN_STATUSES = ["draft", "published", "deprecated", "archived"] as const;
export type UlrDomainStatus = (typeof ULR_DOMAIN_STATUSES)[number];

export const ULR_COMPETENCY_STATUSES = [
  "draft",
  "in_review",
  "published",
  "deprecated",
  "archived",
] as const;
export type UlrCompetencyStatus = (typeof ULR_COMPETENCY_STATUSES)[number];

export const ULR_SKILL_STATUSES = ["draft", "published", "deprecated", "archived"] as const;
export type UlrSkillStatus = (typeof ULR_SKILL_STATUSES)[number];

export const ULR_REGISTRY_KINDS = [
  "domain",
  "strand",
  "sub_strand",
  "competency",
  "skill",
  "evidence_type",
  "assessment_method",
  "resource",
  "rule_set",
  "decision_type",
] as const;
export type UlrRegistryKind = (typeof ULR_REGISTRY_KINDS)[number];

export const ULR_RELATIONSHIP_TYPES = [
  "prerequisite",
  "next_in_sequence",
  "related",
  "cross_domain",
  "assessment",
  "evidence",
  "resource",
  "parent_support",
  "teacher_guidance",
  "ai_rule",
] as const;
export type UlrRelationshipType = (typeof ULR_RELATIONSHIP_TYPES)[number];

export const ULR_PRODUCTION_DOMAIN_KEYS = [
  "domain.structured_literacy",
  "domain.real_life_math",
  "domain.litlab",
  "domain.earthology",
  "domain.life_lab",
  "domain.ai_venture_lab",
] as const;
export type UlrProductionDomainKey = (typeof ULR_PRODUCTION_DOMAIN_KEYS)[number];

export interface UlrAiMetadata {
  recommendation_rule_keys?: string[];
  confidence_thresholds?: Record<string, number>;
  human_review_triggers?: string[];
  parent_coaching_rules?: string[];
  scheduling_preferences?: Record<string, unknown>;
  version?: string;
}

export interface UlrLearningDomain {
  domainKey: string;
  domainCode: string;
  title: string;
  description: string;
  version: string;
  status: UlrDomainStatus;
  sortOrder: number;
  metadata?: Record<string, unknown>;
}

export interface UlrStrand {
  strandKey: string;
  domainKey: string;
  title: string;
  description: string;
  version: string;
  status: UlrDomainStatus;
  sortOrder: number;
  metadata?: Record<string, unknown>;
}

export interface UlrSubStrand {
  subStrandKey: string;
  strandKey: string;
  domainKey: string;
  title: string;
  description: string;
  version: string;
  status: UlrDomainStatus;
  sortOrder: number;
  metadata?: Record<string, unknown>;
}

export interface UlrCompetencyDefinition {
  competencyKey: string;
  version: string;
  status: UlrCompetencyStatus;
  learningDomainKey: string;
  strandKey: string;
  subStrandKey: string;
  title: string;
  titleEducator?: string;
  description: string;
  purpose: string;
  whyItMatters: string;
  developmentalNotes: string;
  prerequisiteCompetencyKeys: string[];
  prerequisiteSkillKeys: string[];
  prerequisiteRationale?: string;
  relatedCompetencyKeys: string[];
  nextCompetencyKeys: string[];
  crossDomainLinks: Array<{ targetKey: string; linkType: string; rationale?: string }>;
  evidenceTypes: string[];
  minimumEvidenceCount: number;
  assessmentMethods: string[];
  instructionalStrategies: string[];
  interventionStrategies: string[];
  parentActivities: string[];
  portfolioEligible: boolean;
  transcriptEligible: boolean;
  aiMetadata: UlrAiMetadata;
  decisionEngineReferences: string[];
  ruleSetKeys: string[];
  metadata?: Record<string, unknown>;
}

export interface UlrAtomicSkillDefinition {
  skillKey: string;
  competencyKey: string;
  learningDomainKey: string;
  strandKey: string;
  subStrandKey: string;
  title: string;
  description: string;
  version: string;
  status: UlrSkillStatus;
  prerequisites: string[];
  relatedSkills: string[];
  nextSkills: string[];
  crossDomainLinks: Array<{ skillId: string; linkType: string; rationale?: string }>;
  difficulty: "foundational" | "developing" | "proficient" | "advanced";
  masteryCriteria: string;
  evidenceTypes: string[];
  minimumEvidenceCount: number;
  assessmentMethods: string[];
  aiMetadata: UlrAiMetadata;
  portfolioEligible: boolean;
  transcriptEligible: boolean;
  metadata?: Record<string, unknown>;
}

export interface UlrRelationship {
  relationshipType: UlrRelationshipType;
  sourceKey: string;
  sourceKind: UlrRegistryKind;
  targetKey: string;
  targetKind: UlrRegistryKind;
  weight?: number;
  metadata?: Record<string, unknown>;
}

export interface UlrRegistrySnapshot {
  domains: UlrLearningDomain[];
  strands: UlrStrand[];
  subStrands: UlrSubStrand[];
  competencies: UlrCompetencyDefinition[];
  atomicSkills: UlrAtomicSkillDefinition[];
  relationships: UlrRelationship[];
  registeredAt: string;
}

export interface UlrHierarchyNode {
  key: string;
  kind: UlrRegistryKind;
  title: string;
  status: string;
  children?: UlrHierarchyNode[];
}

export interface ValidateUlrKeysInput {
  competencyKeys?: string[];
  skillKeys?: string[];
}

export interface ValidateUlrKeysResult {
  ok: boolean;
  unknownCompetencyKeys: string[];
  unknownSkillKeys: string[];
}
