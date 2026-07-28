import { randomUUID } from "node:crypto";
import { projectAcademyEntityToTwin } from "../twin/project";
import { recordStudentAudit, recordStudentTimeline } from "./audit";
import { emitSisEvent } from "./events";
import { createFamiliesService } from "./families";
import {
  canTransitionStudentStatus,
  isStudentLifecycleStatus,
} from "./lifecycle";
import {
  findStudentByApplicant,
  getStudent,
  listStudents,
  upsertStudent,
} from "./store";
import type {
  SisStudent,
  StudentAcademic,
  StudentIdentity,
  StudentLifecycleStatus,
  StudentMedical,
} from "./types";

const EMPTY_MEDICAL: StudentMedical = {
  allergies: "",
  medications: "",
  physician: "",
  insurance: "",
  emergencyProcedures: "",
  medicalAlerts: "",
};

const EMPTY_ACADEMIC: StudentAcademic = {
  currentCourseIds: Object.freeze([]),
  historicalCourseIds: Object.freeze([]),
  readingLevel: null,
  writingLevel: null,
  mathLevel: null,
  structuredLiteracyLevel: null,
  credits: 0,
  graduationRequirementsMet: 0,
  graduationRequirementsTotal: 24,
};

export type CreateSisStudentInput = {
  organizationId: string;
  identity: Omit<StudentIdentity, "internalAcademyId"> & {
    internalAcademyId?: string;
  };
  gradeLevel: string;
  campusId?: string | null;
  campusName?: string | null;
  program: string;
  status?: StudentLifecycleStatus;
  enrollmentDate?: string | null;
  graduationTarget?: string | null;
  applicantId?: string | null;
  parentAccessToken?: string;
  medical?: Partial<StudentMedical>;
  academic?: Partial<StudentAcademic>;
  createdBy: string;
};

export function createSisStudentsService() {
  const service = {
    create(input: CreateSisStudentInput): SisStudent | { error: string } {
      if (!input.identity.legalFirstName.trim() || !input.identity.legalLastName.trim()) {
        return { error: "Legal first and last name are required." };
      }
      if (!input.identity.dateOfBirth.trim()) {
        return { error: "Date of birth is required." };
      }
      if (input.applicantId) {
        const existing = findStudentByApplicant(
          input.organizationId,
          input.applicantId
        );
        if (existing) return existing;
      }

      const now = new Date().toISOString();
      const id = randomUUID();
      const internalAcademyId =
        input.identity.internalAcademyId?.trim() ||
        `AOS-${id.slice(0, 8).toUpperCase()}`;
      const preferred =
        input.identity.preferredName.trim() ||
        `${input.identity.legalFirstName.trim()} ${input.identity.legalLastName.trim()}`;

      const twinId = projectAcademyEntityToTwin({
        organizationId: input.organizationId,
        academyEntity: "Student",
        twinEntityType: "Person",
        id,
        label: preferred,
        kind: "sis_student",
        actor: input.createdBy,
        metadata: {
          status: input.status ?? "Enrolled",
          gradeLevel: input.gradeLevel,
          program: input.program,
          internalAcademyId,
        },
      });

      const student: SisStudent = {
        id,
        organizationId: input.organizationId,
        identity: {
          preferredName: preferred,
          legalFirstName: input.identity.legalFirstName.trim(),
          legalLastName: input.identity.legalLastName.trim(),
          dateOfBirth: input.identity.dateOfBirth.trim(),
          stateStudentId: input.identity.stateStudentId ?? null,
          internalAcademyId,
        },
        status: input.status ?? "Enrolled",
        gradeLevel: input.gradeLevel.trim() || "K",
        campusId: input.campusId ?? null,
        campusName: input.campusName ?? null,
        program: input.program.trim() || "General",
        enrollmentDate: input.enrollmentDate ?? now.slice(0, 10),
        graduationTarget: input.graduationTarget ?? null,
        applicantId: input.applicantId ?? null,
        medical: { ...EMPTY_MEDICAL, ...(input.medical ?? {}) },
        academic: {
          ...EMPTY_ACADEMIC,
          ...(input.academic ?? {}),
          currentCourseIds: Object.freeze([
            ...(input.academic?.currentCourseIds ?? []),
          ]),
          historicalCourseIds: Object.freeze([
            ...(input.academic?.historicalCourseIds ?? []),
          ]),
        },
        parentAccessToken:
          input.parentAccessToken ?? randomUUID().replace(/-/g, ""),
        twinEntityId: twinId,
        createdAt: now,
        updatedAt: now,
        createdBy: input.createdBy,
      };

      upsertStudent(student);
      recordStudentAudit({
        organizationId: input.organizationId,
        studentId: id,
        action: "student.created",
        actor: input.createdBy,
        details: { status: student.status },
      });
      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: id,
        kind: "enrollment",
        message: `Student record created (${student.status}).`,
        actor: input.createdBy,
      });
      emitSisEvent({
        organizationId: input.organizationId,
        entityType: "SisStudent",
        entityId: id,
        eventType: "student_created",
        actor: input.createdBy,
        metadata: { status: student.status },
      });
      return student;
    },

    get: getStudent,
    list: listStudents,
    findByApplicant: findStudentByApplicant,

    search(input: {
      organizationId: string;
      q?: string;
      status?: StudentLifecycleStatus;
      campusId?: string;
      program?: string;
      gradeLevel?: string;
    }): readonly SisStudent[] {
      const q = (input.q ?? "").trim().toLowerCase();
      return Object.freeze(
        listStudents(input.organizationId).filter((s) => {
          if (input.status && s.status !== input.status) return false;
          if (input.campusId && s.campusId !== input.campusId) return false;
          if (input.program && s.program !== input.program) return false;
          if (input.gradeLevel && s.gradeLevel !== input.gradeLevel)
            return false;
          if (!q) return true;
          const hay = [
            s.identity.preferredName,
            s.identity.legalFirstName,
            s.identity.legalLastName,
            s.identity.internalAcademyId,
            s.identity.stateStudentId ?? "",
            s.program,
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
      );
    },

    transition(input: {
      organizationId: string;
      studentId: string;
      status: StudentLifecycleStatus;
      actor: string;
    }): SisStudent | { error: string } | null {
      const current = getStudent(input.organizationId, input.studentId);
      if (!current) return null;
      if (!isStudentLifecycleStatus(input.status)) {
        return { error: "Invalid student status." };
      }
      if (!canTransitionStudentStatus(current.status, input.status)) {
        return {
          error: `Cannot transition from ${current.status} to ${input.status}.`,
        };
      }
      const now = new Date().toISOString();
      const next = upsertStudent({
        ...current,
        status: input.status,
        updatedAt: now,
      });
      recordStudentAudit({
        organizationId: input.organizationId,
        studentId: next.id,
        action: "student.status_changed",
        actor: input.actor,
        details: { from: current.status, to: input.status },
      });
      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: next.id,
        kind: "status_changed",
        message: `Lifecycle ${current.status} → ${input.status}.`,
        actor: input.actor,
        metadata: { from: current.status, to: input.status },
      });
      emitSisEvent({
        organizationId: input.organizationId,
        entityType: "SisStudent",
        entityId: next.id,
        eventType: "status_changed",
        actor: input.actor,
        metadata: { from: current.status, to: input.status },
      });
      return next;
    },

    patch(input: {
      organizationId: string;
      studentId: string;
      actor: string;
      gradeLevel?: string;
      campusId?: string | null;
      campusName?: string | null;
      program?: string;
      graduationTarget?: string | null;
      medical?: Partial<StudentMedical>;
      academic?: Partial<StudentAcademic>;
      identity?: Partial<StudentIdentity>;
    }): SisStudent | null {
      const current = getStudent(input.organizationId, input.studentId);
      if (!current) return null;
      const now = new Date().toISOString();
      const next = upsertStudent({
        ...current,
        gradeLevel: input.gradeLevel ?? current.gradeLevel,
        campusId:
          input.campusId !== undefined ? input.campusId : current.campusId,
        campusName:
          input.campusName !== undefined
            ? input.campusName
            : current.campusName,
        program: input.program?.trim() || current.program,
        graduationTarget:
          input.graduationTarget !== undefined
            ? input.graduationTarget
            : current.graduationTarget,
        medical: { ...current.medical, ...(input.medical ?? {}) },
        academic: {
          ...current.academic,
          ...(input.academic ?? {}),
          currentCourseIds: Object.freeze([
            ...(input.academic?.currentCourseIds ??
              current.academic.currentCourseIds),
          ]),
          historicalCourseIds: Object.freeze([
            ...(input.academic?.historicalCourseIds ??
              current.academic.historicalCourseIds),
          ]),
        },
        identity: { ...current.identity, ...(input.identity ?? {}) },
        updatedAt: now,
      });
      recordStudentAudit({
        organizationId: input.organizationId,
        studentId: next.id,
        action: "student.updated",
        actor: input.actor,
      });
      return next;
    },

    /** Promote an enrolled applicant into the SIS master record. */
    promoteFromApplicant(input: {
      organizationId: string;
      applicantId: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      gradeLevel: string;
      program: string;
      campusId?: string | null;
      campusName?: string | null;
      parentAccessToken?: string;
      guardian?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        relationship: string;
      };
      createdBy: string;
    }): SisStudent | { error: string } {
      const existing = findStudentByApplicant(
        input.organizationId,
        input.applicantId
      );
      if (existing) return existing;

      const student = service.create({
        organizationId: input.organizationId,
        identity: {
          preferredName: `${input.firstName} ${input.lastName}`,
          legalFirstName: input.firstName,
          legalLastName: input.lastName,
          dateOfBirth: input.dateOfBirth,
          stateStudentId: null,
        },
        gradeLevel: input.gradeLevel,
        campusId: input.campusId,
        campusName: input.campusName,
        program: input.program,
        status: "Active",
        applicantId: input.applicantId,
        parentAccessToken: input.parentAccessToken,
        createdBy: input.createdBy,
      });
      if ("error" in student) return student;

      if (input.guardian) {
        createFamiliesService().add({
          organizationId: input.organizationId,
          studentId: student.id,
          kind: "Parent",
          firstName: input.guardian.firstName,
          lastName: input.guardian.lastName,
          email: input.guardian.email,
          phone: input.guardian.phone,
          relationship: input.guardian.relationship,
          custodyFlag: true,
          communicationPreference: "email",
          financialResponsibility: true,
          createdBy: input.createdBy,
        });
      }

      recordStudentTimeline({
        organizationId: input.organizationId,
        studentId: student.id,
        kind: "enrollment",
        message: "Promoted from admissions enrollment.",
        actor: input.createdBy,
        metadata: { applicantId: input.applicantId },
      });
      return student;
    },
  };

  return service;
}
