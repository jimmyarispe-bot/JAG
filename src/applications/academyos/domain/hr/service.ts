import {
  fail,
  issue,
  newDomainId,
  ok,
  type DomainResult,
} from "@/applications/academyos/domain/shared";
import type { EmployeeRecord } from "@/applications/academyos/domain/repositories";

export const HRDomainService = {
  createApplicant(input: {
    displayName: string;
    email: string;
    jobTitle?: string | null;
    schoolId?: string | null;
    now?: string;
  }): DomainResult<EmployeeRecord> {
    const issues = [];
    if (!input.displayName?.trim()) {
      issues.push(issue("required", "Name is required", "displayName"));
    }
    if (!input.email?.trim() || !input.email.includes("@")) {
      issues.push(issue("invalid_email", "Valid email is required", "email"));
    }
    if (issues.length) return fail(issues);

    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("emp"),
      displayName: input.displayName.trim(),
      email: input.email.trim().toLowerCase(),
      jobTitle: input.jobTitle ?? null,
      schoolId: input.schoolId ?? null,
      status: "applicant",
      hireDate: null,
      createdAt: now,
      updatedAt: now,
    });
  },

  hire(employee: EmployeeRecord, hireDate?: string): DomainResult<EmployeeRecord> {
    if (!["applicant", "interview", "offer", "hire"].includes(employee.status)) {
      return fail(
        issue("invalid_state", `Cannot hire employee in status "${employee.status}"`)
      );
    }
    const now = new Date().toISOString();
    return ok({
      ...employee,
      status: "onboarding",
      hireDate: hireDate ?? now.slice(0, 10),
      updatedAt: now,
    });
  },

  activate(employee: EmployeeRecord): DomainResult<EmployeeRecord> {
    if (!["onboarding", "leave"].includes(employee.status)) {
      return fail(
        issue("invalid_state", `Cannot activate employee in status "${employee.status}"`)
      );
    }
    return ok({
      ...employee,
      status: "active",
      updatedAt: new Date().toISOString(),
    });
  },
};
