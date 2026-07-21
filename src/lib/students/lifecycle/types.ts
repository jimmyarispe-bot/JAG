export type StudentStatusFilter = "active" | "archived" | "all";

export interface StudentDependencyHit {
  key: string;
  label: string;
  count: number;
}

export interface StudentDependencyReport {
  studentId: string;
  blocking: StudentDependencyHit[];
  informational: StudentDependencyHit[];
  canDelete: boolean;
}

export interface StudentImportOrigin {
  jobId: string;
  importDate: string | null;
  fileName: string | null;
}

export interface ArchiveStudentInput {
  studentId: string;
  reason?: string | null;
}

export interface RestoreStudentInput {
  studentId: string;
}

export interface DeleteStudentInput {
  studentId: string;
  /** Must be exactly "DELETE" */
  confirmationText: string;
  acknowledged: boolean;
}

export type LifecycleResult =
  | { ok: true; studentId: string; message: string }
  | {
      ok: false;
      error: string;
      code?:
        | "forbidden"
        | "not_found"
        | "has_dependencies"
        | "confirmation_required"
        | "already_archived"
        | "not_archived"
        | "failed";
      dependencies?: StudentDependencyReport;
      suggestArchive?: boolean;
    };
