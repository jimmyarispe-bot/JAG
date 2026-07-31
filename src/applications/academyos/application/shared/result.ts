import type { DomainIssue } from "@/applications/academyos/domain/shared";

export type ApplicationIssue = DomainIssue;

export type ApplicationResult<T> =
  | { ok: true; data: T }
  | { ok: false; issues: ApplicationIssue[] };

export function appOk<T>(data: T): ApplicationResult<T> {
  return { ok: true, data };
}

export function appFail<T = never>(
  issues: ApplicationIssue | ApplicationIssue[]
): ApplicationResult<T> {
  return { ok: false, issues: Array.isArray(issues) ? issues : [issues] };
}

export function fromDomain<T>(
  result: { ok: true; value: T } | { ok: false; issues: DomainIssue[] }
): ApplicationResult<T> {
  return result.ok ? appOk(result.value) : appFail(result.issues);
}
