export type DocumentCategory =
  | "admissions"
  | "enrollment"
  | "medical"
  | "iep"
  | "evaluation"
  | "behavior"
  | "scholarship"
  | "billing"
  | "financial"
  | "employee"
  | "hr"
  | "contracts"
  | "policies"
  | "meeting_notes"
  | "communications"
  | "other";

export type DocumentStatus =
  | "draft"
  | "active"
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived";

export type DocumentRelationEntityType =
  | "student"
  | "family"
  | "employee"
  | "school"
  | "workflow"
  | "scholarship"
  | "invoice"
  | "meeting"
  | "communication"
  | "other";

export type DocumentListFilter =
  | "all"
  | "student"
  | "family"
  | "employee"
  | "school"
  | "templates"
  | "archived";

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "admissions",
  "enrollment",
  "medical",
  "iep",
  "evaluation",
  "behavior",
  "scholarship",
  "billing",
  "financial",
  "employee",
  "hr",
  "contracts",
  "policies",
  "meeting_notes",
  "communications",
  "other",
];

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/csv",
  "text/plain",
] as const;

export interface DocumentRelationInput {
  entityType: DocumentRelationEntityType;
  entityId: string;
  isPrimary?: boolean;
}

export interface CreateDocumentInput {
  title: string;
  description?: string;
  category?: DocumentCategory;
  documentType?: string;
  schoolId?: string | null;
  organizationId?: string | null;
  tags?: string[];
  status?: DocumentStatus;
  fileName?: string | null;
  mimeType?: string | null;
  storagePath?: string | null;
  fileUrl?: string | null;
  fileSizeBytes?: number | null;
  templateId?: string | null;
  workflowId?: string | null;
  relations?: DocumentRelationInput[];
  metadata?: Record<string, unknown>;
  policyLocked?: boolean;
  requiresSignature?: boolean;
}

export interface DocumentRow {
  id: string;
  audit_id: string;
  organization_id: string | null;
  school_id: string | null;
  title: string;
  description: string;
  category: DocumentCategory;
  document_type: string;
  status: DocumentStatus;
  current_version: number;
  mime_type: string | null;
  file_name: string | null;
  storage_path: string | null;
  file_url: string | null;
  file_size_bytes: number | null;
  tags: string[];
  owner_user_id: string | null;
  uploaded_by: string | null;
  template_id: string | null;
  workflow_id: string | null;
  requires_signature: boolean;
  signature_status: string | null;
  signature_provider: string | null;
  signature_external_id: string | null;
  policy_locked: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface DocumentVersionRow {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  description: string;
  mime_type: string | null;
  file_name: string | null;
  storage_path: string | null;
  file_url: string | null;
  file_size_bytes: number | null;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DocumentTemplateRow {
  id: string;
  audit_id: string;
  organization_id: string | null;
  school_id: string | null;
  name: string;
  description: string;
  category: string;
  template_key: string;
  body_text: string | null;
  file_url: string | null;
  mime_type: string | null;
  is_active: boolean;
  usage_count: number;
}

export interface DocumentListRow extends DocumentRow {
  schoolName: string | null;
  ownerName: string | null;
  relatedSummary: string;
}

export interface DocumentListQuery {
  filter?: DocumentListFilter;
  search?: string;
  category?: DocumentCategory | "all";
  schoolId?: string | null;
  studentId?: string | null;
  familyId?: string | null;
  employeeId?: string | null;
  page?: number;
  pageSize?: number;
  sort?: "updated_at" | "created_at" | "title" | "category";
  sortDir?: "asc" | "desc";
}
