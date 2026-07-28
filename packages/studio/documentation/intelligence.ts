/**
 * Documentation Intelligence — indexes docs and detects gaps.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { scanRepository } from "../repository/scanner";
import type { DocIndexEntry, DocumentationIntelligence } from "../types";

function categorize(path: string): DocIndexEntry["category"] {
  const p = path.toLowerCase();
  if (p.includes("platform_enhancement") || p.includes("/per")) return "PER";
  if (p.includes("release")) return "Release";
  if (p.includes("studio")) return "Studio";
  if (p.includes("academyos") || p.includes("healthcare") || p.includes("government") || p.includes("manufacturing"))
    return "Pack";
  if (p.includes("sdk") || p.includes("platform-sdk")) return "SDK";
  if (p.includes("architecture") || p.includes("platform-foundation"))
    return "Architecture";
  if (p.includes("api")) return "API";
  return "Other";
}

function titleFrom(path: string, content: string): string {
  const m = content.match(/^#\s+(.+)$/m);
  return m?.[1]?.trim() || basename(path);
}

function walkDocs(absDir: string, root: string, out: DocIndexEntry[], depth: number) {
  if (depth > 6) return;
  let names: string[];
  try {
    names = readdirSync(absDir);
  } catch {
    return;
  }
  for (const name of names) {
    const abs = join(absDir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkDocs(abs, root, out, depth + 1);
      continue;
    }
    if (!name.endsWith(".md")) continue;
    const rel = relative(root, abs).split(sep).join("/");
    let content = "";
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      content = "";
    }
    out.push({
      id: rel,
      path: rel,
      title: titleFrom(rel, content),
      category: categorize(rel),
      updatedHint: null,
    });
  }
}

const EXPECTED_STUDIO_DOCS = [
  "docs/studio/01_OVERVIEW.md",
  "docs/studio/02_ARCHITECTURE.md",
  "docs/studio/03_REPOSITORY.md",
  "docs/studio/04_RELEASES.md",
  "docs/studio/05_PER_ENGINE.md",
  "docs/studio/06_INSIGHTS.md",
  "docs/studio/07_API.md",
  "docs/studio/08_GRAPH.md",
  "docs/studio/09_CATALOG.md",
  "docs/studio/10_DEPENDENCIES.md",
  "docs/studio/11_RECOMMENDATIONS.md",
  "docs/studio/12_SEARCH.md",
  "docs/studio/13_GOVERNANCE.md",
  "docs/studio/14_CERTIFICATION.md",
  "docs/studio/15_RELEASES.md",
  "docs/studio/16_POLICIES.md",
  "docs/studio/17_QUALITY.md",
  "docs/studio/18_KNOWLEDGE_GRAPH.md",
  "docs/studio/19_GRAPH_SCHEMA.md",
  "docs/studio/20_REASONING.md",
  "docs/studio/21_QUERY_ENGINE.md",
  "docs/studio/22_IMPACT_ANALYSIS.md",
  "docs/studio/23_GRAPH_HEALTH.md",
  "docs/studio/24_RELEASE_REASONING.md",
  "docs/studio/25_ENGINEERING_RECOMMENDATIONS.md",
];

export function buildDocumentationIntelligence(
  root?: string
): DocumentationIntelligence {
  const repoRoot = root ?? process.cwd();
  const docs: DocIndexEntry[] = [];
  const docsDir = join(repoRoot, "docs");
  if (existsSync(docsDir)) walkDocs(docsDir, repoRoot, docs, 0);

  const missingDocumentation = EXPECTED_STUDIO_DOCS.filter(
    (p) => !existsSync(join(repoRoot, p))
  );

  const outdatedDocumentation = docs
    .filter((d) => d.title.toLowerCase().includes("todo") || d.title.toLowerCase().includes("wip"))
    .map((d) => d.path);

  const scan = scanRepository(repoRoot);
  const apiEntries = scan.entries.filter((e) => e.kind === "api");
  const undocumentedApis = apiEntries
    .filter((e) => {
      const slug = e.path
        .replace(/^src\/app\/api\//, "")
        .replace(/\/route\.ts$/, "");
      if (!slug) return false;
      return !docs.some(
        (d) =>
          d.path.toLowerCase().includes(slug.toLowerCase()) ||
          d.title.toLowerCase().includes(slug.split("/").pop() ?? "")
      );
    })
    .map((e) => e.path)
    .slice(0, 50);

  const expected = EXPECTED_STUDIO_DOCS.length;
  const present = expected - missingDocumentation.length;
  const packDocs = docs.filter((d) => d.category === "Pack" || d.category === "Studio").length;
  const coveragePercent = Math.round(
    ((present / expected) * 0.5 + Math.min(1, packDocs / 20) * 0.5) * 1000
  ) / 10;

  return {
    docs: Object.freeze(docs),
    missingDocumentation: Object.freeze(missingDocumentation),
    outdatedDocumentation: Object.freeze(outdatedDocumentation),
    undocumentedApis: Object.freeze(undocumentedApis),
    coveragePercent,
  };
}

export function createDocumentationService() {
  return {
    analyze: buildDocumentationIntelligence,
    search(input: { root?: string; q?: string; category?: DocIndexEntry["category"] }) {
      const intel = buildDocumentationIntelligence(input.root);
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        intel.docs.filter((d) => {
          if (input.category && d.category !== input.category) return false;
          if (!q) return true;
          return (
            d.path.toLowerCase().includes(q) ||
            d.title.toLowerCase().includes(q)
          );
        })
      );
    },
  };
}
