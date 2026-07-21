/**
 * AcademyOS CRUD Completion Gate
 *
 * RULE: No new module may be considered complete until it complies
 * with the AcademyOS CRUD Standard (docs/platform/crud-standards.md).
 */

import { ENTITY_CAPABILITIES } from "./registry";
import type { CrudAction, CrudEntityKey, EntityCapability } from "./types";

/**
 * Entity-level CRUD claim (legacy + CRUD gate).
 * Module-level progressive status lives in `src/lib/platform/release`
 * (`planned` → `released`). Prefer advancing MODULE_RELEASE_REGISTRY.
 */
export type CrudReleaseStatus =
  /** Meets CRUD gate requirements */
  | "complete"
  /** Registered + partially implemented — must NOT claim module complete */
  | "partial"
  /** Intentionally deferred / out of scope for current release */
  | "deferred";

export interface CrudComplianceIssue {
  code:
    | "missing_required_action"
    | "missing_soft_end_state"
    | "missing_history"
    | "hard_delete_without_archive_preference"
    | "complete_without_compliance"
    | "immutable_with_hard_delete";
  message: string;
  entityKey: CrudEntityKey;
}

export interface CrudComplianceResult {
  ok: boolean;
  entityKey: CrudEntityKey;
  label: string;
  releaseStatus: CrudReleaseStatus;
  issues: CrudComplianceIssue[];
  /** True when capability matrix satisfies completion requirements */
  meetsStandard: boolean;
}

/**
 * Baseline actions every manageable (non-immutable) entity must expose
 * before a module can be marked complete.
 */
export const REQUIRED_ACTIONS_FOR_COMPLETION: readonly CrudAction[] = [
  "view",
  "edit",
  "history",
] as const;

/**
 * Soft end-state: at least one of these (archive preferred; cancel/deactivate
 * allowed as domain synonyms).
 */
export const SOFT_END_STATE_ACTIONS: readonly CrudAction[] = [
  "archive",
  "cancel",
  "deactivate",
] as const;

export interface EntityCapabilityWithStatus extends EntityCapability {
  /**
   * Release claim for this entity.
   * - `complete` → validation FAILS unless `evaluateCrudCompliance` passes
   * - `partial` / `deferred` → allowed while gaps remain
   */
  releaseStatus: CrudReleaseStatus;
}

/**
 * Release status for every registered entity.
 * New modules MUST start as `partial` and may only move to `complete`
 * after the completion gate passes.
 */
export const ENTITY_RELEASE_STATUS: Record<CrudEntityKey, CrudReleaseStatus> = {
  student: "complete",
  family: "complete",
  admission: "partial",
  school: "partial",
  program: "partial",
  class: "partial",
  teacher: "partial",
  employee: "complete",
  scholarship: "partial",
  invoice: "complete",
  payment: "complete",
  communication: "complete",
  announcement: "complete",
  template: "complete",
  notification: "partial",
  calendar_event: "complete",
  meeting: "partial",
  resource: "partial",
  workflow: "complete",
  document: "complete",
  report: "deferred",
  setting: "deferred",
};

export function getEntityReleaseStatus(entityKey: CrudEntityKey): CrudReleaseStatus {
  return ENTITY_RELEASE_STATUS[entityKey] ?? "partial";
}

/**
 * Evaluate whether an entity's declared capabilities satisfy the CRUD Standard
 * enough to be marked complete.
 */
export function evaluateCrudCompliance(
  capability: EntityCapability
): CrudComplianceResult {
  const releaseStatus = getEntityReleaseStatus(capability.entityKey);
  const issues: CrudComplianceIssue[] = [];
  const actions = new Set(capability.actions);

  for (const action of REQUIRED_ACTIONS_FOR_COMPLETION) {
    if (!actions.has(action)) {
      // Create-only utilities may omit edit (e.g. payment) — allow immutable view+history
      if (capability.immutable && action === "edit" && actions.has("view")) {
        continue;
      }
      issues.push({
        code: "missing_required_action",
        entityKey: capability.entityKey,
        message: `${capability.label} is missing required action: ${action}`,
      });
    }
  }

  if (!actions.has("history")) {
    issues.push({
      code: "missing_history",
      entityKey: capability.entityKey,
      message: `${capability.label} must expose History / Audit`,
    });
  }

  if (!capability.immutable) {
    const hasSoftEnd = SOFT_END_STATE_ACTIONS.some((a) => actions.has(a));
    if (!hasSoftEnd) {
      issues.push({
        code: "missing_soft_end_state",
        entityKey: capability.entityKey,
        message: `${capability.label} must support archive, cancel, or deactivate (soft end-state)`,
      });
    }

    // If restoreable soft-archive model is used, restore should exist when archive does
    if (actions.has("archive") && !actions.has("restore") && !actions.has("cancel")) {
      // announcement may archive without restore in some designs — require restore when archivePreferred
      if (capability.archivePreferred && capability.hardDelete) {
        issues.push({
          code: "missing_required_action",
          entityKey: capability.entityKey,
          message: `${capability.label} prefers archive and allows hard delete — restore is required`,
        });
      }
    }
  }

  if (capability.hardDelete && !capability.archivePreferred && !capability.immutable) {
    issues.push({
      code: "hard_delete_without_archive_preference",
      entityKey: capability.entityKey,
      message: `${capability.label} allows hard delete but does not prefer archive`,
    });
  }

  if (capability.immutable && capability.hardDelete) {
    issues.push({
      code: "immutable_with_hard_delete",
      entityKey: capability.entityKey,
      message: `${capability.label} is immutable and must not allow hard delete`,
    });
  }

  const meetsStandard = issues.length === 0;

  if (releaseStatus === "complete" && !meetsStandard) {
    issues.push({
      code: "complete_without_compliance",
      entityKey: capability.entityKey,
      message: `${capability.label} is marked releaseStatus=complete but does not meet the CRUD Standard`,
    });
  }

  return {
    ok: releaseStatus !== "complete" || meetsStandard,
    entityKey: capability.entityKey,
    label: capability.label,
    releaseStatus,
    issues,
    meetsStandard,
  };
}

/**
 * Can this entity be declared a completed module?
 * Returns false with reasons when the completion gate blocks.
 */
export function canMarkModuleComplete(entityKey: CrudEntityKey): {
  ok: boolean;
  reasons: string[];
} {
  const capability = ENTITY_CAPABILITIES.find((c) => c.entityKey === entityKey);
  if (!capability) {
    return {
      ok: false,
      reasons: [
        `Entity "${entityKey}" is not registered in ENTITY_CAPABILITIES. Register it before claiming completion.`,
      ],
    };
  }

  const result = evaluateCrudCompliance(capability);
  if (!result.meetsStandard) {
    return {
      ok: false,
      reasons: [
        "AcademyOS CRUD Completion Gate: module cannot be marked complete until it complies with the CRUD Standard.",
        ...result.issues.map((i) => i.message),
        "See docs/platform/crud-standards.md",
      ],
    };
  }

  return { ok: true, reasons: [] };
}

/** Validate all registered entities against the completion gate. */
export function validateCrudCompletionGate(): {
  ok: boolean;
  results: CrudComplianceResult[];
  issues: CrudComplianceIssue[];
} {
  const results = ENTITY_CAPABILITIES.map(evaluateCrudCompliance);
  const issues = results.flatMap((r) =>
    r.releaseStatus === "complete" ? r.issues : r.issues.filter((i) => i.code === "complete_without_compliance")
  );

  // Only fail the gate for entities claiming complete (or structural rule violations on complete)
  const blocking = results.flatMap((r) => {
    if (r.releaseStatus !== "complete") return [];
    return r.issues;
  });

  return {
    ok: blocking.length === 0,
    results,
    issues: blocking,
  };
}

/**
 * Platform rule statement — importable for docs/tests.
 */
export const CRUD_COMPLETION_RULE =
  "No new module may be considered complete until it complies with the AcademyOS CRUD Standard.";
