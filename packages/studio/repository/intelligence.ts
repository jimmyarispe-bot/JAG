/**
 * JS-002 — Repository Intelligence enrichment.
 * Parses symbols, API methods, permissions, events, and package dependencies.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { RepositoryIndexEntry, RepositoryScanResult } from "../types";
import { scanRepository } from "./scanner";

export type RepositorySymbol = {
  readonly kind: "service" | "api" | "permission" | "event" | "entity" | "export";
  readonly name: string;
  readonly path: string;
  readonly packageId: string | null;
  readonly detail: string;
};

export type PackageDependencyGraph = {
  readonly packageId: string;
  readonly path: string;
  readonly dependencies: readonly string[];
  readonly devDependencies: readonly string[];
};

export type RepositoryIntelligenceReport = {
  readonly scannedAt: string;
  readonly root: string;
  readonly scan: RepositoryScanResult;
  readonly symbols: readonly RepositorySymbol[];
  readonly dependencyGraph: readonly PackageDependencyGraph[];
  readonly apiRoutes: readonly {
    readonly path: string;
    readonly methods: readonly string[];
    readonly packageId: string | null;
  }[];
  readonly recommendations: readonly string[];
  readonly coverage: {
    readonly services: number;
    readonly apis: number;
    readonly events: number;
    readonly permissions: number;
    readonly tests: number;
    readonly docs: number;
    readonly packages: number;
  };
};

function readSafe(abs: string): string {
  try {
    return readFileSync(abs, "utf8");
  } catch {
    return "";
  }
}

function enrichFromContent(
  root: string,
  entry: RepositoryIndexEntry,
  symbols: RepositorySymbol[],
  apiRoutes: {
    path: string;
    methods: string[];
    packageId: string | null;
  }[]
): Record<string, string> {
  const abs = join(root, entry.path);
  if (!existsSync(abs) || !/\.(ts|tsx|mts|json)$/.test(entry.path)) {
    return {};
  }
  const content = readSafe(abs);
  if (!content) return {};
  const meta: Record<string, string> = {};

  const serviceFns = [
    ...content.matchAll(
      /export\s+function\s+(create\w+Service)\s*\(/g
    ),
  ].map((m) => m[1]!);
  for (const name of serviceFns) {
    symbols.push({
      kind: "service",
      name,
      path: entry.path,
      packageId: entry.packageId,
      detail: "factory",
    });
  }
  if (serviceFns.length) meta.services = serviceFns.join(",");

  if (entry.kind === "api" || entry.path.includes("/api/")) {
    const methods = ["GET", "POST", "PATCH", "PUT", "DELETE"].filter((m) =>
      new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(content)
    );
    if (methods.length) {
      meta.methods = methods.join(",");
      apiRoutes.push({
        path: entry.path,
        methods,
        packageId: entry.packageId,
      });
      for (const m of methods) {
        symbols.push({
          kind: "api",
          name: m,
          path: entry.path,
          packageId: entry.packageId,
          detail: "route_handler",
        });
      }
    }
  }

  const perms = [
    ...content.matchAll(/id:\s*["']([a-z0-9._-]+\.[a-z0-9._-]+)["']/gi),
  ]
    .map((m) => m[1]!)
    .filter((id) => id.includes("."));
  for (const id of [...new Set(perms)].slice(0, 20)) {
    if (id.startsWith("academyos.") || id.startsWith("studio.") || id.includes("permission")) {
      symbols.push({
        kind: "permission",
        name: id,
        path: entry.path,
        packageId: entry.packageId,
        detail: "permission_id",
      });
    }
  }

  const events = [
    ...content.matchAll(
      /eventType:\s*["'`]([^"'`]+)["'`]|academyos\.([a-z0-9._-]+)/gi
    ),
  ].map((m) => m[1] || `academyos.${m[2]}`);
  for (const ev of [...new Set(events)].slice(0, 30)) {
    symbols.push({
      kind: "event",
      name: ev,
      path: entry.path,
      packageId: entry.packageId,
      detail: "event_type",
    });
  }

  if (
    /export\s+type\s+\w+|academyEntity:\s*["']/i.test(content) &&
    (entry.path.includes("types.ts") || entry.path.includes("mappings"))
  ) {
    const entities = [
      ...content.matchAll(/academyEntity:\s*["']([^"']+)["']/g),
    ].map((m) => m[1]!);
    for (const ent of entities) {
      symbols.push({
        kind: "entity",
        name: ent,
        path: entry.path,
        packageId: entry.packageId,
        detail: "twin_mapping",
      });
    }
  }

  return meta;
}

function parsePackageJson(
  root: string,
  packageId: string,
  relPath: string
): PackageDependencyGraph | null {
  const abs = join(root, relPath);
  if (!existsSync(abs)) return null;
  try {
    const json = JSON.parse(readSafe(abs)) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return {
      packageId,
      path: relPath,
      dependencies: Object.freeze(Object.keys(json.dependencies ?? {})),
      devDependencies: Object.freeze(Object.keys(json.devDependencies ?? {})),
    };
  } catch {
    return null;
  }
}

export function buildRepositoryIntelligence(
  root?: string
): RepositoryIntelligenceReport {
  const repoRoot = root ?? process.cwd();
  const scan = scanRepository(repoRoot);
  const symbols: RepositorySymbol[] = [];
  const apiRoutes: {
    path: string;
    methods: string[];
    packageId: string | null;
  }[] = [];
  const dependencyGraph: PackageDependencyGraph[] = [];

  // Enrich a bounded subset for performance (pack + api surfaces)
  const enrichTargets = scan.entries.filter(
    (e) =>
      e.kind === "service" ||
      e.kind === "api" ||
      e.kind === "event" ||
      e.kind === "permission" ||
      e.kind === "package" ||
      (e.packageId === "academyos" && e.path.endsWith(".ts")) ||
      (e.packageId === "studio" && e.path.endsWith(".ts")) ||
      e.path.startsWith("src/app/api/")
  );

  for (const entry of enrichTargets.slice(0, 400)) {
    enrichFromContent(repoRoot, entry, symbols, apiRoutes);
    if (entry.kind === "package" && entry.path.endsWith("package.json") && entry.packageId) {
      const graph = parsePackageJson(repoRoot, entry.packageId, entry.path);
      if (graph) dependencyGraph.push(graph);
    }
  }

  const recommendations: string[] = [];
  if (scan.counts.api === 0) {
    recommendations.push("No API routes indexed — verify src/app/api scan roots.");
  }
  if (symbols.filter((s) => s.kind === "service").length < 5) {
    recommendations.push("Low service factory coverage — deepen packages/ scan.");
  }
  if (dependencyGraph.length < 1) {
    recommendations.push("No package dependency graphs parsed.");
  }
  if (scan.counts.test > 0 && scan.counts.doc === 0) {
    recommendations.push("Tests present without docs — improve documentation coverage.");
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Repository intelligence healthy — use Studio dashboard for release readiness automation."
    );
  }

  return {
    scannedAt: new Date().toISOString(),
    root: repoRoot,
    scan,
    symbols: Object.freeze(symbols),
    dependencyGraph: Object.freeze(dependencyGraph),
    apiRoutes: Object.freeze(
      apiRoutes.map((r) => ({
        path: r.path,
        methods: Object.freeze(r.methods),
        packageId: r.packageId,
      }))
    ),
    recommendations: Object.freeze(recommendations),
    coverage: {
      services: symbols.filter((s) => s.kind === "service").length,
      apis: apiRoutes.length,
      events: symbols.filter((s) => s.kind === "event").length,
      permissions: symbols.filter((s) => s.kind === "permission").length,
      tests: scan.counts.test,
      docs: scan.counts.doc,
      packages: scan.counts.package,
    },
  };
}

export function createRepositoryIntelligenceService() {
  return {
    analyze: buildRepositoryIntelligence,
    searchSymbols(input: {
      root?: string;
      kind?: RepositorySymbol["kind"];
      q?: string;
    }) {
      const report = buildRepositoryIntelligence(input.root);
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        report.symbols.filter((s) => {
          if (input.kind && s.kind !== input.kind) return false;
          if (!q) return true;
          return (
            s.name.toLowerCase().includes(q) ||
            s.path.toLowerCase().includes(q)
          );
        })
      );
    },
  };
}
