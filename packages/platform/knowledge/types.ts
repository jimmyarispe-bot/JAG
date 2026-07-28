/**
 * JAG Knowledge™ — canonical knowledge & document intelligence types (P-014).
 * Education-specific interpretation belongs to Learning Intelligence (P-015).
 */

export type DocumentDomain =
  | "general"
  | "education"
  | "finance"
  | "board"
  | "legal"
  | "hr"
  | "healthcare"
  | "government"
  | "custom";

/** Configurable type keys — presets are examples, not hard limits. */
export type DocumentTypeKey = string;

export type DocumentStatus =
  | "draft"
  | "active"
  | "checked_out"
  | "archived"
  | "soft_deleted"
  | "immutable_archive"
  | "legal_hold";

export type VerificationStatus =
  | "unverified"
  | "auto_extracted"
  | "human_reviewed"
  | "verified"
  | "disputed";

export type ExtractionMethod =
  | "ocr"
  | "parser"
  | "ner"
  | "classifier"
  | "manual"
  | "semantic"
  | "hook";

export type GraphNodeKind =
  | "organization"
  | "person"
  | "student"
  | "employee"
  | "parent"
  | "teacher"
  | "class"
  | "program"
  | "document"
  | "assessment"
  | "goal"
  | "project"
  | "financial_record"
  | "policy"
  | "meeting"
  | "evidence"
  | "event"
  | "recommendation"
  | "location"
  | "vendor"
  | "customer"
  | "account"
  | "school"
  | "custom";

export type SummaryKind =
  | "executive"
  | "educational"
  | "financial"
  | "legal"
  | "medical"
  | "meeting"
  | "custom";

export type WorkflowKind =
  | "approval"
  | "review"
  | "acknowledgement"
  | "signature_hook"
  | "assignment"
  | "expiration"
  | "renewal";

export type DocumentTypeDefinition = {
  readonly id: string;
  readonly organizationId: string | null;
  readonly key: DocumentTypeKey;
  readonly label: string;
  readonly domain: DocumentDomain;
  readonly active: boolean;
  readonly systemPreset: boolean;
};

export type KnowledgeFolder = {
  readonly id: string;
  readonly organizationId: string;
  readonly parentFolderId: string | null;
  readonly name: string;
  readonly path: string;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type DocumentRecord = {
  readonly id: string;
  readonly organizationId: string;
  readonly folderId: string | null;
  readonly typeKey: DocumentTypeKey;
  readonly domain: DocumentDomain;
  readonly title: string;
  readonly mimeType: string;
  readonly status: DocumentStatus;
  readonly currentVersionId: string;
  readonly tags: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly checkedOutBy: string | null;
  readonly checkedOutAt: string | null;
  readonly legalHold: boolean;
  readonly retentionPolicyId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
};

export type DocumentVersion = {
  readonly id: string;
  readonly organizationId: string;
  readonly documentId: string;
  readonly versionNumber: number;
  readonly storageKey: string;
  readonly contentHash: string;
  readonly byteSize: number;
  readonly mimeType: string;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
  readonly changeNote: string | null;
  /** Immutable once created. */
  readonly immutable: true;
};

export type StorageObject = {
  readonly key: string;
  readonly organizationId: string;
  readonly content: string;
  readonly mimeType: string;
  readonly byteSize: number;
  readonly createdAt: string;
};

export type RetentionPolicy = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly retainDays: number;
  readonly action: "archive" | "soft_delete" | "immutable_archive";
  readonly active: boolean;
};

export type KnowledgePermission = {
  readonly id: string;
  readonly organizationId: string;
  readonly scope:
    | "organization"
    | "department"
    | "team"
    | "role"
    | "document"
    | "field"
    | "evidence";
  readonly scopeId: string | null;
  readonly principalId: string;
  readonly actions: readonly ("read" | "write" | "share" | "approve" | "admin")[];
  readonly expiresAt: string | null;
};

export type OcrResult = {
  readonly id: string;
  readonly organizationId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly text: string;
  readonly pages: number;
  readonly tablesDetected: number;
  readonly formsDetected: number;
  readonly handwritingHookReady: true;
  readonly multilingualHookReady: true;
  readonly confidence: number;
  readonly createdAt: string;
};

export type ExtractedEntity = {
  readonly id: string;
  readonly organizationId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly kind: GraphNodeKind | "date" | "diagnosis" | "accommodation" | "intervention";
  readonly label: string;
  readonly value: string;
  readonly confidence: number;
  readonly method: ExtractionMethod;
  readonly location: string;
  readonly createdAt: string;
};

export type EvidenceFact = {
  readonly id: string;
  readonly organizationId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly location: string;
  readonly statement: string;
  readonly confidence: number;
  readonly method: ExtractionMethod;
  readonly extractedAt: string;
  readonly authorUserId: string | null;
  readonly verificationStatus: VerificationStatus;
  /** Evidence never disappears — soft tombstone only. */
  readonly tombstoned: false;
};

export type GraphNode = {
  readonly id: string;
  readonly organizationId: string;
  readonly kind: GraphNodeKind;
  readonly label: string;
  readonly externalRef: string | null;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
};

export type GraphEdge = {
  readonly id: string;
  readonly organizationId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly relationship: string;
  readonly evidenceFactIds: readonly string[];
  readonly createdAt: string;
};

export type TimelineEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly occurredAt: string;
  readonly kind: string;
  readonly title: string;
  readonly documentId: string | null;
  readonly evidenceFactId: string | null;
  readonly subjectRef: string | null;
};

export type SearchHit = {
  readonly documentId: string;
  readonly versionId: string;
  readonly title: string;
  readonly score: number;
  readonly snippet: string;
  readonly facets: Readonly<Record<string, string>>;
};

export type SemanticIndexEntry = {
  readonly id: string;
  readonly organizationId: string;
  readonly documentId: string;
  readonly versionId: string;
  /** Vector-ready embedding placeholder (deterministic hash vector). */
  readonly vector: readonly number[];
  readonly text: string;
  readonly createdAt: string;
};

export type Citation = {
  readonly id: string;
  readonly organizationId: string;
  readonly evidenceFactId: string;
  readonly documentId: string;
  readonly versionId: string;
  readonly location: string;
};

export type KnowledgeSummary = {
  readonly id: string;
  readonly organizationId: string;
  readonly documentId: string;
  readonly kind: SummaryKind;
  readonly text: string;
  readonly citationIds: readonly string[];
  readonly createdAt: string;
  readonly createdBy: string;
};

export type KnowledgeInsight = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly detail: string;
  readonly evidenceFactIds: readonly string[];
  readonly createdAt: string;
};

export type KnowledgeRecommendation = {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly summary: string;
  readonly documentIds: readonly string[];
  readonly evidenceFactIds: readonly string[];
  readonly confidence: number;
  readonly createdAt: string;
};

export type KnowledgeWorkflow = {
  readonly id: string;
  readonly organizationId: string;
  readonly documentId: string;
  readonly kind: WorkflowKind;
  readonly status: "pending" | "completed" | "rejected" | "expired";
  readonly assigneeId: string | null;
  readonly dueAt: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
};

export type ShareGrant = {
  readonly id: string;
  readonly organizationId: string;
  readonly documentId: string;
  readonly principalId: string;
  readonly actions: readonly ("read" | "write" | "share")[];
  readonly expiresAt: string | null;
  readonly createdAt: string;
};

export type SavedSearch = {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly query: string;
  readonly filters: Readonly<Record<string, string>>;
  readonly createdBy: string;
  readonly createdAt: string;
};

export const KNOWLEDGE_GUARDS = Object.freeze({
  canonicalDocumentOwner: true,
  duplicatesDocumentModels: false,
  duplicatesEvidenceSystems: false,
  educationInterpretationInP015: true,
  everyFactRequiresCitation: true,
  documentsImmutableVersions: true,
  aiConclusionsRequireEvidence: true,
});
