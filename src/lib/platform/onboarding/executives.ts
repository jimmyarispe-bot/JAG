/**
 * Executive team draft helpers for onboarding.
 * Local typing owns active rows; persistence must merge by stable id.
 */

import type { OnboardingExecutiveMember } from "./types";

export function createExecutiveId(): string {
  return `exec.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 9)}`;
}

export function createExecutiveMember(
  input: Omit<OnboardingExecutiveMember, "id"> & { readonly id?: string }
): OnboardingExecutiveMember {
  return {
    id: input.id ?? createExecutiveId(),
    name: input.name,
    role: input.role,
    email: input.email,
    title: input.title,
  };
}

type ExecutiveInput = Omit<OnboardingExecutiveMember, "id"> & {
  readonly id?: string;
};

export function ensureExecutiveIds(
  executives: readonly ExecutiveInput[]
): OnboardingExecutiveMember[] {
  return executives.map((row, index) => {
    if (row.id) {
      return {
        id: row.id,
        name: row.name,
        role: row.role,
        email: row.email,
        title: row.title,
      };
    }
    const seed = (row.email || row.name || `row-${index}`)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .slice(0, 32);
    return {
      id: `exec.legacy.${index}.${seed || "empty"}`,
      name: row.name,
      role: row.role,
      email: row.email,
      title: row.title,
    };
  });
}

/**
 * Merge executive lists for field-save responses.
 *
 * Critical: server persist() always bumps updatedAt, so wall-clock cannot
 * decide authority. Local non-empty draft fields always win; local-only draft
 * rows are kept; incoming may fill empties or append unknown ids.
 */
export function mergeExecutiveLists(
  local: readonly OnboardingExecutiveMember[],
  incoming: readonly OnboardingExecutiveMember[],
  _localUpdatedAt?: string,
  _incomingUpdatedAt?: string
): OnboardingExecutiveMember[] {
  const localRows = ensureExecutiveIds(local);
  const incomingRows = ensureExecutiveIds(incoming);

  if (localRows.length === 0) return incomingRows;
  if (incomingRows.length === 0) return localRows;

  const incomingById = new Map(incomingRows.map((r) => [r.id, r]));
  const seen = new Set<string>();

  const merged: OnboardingExecutiveMember[] = localRows.map((row) => {
    seen.add(row.id);
    const other = incomingById.get(row.id);
    if (!other) return row;
    return {
      id: row.id,
      name: row.name.trim() ? row.name : other.name,
      role: row.role || other.role,
      email: row.email.trim() ? row.email : other.email,
      title: (row.title ?? "").trim() ? row.title : other.title,
    };
  });

  for (const row of incomingRows) {
    if (!seen.has(row.id)) merged.push(row);
  }
  return merged;
}
