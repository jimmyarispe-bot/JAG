/**
 * Knowledge Service — unified search across docs, PERs, releases, optional KG.
 * Consumes Studio documentation / graph read APIs; does not mutate Studio.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDocumentationIntelligence,
  buildKnowledgeGraph,
  getKnowledgeGraph,
  searchGraph,
} from "@studio";
import { listTutorials } from "../store";
import type { KnowledgeHit } from "../types";

function scoreText(query: string, text: string): number {
  const q = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (q.length === 0) return 0;
  const hay = text.toLowerCase();
  let score = 0;
  for (const term of q) {
    if (hay.includes(term)) score += 10;
  }
  return score;
}

function excerpt(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max)}…`;
}

export function buildMrJagKnowledgeIndex(input?: {
  root?: string;
  includeGraph?: boolean;
}): {
  readonly generatedAt: string;
  readonly hitCountEstimate: number;
  readonly sources: readonly string[];
} {
  const root = input?.root ?? process.cwd();
  const docs = buildDocumentationIntelligence(root);
  const sources = [
    "studio.documentation",
    "tutorials.registry",
    "pers",
    "release_notes",
  ];
  if (input?.includeGraph) sources.push("knowledge_graph");
  return {
    generatedAt: new Date().toISOString(),
    hitCountEstimate: docs.docs.length + listTutorials().length,
    sources: Object.freeze(sources),
  };
}

export function searchMrJagKnowledge(input: {
  query: string;
  root?: string;
  includeGraph?: boolean;
  limit?: number;
}): readonly KnowledgeHit[] {
  const root = input.root ?? process.cwd();
  const limit = input.limit ?? 12;
  const hits: KnowledgeHit[] = [];

  const docs = buildDocumentationIntelligence(root);
  for (const entry of docs.docs) {
    const blob = `${entry.title} ${entry.path} ${entry.category}`;
    const s = scoreText(input.query, blob);
    if (s <= 0) continue;
    let body = "";
    const abs = join(/* turbopackIgnore: true */ root, entry.path);
    if (existsSync(/* turbopackIgnore: true */ abs)) {
      try {
        body = readFileSync(/* turbopackIgnore: true */ abs, "utf8").slice(
          0,
          1200
        );
      } catch {
        body = "";
      }
    }
    const kind =
      entry.category === "PER"
        ? ("per" as const)
        : entry.category === "Release"
          ? ("release" as const)
          : ("documentation" as const);
    hits.push({
      id: entry.id,
      title: entry.title,
      excerpt: excerpt(body || entry.title),
      kind,
      path: entry.path,
      score: s + (entry.category === "API" ? 2 : 0),
    });
  }

  for (const t of listTutorials()) {
    const blob = `${t.title} ${t.overview ?? ""} ${t.learningObjectives.join(" ")} ${t.relatedWorkflows.join(" ")}`;
    const s = scoreText(input.query, blob);
    if (s <= 0) continue;
    hits.push({
      id: t.pageId,
      title: t.title,
      excerpt: excerpt(t.overview ?? t.learningObjectives.join("; ")),
      kind: "tutorial",
      path: t.pageId,
      score: s + 5,
    });
  }

  if (input.includeGraph) {
    try {
      const existing = getKnowledgeGraph();
      if (!existing || existing.root !== root) {
        buildKnowledgeGraph({ root, force: false });
      }
      const graphHits = searchGraph({
        q: input.query,
        root,
        limit: 8,
      });
      for (const hit of graphHits) {
        hits.push({
          id: hit.node.id,
          title: hit.node.label,
          excerpt: `Knowledge Graph ${hit.node.kind}`,
          kind: "knowledge_graph",
          path: hit.node.path ?? undefined,
          score: hit.score,
        });
      }
    } catch {
      // Graph optional — help still works from documentation index.
    }
  }

  hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return Object.freeze(hits.slice(0, limit));
}
