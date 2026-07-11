/**
 * Shared Intelligence Context — organization section provider.
 */

import type {
  SharedIntelligenceContextProvider,
  SharedIntelligenceContextRequest,
} from "@/lib/platform/intelligence/context/builder";
import type { IntelligenceMetadata } from "@/lib/platform/intelligence/types";

/** Organization slice of the shared intelligence context. */
export interface OrganizationContextSection {
  readonly available: boolean;
  readonly organizationId: string | null;
  readonly schoolId: string | null;
  readonly organizationName: string | null;
  readonly schoolName: string | null;
  readonly schoolCount: number | null;
  readonly timezone: string | null;
  readonly summary: string | null;
  readonly metadata?: IntelligenceMetadata;
}

/** Optional injected loader — never call external services from the provider itself. */
export interface OrganizationContextProviderDependencies {
  load?: (
    request: SharedIntelligenceContextRequest
  ) => OrganizationContextSection | Promise<OrganizationContextSection>;
}

/** Default empty organization section when no loader is injected. */
export function createEmptyOrganizationContextSection(
  request: SharedIntelligenceContextRequest
): OrganizationContextSection {
  return {
    available: false,
    organizationId: request.organizationId,
    schoolId: request.schoolId,
    organizationName: null,
    schoolName: null,
    schoolCount: null,
    timezone: null,
    summary: null,
  };
}

/**
 * Provides the organization section of SharedIntelligenceContext.
 */
export class OrganizationContextProvider
  implements SharedIntelligenceContextProvider<OrganizationContextSection>
{
  readonly key = "organization";

  constructor(private readonly deps: OrganizationContextProviderDependencies = {}) {}

  async load(request: SharedIntelligenceContextRequest): Promise<OrganizationContextSection> {
    if (this.deps.load) {
      return this.deps.load(request);
    }
    return createEmptyOrganizationContextSection(request);
  }
}
