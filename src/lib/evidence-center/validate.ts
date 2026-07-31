import {
  ALLOWED_EVIDENCE_EXTENSIONS,
  CONFIDENTIALITY_LEVELS,
  DEFAULT_BUSINESS_UNITS,
  EVIDENCE_DOMAINS,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
  RELATIONSHIP_TYPES,
  REPORTING_PERIOD_KINDS,
  type RelationshipType,
  type UploadEvidenceInput,
} from "@/lib/evidence-center/types";

export type EvidenceValidationResult =
  | { readonly ok: true; readonly data: UploadEvidenceInput }
  | {
      readonly ok: false;
      readonly error: string;
      readonly fieldErrors?: Record<string, string>;
    };

function extensionOf(fileName: string): string {
  const parts = fileName.trim().toLowerCase().split(".");
  return parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";
}

export function isAllowedEvidenceFile(fileName: string): boolean {
  return (ALLOWED_EVIDENCE_EXTENSIONS as readonly string[]).includes(
    extensionOf(fileName)
  );
}

export function validateUploadEvidence(
  input: Partial<UploadEvidenceInput>,
  options?: { readonly businessUnits?: readonly string[] }
): EvidenceValidationResult {
  const fieldErrors: Record<string, string> = {};

  const organizationId = (input.organizationId ?? "").trim();
  if (!organizationId) {
    fieldErrors.organizationId = "Organization is required.";
  }

  const fileName = (input.fileName ?? "").trim();
  if (!fileName) {
    fieldErrors.fileName = "A file is required.";
  } else if (!isAllowedEvidenceFile(fileName)) {
    fieldErrors.fileName =
      "Unsupported file type. Use PDF, DOCX, XLSX, CSV, PPTX, or TXT.";
  }

  const domain = (input.domain ?? "").trim();
  if (!(EVIDENCE_DOMAINS as readonly string[]).includes(domain)) {
    fieldErrors.domain = "Select a valid domain.";
  }

  const evidenceType = (input.evidenceType ?? "").trim();
  if (!(EVIDENCE_TYPES as readonly string[]).includes(evidenceType)) {
    fieldErrors.evidenceType = "Select a valid evidence type.";
  }

  const reportingPeriodKind = (
    input.reportingPeriodKind ?? "Custom"
  ).trim();
  if (
    !(REPORTING_PERIOD_KINDS as readonly string[]).includes(reportingPeriodKind)
  ) {
    fieldErrors.reportingPeriodKind = "Select a valid reporting period kind.";
  }

  const reportingPeriodLabel = (
    input.reportingPeriodLabel ??
    input.reportingPeriod ??
    ""
  ).trim();
  if (!reportingPeriodLabel) {
    fieldErrors.reportingPeriodLabel = "Reporting period is required.";
  }

  const businessUnit = (input.businessUnit ?? "Corporate").trim();
  const allowedUnits = options?.businessUnits ?? DEFAULT_BUSINESS_UNITS;
  if (
    businessUnit &&
    !allowedUnits.some((u) => u.toLowerCase() === businessUnit.toLowerCase())
  ) {
    // Allow custom units that organizations add later.
    if (!businessUnit) {
      fieldErrors.businessUnit = "Business unit is required.";
    }
  }

  const confidentiality = (input.confidentiality ?? "Internal").trim();
  if (!(CONFIDENTIALITY_LEVELS as readonly string[]).includes(confidentiality)) {
    fieldErrors.confidentiality = "Select a valid confidentiality level.";
  }

  const source = (input.source ?? "Uploaded").trim();
  if (!(EVIDENCE_SOURCES as readonly string[]).includes(source)) {
    fieldErrors.source = "Select a valid source.";
  }

  const createdBy = (input.createdBy ?? "").trim();
  if (!createdBy) {
    fieldErrors.createdBy = "Uploader is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  const tags = (input.tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);

  const defaultName = fileName.replace(/\.[^.]+$/, "") || fileName;

  return {
    ok: true,
    data: {
      organizationId,
      organizationName: (input.organizationName ?? "").trim() || organizationId,
      fileName,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      name: (input.name ?? "").trim() || defaultName,
      domain,
      evidenceType,
      description: (input.description ?? "").trim(),
      tags,
      reportingPeriodKind,
      reportingPeriodLabel,
      businessUnit: businessUnit || "Corporate",
      department: (input.department ?? "").trim(),
      location: (input.location ?? "").trim(),
      owner: (input.owner ?? "").trim() || (input.createdByName ?? "").trim() || createdBy,
      source,
      confidentiality,
      createdBy,
      createdByName: (input.createdByName ?? "").trim() || createdBy,
    },
  };
}

export function validateRelationshipType(
  value: string
): RelationshipType | null {
  return (RELATIONSHIP_TYPES as readonly string[]).includes(value)
    ? (value as RelationshipType)
    : null;
}
