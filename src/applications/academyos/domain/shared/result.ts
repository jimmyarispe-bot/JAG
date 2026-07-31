export type DomainIssue = {
  code: string;
  message: string;
  path?: string;
};

export type DomainResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: DomainIssue[] };

export function ok<T>(value: T): DomainResult<T> {
  return { ok: true, value };
}

export function fail<T = never>(
  issues: DomainIssue | DomainIssue[]
): DomainResult<T> {
  return { ok: false, issues: Array.isArray(issues) ? issues : [issues] };
}

export function issue(
  code: string,
  message: string,
  path?: string
): DomainIssue {
  return path ? { code, message, path } : { code, message };
}
