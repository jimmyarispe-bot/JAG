/**
 * Repository Intelligence — filesystem scanner for JAG monorepo layout.
 * Consumes the host filesystem; does not modify Platform Foundation.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import type {
  ArchitectureLayer,
  RepositoryIndexEntry,
  RepositoryIndexKind,
  RepositoryScanResult,
} from "../types";

const SCAN_ROOTS = [
  "packages",
  "apps",
  "docs",
  "tests",
  "connectors",
  "sdk",
  "migrations",
  "apis",
  "src/app/api",
  "src/lib/platform-sdk",
  "src/lib/digital-twin",
  "src/lib/connectors",
  "src/lib/jag-platform",
] as const;

function classifyPath(relPath: string): {
  kind: RepositoryIndexKind;
  layer: ArchitectureLayer | null;
  packageId: string | null;
} {
  const p = relPath.split(sep).join("/");
  let packageId: string | null = null;
  if (p.startsWith("packages/")) {
    packageId = p.split("/")[1] ?? null;
  }

  if (p.includes("/api/") || p.startsWith("src/app/api/") || p.startsWith("apis/")) {
    return { kind: "api", layer: packageId === "studio" ? "Studio" : "Industry Packs", packageId };
  }
  if (p.includes("platform-sdk") || p.startsWith("sdk/")) {
    return { kind: "sdk", layer: "SDK", packageId };
  }
  if (p.includes("digital-twin")) {
    return { kind: "entity", layer: "Digital Twin", packageId };
  }
  if (p.includes("connector") || p.startsWith("connectors/")) {
    return { kind: "connector", layer: "Connectors", packageId };
  }
  if (p.includes("migration") || p.startsWith("migrations/")) {
    return { kind: "migration", layer: "Platform Foundation", packageId };
  }
  if (p.startsWith("tests/") || p.endsWith(".test.ts") || p.endsWith(".spec.ts")) {
    return {
      kind: "test",
      layer: p.includes("academyos")
        ? "Industry Packs"
        : p.includes("studio")
          ? "Studio"
          : p.includes("platform-sdk")
            ? "SDK"
            : "Platform Foundation",
      packageId,
    };
  }
  if (p.startsWith("docs/")) {
    return {
      kind: "doc",
      layer: p.includes("studio")
        ? "Studio"
        : p.includes("academyos")
          ? "Industry Packs"
          : "Platform Foundation",
      packageId,
    };
  }
  if (
    p.includes("permission") ||
    p.endsWith("permissions.ts") ||
    p.includes("/auth/")
  ) {
    return { kind: "permission", layer: "Platform Foundation", packageId };
  }
  if (p.includes("event") || p.endsWith("events.ts")) {
    return { kind: "event", layer: packageId ? "Industry Packs" : "Platform Foundation", packageId };
  }
  if (
    p.endsWith("service.ts") ||
    p.includes("/services/") ||
    /Service\.ts$/.test(p) ||
    p.includes("create") && p.endsWith(".ts")
  ) {
    return {
      kind: "service",
      layer: packageId === "studio" ? "Studio" : packageId ? "Industry Packs" : "Platform Foundation",
      packageId,
    };
  }
  if (p.startsWith("packages/") && (p.endsWith("package.json") || p.endsWith("index.ts"))) {
    return {
      kind: "package",
      layer: packageId === "studio" ? "Studio" : "Industry Packs",
      packageId,
    };
  }
  if (p.includes("package.json") || p.endsWith("dependencies")) {
    return { kind: "dependency", layer: null, packageId };
  }
  return {
    kind: "other",
    layer: packageId === "studio" ? "Studio" : packageId ? "Industry Packs" : null,
    packageId,
  };
}

const scanCache = new Map<string, RepositoryScanResult>();

function walk(
  absDir: string,
  root: string,
  out: RepositoryIndexEntry[],
  depth: number,
  maxDepth: number
): void {
  if (depth > maxDepth) return;
  let entries: string[];
  try {
    entries = readdirSync(absDir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (
      name === "node_modules" ||
      name === ".next" ||
      name === ".git" ||
      name === "dist" ||
      name === "coverage"
    ) {
      continue;
    }
    const abs = join(absDir, name);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(abs, root, out, depth + 1, maxDepth);
      continue;
    }
    if (!/\.(ts|tsx|mts|md|json)$/.test(name)) continue;
    const rel = relative(root, abs);
    const { kind, layer, packageId } = classifyPath(rel);
    out.push({
      id: `${kind}:${rel}`,
      kind,
      path: rel.split(sep).join("/"),
      name,
      packageId,
      layer,
      metadata: Object.freeze({}),
    });
  }
}

function emptyCounts(): Record<RepositoryIndexKind, number> {
  return {
    service: 0,
    api: 0,
    entity: 0,
    event: 0,
    permission: 0,
    test: 0,
    doc: 0,
    dependency: 0,
    connector: 0,
    migration: 0,
    sdk: 0,
    package: 0,
    other: 0,
  };
}

export function clearRepositoryScanCache(): void {
  scanCache.clear();
}

export function scanRepository(root?: string): RepositoryScanResult {
  const repoRoot = root ?? process.cwd();
  const cached = scanCache.get(repoRoot);
  if (cached) return cached;

  const entries: RepositoryIndexEntry[] = [];
  const rootsFound: string[] = [];

  for (const r of SCAN_ROOTS) {
    const abs = join(repoRoot, r);
    if (!existsSync(abs)) continue;
    rootsFound.push(r);
    const maxDepth =
      r === "docs" || r === "tests" || r.startsWith("src/")
        ? 6
        : r === "packages"
          ? 6
          : 4;
    walk(abs, repoRoot, entries, 0, maxDepth);
  }

  // Also index top-level packages/* package.json
  const packagesDir = join(repoRoot, "packages");
  if (existsSync(packagesDir)) {
    for (const name of readdirSync(packagesDir)) {
      const pkgJson = join(packagesDir, name, "package.json");
      if (!existsSync(pkgJson)) continue;
      const rel = `packages/${name}/package.json`;
      if (!entries.some((e) => e.path === rel)) {
        entries.push({
          id: `package:${rel}`,
          kind: "package",
          path: rel,
          name: "package.json",
          packageId: name,
          layer: name === "studio" ? "Studio" : "Industry Packs",
          metadata: Object.freeze({}),
        });
      }
    }
  }

  const counts = emptyCounts();
  for (const e of entries) counts[e.kind] += 1;

  const result: RepositoryScanResult = {
    root: repoRoot,
    scannedAt: new Date().toISOString(),
    entries: Object.freeze(entries),
    counts: Object.freeze(counts),
    rootsFound: Object.freeze(rootsFound),
  };
  scanCache.set(repoRoot, result);
  return result;
}

export function createRepositoryService() {
  return {
    scan: scanRepository,
    search(input: {
      root?: string;
      kind?: RepositoryIndexKind;
      q?: string;
      packageId?: string;
    }) {
      const scan = scanRepository(input.root);
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        scan.entries.filter((e) => {
          if (input.kind && e.kind !== input.kind) return false;
          if (input.packageId && e.packageId !== input.packageId) return false;
          if (!q) return true;
          return (
            e.path.toLowerCase().includes(q) ||
            e.name.toLowerCase().includes(q) ||
            (e.packageId?.toLowerCase().includes(q) ?? false)
          );
        })
      );
    },
  };
}
