import { randomUUID } from "node:crypto";
import { createSisStudentsService } from "../sis/students";
import { createApplicantsService } from "./applicants";
import { recordAdmissionsAudit, recordAdmissionsTimeline } from "./audit";
import { emitAdmissionsEvent } from "./events";
import {
  getApplicant,
  getWizard,
  getWizardByApplicant,
  upsertApplicant,
  upsertWizard,
} from "./store";
import {
  ENROLLMENT_WIZARD_SECTIONS,
  type EnrollmentWizardSection,
  type EnrollmentWizardState,
} from "./types";

function nextSection(
  current: EnrollmentWizardSection
): EnrollmentWizardSection | null {
  const i = ENROLLMENT_WIZARD_SECTIONS.indexOf(current);
  if (i < 0 || i >= ENROLLMENT_WIZARD_SECTIONS.length - 1) return null;
  return ENROLLMENT_WIZARD_SECTIONS[i + 1]!;
}

export function createEnrollmentWizardService() {
  const applicants = createApplicantsService();

  return {
    start(input: {
      organizationId: string;
      applicantId: string;
      actor: string;
    }): EnrollmentWizardState | { error: string } {
      const applicant = getApplicant(input.organizationId, input.applicantId);
      if (!applicant) return { error: "Applicant not found." };
      if (
        applicant.stage !== "Accepted" &&
        applicant.stage !== "Enrollment Pending"
      ) {
        return {
          error: "Enrollment wizard requires Accepted or Enrollment Pending.",
        };
      }

      const existing = getWizardByApplicant(
        input.organizationId,
        input.applicantId
      );
      if (existing && existing.status !== "Accepted") return existing;

      const now = new Date().toISOString();
      const wizard = upsertWizard({
        id: randomUUID(),
        organizationId: input.organizationId,
        applicantId: input.applicantId,
        currentSection: "Student Information",
        completedSections: Object.freeze([]),
        data: Object.freeze({}),
        status: "In Progress",
        createdAt: now,
        updatedAt: now,
      });

      upsertApplicant({
        ...applicant,
        enrollmentWizardId: wizard.id,
        enrollmentStatus: "In Progress",
        updatedAt: now,
      });

      if (applicant.stage === "Accepted") {
        applicants.transition({
          organizationId: input.organizationId,
          applicantId: input.applicantId,
          stage: "Enrollment Pending",
          actor: input.actor,
        });
      }

      recordAdmissionsTimeline({
        organizationId: input.organizationId,
        applicantId: input.applicantId,
        kind: "enrollment_started",
        message: "Enrollment wizard started.",
        actor: input.actor,
      });
      return wizard;
    },

    get: getWizard,
    getByApplicant: getWizardByApplicant,

    save(input: {
      organizationId: string;
      wizardId: string;
      actor: string;
      section?: EnrollmentWizardSection;
      data?: Record<string, string>;
      completeSection?: boolean;
    }): EnrollmentWizardState | { error: string } | null {
      const current = getWizard(input.organizationId, input.wizardId);
      if (!current) return null;
      if (current.status === "Accepted") {
        return { error: "Wizard already completed." };
      }

      const section = input.section ?? current.currentSection;
      const merged = {
        ...current.data,
        ...(input.data ?? {}),
      };
      let completed = [...current.completedSections];
      let currentSection = section;

      if (input.completeSection && !completed.includes(section)) {
        completed.push(section);
        const nxt = nextSection(section);
        if (nxt) currentSection = nxt;
      }

      const now = new Date().toISOString();
      const next = upsertWizard({
        ...current,
        currentSection,
        completedSections: Object.freeze(completed),
        data: Object.freeze(merged),
        updatedAt: now,
      });

      recordAdmissionsAudit({
        organizationId: input.organizationId,
        applicantId: current.applicantId,
        action: "enrollment.wizard_saved",
        actor: input.actor,
        details: { section, wizardId: next.id },
      });
      return next;
    },

    submit(input: {
      organizationId: string;
      wizardId: string;
      actor: string;
    }): EnrollmentWizardState | { error: string } | null {
      const current = getWizard(input.organizationId, input.wizardId);
      if (!current) return null;

      const missing = ENROLLMENT_WIZARD_SECTIONS.filter(
        (s) => s !== "Final Review" && !current.completedSections.includes(s)
      );
      if (missing.length > 0) {
        return {
          error: `Complete sections before submit: ${missing.join(", ")}.`,
        };
      }

      const now = new Date().toISOString();
      const next = upsertWizard({
        ...current,
        currentSection: "Final Review",
        completedSections: Object.freeze([...ENROLLMENT_WIZARD_SECTIONS]),
        status: "Submitted",
        updatedAt: now,
      });

      const enrolled = applicants.transition({
        organizationId: input.organizationId,
        applicantId: current.applicantId,
        stage: "Enrolled",
        actor: input.actor,
      });
      if (enrolled && "error" in enrolled) return enrolled;

      const applicant = getApplicant(
        input.organizationId,
        current.applicantId
      );
      if (applicant) {
        createSisStudentsService().promoteFromApplicant({
          organizationId: input.organizationId,
          applicantId: applicant.id,
          firstName: applicant.student.firstName,
          lastName: applicant.student.lastName,
          dateOfBirth: applicant.student.dateOfBirth,
          gradeLevel: applicant.gradeLevel,
          program: applicant.program,
          campusId: applicant.schoolId,
          campusName: applicant.schoolName,
          parentAccessToken: applicant.parentAccessToken,
          guardian: applicant.guardian,
          createdBy: input.actor,
        });
      }

      const finalized = upsertWizard({
        ...next,
        status: "Accepted",
        updatedAt: new Date().toISOString(),
      });

      emitAdmissionsEvent({
        organizationId: input.organizationId,
        entityType: "EnrollmentWizard",
        entityId: finalized.id,
        eventType: "admissions.enrollment_completed",
        actor: input.actor,
        metadata: { applicantId: current.applicantId },
      });
      recordAdmissionsTimeline({
        organizationId: input.organizationId,
        applicantId: current.applicantId,
        kind: "enrollment_completed",
        message: "Enrollment wizard submitted — student enrolled.",
        actor: input.actor,
      });
      return finalized;
    },
  };
}
