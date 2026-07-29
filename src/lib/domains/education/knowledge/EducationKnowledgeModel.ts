/**
 * Canonical Education Knowledge Model — aggregated catalogs.
 * Contains NO execution logic.
 */

import {
  EDUCATION_CAPABILITY_CATALOG,
  type EducationCapabilityDefinition,
} from "./EducationCapabilityCatalog";
import {
  EDUCATION_CLASSIFICATION_CATALOG,
  type EducationClassificationScheme,
} from "./EducationClassification";
import {
  EDUCATION_ENTITY_CATALOG,
  type EducationEntityDefinition,
} from "./EducationEntityCatalog";
import {
  EDUCATION_POLICY_CATALOG,
  type EducationPolicyDefinition,
} from "./EducationPolicyCatalog";
import {
  EDUCATION_RELATIONSHIP_CATALOG,
  type EducationRelationshipDefinition,
} from "./EducationRelationshipCatalog";
import {
  EDUCATION_VOCABULARY,
  type EducationVocabularyTerm,
} from "./EducationVocabulary";
import {
  validateEducationKnowledgeModel,
  type EducationKnowledgeValidationResult,
} from "./EducationKnowledgeValidator";

export const EDUCATION_KNOWLEDGE_MODEL_VERSION = "1.0.0" as const;

export interface EducationKnowledgeModel {
  domainId: "education";
  version: string;
  vocabulary: readonly EducationVocabularyTerm[];
  entities: readonly EducationEntityDefinition[];
  relationships: readonly EducationRelationshipDefinition[];
  classifications: readonly EducationClassificationScheme[];
  policies: readonly EducationPolicyDefinition[];
  capabilities: readonly EducationCapabilityDefinition[];
}

/** Default canonical Education knowledge model. */
export const EDUCATION_KNOWLEDGE_MODEL: EducationKnowledgeModel = {
  domainId: "education",
  version: EDUCATION_KNOWLEDGE_MODEL_VERSION,
  vocabulary: EDUCATION_VOCABULARY,
  entities: EDUCATION_ENTITY_CATALOG,
  relationships: EDUCATION_RELATIONSHIP_CATALOG,
  classifications: EDUCATION_CLASSIFICATION_CATALOG,
  policies: EDUCATION_POLICY_CATALOG,
  capabilities: EDUCATION_CAPABILITY_CATALOG,
};

export function createEducationKnowledgeModel(
  overrides?: Partial<EducationKnowledgeModel>
): EducationKnowledgeModel {
  return {
    domainId: "education",
    version: overrides?.version ?? EDUCATION_KNOWLEDGE_MODEL_VERSION,
    vocabulary: overrides?.vocabulary ?? EDUCATION_VOCABULARY,
    entities: overrides?.entities ?? EDUCATION_ENTITY_CATALOG,
    relationships: overrides?.relationships ?? EDUCATION_RELATIONSHIP_CATALOG,
    classifications:
      overrides?.classifications ?? EDUCATION_CLASSIFICATION_CATALOG,
    policies: overrides?.policies ?? EDUCATION_POLICY_CATALOG,
    capabilities: overrides?.capabilities ?? EDUCATION_CAPABILITY_CATALOG,
  };
}

export function getEducationKnowledgeModel(): EducationKnowledgeModel {
  return EDUCATION_KNOWLEDGE_MODEL;
}

/** Validate the default (or provided) knowledge model. */
export function validateDefaultEducationKnowledgeModel(): EducationKnowledgeValidationResult {
  return validateEducationKnowledgeModel(EDUCATION_KNOWLEDGE_MODEL);
}
