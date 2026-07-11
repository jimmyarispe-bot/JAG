/**
 * Shared Intelligence Context — executive section provider.
 */

import type {
  SharedIntelligenceContextProvider,
  SharedIntelligenceContextRequest,
} from "@/lib/platform/intelligence/context/builder";
import type { IntelligenceMetadata } from "@/lib/platform/intelligence/types";

/** Executive slice of the shared intelligence context. */
export interface ExecutiveContextSection {
  readonly available: boolean;
  readonly organizationId: string | null;
  readonly schoolId: string | null;
  readonly highlightKeys: readonly string[];
  readonly riskFlags: readonly string[];
  readonly opportunityFlags: readonly string[];
  readonly summary: string | null;
  readonly metadata?: IntelligenceMetadata;
}

/** Optional injected loader — never call external services from the provider itself. */
export interface ExecutiveContextProviderDependencies {
  load?: (
    request: SharedIntelligenceContextRequest
  ) => ExecutiveContextSection | Promise<ExecutiveContextSection>;
}

/** Default empty executive section when no loader is injected. */
export function createEmptyExecutiveContextSection(
  request: SharedIntelligenceContextRequest
): ExecutiveContextSection {
  return {
    available: false,
    organizationId: request.organizationId,
    schoolId: request.schoolId,
    highlightKeys: [],
    riskFlags: [],
    opportunityFlags: [],
    summary: null,
  };
}

/**
 * Provides the executive section of SharedIntelligenceContext.
 */
export class ExecutiveContextProvider
  implements SharedIntelligenceContextProvider<ExecutiveContextSection>
{
  readonly key = "executive";

  constructor(private readonly deps: ExecutiveContextProviderDependencies = {}) {}

  async load(request: SharedIntelligenceContextRequest): Promise<ExecutiveContextSection> {
    if (this.deps.load) {
      return this.deps.load(request);
    }
    return createEmptyExecutiveContextSection(request);
  }
}
