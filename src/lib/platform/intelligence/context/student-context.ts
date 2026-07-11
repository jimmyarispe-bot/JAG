/**
 * Shared Intelligence Context — student section provider.
 */

import type {
  SharedIntelligenceContextProvider,
  SharedIntelligenceContextRequest,
} from "@/lib/platform/intelligence/context/builder";
import type { IntelligenceMetadata } from "@/lib/platform/intelligence/types";

/** Student slice of the shared intelligence context. */
export interface StudentContextSection {
  readonly available: boolean;
  readonly organizationId: string | null;
  readonly schoolId: string | null;
  readonly studentId: string | null;
  readonly enrollmentCount: number | null;
  readonly atRiskCount: number | null;
  readonly attendanceRate: number | null;
  readonly summary: string | null;
  readonly metadata?: IntelligenceMetadata;
}

/** Optional injected loader — never call external services from the provider itself. */
export interface StudentContextProviderDependencies {
  load?: (
    request: SharedIntelligenceContextRequest
  ) => StudentContextSection | Promise<StudentContextSection>;
}

/** Default empty student section when no loader is injected. */
export function createEmptyStudentContextSection(
  request: SharedIntelligenceContextRequest
): StudentContextSection {
  return {
    available: false,
    organizationId: request.organizationId,
    schoolId: request.schoolId,
    studentId: request.studentId ?? null,
    enrollmentCount: null,
    atRiskCount: null,
    attendanceRate: null,
    summary: null,
  };
}

/**
 * Provides the student section of SharedIntelligenceContext.
 */
export class StudentContextProvider
  implements SharedIntelligenceContextProvider<StudentContextSection>
{
  readonly key = "student";

  constructor(private readonly deps: StudentContextProviderDependencies = {}) {}

  async load(request: SharedIntelligenceContextRequest): Promise<StudentContextSection> {
    if (this.deps.load) {
      return this.deps.load(request);
    }
    return createEmptyStudentContextSection(request);
  }
}
