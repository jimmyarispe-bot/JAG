import type {
  IntentCandidate,
  IntentCatalogEntry,
  IntentResolutionRequest,
  IntentSignal,
} from "./intent-types";

/**
 * Contributes intent candidates and/or catalog entries from signals.
 * Must not call LLMs — AI adapters register as providers later.
 */
export interface IntentProvider {
  id: string;
  priority?: number;
  /** Optional static catalog contribution. */
  catalog?: readonly IntentCatalogEntry[];
  /**
   * Produce candidates from the resolution request + collected signals.
   * Return [] when this provider has nothing to say.
   */
  detect(
    request: IntentResolutionRequest,
    signals: readonly IntentSignal[]
  ): Promise<readonly IntentCandidate[]> | readonly IntentCandidate[];
}

export function sortIntentProviders(
  providers: readonly IntentProvider[]
): IntentProvider[] {
  return [...providers].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
