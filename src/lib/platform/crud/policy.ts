import {
  DELETE_CONFIRMATION_TOKEN,
  type DependencyReport,
  type LifecycleErrorCode,
} from "./types";

/** Validate AcademyOS hard-delete confirmation (checkbox + type DELETE). */
export function validateDeleteConfirmation(input: {
  confirmationText: string;
  acknowledged: boolean;
}): { ok: true } | { ok: false; error: string; code: LifecycleErrorCode } {
  if (!input.acknowledged) {
    return {
      ok: false,
      error: "You must acknowledge that this action cannot be undone.",
      code: "confirmation_required",
    };
  }
  if (input.confirmationText.trim() !== DELETE_CONFIRMATION_TOKEN) {
    return {
      ok: false,
      error: `Type ${DELETE_CONFIRMATION_TOKEN} to confirm permanent deletion.`,
      code: "confirmation_required",
    };
  }
  return { ok: true };
}

/** Block hard delete when dependency report says so. */
export function assertCanHardDelete(
  report: DependencyReport
): { ok: true } | { ok: false; error: string; code: LifecycleErrorCode; suggestArchive: true } {
  if (!report.canDelete || report.blocking.length > 0) {
    return {
      ok: false,
      error: "Permanent deletion is blocked by related records. Archive instead.",
      code: "has_dependencies",
      suggestArchive: true,
    };
  }
  return { ok: true };
}

export function emptyDependencyReport(entityId: string): DependencyReport {
  return {
    entityId,
    blocking: [],
    informational: [],
    canDelete: true,
  };
}

/** Keyboard shortcut map for entity workspaces (when not typing in inputs). */
export const ENTITY_SHORTCUTS = {
  edit: "E",
  delete: "Delete",
  duplicate: "Ctrl+D",
  save: "Ctrl+S",
  cancel: "Escape",
} as const;

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}
