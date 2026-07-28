import { randomUUID } from "node:crypto";
import { recordAdmissionsAudit, recordAdmissionsTimeline } from "./audit";
import { emitAdmissionsEvent } from "./events";
import { notifyAdmissions } from "./notifications";
import {
  getApplicant,
  getDocument,
  getRequirements,
  listDocuments,
  listRequirements,
  upsertApplicant,
  upsertDocument,
  upsertRequirement,
} from "./store";
import {
  DOCUMENT_REQUIREMENT_TYPES,
  type ApplicantDocument,
  type DocumentRequirementType,
  type DocumentStatus,
} from "./types";

const DEFAULT_TYPES: readonly DocumentRequirementType[] = [
  "Birth Certificate",
  "Immunization Records",
  "Residency Verification",
  "Parent Identification",
];

export function createDocumentsService() {
  return {
    configureRequirements(input: {
      organizationId: string;
      program: string;
      gradeLevel?: string | null;
      types: readonly DocumentRequirementType[];
    }) {
      const types = input.types.filter((t) =>
        (DOCUMENT_REQUIREMENT_TYPES as readonly string[]).includes(t)
      );
      if (types.length === 0) return { error: "At least one document type required." };
      return upsertRequirement({
        organizationId: input.organizationId,
        program: input.program.trim() || "default",
        gradeLevel: input.gradeLevel ?? null,
        types: Object.freeze(types),
      });
    },

    resolveRequiredTypes(
      organizationId: string,
      program: string,
      gradeLevel: string
    ): readonly DocumentRequirementType[] {
      const cfg =
        getRequirements(organizationId, program, gradeLevel) ??
        getRequirements(organizationId, "default", null);
      return cfg?.types ?? DEFAULT_TYPES;
    },

    listRequirements,

    seedForApplicant(input: {
      organizationId: string;
      applicantId: string;
      types: readonly DocumentRequirementType[];
      actor: string;
    }): readonly ApplicantDocument[] {
      const now = new Date().toISOString();
      const created: ApplicantDocument[] = [];
      for (const type of input.types) {
        const doc = upsertDocument({
          id: randomUUID(),
          organizationId: input.organizationId,
          applicantId: input.applicantId,
          type,
          status: "Required",
          fileName: null,
          reviewedBy: null,
          rejectionReason: null,
          expiresAt: null,
          uploadedAt: null,
          createdAt: now,
          updatedAt: now,
        });
        created.push(doc);
      }
      recordAdmissionsTimeline({
        organizationId: input.organizationId,
        applicantId: input.applicantId,
        kind: "documents_seeded",
        message: `Required documents configured (${created.length}).`,
        actor: input.actor,
      });
      return Object.freeze(created);
    },

    list: listDocuments,

    upload(input: {
      organizationId: string;
      documentId: string;
      fileName: string;
      actor: string;
      expiresAt?: string | null;
    }): ApplicantDocument | { error: string } | null {
      const current = getDocument(input.organizationId, input.documentId);
      if (!current) return null;
      const now = new Date().toISOString();
      const next = upsertDocument({
        ...current,
        status: "Uploaded",
        fileName: input.fileName.trim(),
        uploadedAt: now,
        expiresAt: input.expiresAt ?? current.expiresAt,
        rejectionReason: null,
        updatedAt: now,
      });
      recordAdmissionsAudit({
        organizationId: input.organizationId,
        applicantId: current.applicantId,
        action: "document.uploaded",
        actor: input.actor,
        details: { documentId: next.id, type: next.type },
      });
      recordAdmissionsTimeline({
        organizationId: input.organizationId,
        applicantId: current.applicantId,
        kind: "document_uploaded",
        message: `${next.type} uploaded.`,
        actor: input.actor,
      });
      emitAdmissionsEvent({
        organizationId: input.organizationId,
        entityType: "ApplicantDocument",
        entityId: next.id,
        eventType: "admissions.document_uploaded",
        actor: input.actor,
        metadata: { applicantId: current.applicantId, type: next.type },
      });
      return next;
    },

    review(input: {
      organizationId: string;
      documentId: string;
      status: Extract<DocumentStatus, "Reviewed" | "Approved" | "Rejected">;
      actor: string;
      rejectionReason?: string | null;
    }): ApplicantDocument | { error: string } | null {
      const current = getDocument(input.organizationId, input.documentId);
      if (!current) return null;
      if (
        current.status === "Required" &&
        (input.status === "Approved" || input.status === "Reviewed")
      ) {
        return { error: "Document must be uploaded before review." };
      }
      const now = new Date().toISOString();
      const next = upsertDocument({
        ...current,
        status: input.status,
        reviewedBy: input.actor,
        rejectionReason:
          input.status === "Rejected"
            ? (input.rejectionReason ?? "Rejected")
            : null,
        updatedAt: now,
      });
      recordAdmissionsAudit({
        organizationId: input.organizationId,
        applicantId: current.applicantId,
        action: `document.${input.status.toLowerCase()}`,
        actor: input.actor,
        details: { documentId: next.id },
      });
      recordAdmissionsTimeline({
        organizationId: input.organizationId,
        applicantId: current.applicantId,
        kind: "document_reviewed",
        message: `${next.type} → ${next.status}.`,
        actor: input.actor,
      });

      if (this.hasMissingDocuments(input.organizationId, current.applicantId)) {
        notifyAdmissions({
          organizationId: input.organizationId,
          applicantId: current.applicantId,
          template: "missing_documents",
          title: "Documents still required",
          body: "One or more required documents are missing or rejected.",
        });
      }
      return next;
    },

    hasMissingDocuments(organizationId: string, applicantId: string): boolean {
      const docs = listDocuments(organizationId, applicantId);
      return docs.some(
        (d) =>
          d.status === "Required" ||
          d.status === "Rejected" ||
          d.status === "Uploaded" ||
          d.status === "Reviewed"
      );
    },

    allApproved(organizationId: string, applicantId: string): boolean {
      const docs = listDocuments(organizationId, applicantId);
      return docs.length > 0 && docs.every((d) => d.status === "Approved");
    },

    outstanding(organizationId: string, applicantId?: string) {
      return listDocuments(organizationId, applicantId).filter(
        (d) => d.status !== "Approved"
      );
    },

    syncApplicantRequiredTypes(
      organizationId: string,
      applicantId: string
    ): void {
      const applicant = getApplicant(organizationId, applicantId);
      if (!applicant) return;
      const docs = listDocuments(organizationId, applicantId);
      upsertApplicant({
        ...applicant,
        requiredDocumentTypes: Object.freeze(docs.map((d) => d.type)),
        updatedAt: new Date().toISOString(),
      });
    },
  };
}
