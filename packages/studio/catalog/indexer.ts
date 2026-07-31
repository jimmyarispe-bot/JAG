/**
 * Repository Catalog indexer — builds a persistent searchable snapshot.
 * Analyzes the repo; does not modify Foundation / AcademyOS / SDK.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import { buildRepositoryIntelligence } from "../repository/intelligence";
import { scanRepository } from "../repository/scanner";
import { syncPersFromRepository } from "../per/engine";
import { clearCatalogSnapshot, getCatalogSnapshot, setCatalogSnapshot } from "./store";
import type { CatalogEntry, CatalogEntryKind, CatalogSnapshot } from "./types";

const EXTRA_ROOTS = ["supabase", "connectors"] as const;

function readSafe(abs: string): string {
  try {
    return readFileSync(/* turbopackIgnore: true */ abs, "utf8");
  } catch {
    return "";
  }
}

function emptyCounts(): Record<CatalogEntryKind, number> {
  return {
    package: 0,
    service: 0,
    api: 0,
    entity: 0,
    event: 0,
    connector: 0,
    insight_provider: 0,
    twin_mapping: 0,
    per: 0,
    test: 0,
    doc: 0,
    migration: 0,
    schema: 0,
    route: 0,
    export: 0,
    import: 0,
  };
}

function extractImports(content: string): string[] {
  const out: string[] = [];
  for (const m of content.matchAll(
    /from\s+["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)/g
  )) {
    out.push((m[1] || m[2])!);
  }
  return [...new Set(out)].slice(0, 40);
}

function extractExports(content: string): string[] {
  const out: string[] = [];
  for (const m of content.matchAll(
    /export\s+(?:async\s+)?function\s+(\w+)|export\s+(?:type|const|class|interface)\s+(\w+)/g
  )) {
    out.push((m[1] || m[2])!);
  }
  return [...new Set(out)].slice(0, 40);
}

function keywordsFor(entry: {
  name: string;
  path: string;
  kind: string;
  symbols: string[];
}): string[] {
  const parts = [
    entry.name,
    entry.kind,
    ...entry.path.split("/"),
    ...entry.symbols,
  ]
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
  return [...new Set(parts)].slice(0, 40);
}

function walkExtra(
  absDir: string,
  root: string,
  kindHint: CatalogEntryKind,
  out: CatalogEntry[],
  depth: number
): void {
  if (depth > 5) return;
  let names: string[];
  try {
    names = readdirSync(/* turbopackIgnore: true */ absDir);
  } catch {
    return;
  }
  for (const name of names) {
    if (name === "node_modules" || name === ".git") continue;
    const abs = join(/* turbopackIgnore: true */ absDir, name);
    let st;
    try {
      st = statSync(/* turbopackIgnore: true */ abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walkExtra(abs, root, kindHint, out, depth + 1);
      continue;
    }
    if (!/\.(ts|tsx|sql|md|json)$/.test(name)) continue;
    const rel = relative(root, abs).split(sep).join("/");
    const content = readSafe(abs);
    const kind: CatalogEntryKind =
      name.endsWith(".sql") || rel.includes("migration")
        ? "migration"
        : rel.includes("schema")
          ? "schema"
          : kindHint;
    out.push({
      id: `${kind}:${rel}`,
      kind,
      name: basename(rel),
      path: rel,
      ownerPackage: null,
      exports: Object.freeze(extractExports(content)),
      imports: Object.freeze(extractImports(content)),
      routes: Object.freeze([]),
      schemas: Object.freeze(kind === "schema" ? [rel] : []),
      migrations: Object.freeze(kind === "migration" ? [rel] : []),
      tests: Object.freeze([]),
      documentationLinks: Object.freeze([]),
      symbols: Object.freeze(extractExports(content)),
      keywords: Object.freeze(
        keywordsFor({
          name: basename(rel),
          path: rel,
          kind,
          symbols: extractExports(content),
        })
      ),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function indexRepositoryCatalog(input?: {
  root?: string;
  force?: boolean;
}): CatalogSnapshot {
  const root = input?.root ?? process.cwd();
  const existing = getCatalogSnapshot();
  if (existing && existing.root === root && !input?.force) {
    return existing;
  }

  const intel = buildRepositoryIntelligence(root);
  const scan = intel.scan;
  const now = new Date().toISOString();
  const entries: CatalogEntry[] = [];
  const byPath = new Map<string, CatalogEntry>();

  // Packages
  for (const g of intel.dependencyGraph) {
    const entry: CatalogEntry = {
      id: `package:${g.packageId}`,
      kind: "package",
      name: g.packageId,
      path: g.path,
      ownerPackage: g.packageId,
      exports: Object.freeze([]),
      imports: Object.freeze([...g.dependencies]),
      routes: Object.freeze([]),
      schemas: Object.freeze([]),
      migrations: Object.freeze([]),
      tests: Object.freeze(
        scan.entries
          .filter((e) => e.kind === "test" && e.path.includes(g.packageId))
          .map((e) => e.path)
          .slice(0, 50)
      ),
      documentationLinks: Object.freeze(
        scan.entries
          .filter((e) => e.kind === "doc" && e.path.includes(g.packageId))
          .map((e) => e.path)
          .slice(0, 50)
      ),
      symbols: Object.freeze([...g.dependencies]),
      keywords: Object.freeze(
        keywordsFor({
          name: g.packageId,
          path: g.path,
          kind: "package",
          symbols: [...g.dependencies],
        })
      ),
      updatedAt: now,
    };
    byPath.set(entry.id, entry);
  }

  // API routes
  for (const route of intel.apiRoutes) {
    const id = `api:${route.path}`;
    const entry: CatalogEntry = {
      id,
      kind: "api",
      name: route.path.split("/").slice(-2).join("/"),
      path: route.path,
      ownerPackage: route.packageId,
      exports: Object.freeze([...route.methods]),
      imports: Object.freeze([]),
      routes: Object.freeze([...route.methods]),
      schemas: Object.freeze([]),
      migrations: Object.freeze([]),
      tests: Object.freeze(
        scan.entries
          .filter(
            (e) =>
              e.kind === "test" &&
              route.path
                .replace(/^src\/app\/api\//, "")
                .split("/")
                .some((p) => e.path.includes(p))
          )
          .map((e) => e.path)
          .slice(0, 10)
      ),
      documentationLinks: Object.freeze(
        scan.entries
          .filter(
            (e) =>
              e.kind === "doc" &&
              route.path.toLowerCase().split("/").some((p) => e.path.includes(p))
          )
          .map((e) => e.path)
          .slice(0, 10)
      ),
      symbols: Object.freeze([...route.methods]),
      keywords: Object.freeze(
        keywordsFor({
          name: route.path,
          path: route.path,
          kind: "api",
          symbols: [...route.methods],
        })
      ),
      updatedAt: now,
    };
    byPath.set(id, entry);
  }

  // Symbols → services / events / permissions / entities
  for (const sym of intel.symbols) {
    const kind: CatalogEntryKind =
      sym.kind === "service"
        ? "service"
        : sym.kind === "event"
          ? "event"
          : sym.kind === "entity"
            ? "entity"
            : sym.kind === "permission"
              ? "export"
              : sym.kind === "api"
                ? "route"
                : "export";
    const id = `${kind}:${sym.path}:${sym.name}`;
    if (byPath.has(id)) continue;
    const abs = join(/* turbopackIgnore: true */ root, sym.path);
    const content = existsSync(/* turbopackIgnore: true */ abs)
      ? readSafe(abs)
      : "";
    const entry: CatalogEntry = {
      id,
      kind,
      name: sym.name,
      path: sym.path,
      ownerPackage: sym.packageId,
      exports: Object.freeze(extractExports(content)),
      imports: Object.freeze(extractImports(content)),
      routes: Object.freeze([]),
      schemas: Object.freeze([]),
      migrations: Object.freeze([]),
      tests: Object.freeze(
        scan.entries
          .filter(
            (e) =>
              e.kind === "test" &&
              (e.path.includes(sym.name.toLowerCase()) ||
                (sym.packageId != null && e.path.includes(sym.packageId)))
          )
          .map((e) => e.path)
          .slice(0, 8)
      ),
      documentationLinks: Object.freeze(
        scan.entries
          .filter(
            (e) =>
              e.kind === "doc" &&
              (e.path.includes(sym.packageId ?? "") ||
                e.path.toLowerCase().includes(sym.name.toLowerCase()))
          )
          .map((e) => e.path)
          .slice(0, 8)
      ),
      symbols: Object.freeze([sym.name]),
      keywords: Object.freeze(
        keywordsFor({
          name: sym.name,
          path: sym.path,
          kind,
          symbols: [sym.name, sym.detail],
        })
      ),
      updatedAt: now,
    };
    byPath.set(id, entry);
  }

  // Connectors from path
  for (const e of scan.entries.filter((x) => x.kind === "connector")) {
    const id = `connector:${e.path}`;
    byPath.set(id, {
      id,
      kind: "connector",
      name: e.name,
      path: e.path,
      ownerPackage: e.packageId,
      exports: Object.freeze([]),
      imports: Object.freeze([]),
      routes: Object.freeze([]),
      schemas: Object.freeze([]),
      migrations: Object.freeze([]),
      tests: Object.freeze([]),
      documentationLinks: Object.freeze([]),
      symbols: Object.freeze([e.name]),
      keywords: Object.freeze(
        keywordsFor({
          name: e.name,
          path: e.path,
          kind: "connector",
          symbols: ["connector"],
        })
      ),
      updatedAt: now,
    });
  }

  // Twin mappings
  for (const sym of intel.symbols.filter((s) => s.kind === "entity")) {
    const id = `twin_mapping:${sym.name}`;
    byPath.set(id, {
      id,
      kind: "twin_mapping",
      name: sym.name,
      path: sym.path,
      ownerPackage: sym.packageId,
      exports: Object.freeze([]),
      imports: Object.freeze([]),
      routes: Object.freeze([]),
      schemas: Object.freeze([]),
      migrations: Object.freeze([]),
      tests: Object.freeze([]),
      documentationLinks: Object.freeze(
        scan.entries
          .filter((e) => e.kind === "doc" && e.path.includes("twin"))
          .map((e) => e.path)
          .slice(0, 5)
      ),
      symbols: Object.freeze([sym.name]),
      keywords: Object.freeze(["twin", "mapping", ...sym.name.toLowerCase().split(/\W+/)]),
      updatedAt: now,
    });
  }

  // Insight providers (known ids from packs)
  for (const provider of [
    { id: "studio.platform-insights", pkg: "studio" },
    { id: "academyos.education-insights", pkg: "academyos" },
  ]) {
    byPath.set(`insight_provider:${provider.id}`, {
      id: `insight_provider:${provider.id}`,
      kind: "insight_provider",
      name: provider.id,
      path: `packages/${provider.pkg}`,
      ownerPackage: provider.pkg,
      exports: Object.freeze([provider.id]),
      imports: Object.freeze([]),
      routes: Object.freeze([]),
      schemas: Object.freeze([]),
      migrations: Object.freeze([]),
      tests: Object.freeze(
        scan.entries
          .filter((e) => e.kind === "test" && e.path.includes(provider.pkg))
          .map((e) => e.path)
          .slice(0, 5)
      ),
      documentationLinks: Object.freeze([]),
      symbols: Object.freeze([provider.id]),
      keywords: Object.freeze([
        "insight",
        "provider",
        "executive",
        provider.pkg,
      ]),
      updatedAt: now,
    });
  }

  // PERs
  const pers = syncPersFromRepository(root);
  for (const per of pers) {
    byPath.set(`per:${per.id}`, {
      id: `per:${per.id}`,
      kind: "per",
      name: per.id,
      path: `docs/${per.originatingPack}`,
      ownerPackage: per.originatingPack,
      exports: Object.freeze([]),
      imports: Object.freeze([]),
      routes: Object.freeze([]),
      schemas: Object.freeze([]),
      migrations: Object.freeze([]),
      tests: Object.freeze([]),
      documentationLinks: Object.freeze([
        `docs/${per.originatingPack}/06_PLATFORM_ENHANCEMENT_REQUESTS.md`,
      ]),
      symbols: Object.freeze([per.id]),
      keywords: Object.freeze(
        keywordsFor({
          name: per.id,
          path: per.description,
          kind: "per",
          symbols: [...per.packsMentioning, per.id],
        })
      ),
      updatedAt: now,
    });
  }

  // Docs + tests from scan
  for (const e of scan.entries) {
    if (e.kind !== "doc" && e.kind !== "test") continue;
    const kind: CatalogEntryKind = e.kind === "doc" ? "doc" : "test";
    const id = `${kind}:${e.path}`;
    if (byPath.has(id)) continue;
    byPath.set(id, {
      id,
      kind,
      name: e.name,
      path: e.path,
      ownerPackage: e.packageId,
      exports: Object.freeze([]),
      imports: Object.freeze([]),
      routes: Object.freeze([]),
      schemas: Object.freeze([]),
      migrations: Object.freeze([]),
      tests: Object.freeze(kind === "test" ? [e.path] : []),
      documentationLinks: Object.freeze(kind === "doc" ? [e.path] : []),
      symbols: Object.freeze([e.name]),
      keywords: Object.freeze(
        keywordsFor({
          name: e.name,
          path: e.path,
          kind,
          symbols: [],
        })
      ),
      updatedAt: now,
    });
  }

  // Extra roots: supabase/, connectors/
  for (const r of EXTRA_ROOTS) {
    const abs = join(/* turbopackIgnore: true */ root, r);
    if (!existsSync(/* turbopackIgnore: true */ abs)) continue;
    walkExtra(abs, root, r === "supabase" ? "migration" : "connector", entries, 0);
  }
  for (const e of entries) byPath.set(e.id, e);

  const all = [...byPath.values()];
  const counts = emptyCounts();
  for (const e of all) counts[e.kind] += 1;

  const version = createHash("sha1")
    .update(`${root}|${scan.scannedAt}|${all.length}`)
    .digest("hex")
    .slice(0, 12);

  const snapshot: CatalogSnapshot = {
    root,
    indexedAt: now,
    version,
    entries: Object.freeze(all),
    counts: Object.freeze(counts),
  };
  return setCatalogSnapshot(snapshot);
}

export function createCatalogService() {
  return {
    index: indexRepositoryCatalog,
    get: getCatalogSnapshot,
    clear: clearCatalogSnapshot,
    search(input: {
      root?: string;
      q?: string;
      kind?: CatalogEntryKind;
      ownerPackage?: string;
      force?: boolean;
    }) {
      const snap = indexRepositoryCatalog({
        root: input.root,
        force: input.force,
      });
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        snap.entries.filter((e) => {
          if (input.kind && e.kind !== input.kind) return false;
          if (input.ownerPackage && e.ownerPackage !== input.ownerPackage)
            return false;
          if (!q) return true;
          return (
            e.name.toLowerCase().includes(q) ||
            e.path.toLowerCase().includes(q) ||
            e.keywords.some((k) => k.includes(q)) ||
            e.symbols.some((s) => s.toLowerCase().includes(q))
          );
        })
      );
    },
    ensure(root?: string) {
      return indexRepositoryCatalog({ root, force: false });
    },
  };
}

// keep scanRepository imported for potential future incremental hashing
void scanRepository;
