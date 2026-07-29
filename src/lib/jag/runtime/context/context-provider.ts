import type { RuntimeIdentity } from "../contracts/identity";
import type {
  AvailableContext,
  ContextSelection,
  ContextSnapshot,
} from "./context-types";

/**
 * Contributes discoverable contexts and optional enrichment.
 * Domain packs implement this — Core never interprets domain objects.
 */
export interface ContextProvider {
  id: string;
  priority?: number;
  /**
   * Discover contexts available for this identity.
   * Return [] when this provider has nothing to contribute.
   */
  discover(
    identity: RuntimeIdentity
  ): Promise<readonly AvailableContext[]> | readonly AvailableContext[];
  /**
   * Optionally enrich a resolved snapshot (generic attributes only).
   */
  enrich?(
    identity: RuntimeIdentity,
    snapshot: ContextSnapshot,
    selection?: ContextSelection
  ): Promise<ContextSnapshot> | ContextSnapshot;
}

export function sortContextProviders(
  providers: readonly ContextProvider[]
): ContextProvider[] {
  return [...providers].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
