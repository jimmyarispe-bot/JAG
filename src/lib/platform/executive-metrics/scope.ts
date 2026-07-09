import type {
  ExecutiveMetricsFilters,
  ExecutiveMetricsScope,
} from "@/lib/platform/executive-metrics/types";

/** Normalize filter aliases into a stable scope object. */
export function resolveExecutiveMetricsScope(
  filters: ExecutiveMetricsFilters = {}
): ExecutiveMetricsScope {
  return {
    networkId: filters.networkId ?? null,
    regionId: filters.regionId ?? null,
    campusId: filters.campusId ?? null,
    programId: filters.programId ?? null,
    program: filters.program ?? null,
    organizationId: filters.organizationId ?? null,
    schoolId: filters.schoolId ?? null,
  };
}

/**
 * School id passed to existing domain loaders.
 * Prefer explicit schoolId; campusId is accepted as an alias when schoolId is absent
 * (many domain services scope by schools.id, not campuses.id).
 */
export function resolveSchoolScopeId(scope: ExecutiveMetricsScope): string | undefined {
  return scope.schoolId ?? scope.campusId ?? undefined;
}

/** True when any hierarchy filter beyond org/school is set (partial support today). */
export function hasExtendedHierarchyFilters(scope: ExecutiveMetricsScope): boolean {
  return Boolean(scope.networkId || scope.regionId || scope.programId || scope.program);
}
