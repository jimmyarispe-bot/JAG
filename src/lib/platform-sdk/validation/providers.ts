/**
 * Provider / entity validators for SDK conformance checks.
 */

import type { PlatformConnector } from "@/lib/platform-sdk/connectors/types";
import type { DecisionSource, DecisionWorkflow } from "@/lib/platform-sdk/decisions/types";
import type {
  TwinEntityDescriptor,
  TwinValidationResult,
} from "@/lib/platform-sdk/digital-twin/types";
import type {
  EvidenceDocumentDescriptor,
  EvidenceProvider,
  EvidenceValidator,
} from "@/lib/platform-sdk/evidence/types";
import type { InsightProvider, InsightRule } from "@/lib/platform-sdk/executive/types";

export type SdkValidationResult = {
  readonly ok: boolean;
  readonly errors: readonly string[];
};

export function validatePlatformConnector(
  connector: PlatformConnector
): SdkValidationResult {
  const errors: string[] = [];
  if (!connector.id?.trim()) errors.push("Connector id is required.");
  if (!connector.version?.trim()) errors.push("Connector version is required.");
  const caps = connector.capabilities();
  if (!caps?.operations?.length) {
    errors.push("Connector must declare at least one capability operation.");
  }
  if (!Array.isArray(connector.entityMappings())) {
    errors.push("entityMappings() must return an array.");
  }
  if (!Array.isArray(connector.permissions())) {
    errors.push("permissions() must return an array.");
  }
  return { ok: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateTwinEntityDescriptor(
  entity: TwinEntityDescriptor
): TwinValidationResult {
  if (!entity.id?.trim()) return { ok: false, error: "Entity id is required." };
  if (!entity.organizationId?.trim()) {
    return { ok: false, error: "organizationId is required." };
  }
  if (!entity.entityType?.trim()) {
    return { ok: false, error: "entityType is required." };
  }
  if (!entity.label?.trim()) return { ok: false, error: "label is required." };
  if (entity.status !== "Active" && entity.status !== "Archived") {
    return { ok: false, error: "status must be Active or Archived." };
  }
  return { ok: true };
}

export function createBasicEvidenceValidator(): EvidenceValidator {
  return {
    id: "sdk.evidence.basic-validator",
    validate(document: EvidenceDocumentDescriptor) {
      if (!document.id?.trim()) {
        return { ok: false, error: "Evidence id is required." };
      }
      if (!document.organizationId?.trim()) {
        return { ok: false, error: "organizationId is required." };
      }
      if (!document.title?.trim()) {
        return { ok: false, error: "title is required." };
      }
      return { ok: true };
    },
  };
}

export function validateEvidenceProvider(
  provider: EvidenceProvider
): SdkValidationResult {
  const errors: string[] = [];
  if (!provider.id?.trim()) errors.push("Evidence provider id is required.");
  if (!provider.version?.trim()) {
    errors.push("Evidence provider version is required.");
  }
  return { ok: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateInsightProvider(
  provider: InsightProvider
): SdkValidationResult {
  const errors: string[] = [];
  if (!provider.id?.trim()) errors.push("Insight provider id is required.");
  if (!provider.version?.trim()) {
    errors.push("Insight provider version is required.");
  }
  const rules = provider.rules();
  if (!Array.isArray(rules)) errors.push("rules() must return an array.");
  for (const rule of rules) {
    const ruleErrors = validateInsightRule(rule);
    errors.push(...ruleErrors.errors);
  }
  return { ok: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateInsightRule(rule: InsightRule): SdkValidationResult {
  const errors: string[] = [];
  if (!rule.id?.trim()) errors.push("Insight rule id is required.");
  if (!rule.domain?.trim()) errors.push("Insight rule domain is required.");
  if (typeof rule.evaluate !== "function") {
    errors.push(`Insight rule “${rule.id}” must implement evaluate().`);
  }
  return { ok: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateDecisionSource(
  source: DecisionSource
): SdkValidationResult {
  const errors: string[] = [];
  if (!source.id?.trim()) errors.push("Decision source id is required.");
  if (!source.version?.trim()) errors.push("Decision source version is required.");
  if (!source.label?.trim()) errors.push("Decision source label is required.");
  return { ok: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateDecisionWorkflow(
  workflow: DecisionWorkflow
): SdkValidationResult {
  const errors: string[] = [];
  if (!workflow.id?.trim()) errors.push("Decision workflow id is required.");
  if (typeof workflow.canTransition !== "function") {
    errors.push("Decision workflow must implement canTransition().");
  }
  return { ok: errors.length === 0, errors: Object.freeze(errors) };
}
