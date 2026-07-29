export interface RuntimeEvidenceReference {
  source: string;
  id: string;
  retrievedAt: string;
  hash?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

/** Non-empty evidence collection required before Action execution (Law 7). */
export type EvidenceSet = readonly RuntimeEvidenceReference[];
