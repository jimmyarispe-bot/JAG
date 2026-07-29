/**
 * Enrollment evidence builders — references only, no storage.
 */

import type { CognitiveEvidenceRef } from "@/lib/jag/runtime";
import type {
  EnrollmentDocumentRequirement,
  EnrollmentObservation,
} from "./EnrollmentTypes";

export type EnrollmentEvidenceCode =
  | "missing_transcript"
  | "missing_required_document"
  | "capacity_reached"
  | "capacity_available"
  | "scholarship_approved"
  | "scholarship_pending"
  | "scholarship_review_required"
  | "assessment_incomplete"
  | "assessment_complete"
  | "assessment_pending"
  | "required_signatures_missing"
  | "family_interview_complete"
  | "family_interview_pending"
  | "campus_unassigned"
  | "program_assigned"
  | "documents_complete";

export interface EnrollmentEvidenceItem {
  code: EnrollmentEvidenceCode;
  id: string;
  summary: string;
  severity: "info" | "warning" | "blocking";
  ref: CognitiveEvidenceRef;
}

function ref(
  id: string,
  attributes?: Readonly<Record<string, unknown>>
): CognitiveEvidenceRef {
  return {
    source: "education.enrollment",
    id,
    retrievedAt: new Date().toISOString(),
    attributes,
  };
}

function item(
  code: EnrollmentEvidenceCode,
  enrollmentRequestId: string,
  summary: string,
  severity: EnrollmentEvidenceItem["severity"],
  extra?: Readonly<Record<string, unknown>>
): EnrollmentEvidenceItem {
  const id = `${enrollmentRequestId}:${code}${
    extra?.documentId ? `:${extra.documentId}` : ""
  }`;
  return {
    code,
    id,
    summary,
    severity,
    ref: ref(id, { code, summary, severity, ...extra }),
  };
}

/** Derive evidence items from a normalized enrollment observation. */
export function collectEnrollmentEvidence(
  observation: EnrollmentObservation
): EnrollmentEvidenceItem[] {
  const rid = observation.enrollmentRequestId;
  const items: EnrollmentEvidenceItem[] = [];

  const docs = observation.requiredDocuments ?? [];
  const missingRequired = docs.filter(
    (d) => d.required && (d.status === "missing" || d.status === "rejected")
  );
  for (const doc of missingRequired) {
    const isTranscript =
      doc.kind === "transcript" ||
      doc.documentId.toLowerCase().includes("transcript");
    items.push(
      item(
        isTranscript ? "missing_transcript" : "missing_required_document",
        rid,
        doc.label
          ? `Missing or rejected: ${doc.label}`
          : `Missing required document: ${doc.kind}`,
        "blocking",
        { documentId: doc.documentId, kind: doc.kind }
      )
    );
  }

  if (
    observation.academicHistory &&
    !observation.academicHistory.transcriptOnFile &&
    !missingRequired.some(
      (d) =>
        d.kind === "transcript" ||
        d.documentId.toLowerCase().includes("transcript")
    )
  ) {
    items.push(
      item(
        "missing_transcript",
        rid,
        "Academic transcript not on file",
        "blocking"
      )
    );
  }

  if (
    docs.length > 0 &&
    missingRequired.length === 0 &&
    docs.every((d) => !d.required || d.status === "verified" || d.status === "submitted")
  ) {
    items.push(
      item(
        "documents_complete",
        rid,
        "Required documents are submitted or verified",
        "info"
      )
    );
  }

  const capacity = observation.capacity;
  if (capacity) {
    const available = capacity.seatsFilled < capacity.seatsTotal;
    if (!available) {
      items.push(
        item(
          "capacity_reached",
          rid,
          `Program capacity reached (${capacity.seatsFilled}/${capacity.seatsTotal})`,
          "blocking",
          {
            seatsFilled: capacity.seatsFilled,
            seatsTotal: capacity.seatsTotal,
            waitlistOpen: capacity.waitlistOpen ?? false,
          }
        )
      );
    } else {
      items.push(
        item(
          "capacity_available",
          rid,
          `Capacity available (${capacity.seatsFilled}/${capacity.seatsTotal})`,
          "info",
          {
            seatsFilled: capacity.seatsFilled,
            seatsTotal: capacity.seatsTotal,
          }
        )
      );
    }
  }

  const scholarship = observation.scholarship;
  if (scholarship) {
    if (scholarship.status === "approved") {
      items.push(
        item("scholarship_approved", rid, "Scholarship approved", "info", {
          scholarshipId: scholarship.scholarshipId,
        })
      );
    } else if (scholarship.status === "pending") {
      items.push(
        item(
          "scholarship_pending",
          rid,
          "Scholarship decision pending",
          "warning",
          { scholarshipId: scholarship.scholarshipId }
        )
      );
    } else if (scholarship.status === "review_required") {
      items.push(
        item(
          "scholarship_review_required",
          rid,
          "Scholarship requires manual review",
          "warning",
          { scholarshipId: scholarship.scholarshipId }
        )
      );
    }
  }

  const assessment = observation.assessment;
  if (assessment) {
    if (assessment.status === "complete") {
      items.push(
        item("assessment_complete", rid, "Assessment complete", "info")
      );
    } else if (assessment.status === "pending") {
      items.push(
        item("assessment_pending", rid, "Assessment pending", "blocking")
      );
    } else if (assessment.status === "incomplete") {
      items.push(
        item(
          "assessment_incomplete",
          rid,
          "Assessment incomplete",
          "blocking"
        )
      );
    }
  }

  const interview = observation.interview;
  if (interview) {
    if (interview.status === "complete") {
      items.push(
        item(
          "family_interview_complete",
          rid,
          "Family interview complete",
          "info"
        )
      );
    } else if (
      interview.status === "pending" ||
      interview.status === "scheduled"
    ) {
      items.push(
        item(
          "family_interview_pending",
          rid,
          "Family interview not complete",
          "warning"
        )
      );
    }
  }

  const signatures = observation.signatures ?? [];
  const missingSignatures = signatures.filter((s) => !s.complete);
  if (missingSignatures.length > 0) {
    items.push(
      item(
        "required_signatures_missing",
        rid,
        `Required signatures missing (${missingSignatures
          .map((s) => s.role)
          .join(", ")})`,
        "blocking",
        { roles: missingSignatures.map((s) => s.role) }
      )
    );
  }

  if (!observation.campus) {
    items.push(
      item("campus_unassigned", rid, "Campus not assigned", "warning")
    );
  }

  if (observation.program?.programId) {
    items.push(
      item(
        "program_assigned",
        rid,
        `Program assigned: ${observation.program.name ?? observation.program.programId}`,
        "info",
        { programId: observation.program.programId }
      )
    );
  }

  return items;
}

export function toEvidenceSet(
  items: readonly EnrollmentEvidenceItem[]
): CognitiveEvidenceRef[] {
  return items.map((i) => i.ref);
}

export function missingDocumentKinds(
  docs: readonly EnrollmentDocumentRequirement[]
): string[] {
  return docs
    .filter((d) => d.required && (d.status === "missing" || d.status === "rejected"))
    .map((d) => d.kind);
}
