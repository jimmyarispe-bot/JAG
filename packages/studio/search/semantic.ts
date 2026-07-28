/**
 * Semantic repository search — concept tokens + catalog keywords.
 */

import { createCatalogService } from "../catalog/indexer";
import type { CatalogEntry } from "../catalog/types";

const CONCEPT_EXPANSIONS: Record<string, readonly string[]> = {
  "student attendance": [
    "attendance",
    "student",
    "sis",
    "present",
    "absent",
  ],
  "insight providers": [
    "insight",
    "provider",
    "executive",
    "intelligence",
    "dashboard",
  ],
  "role permissions": [
    "permission",
    "role",
    "authorization",
    "rbac",
    "scope",
  ],
  tuition: ["tuition", "invoice", "billing", "finance", "scholarship", "payment"],
  payroll: ["payroll", "timesheet", "workforce", "compensation"],
  twin: ["twin", "digital", "mapping", "entity", "person", "document"],
  connector: ["connector", "quickbooks", "sync", "runtime"],
};

export type SearchHit = {
  readonly entry: CatalogEntry;
  readonly score: number;
  readonly matchedOn: readonly string[];
};

export type SearchResult = {
  readonly query: string;
  readonly tokens: readonly string[];
  readonly hits: readonly SearchHit[];
  readonly tookMs: number;
};

function expandQuery(q: string): string[] {
  const normalized = q.trim().toLowerCase();
  const tokens = new Set<string>(
    normalized.split(/[^a-z0-9]+/).filter((t) => t.length > 1)
  );
  for (const [concept, expand] of Object.entries(CONCEPT_EXPANSIONS)) {
    if (normalized.includes(concept) || concept.includes(normalized)) {
      for (const t of expand) tokens.add(t);
    }
  }
  // Partial concept match
  for (const [concept, expand] of Object.entries(CONCEPT_EXPANSIONS)) {
    const conceptTokens = concept.split(/\s+/);
    if (conceptTokens.every((t) => tokens.has(t) || normalized.includes(t))) {
      for (const t of expand) tokens.add(t);
    }
  }
  return [...tokens];
}

function scoreEntry(entry: CatalogEntry, tokens: readonly string[]): SearchHit | null {
  const matched: string[] = [];
  let score = 0;
  const hay = {
    name: entry.name.toLowerCase(),
    path: entry.path.toLowerCase(),
    kind: entry.kind,
    keywords: entry.keywords,
    symbols: entry.symbols.map((s) => s.toLowerCase()),
  };

  for (const t of tokens) {
    if (hay.name.includes(t)) {
      score += 12;
      matched.push(`name:${t}`);
    }
    if (hay.path.includes(t)) {
      score += 6;
      matched.push(`path:${t}`);
    }
    if (hay.kind.includes(t)) {
      score += 8;
      matched.push(`kind:${t}`);
    }
    if (hay.keywords.some((k) => k.includes(t) || t.includes(k))) {
      score += 10;
      matched.push(`keyword:${t}`);
    }
    if (hay.symbols.some((s) => s.includes(t))) {
      score += 9;
      matched.push(`symbol:${t}`);
    }
  }

  if (score <= 0) return null;
  // Boost docs/tests/APIs slightly for discoverability
  if (entry.kind === "doc") score += 2;
  if (entry.kind === "api") score += 3;
  if (entry.kind === "per") score += 4;

  return {
    entry,
    score,
    matchedOn: Object.freeze(matched),
  };
}

export function semanticSearch(input: {
  query: string;
  root?: string;
  kinds?: readonly CatalogEntry["kind"][];
  limit?: number;
  forceIndex?: boolean;
}): SearchResult {
  const started =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();
  const catalog = createCatalogService().index({
    root: input.root,
    force: input.forceIndex,
  });
  const tokens = expandQuery(input.query);
  const hits: SearchHit[] = [];
  for (const entry of catalog.entries) {
    if (input.kinds && !input.kinds.includes(entry.kind)) continue;
    const hit = scoreEntry(entry, tokens);
    if (hit) hits.push(hit);
  }
  hits.sort((a, b) => b.score - a.score);
  const limit = input.limit ?? 40;
  const ended =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  return {
    query: input.query,
    tokens: Object.freeze(tokens),
    hits: Object.freeze(hits.slice(0, limit)),
    tookMs: Math.round((ended - started) * 100) / 100,
  };
}

export function createSearchService() {
  return {
    search: semanticSearch,
  };
}
