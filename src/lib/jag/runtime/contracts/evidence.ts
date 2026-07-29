export interface RuntimeEvidenceReference {
  source: string;
  id: string;
  retrievedAt: string;
  hash?: string;
  attributes?: Readonly<Record<string, unknown>>;
}
