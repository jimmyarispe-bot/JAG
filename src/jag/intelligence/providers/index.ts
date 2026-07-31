/**
 * Intelligence Provider Abstraction v1
 *
 * Provider-agnostic contracts for reasoning engines.
 * No concrete vendor implementations in this module.
 */

export { INTELLIGENCE_PROVIDER_VERSION } from "@/jag/intelligence/providers/version";

export {
  PROVIDER_CAPABILITY_FLAGS,
  capabilitiesSatisfy,
  isProviderCapabilities,
  type ProviderCapabilityFlag,
  type ProviderCapabilities,
  type CapabilityRequirement,
} from "@/jag/intelligence/providers/capabilities";

export {
  isIntelligenceProviderRequest,
  type IntelligenceProviderRequest,
} from "@/jag/intelligence/providers/request";

export {
  isIntelligenceProviderArtifacts,
  isIntelligenceProviderResponse,
  type IntelligenceProviderArtifacts,
  type IntelligenceProviderResponse,
  type ProviderDiagnostics,
} from "@/jag/intelligence/providers/response";

export type {
  IntelligenceProvider,
  IntelligenceProviderDescriptor,
  IntelligenceProviderKind,
} from "@/jag/intelligence/providers/intelligence-provider";

export type { CompletionProvider } from "@/jag/intelligence/providers/completion-provider";
export type { EmbeddingProvider, EmbeddingVector } from "@/jag/intelligence/providers/embedding-provider";
export type { ReasoningProvider } from "@/jag/intelligence/providers/reasoning-provider";

export {
  createProviderRegistry,
  emptyProviderCapabilities,
  type ProviderRegistry,
} from "@/jag/intelligence/providers/registry";

export {
  collectInjectedEvidenceKindIssues,
  validateIntelligenceProvider,
  validateProviderArtifacts,
  validateProviderResponse,
} from "@/jag/intelligence/providers/validation";
