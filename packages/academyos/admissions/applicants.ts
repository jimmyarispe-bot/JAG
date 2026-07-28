/**
 * Applicant lifecycle — create, transition, search.
 */

import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { recordAdmissionsAudit, recordAdmissionsTimeline } from "./audit";
import { createDocumentsService } from "./documents";
import { findDuplicateApplicants } from "./duplicates";
import { emitAdmissionsEvent } from "./events";
import { notifyAdmissions } from "./notifications";
import { canTransitionStage, isAdmissionsStage } from "./pipeline";
import {
  getApplicant,
  listApplicants,
  upsertApplicant,
} from "./store";
import type {
  AcademyApplicant,
  AdmissionsStage,
  ApplicantScholarshipStatus,
  AssessmentStatus,
  DuplicateMatch,
  GuardianInfo,
  StudentInfo,
} from "./types";

export type CreateApplicantInput = {
  organizationId: string;
  student: StudentInfo;
  guardian: GuardianInfo;
  schoolId?: string | null;
  schoolName?: string | null;
  program: string;
  gradeLevel: string;
  assignedAdvisor?: string | null;
  createdBy: string;
  /** When true, create even if duplicates found. */
  force?: boolean;
};

export function createApplicantsService() {
  const documents = createDocumentsService();

  const service = {
    findDuplicates: findDuplicateApplicants,

    create(
      input: CreateApplicantInput
    ):
      | AcademyApplicant
      | { error: string; duplicates?: readonly DuplicateMatch[] } {
      if (!input.student.firstName.trim() || !input.student.lastName.trim()) {
        return { error: "Student first and last name are required." };
      }
      if (!input.student.dateOfBirth.trim()) {
        return { error: "Date of birth is required." };
      }
      if (!input.guardian.email.trim() || !input.guardian.phone.trim()) {
        return { error: "Parent email and phone are required." };
      }

      const duplicates = findDuplicateApplicants({
        organizationId: input.organizationId,
        student: input.student,
        guardian: input.guardian,
      });
      if (duplicates.length > 0 && !input.force) {
        return {
          error: "Possible duplicate applicants found.",
          duplicates,
        };
      }

      const now = new Date().toISOString();
      const id = randomUUID();
      const program = input.program.trim() || "General";
      const gradeLevel =
        input.gradeLevel.trim() || input.student.gradeLevel.trim() || "K";
      const requiredTypes = documents.resolveRequiredTypes(
        input.organizationId,
        program,
        gradeLevel
      );

      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Student",
        twinEntityType: "Person",
        id,
        label: `${input.student.firstName.trim()} ${input.student.lastName.trim()}`,
        kind: "applicant",
        actor: input.createdBy,
        metadata: {
          stage: "Inquiry",
          program,
          gradeLevel,
        },
      });

      const applicant: AcademyApplicant = {
        id,
        organizationId: input.organizationId,
        student: {
          firstName: input.student.firstName.trim(),
          lastName: input.student.lastName.trim(),
          dateOfBirth: input.student.dateOfBirth.trim(),
          gradeLevel,
          email: input.student.email ?? null,
        },
        guardian: {
          firstName: input.guardian.firstName.trim(),
          lastName: input.guardian.lastName.trim(),
          email: input.guardian.email.trim(),
          phone: input.guardian.phone.trim(),
          relationship: input.guardian.relationship.trim() || "Parent",
        },
        schoolId: input.schoolId ?? null,
        schoolName: input.schoolName ?? null,
        program,
        gradeLevel,
        stage: "Inquiry",
        assignedAdvisor: input.assignedAdvisor ?? null,
        scholarshipStatus: "None",
        scholarshipId: null,
        scholarshipAmount: 0,
        assessmentStatus: "Awaiting Schedule",
        assessmentScheduledAt: null,
        enrollmentStatus: "Not Started",
        enrollmentWizardId: null,
        parentAccessToken: randomUUID().replace(/-/g, ""),
        requiredDocumentTypes: Object.freeze([...requiredTypes]),
        twinEntityId: twinId,
        inquiredAt: now,
        submittedAt: null,
        acceptedAt: null,
        enrolledAt: null,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      };

      upsertApplicant(applicant);
      documents.seedForApplicant({
        organizationId: input.organizationId,
        applicantId: id,
        types: requiredTypes,
        actor: input.createdBy,
      });

      recordAdmissionsAudit({
        organizationId: input.organizationId,
        applicantId: id,
        action: "applicant.created",
        actor: input.createdBy,
        details: { stage: "Inquiry" },
      });
      recordAdmissionsTimeline({
        organizationId: input.organizationId,
        applicantId: id,
        kind: "created",
        message: "Inquiry created.",
        actor: input.createdBy,
      });
      emitAdmissionsEvent({
        organizationId: input.organizationId,
        entityType: "AcademyApplicant",
        entityId: id,
        eventType: "admissions.applicant_created",
        actor: input.createdBy,
        metadata: { stage: "Inquiry" },
      });
      notifyAdmissions({
        organizationId: input.organizationId,
        applicantId: id,
        template: "application_received",
        title: "Application inquiry received",
        body: "We received your inquiry. You can track status in the parent portal.",
      });

      return applicant;
    },

    get: getApplicant,
    list: listApplicants,

    search(input: {
      organizationId: string;
      q?: string;
      stage?: AdmissionsStage;
      schoolId?: string;
      program?: string;
    }): readonly AcademyApplicant[] {
      const q = (input.q ?? "").trim().toLowerCase();
      return Object.freeze(
        listApplicants(input.organizationId).filter((a) => {
          if (input.stage && a.stage !== input.stage) return false;
          if (input.schoolId && a.schoolId !== input.schoolId) return false;
          if (input.program && a.program !== input.program) return false;
          if (!q) return true;
          const hay = [
            a.student.firstName,
            a.student.lastName,
            a.guardian.email,
            a.guardian.phone,
            a.program,
            a.assignedAdvisor ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
      );
    },

    transition(input: {
      organizationId: string;
      applicantId: string;
      stage: AdmissionsStage;
      actor: string;
    }): AcademyApplicant | { error: string } | null {
      const current = getApplicant(input.organizationId, input.applicantId);
      if (!current) return null;
      if (!isAdmissionsStage(input.stage)) {
        return { error: "Invalid stage." };
      }
      if (!canTransitionStage(current.stage, input.stage)) {
        return {
          error: `Cannot transition from ${current.stage} to ${input.stage}.`,
        };
      }

      const now = new Date().toISOString();
      let next: AcademyApplicant = {
        ...current,
        stage: input.stage,
        updatedAt: now,
        submittedAt:
          input.stage === "Application Submitted"
            ? now
            : current.submittedAt,
        acceptedAt:
          input.stage === "Accepted" ? now : current.acceptedAt,
        enrolledAt:
          input.stage === "Enrolled" ? now : current.enrolledAt,
        assessmentStatus:
          input.stage === "Assessment Scheduled"
            ? "Scheduled"
            : input.stage === "Assessment Complete"
              ? "Complete"
              : current.assessmentStatus,
        enrollmentStatus:
          input.stage === "Enrollment Pending"
            ? current.enrollmentStatus === "Not Started"
              ? "In Progress"
              : current.enrollmentStatus
            : input.stage === "Enrolled"
              ? "Complete"
              : current.enrollmentStatus,
      };

      upsertApplicant(next);

      recordAdmissionsAudit({
        organizationId: input.organizationId,
        applicantId: next.id,
        action: "applicant.stage_changed",
        actor: input.actor,
        details: { from: current.stage, to: input.stage },
      });
      recordAdmissionsTimeline({
        organizationId: input.organizationId,
        applicantId: next.id,
        kind: "stage_changed",
        message: `Stage ${current.stage} → ${input.stage}.`,
        actor: input.actor,
        metadata: { from: current.stage, to: input.stage },
      });
      emitAdmissionsEvent({
        organizationId: input.organizationId,
        entityType: "AcademyApplicant",
        entityId: next.id,
        eventType: "admissions.stage_changed",
        actor: input.actor,
        metadata: { from: current.stage, to: input.stage },
      });

      if (input.stage === "Accepted") {
        notifyAdmissions({
          organizationId: input.organizationId,
          applicantId: next.id,
          template: "acceptance",
          title: "Congratulations — accepted",
          body: "Your application was accepted. Complete enrollment in the parent portal.",
        });
      }
      if (input.stage === "Enrollment Pending") {
        notifyAdmissions({
          organizationId: input.organizationId,
          applicantId: next.id,
          template: "enrollment_reminder",
          title: "Enrollment reminder",
          body: "Please complete the enrollment wizard to finish registration.",
        });
      }
      if (input.stage === "Enrolled") {
        notifyAdmissions({
          organizationId: input.organizationId,
          applicantId: next.id,
          template: "enrollment_completed",
          title: "Enrollment complete",
          body: "Welcome! Enrollment is complete for the first day of school.",
        });
      }
      if (input.stage === "Assessment Scheduled") {
        notifyAdmissions({
          organizationId: input.organizationId,
          applicantId: next.id,
          template: "assessment_scheduled",
          title: "Assessment scheduled",
          body: "An assessment has been scheduled for your applicant.",
        });
      }

      return next;
    },

    patch(input: {
      organizationId: string;
      applicantId: string;
      actor: string;
      assignedAdvisor?: string | null;
      scholarshipStatus?: ApplicantScholarshipStatus;
      scholarshipId?: string | null;
      scholarshipAmount?: number;
      assessmentStatus?: AssessmentStatus;
      assessmentScheduledAt?: string | null;
      schoolId?: string | null;
      schoolName?: string | null;
      program?: string;
    }): AcademyApplicant | null {
      const current = getApplicant(input.organizationId, input.applicantId);
      if (!current) return null;
      const now = new Date().toISOString();
      const next = upsertApplicant({
        ...current,
        assignedAdvisor:
          input.assignedAdvisor !== undefined
            ? input.assignedAdvisor
            : current.assignedAdvisor,
        scholarshipStatus:
          input.scholarshipStatus ?? current.scholarshipStatus,
        scholarshipId:
          input.scholarshipId !== undefined
            ? input.scholarshipId
            : current.scholarshipId,
        scholarshipAmount:
          input.scholarshipAmount ?? current.scholarshipAmount,
        assessmentStatus: input.assessmentStatus ?? current.assessmentStatus,
        assessmentScheduledAt:
          input.assessmentScheduledAt !== undefined
            ? input.assessmentScheduledAt
            : current.assessmentScheduledAt,
        schoolId:
          input.schoolId !== undefined ? input.schoolId : current.schoolId,
        schoolName:
          input.schoolName !== undefined
            ? input.schoolName
            : current.schoolName,
        program: input.program?.trim() || current.program,
        updatedAt: now,
      });
      recordAdmissionsAudit({
        organizationId: input.organizationId,
        applicantId: next.id,
        action: "applicant.updated",
        actor: input.actor,
      });
      return next;
    },

    scheduleAssessment(input: {
      organizationId: string;
      applicantId: string;
      scheduledAt: string;
      actor: string;
    }): AcademyApplicant | { error: string } | null {
      const current = getApplicant(input.organizationId, input.applicantId);
      if (!current) return null;
      service.patch({
        organizationId: input.organizationId,
        applicantId: input.applicantId,
        actor: input.actor,
        assessmentStatus: "Scheduled",
        assessmentScheduledAt: input.scheduledAt,
      });
      const transitioned = service.transition({
        organizationId: input.organizationId,
        applicantId: input.applicantId,
        stage: "Assessment Scheduled",
        actor: input.actor,
      });
      return transitioned;
    },
  };

  return service;
}
