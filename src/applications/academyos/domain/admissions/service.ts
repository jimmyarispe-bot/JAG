import {
  fail,
  issue,
  newDomainId,
  ok,
  type DomainResult,
} from "@/applications/academyos/domain/shared";
import type {
  ApplicationRecord,
  InquiryRecord,
} from "@/applications/academyos/domain/repositories";

export type CreateInquiryInput = {
  displayName: string;
  email: string;
  phone?: string | null;
  schoolId?: string | null;
  source?: string | null;
  now?: string;
};

export type CreateApplicationInput = {
  displayName: string;
  schoolId: string;
  inquiryId?: string | null;
  studentId?: string | null;
  now?: string;
};

export type AdmissionsDecision = "accept" | "decline";

/** Education admissions policy — no platform / persistence. */
export const AdmissionsDomainService = {
  createInquiry(input: CreateInquiryInput): DomainResult<InquiryRecord> {
    const issues = [];
    if (!input.displayName?.trim()) {
      issues.push(issue("required", "Inquirer name is required", "displayName"));
    }
    if (!input.email?.trim() || !input.email.includes("@")) {
      issues.push(issue("invalid_email", "Valid email is required", "email"));
    }
    if (issues.length) return fail(issues);

    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("inq"),
      displayName: input.displayName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone ?? null,
      schoolId: input.schoolId ?? null,
      source: input.source ?? null,
      status: "inquiry",
      createdAt: now,
      updatedAt: now,
    });
  },

  createApplication(
    input: CreateApplicationInput
  ): DomainResult<ApplicationRecord> {
    const issues = [];
    if (!input.displayName?.trim()) {
      issues.push(issue("required", "Applicant name is required", "displayName"));
    }
    if (!input.schoolId?.trim()) {
      issues.push(issue("required", "School is required", "schoolId"));
    }
    if (issues.length) return fail(issues);

    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("app"),
      displayName: input.displayName.trim(),
      inquiryId: input.inquiryId ?? null,
      studentId: input.studentId ?? null,
      schoolId: input.schoolId,
      submittedOn: now,
      status: "application",
      createdAt: now,
      updatedAt: now,
    });
  },

  decideApplication(
    application: ApplicationRecord,
    decision: AdmissionsDecision
  ): DomainResult<ApplicationRecord> {
    if (application.status === "enrollment" || application.status === "declined") {
      return fail(
        issue("invalid_state", `Application is already ${application.status}`)
      );
    }
    if (!["application", "review", "acceptance"].includes(application.status)) {
      return fail(
        issue(
          "invalid_state",
          `Cannot decide application in status "${application.status}"`
        )
      );
    }
    const next =
      decision === "accept"
        ? { ...application, status: "acceptance" }
        : { ...application, status: "declined" };
    return ok({ ...next, updatedAt: new Date().toISOString() });
  },

  markEnrolled(application: ApplicationRecord): DomainResult<ApplicationRecord> {
    if (application.status !== "acceptance") {
      return fail(
        issue("invalid_state", "Only accepted applications can enroll")
      );
    }
    return ok({
      ...application,
      status: "enrollment",
      updatedAt: new Date().toISOString(),
    });
  },
};
