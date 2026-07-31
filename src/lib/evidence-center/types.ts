export const EVIDENCE_DOMAINS = [
  "Financial Intelligence",
  "People Intelligence",
  "Operations Intelligence",
  "Governance Intelligence",
  "Academic Intelligence",
  "Technology Intelligence",
  "General",
] as const;

export type EvidenceDomain = (typeof EVIDENCE_DOMAINS)[number];

export const EVIDENCE_TYPES = [
  "Financial Statement",
  "Bank Statement",
  "Budget",
  "Payroll",
  "Policy",
  "Procedure",
  "Board Minutes",
  "Contract",
  "Strategic Plan",
  "Research",
  "Presentation",
  "Spreadsheet",
  "Other",
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
  "awaiting_review",
] as const;

export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const ALLOWED_EVIDENCE_EXTENSIONS = [
  "pdf",
  "docx",
  "xlsx",
  "csv",
  "pptx",
  "txt",
] as const;

export const REPORTING_PERIOD_KINDS = [
  "Monthly",
  "Quarterly",
  "Annual",
  "Custom",
] as const;

export type ReportingPeriodKind = (typeof REPORTING_PERIOD_KINDS)[number];

export const DEFAULT_BUSINESS_UNITS = [
  "Corporate",
  "Finance",
  "Operations",
  "Sales",
  "Marketing",
  "Human Resources",
  "Academics",
  "Technology",
] as const;

export const CONFIDENTIALITY_LEVELS = [
  "Public",
  "Internal",
  "Confidential",
  "Highly Confidential",
] as const;

export type ConfidentialityLevel = (typeof CONFIDENTIALITY_LEVELS)[number];

export const EVIDENCE_SOURCES = [
  "Uploaded",
  "QuickBooks",
  "Google Workspace",
  "Microsoft 365",
  "Salesforce",
  "HubSpot",
  "Manual",
  "Other",
] as const;

export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

export const RELATIONSHIP_TYPES = [
  "Related",
  "Supports",
  "Supersedes",
  "References",
  "Derived From",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const TIMELINE_EVENT_KINDS = [
  "created",
  "uploaded",
  "version_added",
  "metadata_updated",
  "pipeline",
] as const;

export type TimelineEventKind = (typeof TIMELINE_EVENT_KINDS)[number];

export type EvidenceTimelineEvent = {
  readonly id: string;
  readonly kind: TimelineEventKind;
  readonly at: string;
  readonly label: string;
  readonly actorName?: string;
};

export type EvidenceVersion = {
  readonly id: string;
  readonly documentId: string;
  readonly organizationId: string;
  readonly versionNumber: number;
  readonly fileName: string;
  readonly storagePath: string;
  readonly mimeType: string;
  readonly byteSize: number;
  readonly isLatest: boolean;
  readonly superseded: boolean;
  readonly createdBy: string;
  readonly createdByName: string;
  readonly createdAt: string;
  readonly notes: string;
};

export type EvidenceRelationship = {
  readonly id: string;
  readonly organizationId: string;
  readonly fromDocumentId: string;
  readonly toDocumentId: string;
  readonly relationshipType: RelationshipType;
  readonly createdBy: string;
  readonly createdAt: string;
};

export type EvidenceDocument = {
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly name: string;
  readonly storagePath: string;
  readonly domain: EvidenceDomain;
  readonly evidenceType: EvidenceType;
  readonly description: string;
  readonly tags: readonly string[];
  readonly reportingPeriodKind: ReportingPeriodKind;
  readonly reportingPeriodLabel: string;
  readonly businessUnit: string;
  readonly department: string;
  readonly location: string;
  readonly owner: string;
  readonly source: EvidenceSource;
  readonly confidentiality: ConfidentialityLevel;
  readonly currentVersion: number;
  readonly status: EvidenceStatus;
  readonly createdBy: string;
  readonly createdByName: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly byteSize: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly timeline: readonly EvidenceTimelineEvent[];
};

export type UploadEvidenceInput = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly fileName: string;
  readonly mimeType?: string;
  readonly byteSize?: number;
  /** Display name in the catalog (defaults from file name). */
  readonly name?: string;
  readonly domain: string;
  readonly evidenceType: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly reportingPeriodKind?: string;
  readonly reportingPeriodLabel?: string;
  /** @deprecated use reportingPeriodLabel */
  readonly reportingPeriod?: string;
  readonly businessUnit?: string;
  readonly department?: string;
  readonly location?: string;
  readonly owner?: string;
  readonly source?: string;
  readonly confidentiality?: string;
  readonly createdBy: string;
  readonly createdByName: string;
};

export type EvidenceSearchFilters = {
  readonly organizationId: string;
  readonly query?: string;
  readonly domain?: string;
  readonly evidenceType?: string;
  readonly status?: string;
  readonly tag?: string;
  readonly reportingPeriod?: string;
  readonly businessUnit?: string;
  readonly department?: string;
  readonly confidentiality?: string;
  readonly owner?: string;
  readonly source?: string;
};

export type CatalogDashboardSummary = {
  readonly byDomain: Readonly<Record<string, number>>;
  readonly byType: Readonly<Record<string, number>>;
  readonly byReportingPeriod: Readonly<Record<string, number>>;
  readonly recentUploads: readonly EvidenceDocument[];
  readonly awaitingReview: number;
  readonly latestVersionCount: number;
};
