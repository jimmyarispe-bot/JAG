import { newId, nowIso } from "../ids";
import { semanticSearch } from "../semantic-search";
import { kstore } from "../store";
import type { SavedSearch, SearchHit } from "../types";

export function keywordSearch(input: {
  organizationId: string;
  query: string;
  filters?: Readonly<Record<string, string>>;
  limit?: number;
}): readonly SearchHit[] {
  const q = input.query.trim().toLowerCase();
  const filters = input.filters ?? {};
  const docs = kstore.listDocuments(input.organizationId).filter((d) => {
    if (d.status === "soft_deleted") return false;
    if (filters.domain && d.domain !== filters.domain) return false;
    if (filters.typeKey && d.typeKey !== filters.typeKey) return false;
    if (filters.tag && !d.tags.includes(filters.tag)) return false;
    if (filters.status && d.status !== filters.status) return false;
    if (!q) return true;
    const meta = JSON.stringify(d.metadata).toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q)) ||
      meta.includes(q) ||
      d.typeKey.includes(q)
    );
  });

  const hits = docs.slice(0, input.limit ?? 50).map((d) =>
    Object.freeze({
      documentId: d.id,
      versionId: d.currentVersionId,
      title: d.title,
      score: q && d.title.toLowerCase().includes(q) ? 1 : 0.6,
      snippet: `${d.typeKey} · ${d.domain} · ${d.tags.join(", ")}`,
      facets: Object.freeze({
        domain: d.domain,
        typeKey: d.typeKey,
        status: d.status,
      }),
    })
  );
  return Object.freeze(hits);
}

export function facetedSearch(input: {
  organizationId: string;
  query?: string;
  filters?: Readonly<Record<string, string>>;
}): {
  readonly hits: readonly SearchHit[];
  readonly facets: Readonly<Record<string, Record<string, number>>>;
} {
  const hits = keywordSearch({
    organizationId: input.organizationId,
    query: input.query ?? "",
    filters: input.filters,
  });
  const facets: Record<string, Record<string, number>> = {
    domain: {},
    typeKey: {},
    status: {},
  };
  for (const h of hits) {
    for (const [k, v] of Object.entries(h.facets)) {
      facets[k] ??= {};
      facets[k]![v] = (facets[k]![v] ?? 0) + 1;
    }
  }
  return Object.freeze({ hits, facets: Object.freeze(facets) });
}

export function search(input: {
  organizationId: string;
  query: string;
  mode?: "keyword" | "semantic" | "hybrid";
  filters?: Readonly<Record<string, string>>;
  limit?: number;
}): readonly SearchHit[] {
  const mode = input.mode ?? "hybrid";
  if (mode === "keyword") return keywordSearch(input);
  if (mode === "semantic") return semanticSearch(input);
  const kw = keywordSearch(input);
  const sem = semanticSearch(input);
  const map = new Map<string, SearchHit>();
  for (const h of [...sem, ...kw]) {
    const prev = map.get(h.documentId);
    if (!prev || h.score > prev.score) map.set(h.documentId, h);
  }
  return Object.freeze(
    [...map.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit ?? 50)
  );
}

export function saveSearch(input: {
  organizationId: string;
  userId: string;
  name: string;
  query: string;
  filters?: Readonly<Record<string, string>>;
}): SavedSearch {
  return kstore.upsertSavedSearch({
    id: newId("ksave"),
    organizationId: input.organizationId,
    name: input.name,
    query: input.query,
    filters: Object.freeze({ ...(input.filters ?? {}) }),
    createdBy: input.userId,
    createdAt: nowIso(),
  });
}

export function listSavedSearches(organizationId: string) {
  return kstore.listSavedSearches(organizationId);
}
