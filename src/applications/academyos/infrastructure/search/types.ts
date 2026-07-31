export type SearchDocument = {
  id: string;
  collection: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
};

export type SearchHit = {
  id: string;
  collection: string;
  score: number;
  title: string;
};

export type SearchProvider = {
  readonly id: "stub" | "memory";
  index(document: SearchDocument): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  query(input: {
    collection?: string;
    text: string;
    limit?: number;
  }): Promise<SearchHit[]>;
};
