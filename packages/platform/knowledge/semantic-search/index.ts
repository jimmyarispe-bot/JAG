import { hashVector } from "../ids";
import { kstore } from "../store";
import type { SearchHit } from "../types";

function cosine(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Vector-ready semantic search over AI-ready index entries. */
export function semanticSearch(input: {
  organizationId: string;
  query: string;
  limit?: number;
}): readonly SearchHit[] {
  const qv = hashVector(input.query);
  const hits = kstore
    .listIndex(input.organizationId)
    .map((entry) => {
      const doc = kstore.getDocument(entry.documentId);
      const score = cosine(qv, entry.vector);
      return {
        documentId: entry.documentId,
        versionId: entry.versionId,
        title: doc?.title ?? entry.documentId,
        score,
        snippet: entry.text.slice(0, 160),
        facets: Object.freeze({
          domain: doc?.domain ?? "general",
          typeKey: doc?.typeKey ?? "general",
        }),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 20);
  return Object.freeze(hits);
}
