import {
  fail,
  issue,
  newDomainId,
  ok,
  type DomainResult,
} from "@/applications/academyos/domain/shared";
import type {
  ProgramRecord,
  SchoolRecord,
} from "@/applications/academyos/domain/repositories";

export const AdministrationDomainService = {
  createSchool(input: {
    displayName: string;
    code: string;
    organizationId: string;
    now?: string;
  }): DomainResult<SchoolRecord> {
    const issues = [];
    if (!input.displayName?.trim()) {
      issues.push(issue("required", "School name is required", "displayName"));
    }
    if (!input.code?.trim()) {
      issues.push(issue("required", "School code is required", "code"));
    }
    if (!input.organizationId?.trim()) {
      issues.push(
        issue("required", "Organization is required", "organizationId")
      );
    }
    if (issues.length) return fail(issues);

    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("sch"),
      displayName: input.displayName.trim(),
      code: input.code.trim().toUpperCase(),
      organizationId: input.organizationId,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },

  createProgram(input: {
    displayName: string;
    schoolId?: string | null;
    code?: string | null;
    now?: string;
  }): DomainResult<ProgramRecord> {
    if (!input.displayName?.trim()) {
      return fail(issue("required", "Program name is required", "displayName"));
    }
    const now = input.now ?? new Date().toISOString();
    return ok({
      id: newDomainId("prg"),
      displayName: input.displayName.trim(),
      schoolId: input.schoolId ?? null,
      code: input.code?.trim().toUpperCase() ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
};
