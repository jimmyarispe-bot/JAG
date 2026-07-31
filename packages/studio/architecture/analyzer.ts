/**
 * Architecture Workspace — live structural view of JAG platform layers.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { scanRepository } from "../repository/scanner";
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureView,
  ArchitectureViolation,
} from "../types";

const LAYER_PATHS: Record<string, { layer: ArchitectureNode["layer"]; path: string }> = {
  foundation_platform: {
    layer: "Platform Foundation",
    path: "src/lib/platform",
  },
  foundation_jag: {
    layer: "Platform Foundation",
    path: "src/lib/jag-platform",
  },
  sdk: { layer: "SDK", path: "src/lib/platform-sdk" },
  twin: { layer: "Digital Twin", path: "src/lib/digital-twin" },
  connectors: { layer: "Connectors", path: "src/lib/connectors" },
  ei: {
    layer: "Executive Intelligence",
    path: "src/lib/platform-sdk/executive",
  },
  memory: {
    layer: "Organizational Memory",
    path: "src/lib/platform/oios",
  },
  academyos: { layer: "Industry Packs", path: "packages/academyos" },
  studio: { layer: "Studio", path: "packages/studio" },
};

/** Allowed dependency direction: higher index may depend on lower. */
const LAYER_RANK: Record<string, number> = {
  "Platform Foundation": 0,
  SDK: 1,
  "Digital Twin": 1,
  Connectors: 2,
  "Executive Intelligence": 2,
  "Organizational Memory": 2,
  "Industry Packs": 3,
  Studio: 4,
};

export function buildArchitectureView(root?: string): ArchitectureView {
  const repoRoot = root ?? process.cwd();
  const scan = scanRepository(repoRoot);
  const nodes: ArchitectureNode[] = [];
  const edges: ArchitectureEdge[] = [];
  const violations: ArchitectureViolation[] = [];

  for (const [id, def] of Object.entries(LAYER_PATHS)) {
    const abs = join(/* turbopackIgnore: true */ repoRoot, def.path);
    const healthy = existsSync(/* turbopackIgnore: true */ abs);
    nodes.push({
      id,
      label: def.layer === "Industry Packs" && id === "academyos"
        ? "AcademyOS"
        : def.layer === "Studio"
          ? "JAG Studio"
          : def.layer,
      layer: def.layer,
      packagePath: def.path,
      healthy,
    });
  }

  // Canonical dependency edges (Studio consumes everything; packs consume foundation/sdk)
  const deps: ArchitectureEdge[] = [
    { from: "sdk", to: "foundation_platform", kind: "depends_on" },
    { from: "twin", to: "foundation_platform", kind: "depends_on" },
    { from: "connectors", to: "sdk", kind: "consumes" },
    { from: "ei", to: "sdk", kind: "extends" },
    { from: "memory", to: "foundation_platform", kind: "depends_on" },
    { from: "academyos", to: "sdk", kind: "consumes" },
    { from: "academyos", to: "twin", kind: "consumes" },
    { from: "academyos", to: "connectors", kind: "consumes" },
    { from: "academyos", to: "ei", kind: "extends" },
    { from: "studio", to: "sdk", kind: "consumes" },
    { from: "studio", to: "academyos", kind: "consumes" },
    { from: "studio", to: "foundation_platform", kind: "consumes" },
  ];
  edges.push(...deps);

  // Violation: missing required layers
  for (const n of nodes) {
    if (!n.healthy && n.id !== "memory") {
      // Organizational Memory path may vary — Info only if missing
      const severity = n.layer === "Organizational Memory" ? "Info" : "Error";
      violations.push({
        id: `missing:${n.id}`,
        severity,
        rule: "layer.presence",
        message: `Expected path missing: ${n.packagePath}`,
        nodes: [n.id],
      });
    }
  }

  // Detect AcademyOS importing studio (forbidden reverse dependency) via scan heuristics
  const academyImportsStudio = scan.entries.some(
    (e) =>
      e.packageId === "academyos" &&
      e.path.includes("studio") &&
      e.kind !== "doc"
  );
  if (academyImportsStudio) {
    violations.push({
      id: "viol:aos-imports-studio",
      severity: "Error",
      rule: "no.pack.to.studio",
      message: "Industry packs must not depend on Studio.",
      nodes: ["academyos", "studio"],
    });
  }

  // Layer rank violations on declared edges
  for (const e of edges) {
    const from = nodes.find((n) => n.id === e.from);
    const to = nodes.find((n) => n.id === e.to);
    if (!from || !to) continue;
    const fr = LAYER_RANK[from.layer] ?? 0;
    const tr = LAYER_RANK[to.layer] ?? 0;
    if (fr < tr && e.kind === "depends_on") {
      violations.push({
        id: `rank:${e.from}->${e.to}`,
        severity: "Warning",
        rule: "layer.direction",
        message: `${from.label} should not depend upward on ${to.label}`,
        nodes: [e.from, e.to],
      });
    }
  }

  // Circular dependency detection (simple DFS on edges)
  const circularDependencies = detectCycles(edges);
  for (const cycle of circularDependencies) {
    violations.push({
      id: `cycle:${cycle.join(">")}`,
      severity: "Error",
      rule: "no.circular.deps",
      message: `Circular dependency: ${cycle.join(" → ")}`,
      nodes: cycle,
    });
  }

  const referenced = new Set(edges.flatMap((e) => [e.from, e.to]));
  const orphanedModules = nodes
    .filter((n) => n.healthy && !referenced.has(n.id) && n.id !== "foundation_jag")
    .map((n) => n.id);

  const packageHealth: Record<string, { healthy: boolean; issues: number }> = {};
  for (const n of nodes) {
    const issues = violations.filter((v) => v.nodes.includes(n.id)).length;
    packageHealth[n.id] = { healthy: n.healthy && issues === 0, issues };
  }

  const errorCount = violations.filter((v) => v.severity === "Error").length;
  const warnCount = violations.filter((v) => v.severity === "Warning").length;
  const healthScore = Math.max(
    0,
    Math.min(100, 100 - errorCount * 15 - warnCount * 5)
  );

  return {
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    violations: Object.freeze(violations),
    circularDependencies: Object.freeze(circularDependencies),
    orphanedModules: Object.freeze(orphanedModules),
    packageHealth: Object.freeze(packageHealth),
    healthScore,
  };
}

function detectCycles(edges: readonly ArchitectureEdge[]): string[][] {
  const adj = new Map<string, string[]>();
  for (const e of edges) {
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

  for (const node of adj.keys()) dfs(node);
  return cycles;
}

export function createArchitectureService() {
  return {
    view: buildArchitectureView,
  };
}
