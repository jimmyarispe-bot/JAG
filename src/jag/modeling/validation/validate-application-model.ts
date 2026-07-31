/**
 * Structural validation for ApplicationModel (no industry rules).
 */

import type { ApplicationModel } from "@/jag/modeling/application-model";

export type ModelValidationIssue = {
  readonly path: string;
  readonly code: string;
  readonly message: string;
};

export type ModelValidationResult = {
  readonly ok: boolean;
  readonly issues: readonly ModelValidationIssue[];
};

function issue(
  path: string,
  code: string,
  message: string
): ModelValidationIssue {
  return { path, code, message };
}

export function validateApplicationModel(
  model: ApplicationModel
): ModelValidationResult {
  const issues: ModelValidationIssue[] = [];
  const meta = model.metadata;

  if (!meta?.id?.trim()) {
    issues.push(issue("metadata.id", "required", "Application id is required"));
  }
  if (!meta?.applicationId?.trim()) {
    issues.push(
      issue(
        "metadata.applicationId",
        "required",
        "applicationId is required"
      )
    );
  }
  if (!meta?.version?.trim()) {
    issues.push(
      issue("metadata.version", "required", "version is required")
    );
  }
  if (!meta?.displayName?.trim()) {
    issues.push(
      issue("metadata.displayName", "required", "displayName is required")
    );
  }

  const entityTypes = new Set<string>();
  for (const [i, entity] of (model.entities ?? []).entries()) {
    if (!entity.entityType?.trim()) {
      issues.push(
        issue(`entities[${i}].entityType`, "required", "entityType required")
      );
    } else if (entityTypes.has(entity.entityType)) {
      issues.push(
        issue(
          `entities[${i}].entityType`,
          "duplicate",
          `Duplicate entityType "${entity.entityType}"`
        )
      );
    } else {
      entityTypes.add(entity.entityType);
    }
  }

  const processIds = new Set<string>();
  for (const [i, process] of (model.processes ?? []).entries()) {
    if (!process.id?.trim()) {
      issues.push(issue(`processes[${i}].id`, "required", "process id required"));
    } else if (processIds.has(process.id)) {
      issues.push(
        issue(`processes[${i}].id`, "duplicate", `Duplicate process "${process.id}"`)
      );
    } else {
      processIds.add(process.id);
    }
  }

  const decisionIds = new Set<string>();
  for (const [i, decision] of (model.decisions ?? []).entries()) {
    if (!decision.id?.trim()) {
      issues.push(
        issue(`decisions[${i}].id`, "required", "decision id required")
      );
    } else if (decisionIds.has(decision.id)) {
      issues.push(
        issue(
          `decisions[${i}].id`,
          "duplicate",
          `Duplicate decision "${decision.id}"`
        )
      );
    } else {
      decisionIds.add(decision.id);
    }
  }

  return { ok: issues.length === 0, issues };
}
