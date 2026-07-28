/**
 * Knowledge Graph ingestion — maps Studio evidence into nodes/edges.
 * Consumes catalog, products, PERs, releases, tests, docs — no Foundation edits.
 */

import { createHash } from "node:crypto";
import { createCatalogService } from "../../catalog/indexer";
import type { CatalogEntry } from "../../catalog/types";
import { createPerEngine } from "../../per/engine";
import { createProductRegistryService } from "../../products/registry";
import { listReleases } from "../../store";
import { buildTestingWorkspace } from "../../testing/workspace";
import type { KnowledgeEdge } from "../edges/types";
import type { KnowledgeEdgeKind } from "../edges/types";
import type { KnowledgeNode } from "../nodes/types";
import type { KnowledgeNodeKind } from "../nodes/types";

const ACADEMY_MODULES = [
  "Admissions",
  "SIS",
  "Learning",
  "Finance",
  "Workforce",
  "Communications",
  "Validation",
  "Hardening",
] as const;

const PLATFORM_PACKAGES = [
  { id: "platform-sdk", path: "src/lib/platform-sdk", productId: null },
  { id: "connector-runtime", path: "src/lib/connectors", productId: null },
  {
    id: "executive-intelligence",
    path: "src/lib/executive-intelligence",
    productId: null,
  },
  { id: "digital-twin", path: "src/lib/digital-twin", productId: null },
  {
    id: "organizational-memory",
    path: "src/lib/platform/oios",
    productId: null,
  },
  { id: "platform-foundation", path: "src/lib/platform", productId: null },
] as const;

function node(
  kind: KnowledgeNodeKind,
  id: string,
  label: string,
  opts: Partial<Omit<KnowledgeNode, "id" | "kind" | "label">> & {
    updatedAt: string;
  }
): KnowledgeNode {
  return {
    id,
    kind,
    label,
    path: opts.path ?? null,
    ownerPackage: opts.ownerPackage ?? null,
    productId: opts.productId ?? null,
    metadata: Object.freeze(opts.metadata ?? {}),
    keywords: Object.freeze(opts.keywords ?? []),
    updatedAt: opts.updatedAt,
  };
}

function edge(
  kind: KnowledgeEdgeKind,
  from: string,
  to: string,
  evidence: string,
  weight = 1
): KnowledgeEdge {
  return {
    id: `${kind}:${from}->${to}`,
    from,
    to,
    kind,
    evidence,
    weight,
  };
}

function catalogKindToNode(kind: CatalogEntry["kind"]): KnowledgeNodeKind | null {
  switch (kind) {
    case "package":
      return "package";
    case "service":
      return "service";
    case "api":
    case "route":
      return "api";
    case "entity":
      return "entity";
    case "event":
      return "event";
    case "connector":
      return "connector";
    case "insight_provider":
      return "insight_provider";
    case "twin_mapping":
      return "twin_mapping";
    case "per":
      return "per";
    case "test":
      return "test";
    case "doc":
      return "document";
    default:
      return null;
  }
}

function moduleForPath(path: string, pkg: string | null): string | null {
  if (pkg !== "academyos") return null;
  const p = path.toLowerCase();
  for (const m of ACADEMY_MODULES) {
    if (p.includes(m.toLowerCase())) return m;
  }
  if (p.includes("admission")) return "Admissions";
  if (p.includes("sis") || p.includes("student")) return "SIS";
  if (p.includes("learning") || p.includes("assessment")) return "Learning";
  if (p.includes("finance") || p.includes("tuition") || p.includes("invoice"))
    return "Finance";
  if (p.includes("workforce") || p.includes("payroll")) return "Workforce";
  if (p.includes("communication") || p.includes("notif"))
    return "Communications";
  if (p.includes("validation") || p.includes("rc1")) return "Validation";
  if (p.includes("hardening") || p.includes("rc2")) return "Hardening";
  return null;
}

export type IngestionResult = {
  readonly nodes: KnowledgeNode[];
  readonly edges: KnowledgeEdge[];
  readonly catalogVersion: string | null;
  readonly root: string;
};

export function ingestKnowledgeSources(input?: {
  root?: string;
  force?: boolean;
}): IngestionResult {
  const root = input?.root ?? process.cwd();
  const now = new Date().toISOString();
  const catalog = createCatalogService().index({
    root,
    force: input?.force,
  });
  const products = createProductRegistryService().list();
  const pers = createPerEngine().sync(root);
  const testing = buildTestingWorkspace(root);
  const releases = listReleases();

  const nodes = new Map<string, KnowledgeNode>();
  const edges = new Map<string, KnowledgeEdge>();

  const addN = (n: KnowledgeNode) => {
    if (!nodes.has(n.id)) nodes.set(n.id, n);
  };
  const addE = (e: KnowledgeEdge) => {
    if (nodes.has(e.from) && nodes.has(e.to)) edges.set(e.id, e);
  };

  // Product layer
  addN(
    node("product", "product:platform-foundation", "Platform Foundation", {
      path: "src/lib/platform",
      productId: null,
      keywords: ["platform", "foundation"],
      updatedAt: now,
    })
  );
  addN(
    node("product", "product:studio", "JAG Studio", {
      path: "packages/studio",
      ownerPackage: "studio",
      productId: "studio",
      keywords: ["studio", "governance"],
      updatedAt: now,
    })
  );
  for (const p of products) {
    addN(
      node("product", `product:${p.id}`, p.name, {
        path: `packages/${p.id}`,
        ownerPackage: p.id,
        productId: p.id,
        metadata: {
          version: p.version,
          stage: p.releaseStatus,
          certification: p.certification,
        },
        keywords: [p.id, p.name.toLowerCase()],
        updatedAt: now,
      })
    );
  }

  // Platform packages
  for (const pkg of PLATFORM_PACKAGES) {
    addN(
      node("package", `package:${pkg.id}`, pkg.id, {
        path: pkg.path,
        ownerPackage: pkg.id,
        productId: pkg.productId,
        keywords: [pkg.id, "platform"],
        updatedAt: now,
      })
    );
    addE(
      edge(
        "PART_OF",
        `package:${pkg.id}`,
        "product:platform-foundation",
        `${pkg.id} is Platform Foundation surface`
      )
    );
  }

  // Catalog entries → nodes
  for (const e of catalog.entries) {
    const kind = catalogKindToNode(e.kind);
    if (!kind) continue;
    const id =
      kind === "package"
        ? `package:${e.name}`
        : kind === "api"
          ? `api:${e.path}`
          : kind === "per"
            ? `per:${e.name}`
            : kind === "document"
              ? `document:${e.path}`
              : kind === "test"
                ? `test:${e.path}`
                : `${kind}:${e.path}:${e.name}`;

    addN(
      node(kind, id, e.name, {
        path: e.path,
        ownerPackage: e.ownerPackage,
        productId: e.ownerPackage,
        metadata: {
          catalogId: e.id,
          exports: String(e.exports.length),
          tests: String(e.tests.length),
        },
        keywords: [...e.keywords, ...e.symbols.map((s) => s.toLowerCase())],
        updatedAt: e.updatedAt,
      })
    );

    if (e.ownerPackage) {
      const pkgId = `package:${e.ownerPackage}`;
      if (!nodes.has(pkgId)) {
        addN(
          node("package", pkgId, e.ownerPackage, {
            path: `packages/${e.ownerPackage}`,
            ownerPackage: e.ownerPackage,
            productId: e.ownerPackage,
            keywords: [e.ownerPackage],
            updatedAt: now,
          })
        );
      }
      if (kind !== "package") {
        addE(
          edge("CONTAINS", pkgId, id, `${e.ownerPackage} contains ${e.name}`)
        );
        addE(
          edge("OWNED_BY", id, pkgId, `${e.name} owned by ${e.ownerPackage}`)
        );
      }
    }
  }

  // Studio / AcademyOS product ↔ package
  for (const pkgName of ["studio", "academyos"]) {
    const pkgId = `package:${pkgName}`;
    const prodId = `product:${pkgName}`;
    if (nodes.has(pkgId) && nodes.has(prodId)) {
      addE(edge("PART_OF", pkgId, prodId, `${pkgName} package is product`));
      addE(edge("CONTAINS", prodId, pkgId, `${pkgName} product contains package`));
    }
  }
  if (nodes.has("package:studio") && nodes.has("product:studio")) {
    addE(
      edge(
        "PART_OF",
        "package:studio",
        "product:studio",
        "studio package is JAG Studio"
      )
    );
  }

  // AcademyOS modules
  for (const mod of ACADEMY_MODULES) {
    const mid = `module:academyos:${mod}`;
    addN(
      node("module", mid, mod, {
        path: `packages/academyos`,
        ownerPackage: "academyos",
        productId: "academyos",
        keywords: [mod.toLowerCase(), "academyos", "module"],
        updatedAt: now,
      })
    );
    if (nodes.has("package:academyos")) {
      addE(
        edge(
          "CONTAINS",
          "package:academyos",
          mid,
          `academyos contains module ${mod}`
        )
      );
    }
    if (nodes.has("product:academyos")) {
      addE(
        edge(
          "PART_OF",
          mid,
          "product:academyos",
          `${mod} part of AcademyOS`
        )
      );
    }
  }

  // Wire services/APIs to modules
  for (const e of catalog.entries) {
    if (e.kind !== "service" && e.kind !== "api") continue;
    const mod = moduleForPath(e.path, e.ownerPackage);
    if (!mod) continue;
    const mid = `module:academyos:${mod}`;
    const nid =
      e.kind === "api"
        ? `api:${e.path}`
        : `service:${e.path}:${e.name}`;
    if (!nodes.has(nid) || !nodes.has(mid)) continue;
    if (e.kind === "service") {
      addE(edge("USES", mid, nid, `${mod} uses ${e.name}`));
    } else {
      addE(edge("EXPOSES", mid, nid, `${mod} exposes ${e.path}`));
    }
  }

  // Services expose APIs (same package + name overlap)
  const services = [...nodes.values()].filter((n) => n.kind === "service");
  const apis = [...nodes.values()].filter((n) => n.kind === "api");
  for (const svc of services) {
    for (const api of apis) {
      if (
        svc.ownerPackage &&
        svc.ownerPackage === api.ownerPackage &&
        (api.path.toLowerCase().includes(svc.label.toLowerCase().replace(/service$/i, "")) ||
          api.keywords.some((k) => svc.keywords.includes(k)))
      ) {
        addE(
          edge("EXPOSES", svc.id, api.id, `${svc.label} exposes ${api.path}`, 0.5)
        );
      }
    }
  }

  // Events → workflows → notifications (deterministic stubs from catalog)
  for (const ev of [...nodes.values()].filter((n) => n.kind === "event")) {
    const wfId = `workflow:${ev.ownerPackage ?? "platform"}:${ev.label}`;
    addN(
      node("workflow", wfId, `${ev.label}Workflow`, {
        path: ev.path,
        ownerPackage: ev.ownerPackage,
        productId: ev.productId,
        keywords: ["workflow", ...ev.keywords],
        updatedAt: now,
      })
    );
    addE(edge("TRIGGERS", ev.id, wfId, `${ev.label} triggers workflow`));
    if (ev.ownerPackage) {
      const mod = moduleForPath(ev.path ?? "", ev.ownerPackage);
      if (mod) {
        addE(
          edge(
            "EMITS",
            `module:academyos:${mod}`,
            ev.id,
            `${mod} emits ${ev.label}`
          )
        );
      }
    }
    const notifId = `notification:${ev.label}`;
    addN(
      node("notification", notifId, `${ev.label} Notification`, {
        ownerPackage: ev.ownerPackage,
        productId: ev.productId,
        keywords: ["notification", ...ev.keywords],
        updatedAt: now,
      })
    );
    addE(
      edge("GENERATES", wfId, notifId, `workflow generates notification`)
    );
  }

  // Twin / entity RETURNS from APIs (same package)
  for (const api of apis) {
    for (const ent of [...nodes.values()].filter(
      (n) => n.kind === "entity" || n.kind === "twin_mapping"
    )) {
      if (api.ownerPackage && api.ownerPackage === ent.ownerPackage) {
        addE(
          edge(
            "RETURNS",
            api.id,
            ent.id,
            `${api.path} returns ${ent.label}`,
            0.3
          )
        );
      }
    }
  }

  // Docs DESCRIBES packages
  for (const doc of [...nodes.values()].filter((n) => n.kind === "document")) {
    const pkg =
      doc.ownerPackage ??
      (doc.path?.includes("academyos")
        ? "academyos"
        : doc.path?.includes("studio")
          ? "studio"
          : doc.path?.includes("platform")
            ? "platform-foundation"
            : null);
    if (pkg && nodes.has(`package:${pkg}`)) {
      addE(
        edge(
          "DESCRIBES",
          doc.id,
          `package:${pkg}`,
          `${doc.label} describes ${pkg}`
        )
      );
      addE(
        edge(
          "DOCUMENTS",
          doc.id,
          `package:${pkg}`,
          `${doc.label} documents ${pkg}`
        )
      );
    }
  }

  // Tests VALIDATES modules/packages
  for (const t of [...nodes.values()].filter((n) => n.kind === "test")) {
    const mod = moduleForPath(t.path ?? "", t.ownerPackage);
    if (mod && nodes.has(`module:academyos:${mod}`)) {
      addE(
        edge(
          "VALIDATES",
          t.id,
          `module:academyos:${mod}`,
          `${t.label} validates ${mod}`
        )
      );
    } else if (t.ownerPackage && nodes.has(`package:${t.ownerPackage}`)) {
      addE(
        edge(
          "VALIDATES",
          t.id,
          `package:${t.ownerPackage}`,
          `${t.label} validates ${t.ownerPackage}`
        )
      );
    }
  }

  // Test suites from testing workspace
  for (const suite of testing.suites) {
    const sid = `test_suite:${suite.id}`;
    addN(
      node("test_suite", sid, suite.name, {
        productId: suite.domain === "AcademyOS" ? "academyos" : null,
        metadata: {
          passRate: String(suite.lastPassRate ?? ""),
          failures: String(suite.lastFailures),
          fileCount: String(suite.fileCount),
        },
        keywords: [suite.name.toLowerCase(), suite.domain.toLowerCase()],
        updatedAt: suite.lastRunAt ?? now,
      })
    );
    if (suite.domain === "AcademyOS" && nodes.has("package:academyos")) {
      addE(
        edge(
          "VALIDATES",
          sid,
          "package:academyos",
          `${suite.name} validates academyos`
        )
      );
    }
    if (suite.domain === "Studio" && nodes.has("package:studio")) {
      addE(
        edge("VALIDATES", sid, "package:studio", `${suite.name} validates studio`)
      );
    }
  }

  // PERs
  for (const per of pers) {
    const pid = `per:${per.id}`;
    addN(
      node("per", pid, per.id, {
        path: `docs/${per.originatingPack}`,
        ownerPackage: per.originatingPack,
        productId: per.originatingPack,
        metadata: {
          status: per.status,
          promote: String(per.promoteToFoundation),
        },
        keywords: [
          per.id.toLowerCase(),
          ...per.packsMentioning.map((p) => p.toLowerCase()),
        ],
        updatedAt: per.updatedAt,
      })
    );
    for (const pack of new Set([
      per.originatingPack,
      ...per.packsMentioning,
    ])) {
      if (nodes.has(`package:${pack}`)) {
        addE(
          edge("REFERENCES", `package:${pack}`, pid, `${pack} references ${per.id}`)
        );
      }
      if (nodes.has(`product:${pack}`)) {
        addE(
          edge("REFERENCES", `product:${pack}`, pid, `${pack} product references ${per.id}`)
        );
      }
    }
  }

  // Releases CERTIFIES products
  for (const rel of releases) {
    const rid = `release:${rel.id}`;
    addN(
      node("release", rid, `${rel.productId}@${rel.version}`, {
        productId: rel.productId,
        ownerPackage: rel.productId,
        metadata: {
          status: rel.status,
          version: rel.version,
        },
        keywords: [rel.productId, rel.version, rel.status.toLowerCase()],
        updatedAt: rel.createdAt,
      })
    );
    if (nodes.has(`product:${rel.productId}`)) {
      addE(
        edge(
          "CERTIFIES",
          rid,
          `product:${rel.productId}`,
          `release ${rel.version} certifies ${rel.productId}`
        )
      );
    }
  }

  // Package DEPENDS_ON from catalog imports
  for (const e of catalog.entries.filter((x) => x.kind === "package")) {
    const from = `package:${e.name}`;
    for (const dep of e.imports) {
      const local = dep
        .replace(/^@jag\//, "")
        .replace(/^@/, "")
        .split("/")[0]!;
      const candidates = [
        `package:${local}`,
        `package:${dep}`,
        ...[...nodes.keys()].filter(
          (id) =>
            id.startsWith("package:") &&
            (dep.includes(id.slice("package:".length)) ||
              id.includes(local))
        ),
      ];
      for (const to of candidates) {
        if (nodes.has(to) && to !== from) {
          addE(edge("DEPENDS_ON", from, to, `${e.name} depends on ${to}`));
          addE(edge("CONSUMES", from, to, `${e.name} consumes ${to}`, 0.5));
          break;
        }
      }
    }
  }

  // Roles (governance)
  for (const role of [
    "Engineering",
    "Architecture",
    "QA",
    "Executive",
    "Release",
  ]) {
    addN(
      node("role", `role:${role}`, role, {
        keywords: ["role", "approval", role.toLowerCase()],
        updatedAt: now,
      })
    );
  }

  // Insight providers already from catalog; ensure known ids
  for (const ip of [
    "studio.platform-insights",
    "academyos.education-insights",
  ]) {
    const id = `insight_provider:${ip}`;
    if (!nodes.has(id)) {
      addN(
        node("insight_provider", id, ip, {
          ownerPackage: ip.startsWith("studio") ? "studio" : "academyos",
          productId: ip.startsWith("studio") ? "studio" : "academyos",
          keywords: ["insight", "provider"],
          updatedAt: now,
        })
      );
    }
  }

  return {
    nodes: [...nodes.values()],
    edges: [...edges.values()],
    catalogVersion: catalog.version,
    root,
  };
}

export function hashGraphVersion(
  nodeCount: number,
  edgeCount: number,
  catalogVersion: string | null
): string {
  return createHash("sha1")
    .update(`${catalogVersion ?? ""}|${nodeCount}|${edgeCount}`)
    .digest("hex")
    .slice(0, 12);
}
