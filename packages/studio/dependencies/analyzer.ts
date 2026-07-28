/**
 * Dependency Engine — circular deps, duplicates, orphans, dead exports, gaps.
 */

import { createCatalogService } from "../catalog/indexer";
import { buildArchitectureGraph } from "../graph/builder";
import type { GraphEdge } from "../graph/types";

export type DependencyIssueSeverity = "Info" | "Warning" | "Error" | "Critical";

export type DependencyIssue = {
  readonly id: string;
  readonly severity: DependencyIssueSeverity;
  readonly rule: string;
  readonly title: string;
  readonly detail: string;
  readonly evidence: readonly string[];
  readonly nodeIds: readonly string[];
};

export type DependencyReport = {
  readonly root: string;
  readonly analyzedAt: string;
  readonly issues: readonly DependencyIssue[];
  readonly circularDependencies: readonly string[][];
  readonly riskScore: number;
};

function detectCycles(edges: readonly GraphEdge[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (e.kind !== "depends_on" && e.kind !== "consumes") continue;
    const list = adj.get(e.from) ?? [];
    list.push(e.to);
    adj.set(e.from, list);
  }
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function dfs(node: string) {
    if (visiting.has(node)) {
      const idx = stack.indexOf(node);
      if (idx >= 0) cycles.push([...stack.slice(idx), node]);
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const next of adj.get(node) ?? []) dfs(next);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }
  for (const n of adj.keys()) dfs(n);
  return cycles;
}

export function analyzeDependencies(input?: {
  root?: string;
  force?: boolean;
}): DependencyReport {
  const catalog = createCatalogService().index({
    root: input?.root,
    force: input?.force,
  });
  const graph = buildArchitectureGraph({
    root: input?.root,
    force: false,
  });
  const issues: DependencyIssue[] = [];

  const cycles = detectCycles(graph.edges);
  for (const cycle of cycles) {
    issues.push({
      id: `cycle:${cycle.join(">")}`,
      severity: "Error",
      rule: "circular_dependency",
      title: "Circular dependency detected",
      detail: cycle.join(" → "),
      evidence: Object.freeze([cycle.join(" → ")]),
      nodeIds: Object.freeze(cycle),
    });
  }

  // Duplicate services by name across packages
  const servicesByName = new Map<string, string[]>();
  for (const e of catalog.entries.filter((x) => x.kind === "service")) {
    const list = servicesByName.get(e.name) ?? [];
    list.push(e.id);
    servicesByName.set(e.name, list);
  }
  for (const [name, ids] of servicesByName) {
    if (ids.length < 2) continue;
    issues.push({
      id: `dup.service:${name}`,
      severity: "Warning",
      rule: "duplicate_service",
      title: `Duplicate service factory: ${name}`,
      detail: `${ids.length} definitions share the name ${name}.`,
      evidence: Object.freeze(ids),
      nodeIds: Object.freeze(ids),
    });
  }

  // Duplicate entities
  const entitiesByName = new Map<string, string[]>();
  for (const e of catalog.entries.filter(
    (x) => x.kind === "entity" || x.kind === "twin_mapping"
  )) {
    const list = entitiesByName.get(e.name) ?? [];
    list.push(e.id);
    entitiesByName.set(e.name, list);
  }
  for (const [name, ids] of entitiesByName) {
    if (ids.length < 2) continue;
    issues.push({
      id: `dup.entity:${name}`,
      severity: "Warning",
      rule: "duplicate_entity",
      title: `Duplicate entity / Twin mapping: ${name}`,
      detail: `${ids.length} catalog entries named ${name}.`,
      evidence: Object.freeze(ids),
      nodeIds: Object.freeze(ids),
    });
  }

  // Orphaned modules — packages with no edges
  const referenced = new Set(graph.edges.flatMap((e) => [e.from, e.to]));
  for (const n of graph.nodes.filter((x) => x.kind === "package")) {
    if (!referenced.has(n.id) && n.ownerPackage !== "studio") {
      issues.push({
        id: `orphan:${n.id}`,
        severity: "Info",
        rule: "orphaned_module",
        title: `Orphaned package node: ${n.label}`,
        detail: "Package has no graph relationships yet.",
        evidence: Object.freeze([n.path ?? n.id]),
        nodeIds: Object.freeze([n.id]),
      });
    }
  }

  // Unused APIs — no tests and no docs
  for (const api of catalog.entries.filter((e) => e.kind === "api")) {
    if (api.tests.length === 0 && api.documentationLinks.length === 0) {
      issues.push({
        id: `unused.api:${api.id}`,
        severity: "Warning",
        rule: "unused_api",
        title: `API without tests or docs: ${api.name}`,
        detail: api.path,
        evidence: Object.freeze([api.path]),
        nodeIds: Object.freeze([api.id]),
      });
    } else if (api.documentationLinks.length === 0) {
      issues.push({
        id: `missing.doc.api:${api.id}`,
        severity: "Info",
        rule: "missing_documentation",
        title: `API missing documentation: ${api.name}`,
        detail: api.path,
        evidence: Object.freeze([api.path]),
        nodeIds: Object.freeze([api.id]),
      });
    }
    if (api.tests.length === 0) {
      issues.push({
        id: `missing.test.api:${api.id}`,
        severity: "Warning",
        rule: "missing_tests",
        title: `API missing tests: ${api.name}`,
        detail: api.path,
        evidence: Object.freeze([api.path]),
        nodeIds: Object.freeze([api.id]),
      });
    }
  }

  // Services without tests
  for (const svc of catalog.entries.filter((e) => e.kind === "service")) {
    if (svc.tests.length === 0) {
      issues.push({
        id: `missing.test.service:${svc.id}`,
        severity: "Warning",
        rule: "missing_tests",
        title: `Service has no linked tests: ${svc.name}`,
        detail: svc.path,
        evidence: Object.freeze([svc.path]),
        nodeIds: Object.freeze([svc.id]),
      });
    }
  }

  // Dead exports — export symbols never imported elsewhere (heuristic)
  const allImports = new Set(
    catalog.entries.flatMap((e) => e.imports.map((i) => i.toLowerCase()))
  );
  for (const e of catalog.entries) {
    for (const exp of e.exports) {
      if (exp.length < 4) continue;
      const needle = exp.toLowerCase();
      const used =
        allImports.has(needle) ||
        [...allImports].some((i) => i.includes(needle));
      if (!used && e.kind === "service") {
        issues.push({
          id: `dead.export:${e.id}:${exp}`,
          severity: "Info",
          rule: "dead_export",
          title: `Possibly unused export: ${exp}`,
          detail: `${exp} in ${e.path}`,
          evidence: Object.freeze([e.path, exp]),
          nodeIds: Object.freeze([e.id]),
        });
      }
    }
  }

  // Missing insight providers for industry packs
  const packs = catalog.entries.filter((e) => e.kind === "package");
  const providers = new Set(
    catalog.entries
      .filter((e) => e.kind === "insight_provider")
      .map((e) => e.ownerPackage)
  );
  for (const p of packs) {
    if (
      (p.ownerPackage === "academyos" || p.ownerPackage === "studio") &&
      !providers.has(p.ownerPackage)
    ) {
      issues.push({
        id: `missing.insight:${p.ownerPackage}`,
        severity: "Warning",
        rule: "missing_insight_provider",
        title: `Missing Insight Provider for ${p.ownerPackage}`,
        detail: "Industry packs should register an Insight Provider.",
        evidence: Object.freeze([p.path]),
        nodeIds: Object.freeze([p.id]),
      });
    }
  }

  const severityWeight: Record<DependencyIssueSeverity, number> = {
    Info: 1,
    Warning: 3,
    Error: 8,
    Critical: 15,
  };
  const debt = issues.reduce((a, i) => a + severityWeight[i.severity], 0);
  const riskScore = Math.min(100, debt);

  return {
    root: catalog.root,
    analyzedAt: new Date().toISOString(),
    issues: Object.freeze(issues),
    circularDependencies: Object.freeze(cycles),
    riskScore,
  };
}

export function createDependencyEngine() {
  return {
    analyze: analyzeDependencies,
    bySeverity(root?: string) {
      const report = analyzeDependencies({ root });
      const groups: Record<DependencyIssueSeverity, number> = {
        Info: 0,
        Warning: 0,
        Error: 0,
        Critical: 0,
      };
      for (const i of report.issues) groups[i.severity] += 1;
      return { ...report, counts: Object.freeze(groups) };
    },
  };
}
