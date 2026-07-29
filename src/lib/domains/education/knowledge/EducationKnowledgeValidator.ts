/**
 * Validate Education knowledge catalogs — structural integrity only.
 * No policy evaluation or business logic.
 */

import { EDUCATION_CAPABILITY_CATALOG } from "./EducationCapabilityCatalog";
import { EDUCATION_CLASSIFICATION_CATALOG } from "./EducationClassification";
import { EDUCATION_ENTITY_CATALOG } from "./EducationEntityCatalog";
import { EDUCATION_POLICY_CATALOG } from "./EducationPolicyCatalog";
import { EDUCATION_RELATIONSHIP_CATALOG } from "./EducationRelationshipCatalog";
import { EDUCATION_VOCABULARY } from "./EducationVocabulary";
import type { EducationKnowledgeModel } from "./EducationKnowledgeModel";

export type EducationKnowledgeIssueSeverity = "error" | "warning";

export interface EducationKnowledgeValidationIssue {
  code: string;
  message: string;
  severity: EducationKnowledgeIssueSeverity;
  id?: string;
}

export interface EducationKnowledgeValidationResult {
  ok: boolean;
  errors: readonly EducationKnowledgeValidationIssue[];
  warnings: readonly EducationKnowledgeValidationIssue[];
}

export function validateEducationKnowledgeModel(
  model?: EducationKnowledgeModel
): EducationKnowledgeValidationResult {
  const entities = model?.entities ?? EDUCATION_ENTITY_CATALOG;
  const relationships = model?.relationships ?? EDUCATION_RELATIONSHIP_CATALOG;
  const policies = model?.policies ?? EDUCATION_POLICY_CATALOG;
  const classifications =
    model?.classifications ?? EDUCATION_CLASSIFICATION_CATALOG;
  const vocabulary = model?.vocabulary ?? EDUCATION_VOCABULARY;
  const capabilities = model?.capabilities ?? EDUCATION_CAPABILITY_CATALOG;

  const errors: EducationKnowledgeValidationIssue[] = [];
  const warnings: EducationKnowledgeValidationIssue[] = [];

  // Unique identifiers across catalogs
  assertUnique(
    vocabulary.map((v) => v.id),
    "VOCABULARY_DUPLICATE_ID",
    "Duplicate vocabulary id",
    errors
  );
  assertUnique(
    entities.map((e) => e.id),
    "ENTITY_DUPLICATE_ID",
    "Duplicate entity id",
    errors
  );
  assertUnique(
    relationships.map((r) => r.id),
    "RELATIONSHIP_DUPLICATE_ID",
    "Duplicate relationship id",
    errors
  );
  assertUnique(
    policies.map((p) => p.id),
    "POLICY_DUPLICATE_ID",
    "Duplicate policy id",
    errors
  );
  assertUnique(
    classifications.map((c) => c.id),
    "CLASSIFICATION_DUPLICATE_ID",
    "Duplicate classification scheme id",
    errors
  );
  assertUnique(
    capabilities.map((c) => c.id),
    "CAPABILITY_DUPLICATE_ID",
    "Duplicate capability id",
    errors
  );

  // Vocabulary preferred-term uniqueness (case-insensitive)
  const termKeys = vocabulary.map((v) => v.term.toLowerCase());
  assertUnique(
    termKeys,
    "VOCABULARY_DUPLICATE_TERM",
    "Duplicate vocabulary preferred term",
    errors
  );

  const vocabIds = new Set(vocabulary.map((v) => v.id));
  const entityIds = new Set(entities.map((e) => e.id));
  const policyIds = new Set(policies.map((p) => p.id));
  const classificationIds = new Set(classifications.map((c) => c.id));

  // Entity → vocabulary consistency
  for (const entity of entities) {
    if (!vocabIds.has(entity.vocabularyId)) {
      errors.push({
        code: "ENTITY_VOCABULARY_MISSING",
        message: `Entity ${entity.id} references missing vocabulary ${entity.vocabularyId}`,
        severity: "error",
        id: entity.id,
      });
    }
  }

  // Relationship endpoint integrity
  for (const rel of relationships) {
    if (!entityIds.has(rel.fromEntityId)) {
      errors.push({
        code: "RELATIONSHIP_FROM_UNKNOWN",
        message: `Relationship ${rel.id} fromEntityId unknown: ${rel.fromEntityId}`,
        severity: "error",
        id: rel.id,
      });
    }
    if (!entityIds.has(rel.toEntityId)) {
      errors.push({
        code: "RELATIONSHIP_TO_UNKNOWN",
        message: `Relationship ${rel.id} toEntityId unknown: ${rel.toEntityId}`,
        severity: "error",
        id: rel.id,
      });
    }
  }

  // Classification value integrity
  for (const scheme of classifications) {
    assertUnique(
      scheme.values.map((v) => v.id),
      "CLASSIFICATION_VALUE_DUPLICATE_ID",
      `Duplicate value id in ${scheme.id}`,
      errors
    );
    assertUnique(
      scheme.values.map((v) => v.code.toLowerCase()),
      "CLASSIFICATION_VALUE_DUPLICATE_CODE",
      `Duplicate value code in ${scheme.id}`,
      errors
    );
    if (scheme.values.length === 0) {
      warnings.push({
        code: "CLASSIFICATION_EMPTY",
        message: `Classification scheme ${scheme.id} has no values`,
        severity: "warning",
        id: scheme.id,
      });
    }
  }

  // Policy related refs
  for (const policy of policies) {
    for (const entityId of policy.relatedEntityIds ?? []) {
      if (!entityIds.has(entityId)) {
        errors.push({
          code: "POLICY_ENTITY_UNKNOWN",
          message: `Policy ${policy.id} relatedEntityIds unknown: ${entityId}`,
          severity: "error",
          id: policy.id,
        });
      }
    }
    for (const classId of policy.relatedClassificationIds ?? []) {
      if (!classificationIds.has(classId)) {
        errors.push({
          code: "POLICY_CLASSIFICATION_UNKNOWN",
          message: `Policy ${policy.id} relatedClassificationIds unknown: ${classId}`,
          severity: "error",
          id: policy.id,
        });
      }
    }
    if (policy.parameters.length === 0) {
      warnings.push({
        code: "POLICY_NO_PARAMETERS",
        message: `Policy ${policy.id} declares no parameters`,
        severity: "warning",
        id: policy.id,
      });
    }
  }

  // Capability related refs
  for (const capability of capabilities) {
    for (const entityId of capability.relatedEntityIds ?? []) {
      if (!entityIds.has(entityId)) {
        errors.push({
          code: "CAPABILITY_ENTITY_UNKNOWN",
          message: `Capability ${capability.id} relatedEntityIds unknown: ${entityId}`,
          severity: "error",
          id: capability.id,
        });
      }
    }
    for (const policyId of capability.relatedPolicyIds ?? []) {
      if (!policyIds.has(policyId)) {
        errors.push({
          code: "CAPABILITY_POLICY_UNKNOWN",
          message: `Capability ${capability.id} relatedPolicyIds unknown: ${policyId}`,
          severity: "error",
          id: capability.id,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function assertUnique(
  ids: readonly string[],
  code: string,
  label: string,
  errors: EducationKnowledgeValidationIssue[]
): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      errors.push({
        code,
        message: `${label}: ${id}`,
        severity: "error",
        id,
      });
    } else {
      seen.add(id);
    }
  }
}
