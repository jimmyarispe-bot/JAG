/**
 * Pipeline refresh metadata (Sprint 068).
 * Workspace always refreshes from intelligence pipeline soft-reads.
 */

export interface RefreshSnapshot {
  source: "intelligence-pipeline";
  refreshedAt: string;
  contributingDomains: string[];
}

export class RefreshEngine {
  snapshot(input: {
    nowIso: string;
    domains: string[];
  }): RefreshSnapshot {
    return {
      source: "intelligence-pipeline",
      refreshedAt: input.nowIso,
      contributingDomains: [...new Set(input.domains)],
    };
  }
}
