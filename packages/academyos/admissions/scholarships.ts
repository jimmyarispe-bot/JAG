/**
 * Scholarship integration for admissions/enrollment.
 */

import { createScholarshipsService } from "../domain/services";
import { createApplicantsService } from "./applicants";
import { recordAdmissionsTimeline } from "./audit";
import { getApplicant } from "./store";
import type { ApplicantScholarshipStatus } from "./types";

export function createAdmissionsScholarshipService() {
  const scholarships = createScholarshipsService();
  const applicants = createApplicantsService();

  return {
    link(input: {
      organizationId: string;
      applicantId: string;
      programName: string;
      amount: number;
      eligibility?: "Eligible" | "Applied" | "Interested";
      documentationStatus?: "Pending" | "Complete";
      actor: string;
    }) {
      const applicant = getApplicant(input.organizationId, input.applicantId);
      if (!applicant) return { error: "Applicant not found." };

      const award = scholarships.create({
        organizationId: input.organizationId,
        name: input.programName,
        amount: input.amount,
        studentId: null,
        createdBy: input.actor,
      });
      if ("error" in award) return award;

      let status: ApplicantScholarshipStatus =
        input.eligibility === "Eligible"
          ? "Eligible"
          : input.eligibility === "Applied"
            ? "Applied"
            : "Interested";
      if (input.documentationStatus === "Pending") {
        status = "Documentation Pending";
      }
      if (input.amount > 0 && status === "Eligible") {
        status = "Awarded";
      }

      const patched = applicants.patch({
        organizationId: input.organizationId,
        applicantId: input.applicantId,
        actor: input.actor,
        scholarshipStatus: status,
        scholarshipId: award.id,
        scholarshipAmount: input.amount,
      });

      recordAdmissionsTimeline({
        organizationId: input.organizationId,
        applicantId: input.applicantId,
        kind: "scholarship_linked",
        message: `Scholarship ${input.programName} linked (${status}).`,
        actor: input.actor,
        metadata: {
          scholarshipId: award.id,
          amount: String(input.amount),
        },
      });

      return { applicant: patched, scholarship: award };
    },

    markAwarded(input: {
      organizationId: string;
      applicantId: string;
      actor: string;
    }) {
      const applicant = getApplicant(input.organizationId, input.applicantId);
      if (!applicant?.scholarshipId) {
        return { error: "No scholarship linked." };
      }
      return applicants.patch({
        organizationId: input.organizationId,
        applicantId: input.applicantId,
        actor: input.actor,
        scholarshipStatus: "Awarded",
      });
    },
  };
}
