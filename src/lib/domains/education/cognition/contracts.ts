/**
 * Education cognition provider contracts — interfaces only.
 * No algorithms, recommendations engines, or business rules.
 */

import type { CognitiveThinkRequest } from "@/lib/jag/runtime";

/** Opaque Education cognition scope token. */
export type EducationCognitiveScope =
  | "student"
  | "class"
  | "program"
  | "enrollment"
  | "attendance"
  | "progress"
  | "family";

/**
 * Education-specific cognitive provider surface.
 * Implementations (later phases) must still satisfy Runtime CognitiveContributor.
 */
export interface EducationCognitiveProviderContract {
  id: string;
  /** Declared scopes this provider may address — not evaluated here. */
  scopes: readonly EducationCognitiveScope[];
  supports?(request: CognitiveThinkRequest): boolean;
  /** Placeholder gather — foundation returns empty. */
  gatherEvidence?(request: CognitiveThinkRequest): readonly never[] | Promise<readonly never[]>;
  /** Explicitly deferred — no recommend algorithms in D1. */
  recommend?: never;
}
