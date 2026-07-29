/**
 * Validate Capability Pack registry integrity.
 * Structural checks only — does not execute intelligence.
 */

import { EDUCATION_CAPABILITY_CATALOG } from "../knowledge";
import { EDUCATION_POLICY_CATALOG } from "../knowledge";
import { EDUCATION_CONTRIBUTOR_IDS } from "../types";
import type { EducationCapabilityPackMetadata } from "./EducationCapabilityMetadata";

export type EducationCapabilityValidationSeverity = "error" | "warning";

export interface EducationCapabilityValidationIssue {
  code: string;
  message: string;
  severity: EducationCapabilityValidationSeverity;
  packId?: string;
  ref?: string;
}

export interface EducationCapabilityValidationResult {
  ok: boolean;
  errors: readonly EducationCapabilityValidationIssue[];
  warnings: readonly EducationCapabilityValidationIssue[];
}

const KNOWN_CONTRIBUTOR_IDS = new Set<string>(
  Object.values(EDUCATION_CONTRIBUTOR_IDS)
);

const KNOWN_KNOWLEDGE_IDS = new Set(
  EDUCATION_CAPABILITY_CATALOG.map((c) => c.id)
);

const KNOWN_POLICY_IDS = new Set(EDUCATION_POLICY_CATALOG.map((p) => p.id));

const VERSION_PATTERN = /^\d+\.\d+\.\d+(-[A-Za-z0-9.-]+)?$/;

export function validateEducationCapabilityPacks(
  packs: readonly EducationCapabilityPackMetadata[]
): EducationCapabilityValidationResult {
  const errors: EducationCapabilityValidationIssue[] = [];
  const warnings: EducationCapabilityValidationIssue[] = [];

  assertUniquePackIds(packs, errors);

  const packIds = new Set(packs.map((p) => p.id));

  for (const pack of packs) {
    validatePackShape(pack, errors, warnings);
    validateContributors(pack, errors, warnings);
    validateDocumentation(pack, errors, warnings);
    validateDependencies(pack, packIds, errors);
    validateKnowledgeExtensions(pack, warnings);
    validatePolicyExtensions(pack, warnings);
    validateVersion(pack, errors, warnings);
  }

  // Cross-pack: dependency packs should not form cycles (simple check)
  detectDependencyCycles(packs, errors);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function assertUniquePackIds(
  packs: readonly EducationCapabilityPackMetadata[],
  errors: EducationCapabilityValidationIssue[]
): void {
  const seen = new Map<string, number>();
  for (const pack of packs) {
    const count = (seen.get(pack.id) ?? 0) + 1;
    seen.set(pack.id, count);
    if (count === 2) {
      errors.push({
        code: "DUPLICATE_PACK_ID",
        message: `Duplicate capability pack id: ${pack.id}`,
        severity: "error",
        packId: pack.id,
      });
    }
  }
}

function validatePackShape(
  pack: EducationCapabilityPackMetadata,
  errors: EducationCapabilityValidationIssue[],
  warnings: EducationCapabilityValidationIssue[]
): void {
  if (!pack.id?.trim()) {
    errors.push({
      code: "MISSING_PACK_ID",
      message: "Capability pack is missing id",
      severity: "error",
    });
  }
  if (!pack.name?.trim()) {
    errors.push({
      code: "MISSING_PACK_NAME",
      message: `Capability pack ${pack.id} is missing name`,
      severity: "error",
      packId: pack.id,
    });
  }
  if (!pack.description?.trim()) {
    warnings.push({
      code: "MISSING_DESCRIPTION",
      message: `Capability pack ${pack.id} has empty description`,
      severity: "warning",
      packId: pack.id,
    });
  }
  if (pack.contributors.length === 0) {
    errors.push({
      code: "MISSING_CONTRIBUTORS",
      message: `Capability pack ${pack.id} declares no contributors`,
      severity: "error",
      packId: pack.id,
    });
  }
  if (pack.plannerIntents.length === 0) {
    warnings.push({
      code: "MISSING_PLANNER_INTENTS",
      message: `Capability pack ${pack.id} declares no planner intents`,
      severity: "warning",
      packId: pack.id,
    });
  }
}

function validateContributors(
  pack: EducationCapabilityPackMetadata,
  errors: EducationCapabilityValidationIssue[],
  warnings: EducationCapabilityValidationIssue[]
): void {
  const seen = new Set<string>();
  for (const contributorId of pack.contributors) {
    if (!contributorId?.trim()) {
      errors.push({
        code: "MISSING_CONTRIBUTORS",
        message: `Capability pack ${pack.id} has an empty contributor id`,
        severity: "error",
        packId: pack.id,
      });
      continue;
    }
    if (seen.has(contributorId)) {
      errors.push({
        code: "DUPLICATE_CONTRIBUTOR_REF",
        message: `Capability pack ${pack.id} lists contributor ${contributorId} more than once`,
        severity: "error",
        packId: pack.id,
        ref: contributorId,
      });
    }
    seen.add(contributorId);
    if (!KNOWN_CONTRIBUTOR_IDS.has(contributorId)) {
      errors.push({
        code: "UNKNOWN_CONTRIBUTOR",
        message: `Capability pack ${pack.id} references unknown contributor ${contributorId}`,
        severity: "error",
        packId: pack.id,
        ref: contributorId,
      });
    } else if (!contributorId.includes(".cognition.")) {
      warnings.push({
        code: "NON_COGNITIVE_CONTRIBUTOR",
        message: `Capability pack ${pack.id} references non-cognitive contributor ${contributorId}`,
        severity: "warning",
        packId: pack.id,
        ref: contributorId,
      });
    }
  }
}

function validateDocumentation(
  pack: EducationCapabilityPackMetadata,
  errors: EducationCapabilityValidationIssue[],
  warnings: EducationCapabilityValidationIssue[]
): void {
  if (pack.documentation.length === 0) {
    errors.push({
      code: "MISSING_DOCS",
      message: `Capability pack ${pack.id} declares no documentation`,
      severity: "error",
      packId: pack.id,
    });
    return;
  }
  for (const doc of pack.documentation) {
    if (!doc?.trim()) {
      errors.push({
        code: "MISSING_DOCS",
        message: `Capability pack ${pack.id} has an empty documentation entry`,
        severity: "error",
        packId: pack.id,
      });
    } else if (!doc.endsWith(".md")) {
      warnings.push({
        code: "DOC_PATH_SUSPECT",
        message: `Capability pack ${pack.id} documentation entry may be invalid: ${doc}`,
        severity: "warning",
        packId: pack.id,
        ref: doc,
      });
    }
  }
}

function validateDependencies(
  pack: EducationCapabilityPackMetadata,
  registeredIds: Set<string>,
  errors: EducationCapabilityValidationIssue[]
): void {
  for (const dep of pack.dependencies) {
    if (!dep?.trim()) {
      errors.push({
        code: "MISSING_DEPENDENCY",
        message: `Capability pack ${pack.id} has an empty dependency id`,
        severity: "error",
        packId: pack.id,
      });
      continue;
    }
    if (dep === pack.id) {
      errors.push({
        code: "SELF_DEPENDENCY",
        message: `Capability pack ${pack.id} depends on itself`,
        severity: "error",
        packId: pack.id,
        ref: dep,
      });
      continue;
    }
    if (!registeredIds.has(dep)) {
      errors.push({
        code: "MISSING_DEPENDENCY",
        message: `Capability pack ${pack.id} depends on unregistered pack ${dep}`,
        severity: "error",
        packId: pack.id,
        ref: dep,
      });
    }
  }
}

function validateKnowledgeExtensions(
  pack: EducationCapabilityPackMetadata,
  warnings: EducationCapabilityValidationIssue[]
): void {
  for (const id of pack.knowledgeExtensions) {
    if (!KNOWN_KNOWLEDGE_IDS.has(id)) {
      warnings.push({
        code: "UNKNOWN_KNOWLEDGE_EXTENSION",
        message: `Capability pack ${pack.id} references unknown knowledge capability ${id}`,
        severity: "warning",
        packId: pack.id,
        ref: id,
      });
    }
  }
}

function validatePolicyExtensions(
  pack: EducationCapabilityPackMetadata,
  warnings: EducationCapabilityValidationIssue[]
): void {
  for (const id of pack.policyExtensions) {
    if (!KNOWN_POLICY_IDS.has(id)) {
      warnings.push({
        code: "UNKNOWN_POLICY_EXTENSION",
        message: `Capability pack ${pack.id} references unknown policy ${id}`,
        severity: "warning",
        packId: pack.id,
        ref: id,
      });
    }
  }
}

function validateVersion(
  pack: EducationCapabilityPackMetadata,
  errors: EducationCapabilityValidationIssue[],
  warnings: EducationCapabilityValidationIssue[]
): void {
  if (!pack.version?.trim()) {
    errors.push({
      code: "VERSION_INCONSISTENT",
      message: `Capability pack ${pack.id} is missing version`,
      severity: "error",
      packId: pack.id,
    });
    return;
  }
  if (!VERSION_PATTERN.test(pack.version)) {
    errors.push({
      code: "VERSION_INCONSISTENT",
      message: `Capability pack ${pack.id} has invalid version "${pack.version}" (expected semver)`,
      severity: "error",
      packId: pack.id,
      ref: pack.version,
    });
  }

  // Soft consistency: major versions across packs in a domain release should align
  // when both are feature-complete — warn only.
  void warnings;
}

function detectDependencyCycles(
  packs: readonly EducationCapabilityPackMetadata[],
  errors: EducationCapabilityValidationIssue[]
): void {
  const byId = new Map(packs.map((p) => [p.id, p] as const));
  const visited = new Set<string>();
  const stack = new Set<string>();
  const reported = new Set<string>();

  function visit(id: string): void {
    if (stack.has(id)) {
      if (!reported.has(id)) {
        reported.add(id);
        errors.push({
          code: "DEPENDENCY_CYCLE",
          message: `Capability pack dependency cycle involving ${id}`,
          severity: "error",
          packId: id,
        });
      }
      return;
    }
    if (visited.has(id)) return;
    visited.add(id);
    stack.add(id);
    const pack = byId.get(id);
    for (const dep of pack?.dependencies ?? []) {
      if (byId.has(dep)) visit(dep);
    }
    stack.delete(id);
  }

  for (const pack of packs) {
    visit(pack.id);
  }
}
