/**
 * CompletionProvider — optional narrower surface for text completion engines.
 * Still must emit structured EI artifacts via the shared response contract.
 */

import type { IntelligenceProvider } from "@/jag/intelligence/providers/intelligence-provider";
import type { IntelligenceProviderRequest } from "@/jag/intelligence/providers/request";
import type { IntelligenceProviderResponse } from "@/jag/intelligence/providers/response";

export type CompletionProvider = IntelligenceProvider & {
  readonly kind: "completion" | "hybrid";
  /**
   * Optional lower-level completion hook. Results must still be mapped
   * into IntelligenceProviderResponse before entering EI contracts.
   */
  complete?(
    request: IntelligenceProviderRequest
  ): Promise<{ readonly text: string }> | { readonly text: string };
  reason(
    request: IntelligenceProviderRequest
  ): Promise<IntelligenceProviderResponse> | IntelligenceProviderResponse;
};
