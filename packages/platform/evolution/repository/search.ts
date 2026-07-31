/**
 * Repository analysis — search existing capabilities before proposing new work.
 * Read-only consumption of docs, tutorials, help, prior evolution; optional KG.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  listIncidents,
  listTutorials,
  searchMrJagKnowledge,
} from "@mr-jag";
import { listRequests } from "../store";
import type {
  EvolutionCaptureRequest,
  RepositoryAnalysis,
  RepositoryHit,
} from "../types";

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "all",
  "you",
  "could",
  "wish",
  "need",
  "help",
  "jag",
  "that",
  "this",
  "from",
  "into",
  "have",
  "platform",
  "product",
  "products",
  "shared",
  "wide",
  "across",
]);

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3 && !STOPWORDS.has(t));
}

function score(queryTokens: string[], text: string): number {
  const hay = text.toLowerCase();
  let s = 0;
  for (const t of queryTokens) {
    if (hay.includes(t)) s += 10;
  }
  return s;
}

function excerpt(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max)}…`;
}

function walkDocs(root: string, rel: string, acc: string[], depth = 0): void {
  if (depth > 4 || acc.length > 80) return;
  const abs = join(root, rel);
  if (!existsSync(abs)) return;
  let entries: string[] = [];
  try {
    entries = readdirSync(abs);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const childRel = join(rel, name).replace(/\\/g, "/");
    const childAbs = join(root, childRel);
    let st;
    try {
      st = statSync(childAbs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkDocs(root, childRel, acc, depth + 1);
    } else if (name.endsWith(".md") || name.endsWith(".ts")) {
      acc.push(childRel);
    }
  }
}

function searchFilesystem(
  root: string,
  queryTokens: string[],
  limit: number
): RepositoryHit[] {
  const paths: string[] = [];
  for (const dir of [
    "docs/platform",
    "docs/studio",
    "src/app/api",
    "packages/platform",
  ]) {
    walkDocs(root, dir, paths);
  }
  const hits: RepositoryHit[] = [];
  for (const p of paths) {
    let body = "";
    try {
      body = readFileSync(join(root, p), "utf8").slice(0, 2000);
    } catch {
      continue;
    }
    const s = score(queryTokens, `${p} ${body}`);
    if (s <= 0) continue;
    const kind: RepositoryHit["kind"] = p.includes("/api/")
      ? "api"
      : p.endsWith(".md")
        ? "documentation"
        : "service";
    hits.push({
      kind,
      id: p,
      title: p.split("/").pop() ?? p,
      excerpt: excerpt(body),
      path: p,
      score: s,
    });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

export function analyzeRepository(input: {
  request: EvolutionCaptureRequest;
  root?: string;
  includeGraph?: boolean;
}): RepositoryAnalysis {
  const root = input.root ?? process.cwd();
  const query = `${input.request.title} ${input.request.description}`;
  const queryTokens = tokens(query);
  const hits: RepositoryHit[] = [];

  try {
    for (const t of listTutorials()) {
      const s = score(
        queryTokens,
        `${t.pageId} ${t.title} ${t.overview ?? ""} ${t.learningObjectives.join(" ")}`
      );
      if (s <= 0) continue;
      hits.push({
        kind: "tutorial",
        id: t.pageId,
        title: t.title,
        excerpt: excerpt(t.overview ?? t.learningObjectives.join("; ")),
        score: s + 5,
      });
    }
  } catch {
    // catalog optional
  }

  try {
    for (const i of listIncidents({
      organizationId: input.request.organizationId,
      limit: 20,
    })) {
      const s = score(queryTokens, `${i.question} ${i.resolution ?? ""}`);
      if (s <= 0) continue;
      hits.push({
        kind: "help_incident",
        id: i.id,
        title: excerpt(i.question, 80),
        excerpt: excerpt(i.resolution ?? i.status),
        score: s,
      });
    }
  } catch {
    // optional
  }

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const selfNorm = normalize(query);

  for (const prev of listRequests({
    organizationId: input.request.organizationId,
    limit: 100,
  })) {
    if (prev.requestId === input.request.requestId) continue;
    const prevText = `${prev.title} ${prev.description}`;
    const prevNorm = normalize(prevText);
    const exactish =
      selfNorm === prevNorm ||
      (selfNorm.length > 24 &&
        (selfNorm.includes(prevNorm) || prevNorm.includes(selfNorm)));
    const s = score(queryTokens, prevText);
    const dupScore = exactish ? Math.max(s, 50) + 25 : s;
    if (dupScore < 25 && !exactish) continue;
    hits.push({
      kind: "evolution_request",
      id: prev.requestId,
      title: prev.title,
      excerpt: excerpt(prev.description),
      score: dupScore + (exactish ? 20 : 15),
    });
  }

  hits.push(...searchFilesystem(root, queryTokens, 12));

  if (input.includeGraph) {
    try {
      for (const h of searchMrJagKnowledge({
        query,
        root,
        includeGraph: true,
        limit: 6,
      })) {
        hits.push({
          kind: "knowledge_graph",
          id: h.id,
          title: h.title,
          excerpt: h.excerpt,
          path: h.path,
          score: 40,
        });
      }
    } catch {
      // graph optional
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const top = hits.slice(0, 20);
  const dupHit = top.find(
    (h) => h.kind === "evolution_request" && h.score >= 45
  );
  const strongExisting = top.filter(
    (h) =>
      (h.kind === "api" ||
        h.kind === "service" ||
        h.kind === "tutorial" ||
        h.kind === "documentation") &&
      h.score >= 40
  );
  const alreadyExists =
    strongExisting.length >= 2 &&
    strongExisting[0]!.score >= 50 &&
    !/\b(bug|broken|missing|doesn't|does not|can't|cannot)\b/i.test(query);
  const partialImplementation = !alreadyExists && strongExisting.length >= 1;
  const reusableCapability =
    strongExisting.length > 0 ||
    top.some((h) => h.kind === "tutorial" && h.score >= 20);

  let summary: string;
  if (dupHit) {
    summary = `Likely duplicate of existing Evolution request ${dupHit.id}.`;
  } else if (alreadyExists) {
    summary =
      "Repository evidence suggests this capability already exists or is substantially covered.";
  } else if (partialImplementation) {
    summary =
      "Partial implementation found — prefer extending reusable components over greenfield work.";
  } else {
    summary =
      "No strong existing match; a governed proposal may be appropriate.";
  }

  return {
    requestId: input.request.requestId,
    query,
    hits: Object.freeze(top),
    alreadyExists,
    partialImplementation,
    duplicateRequest: Boolean(dupHit),
    duplicateOfRequestId: dupHit?.id ?? null,
    reusableCapability,
    summary,
    searchedAt: new Date().toISOString(),
  };
}
