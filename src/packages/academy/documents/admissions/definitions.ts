/**
 * Academy Admissions document definitions — package contributions only.
 * Document Engine owns lifecycle; no storage here.
 */

import type {
  DocumentCategory,
  DocumentDefinition,
} from "@/jag/documents";
import { ACADEMY_APPLICATION_ID } from "@/packages/academy/package";

export const ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY_ID =
  "academy.documents.admissions" as const;

export const ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY: DocumentCategory =
  Object.freeze({
    id: ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY_ID,
    label: "Admissions",
    description: "Documents collected during the Academy admissions process",
  });

export const ACADEMY_ADMISSIONS_DOCUMENT_IDS = {
  application: "academy.document.admissions.application",
  birthCertificate: "academy.document.admissions.birth_certificate",
  residencyVerification: "academy.document.admissions.residency_verification",
  priorSchoolRecords: "academy.document.admissions.prior_school_records",
  parentConsent: "academy.document.admissions.parent_consent",
  scholarship: "academy.document.admissions.scholarship",
} as const;

function doc(input: {
  id: string;
  label: string;
  description: string;
  optional?: boolean;
}): DocumentDefinition {
  return Object.freeze({
    id: input.id,
    applicationId: ACADEMY_APPLICATION_ID,
    version: "1.0.0",
    label: input.label,
    description: input.description,
    categoryId: ACADEMY_ADMISSIONS_DOCUMENT_CATEGORY_ID,
    defaultClassification: "confidential" as const,
    allowedClassifications: Object.freeze([
      "internal" as const,
      "confidential" as const,
      "restricted" as const,
    ]),
    metadataSchema: input.optional
      ? Object.freeze({ optional: true })
      : undefined,
  });
}

export const ACADEMY_ADMISSIONS_DOCUMENT_DEFINITIONS: readonly DocumentDefinition[] =
  Object.freeze([
    doc({
      id: ACADEMY_ADMISSIONS_DOCUMENT_IDS.application,
      label: "Application",
      description: "Completed admissions application packet",
    }),
    doc({
      id: ACADEMY_ADMISSIONS_DOCUMENT_IDS.birthCertificate,
      label: "Birth Certificate",
      description: "Official birth certificate for the applicant",
    }),
    doc({
      id: ACADEMY_ADMISSIONS_DOCUMENT_IDS.residencyVerification,
      label: "Residency Verification",
      description: "Proof of residency when required by policy",
    }),
    doc({
      id: ACADEMY_ADMISSIONS_DOCUMENT_IDS.priorSchoolRecords,
      label: "Prior School Records",
      description: "Transcripts and records from prior schools",
    }),
    doc({
      id: ACADEMY_ADMISSIONS_DOCUMENT_IDS.parentConsent,
      label: "Parent Consent",
      description: "Guardian/parent consent for admissions processing",
    }),
    doc({
      id: ACADEMY_ADMISSIONS_DOCUMENT_IDS.scholarship,
      label: "Scholarship Documentation",
      description: "Optional scholarship supporting documents",
      optional: true,
    }),
  ]);

/** Required (non-optional) document definition ids for stage metadata. */
export const ACADEMY_ADMISSIONS_REQUIRED_DOCUMENT_IDS = Object.freeze([
  ACADEMY_ADMISSIONS_DOCUMENT_IDS.application,
  ACADEMY_ADMISSIONS_DOCUMENT_IDS.birthCertificate,
  ACADEMY_ADMISSIONS_DOCUMENT_IDS.residencyVerification,
  ACADEMY_ADMISSIONS_DOCUMENT_IDS.priorSchoolRecords,
  ACADEMY_ADMISSIONS_DOCUMENT_IDS.parentConsent,
] as const);

export const ACADEMY_ADMISSIONS_DOCUMENT_DEFINITION_IDS = Object.freeze(
  ACADEMY_ADMISSIONS_DOCUMENT_DEFINITIONS.map((d) => d.id)
);

/** @deprecated Prefer priorSchoolRecords — alias for Sprint 011 id consumers. */
export const ACADEMY_ADMISSIONS_LEGACY_TRANSCRIPT_ID =
  "academy.document.admissions.transcript" as const;
