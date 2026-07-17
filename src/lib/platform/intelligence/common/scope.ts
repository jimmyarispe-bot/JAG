/**
 * Shared graph-scope matching (Stabilization A3).
 *
 * Leaf helper — no domain imports.
 * Null/undefined filter fields act as wildcards (majority domain pattern).
 */

/** Minimal org/school scope used by most intelligence result stores. */
export interface GraphScopeLike {
  organizationId: string | null;
  schoolId: string | null;
}

/**
 * Match a record scope against an optional partial filter.
 * `null` / `undefined` filter fields are wildcards.
 */
export function matchesGraphScope(
  scope: GraphScopeLike,
  filter: Partial<GraphScopeLike>
): boolean {
  return (
    (filter.organizationId == null ||
      scope.organizationId === filter.organizationId) &&
    (filter.schoolId == null || scope.schoolId === filter.schoolId)
  );
}
