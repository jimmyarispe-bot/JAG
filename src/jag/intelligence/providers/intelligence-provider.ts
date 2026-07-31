/**
 * Root provider interface — any reasoning engine participates here.
 */

import type { ProviderCapabilities } from "@/jag/intelligence/providers/capabilities";
import type { IntelligenceProviderRequest } from "@/jag/intelligence/providers/request";
import type { IntelligenceProviderResponse } from "@/jag/intelligence/providers/response";

export type IntelligenceProviderKind =
  | "reasoning"
  | "completion"
  | "embedding"
  | "rule_based"
  | "hybrid";

export type IntelligenceProviderDescriptor = {
  readonly id: string;
  readonly displayName: string;
  readonly kind: IntelligenceProviderKind;
  readonly capabilities: ProviderCapabilities;
  /** Vendor label is informational only — never imported as an SDK. */
  readonly vendorLabel?: string;
};

/**
 * Contract for participating in Executive Intelligence.
 * Implementations live outside the foundation; this module defines shape only.
 */
export type IntelligenceProvider = IntelligenceProviderDescriptor & {
  /**
   * Produce structured EI artifacts from curated inputs.
   * Must not access unrestricted runtime or Platform engines.
   */
  reason(
    request: IntelligenceProviderRequest
  ): Promise<IntelligenceProviderResponse> | IntelligenceProviderResponse;
};
