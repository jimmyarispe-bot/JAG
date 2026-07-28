/**
 * Architecture Graph builder — relationships from the persistent catalog.
 */

import { createCatalogService } from "../catalog/indexer";
import type { CatalogEntry } from "../catalog/types";
import type {
  ArchitectureGraph,
  GraphEdge,
  GraphNode,
  GraphNodeKind,
  GraphRelationKind,
} from "./types";

function nodeKind(kind: CatalogEntry["kind"]): GraphNodeKind | null {
  switch (kind) {
    case "package":
    case "service":
    case "api":
    case "entity":
    case "event":
    case "connector":
    case "insight_provider":
    case "twin_mapping":
    case "per":
    case "test":
    case "doc":
      return kind;
    default:
      return null;
  }
}

function edge(
  from: string,
  to: string,
  kind: GraphRelationKind,
  evidence: string
): GraphEdge {
  return {
    id: `${kind}:${from}->${to}`,
    from,
    to,
    kind,
    evidence,
  };
}

export function buildArchitectureGraph(input?: {
  root?: string;
  force?: boolean;
}): ArchitectureGraph {
  const catalog = createCatalogService().index({
    root: input?.root,
    force: input?.force,
  });
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  for (const e of catalog.entries) {
    const kind = nodeKind(e.kind);
    if (!kind) continue;
    if (nodeIds.has(e.id)) continue;
    nodeIds.add(e.id);
    nodes.push({
      id: e.id,
      kind,
      label: e.name,
      path: e.path,
      ownerPackage: e.ownerPackage,
      metadata: Object.freeze({
        exports: String(e.exports.length),
        tests: String(e.tests.length),
        docs: String(e.documentationLinks.length),
      }),
    });
  }

  const byPackage = new Map<string, string>();
  for (const n of nodes) {
    if (n.kind === "package" && n.ownerPackage) {
      byPackage.set(n.ownerPackage, n.id);
    }
  }

  for (const e of catalog.entries) {
    if (!nodeIds.has(e.id)) continue;

    // Package owns entry
    if (e.ownerPackage && byPackage.has(e.ownerPackage) && e.kind !== "package") {
      edges.push(
        edge(
          byPackage.get(e.ownerPackage)!,
          e.id,
          "exposes",
          `${e.ownerPackage} owns ${e.kind} ${e.name}`
        )
      );
    }

    // Imports → depends_on between packages
    if (e.kind === "package") {
      for (const dep of e.imports) {
        const local = dep.replace(/^@jag\//, "").replace(/^@/, "");
        const targetPkg =
          [...byPackage.keys()].find(
            (p) => local === p || dep.includes(p) || dep.includes(`packages/${p}`)
          ) ?? null;
        if (targetPkg && byPackage.has(targetPkg) && targetPkg !== e.ownerPackage) {
          edges.push(
            edge(
              e.id,
              byPackage.get(targetPkg)!,
              "depends_on",
              `${e.name} depends on ${targetPkg}`
            )
          );
        }
      }
    }

    // Service/API imports relative packages
    for (const imp of e.imports) {
      if (imp.includes("academyos") && byPackage.has("academyos") && e.id !== "package:academyos") {
        edges.push(
          edge(e.id, "package:academyos", "consumes", `${e.name} imports academyos`)
        );
      }
      if (imp.includes("platform-sdk") || imp.includes("@/lib/platform-sdk")) {
        // synthetic SDK node
        if (!nodeIds.has("package:platform-sdk")) {
          nodeIds.add("package:platform-sdk");
          nodes.push({
            id: "package:platform-sdk",
            kind: "package",
            label: "platform-sdk",
            path: "src/lib/platform-sdk",
            ownerPackage: "platform-sdk",
            metadata: Object.freeze({}),
          });
          byPackage.set("platform-sdk", "package:platform-sdk");
        }
        edges.push(
          edge(e.id, "package:platform-sdk", "consumes", `${e.name} imports SDK`)
        );
      }
    }

    // tested_by / documented_by
    for (const t of e.tests) {
      const tid = `test:${t}`;
      if (nodeIds.has(tid)) {
        edges.push(edge(e.id, tid, "tested_by", `${e.name} tested by ${t}`));
      }
    }
    for (const d of e.documentationLinks) {
      const did = `doc:${d}`;
      if (nodeIds.has(did)) {
        edges.push(
          edge(e.id, did, "documented_by", `${e.name} documented by ${d}`)
        );
      }
    }

    // Events emitted by services
    if (e.kind === "event" && e.ownerPackage && byPackage.has(e.ownerPackage)) {
      edges.push(
        edge(
          byPackage.get(e.ownerPackage)!,
          e.id,
          "emits",
          `${e.ownerPackage} emits ${e.name}`
        )
      );
    }

    // Twin mappings
    if (e.kind === "twin_mapping" && e.ownerPackage && byPackage.has(e.ownerPackage)) {
      edges.push(
        edge(
          e.id,
          byPackage.get(e.ownerPackage)!,
          "maps_to",
          `${e.name} mapped in ${e.ownerPackage}`
        )
      );
    }

    // PER references packs
    if (e.kind === "per") {
      for (const kw of e.keywords) {
        if (byPackage.has(kw)) {
          edges.push(
            edge(e.id, byPackage.get(kw)!, "references", `${e.name} mentions ${kw}`)
          );
        }
      }
      if (e.ownerPackage && byPackage.has(e.ownerPackage)) {
        edges.push(
          edge(
            e.id,
            byPackage.get(e.ownerPackage)!,
            "references",
            `${e.name} originates in ${e.ownerPackage}`
          )
        );
      }
    }
  }

  // Deduplicate edges
  const edgeMap = new Map<string, GraphEdge>();
  for (const ed of edges) edgeMap.set(ed.id, ed);

  return {
    root: catalog.root,
    builtAt: new Date().toISOString(),
    catalogVersion: catalog.version,
    nodes: Object.freeze(nodes),
    edges: Object.freeze([...edgeMap.values()]),
  };
}

export function createGraphService() {
  return {
    build: buildArchitectureGraph,
    dependents(nodeId: string, root?: string) {
      const g = buildArchitectureGraph({ root });
      return Object.freeze(
        g.edges.filter((e) => e.to === nodeId).map((e) => ({
          edge: e,
          node: g.nodes.find((n) => n.id === e.from) ?? null,
        }))
      );
    },
    dependencies(nodeId: string, root?: string) {
      const g = buildArchitectureGraph({ root });
      return Object.freeze(
        g.edges.filter((e) => e.from === nodeId).map((e) => ({
          edge: e,
          node: g.nodes.find((n) => n.id === e.to) ?? null,
        }))
      );
    },
    summarize(root?: string) {
      const g = buildArchitectureGraph({ root });
      const byKind: Record<string, number> = {};
      for (const n of g.nodes) byKind[n.kind] = (byKind[n.kind] ?? 0) + 1;
      return {
        nodeCount: g.nodes.length,
        edgeCount: g.edges.length,
        byKind: Object.freeze(byKind),
        catalogVersion: g.catalogVersion,
      };
    },
  };
}
