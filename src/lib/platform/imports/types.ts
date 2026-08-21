/**
 * Platform Bulk Import Engine — shared types.
 * Entity-agnostic: Student is the first registered importer.
 */

export type ImportEntityType =
  | "student"
  | "admissions_lead"
  | "parent"
  | "employee"
  | "teacher"
  | "scholarship"
  | "class"
  | "school"
  | "campus"
  | "program"
  | "vendor"
  | "donor";

export type ImportSourceFormat = "csv" | "xlsx" | "xls" | "google_sheets";

export type ImportMode =
  | "create_only"
  | "update_existing"
  | "skip_duplicates"
  | "merge_duplicates"
  | "ask_during_preview";

export type ImportJobStatus =
  | "uploaded"
  | "configured"
  | "mapped"
  | "validated"
  | "preview"
  | "importing"
  | "completed"
  | "failed"
  | "rolled_back";

export type ImportRowStatus =
  | "pending"
  | "valid"
  | "warning"
  | "error"
  | "new"
  | "update"
  | "duplicate"
  | "skipped"
  | "imported"
  | "failed";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ImportFieldDefinition {
  key: string;
  label: string;
  required?: boolean;
  aliases?: string[];
  dataType?: "string" | "date" | "email" | "phone" | "number" | "enum";
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: string;
  defaultValue?: string;
  required?: boolean;
  confidence?: number;
}

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  fieldName?: string;
  rowNumber?: number;
  resolutionHint?: string;
}

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
  sheetName?: string;
  rowCount: number;
}

export interface ParsedWorkbook {
  format: ImportSourceFormat;
  fileName: string;
  fileSizeBytes: number;
  sheets: ParsedSheet[];
  /** Primary sheet used for import */
  primary: ParsedSheet;
}

export interface ImportDestination {
  schoolId: string;
  campusId?: string | null;
  program?: string | null;
  schoolYearId?: string | null;
  importMode: ImportMode;
}

export interface ImportJobCounts {
  total: number;
  valid: number;
  warnings: number;
  errors: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
}

export interface ImportJob {
  id: string;
  entityType: ImportEntityType;
  status: ImportJobStatus;
  sourceFormat: ImportSourceFormat;
  fileName: string;
  fileSizeBytes: number;
  organizationId: string | null;
  schoolId: string | null;
  campusId: string | null;
  program: string | null;
  schoolYearId: string | null;
  importMode: ImportMode;
  mappings: FieldMapping[];
  counts: ImportJobCounts;
  durationMs: number | null;
  importedBy: string | null;
  importedByName?: string | null;
  startedAt: string;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}

export interface ImportRow {
  id: string;
  jobId: string;
  rowNumber: number;
  raw: Record<string, string>;
  mapped: Record<string, unknown>;
  status: ImportRowStatus;
  issues: ValidationIssue[];
  previewAction?: "create" | "update" | "skip" | "merge" | "ask";
  targetEntityId?: string | null;
  familyGroupKey?: string | null;
}

export interface PreviewRow {
  rowNumber: number;
  mapped: Record<string, unknown>;
  status: ImportRowStatus;
  action: "create" | "update" | "skip" | "merge" | "ask";
  issues: ValidationIssue[];
  highlight: "new" | "updated" | "duplicate" | "skipped" | "error";
}

export interface ImportPreview {
  jobId: string;
  rows: PreviewRow[];
  summary: ImportJobCounts & {
    familyGroups: number;
    scholarshipMatches: number;
    scholarshipUnknown: number;
  };
}

export interface ImportCommitResult {
  jobId: string;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  warnings: number;
  durationMs: number;
  reportCsv: string;
}

export interface ImportProgress {
  jobId: string;
  status: ImportJobStatus;
  processed: number;
  total: number;
  percent: number;
  estimatedRemainingMs: number | null;
  message: string;
}

export interface RollbackResult {
  jobId: string;
  rolledBackEntities: number;
  errors: string[];
}

export interface ImportTemplate {
  id: string;
  entityType: ImportEntityType;
  name: string;
  description: string;
  fileName: string;
  headers: string[];
  sampleRows: string[][];
}

export interface ImportLookupContext {
  schoolIds: string[];
  campusIdsBySchool: Map<string, Set<string>>;
  campusNamesBySchool: Map<string, Map<string, string>>;
  programCodes: Set<string>;
  schoolYearIdsBySchool: Map<string, Set<string>>;
  existingStudents: Array<{
    id: string;
    school_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    grade_level: string | null;
    family_id: string | null;
  }>;
  existingGuardians: Array<{
    id: string;
    family_id: string;
    email: string | null;
    phone: string | null;
    first_name: string;
    last_name: string;
  }>;
  existingFamilies: Array<{
    id: string;
    school_id: string;
    family_name: string;
    primary_address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    billing_email: string | null;
    billing_phone: string | null;
  }>;
  fundingCodes: Set<string>;
  fundingLabels: Map<string, string>;
  scholarshipFundNames: Map<string, string>;
}

export interface EntityImporter {
  entityType: ImportEntityType;
  displayName: string;
  description: string;
  fields: ImportFieldDefinition[];
  templates: ImportTemplate[];
  /** Optional entity-specific validation after common mapping */
  validateRow?(
    mapped: Record<string, unknown>,
    ctx: ImportLookupContext,
    destination: ImportDestination,
    rowNumber: number
  ): ValidationIssue[];
  /** Resolve create/update/skip for preview */
  resolvePreviewAction?(
    mapped: Record<string, unknown>,
    ctx: ImportLookupContext,
    destination: ImportDestination
  ): { action: PreviewRow["action"]; targetEntityId?: string | null; highlight: PreviewRow["highlight"] };
  /** Commit a single mapped row; return created/updated entity ids for rollback */
  commitRow?(
    mapped: Record<string, unknown>,
    destination: ImportDestination,
    action: PreviewRow["action"],
    targetEntityId: string | null | undefined,
    helpers: ImportCommitHelpers
  ): Promise<ImportRowCommitResult>;
}

export interface ImportCommitHelpers {
  supabase: unknown;
  actorUserId: string | null;
  jobId: string;
}

export interface ImportRowCommitResult {
  ok: boolean;
  action: "imported" | "updated" | "skipped" | "failed";
  entityType?: string;
  entityId?: string;
  relatedEntities?: Array<{ entityType: string; entityId: string; action: "created" | "updated" | "linked" }>;
  error?: string;
  warnings?: string[];
}

export interface RegisterImporterOptions {
  overwrite?: boolean;
}

export const EMPTY_COUNTS = (): ImportJobCounts => ({
  total: 0,
  valid: 0,
  warnings: 0,
  errors: 0,
  imported: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
});

export const WIZARD_STEPS = [
  { key: "upload", label: "Upload", number: 1 },
  { key: "destination", label: "Destination", number: 2 },
  { key: "mapping", label: "Mapping", number: 3 },
  { key: "validation", label: "Validation", number: 4 },
  { key: "preview", label: "Preview", number: 5 },
  { key: "import", label: "Import", number: 6 },
  { key: "results", label: "Results", number: 7 },
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number]["key"];
