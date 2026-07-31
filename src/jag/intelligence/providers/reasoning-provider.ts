/**
 * ReasoningProvider — preferred surface for multi-step organizational reasoning.
 */

import type { IntelligenceProvider } from "@/jag/intelligence/providers/intelligence-provider";
import type { IntelligenceProviderRequest } from "@/jag/intelligence/providers/request";
import type { IntelligenceProviderResponse } from "@/jag/intelligence/providers/response";

export type ReasoningProvider = IntelligenceProvider & {
  readonly kind: "reasoning" | "rule_based" | "hybrid";
  reason(
    request: IntelligenceProviderRequest
  ): Promise<IntelligenceProviderResponse> | IntelligenceProviderResponse;
};
