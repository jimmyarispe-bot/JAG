/**
 * AcademyOS Universal CRUD / Lifecycle types (platform standard).
 */

export type CrudAction =
  | "view"
  | "create"
  | "edit"
  | "archive"
  | "restore"
  | "delete"
  | "duplicate"
  | "history"
  | "cancel"
  | "enable"
  | "disable"
  | "deactivate"
  | "reschedule"
  | "merge"
  | "split";

export type CrudEntityKey =
  | "student"
  | "family"
  | "admission"
  | "school"
  | "program"
  | "class"
  | "teacher"
  | "employee"
  | "scholarship"
  | "invoice"
  | "payment"
  | "communication"
  | "announcement"
  | "template"
  | "notification"
  | "calendar_event"
  | "meeting"
  | "resource"
  | "workflow"
  | "document"
  | "report"
  | "setting";

export interface DependencyHit {
  key: string;
  label: string;
  count: number;
}

export interface DependencyReport {
  entityId: string;
  blocking: DependencyHit[];
  informational: DependencyHit[];
  canDelete: boolean;
}

export interface DeleteContextField {
  label: string;
  value: string;
}

export interface DeleteContext {
  entityKey: CrudEntityKey;
  entityId: string;
  displayName: string;
  fields: DeleteContextField[];
  dependencies: DependencyReport;
  suggestArchive: boolean;
  /** Extra banners (e.g. import origin) */
  notices?: Array<{ title: string; body: string; tone?: "info" | "warning" }>;
}

export type LifecycleErrorCode =
  | "forbidden"
  | "not_found"
  | "has_dependencies"
  | "confirmation_required"
  | "already_archived"
  | "not_archived"
  | "immutable"
  | "failed";

export type LifecycleResult<TId extends string = string> =
  | { ok: true; id: TId; message: string }
  | {
      ok: false;
      error: string;
      code?: LifecycleErrorCode;
      dependencies?: DependencyReport;
      suggestArchive?: boolean;
    };

export interface EntityCapability {
  entityKey: CrudEntityKey;
  label: string;
  module: string;
  actions: CrudAction[];
  /** Prefer archive over hard delete */
  archivePreferred: boolean;
  /** Hard delete allowed only with typed DELETE confirmation */
  hardDelete: boolean;
  /** Finance-style immutable end-states (void/write-off) instead of delete */
  immutable?: boolean;
  notes?: string;
}

export const DELETE_CONFIRMATION_TOKEN = "DELETE" as const;
