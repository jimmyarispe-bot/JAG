/**
 * Shared Intelligence Context — finance section provider.
 */

import type {
  SharedIntelligenceContextProvider,
  SharedIntelligenceContextRequest,
} from "@/lib/platform/intelligence/context/builder";
import type { IntelligenceMetadata } from "@/lib/platform/intelligence/types";

/** Finance slice of the shared intelligence context. */
export interface FinanceContextSection {
  readonly available: boolean;
  readonly organizationId: string | null;
  readonly schoolId: string | null;
  readonly cashPosition: number | null;
  readonly outstandingReceivables: number | null;
  readonly revenueToDate: number | null;
  readonly currency: string | null;
  readonly anomalyFlags: readonly string[];
  readonly summary: string | null;
  readonly metadata?: IntelligenceMetadata;
}

/** Optional injected loader — never call external services from the provider itself. */
export interface FinanceContextProviderDependencies {
  load?: (
    request: SharedIntelligenceContextRequest
  ) => FinanceContextSection | Promise<FinanceContextSection>;
}

/** Default empty finance section when no loader is injected. */
export function createEmptyFinanceContextSection(
  request: SharedIntelligenceContextRequest
): FinanceContextSection {
  return {
    available: false,
    organizationId: request.organizationId,
    schoolId: request.schoolId,
    cashPosition: null,
    outstandingReceivables: null,
    revenueToDate: null,
    currency: null,
    anomalyFlags: [],
    summary: null,
  };
}

/**
 * Provides the finance section of SharedIntelligenceContext.
 */
export class FinanceContextProvider
  implements SharedIntelligenceContextProvider<FinanceContextSection>
{
  readonly key = "finance";

  constructor(private readonly deps: FinanceContextProviderDependencies = {}) {}

  async load(request: SharedIntelligenceContextRequest): Promise<FinanceContextSection> {
    if (this.deps.load) {
      return this.deps.load(request);
    }
    return createEmptyFinanceContextSection(request);
  }
}
