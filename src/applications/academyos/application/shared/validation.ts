import type { ApplicationIssue } from "@/applications/academyos/application/shared/result";

/** AcademyOS business validation helpers (platform form validation stays in JAG). */
export function requireTrimmed(
  value: unknown,
  path: string,
  label: string
): ApplicationIssue | null {
  if (typeof value !== "string" || !value.trim()) {
    return { code: "required", message: `${label} is required`, path };
  }
  return null;
}

export function requirePositiveNumber(
  value: unknown,
  path: string,
  label: string
): ApplicationIssue | null {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    return {
      code: "invalid_number",
      message: `${label} must be a positive number`,
      path,
    };
  }
  return null;
}

export function collectIssues(
  ...candidates: Array<ApplicationIssue | null | undefined>
): ApplicationIssue[] {
  return candidates.filter((i): i is ApplicationIssue => Boolean(i));
}
