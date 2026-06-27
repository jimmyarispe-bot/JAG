export type NoteCategory =
  | "general"
  | "academic"
  | "behavior"
  | "medical"
  | "family"
  | "financial"
  | "compliance"
  | "internal";

export type NoteVisibility = "staff" | "restricted" | "leadership" | "parent_visible";

export type NoteSource = "manual" | "import" | "integration" | "migration";

export interface NoteAttachment {
  documentId: string | null;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
}

export interface PlatformNote {
  id: string;
  organization_id: string;
  school_id: string | null;
  entity_type: string;
  entity_id: string;
  student_id: string | null;
  family_id: string | null;
  body: string;
  category: NoteCategory;
  is_pinned: boolean;
  author_user_id: string;
  visibility: NoteVisibility;
  mentioned_user_ids: string[];
  attachments: NoteAttachment[];
  source: NoteSource;
  metadata: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  users?: { full_name: string | null } | null;
}

export interface CreateNoteInput {
  organizationId: string;
  schoolId?: string | null;
  entityType: string;
  entityId: string;
  body: string;
  category?: NoteCategory;
  visibility?: NoteVisibility;
  isPinned?: boolean;
  mentionedUserIds?: string[];
  attachments?: NoteAttachment[];
  authorUserId: string;
  studentId?: string | null;
  familyId?: string | null;
  source?: NoteSource;
  metadata?: Record<string, unknown>;
}

export interface UpdateNoteInput {
  body?: string;
  category?: NoteCategory;
  visibility?: NoteVisibility;
  isPinned?: boolean;
  mentionedUserIds?: string[];
  attachments?: NoteAttachment[];
}
