/**
 * JS-005 — Derive missing relationships from repository / catalog evidence.
 * No manually maintained edges; all links are evidence-backed heuristics.
 */

import type { CatalogEntry, CatalogSnapshot } from "../../catalog/types";
import type { PackageDependencyGraph } from "../../repository/intelligence";
import type { KnowledgeEdge, KnowledgeEdgeKind } from "../edges/types";
import type { KnowledgeNode } from "../nodes/types";

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

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function stemService(name: string): string {
  return name.replace(/Service$/i, "").toLowerCase();
}

function overlap(a: readonly string[], b: readonly string[]): number {
  const bs = new Set(b);
  let n = 0;
  for (const x of a) if (bs.has(x)) n += 1;
  return n;
}

function catalogByPath(catalog: CatalogSnapshot): Map<string, CatalogEntry> {
  const m = new Map<string, CatalogEntry>();
  for (const e of catalog.entries) m.set(e.path, e);
  return m;
}

/**
 * Densify graph edges using catalog + package dependency evidence.
 */
export function densifyKnowledgeEdges(input: {
  nodes: Map<string, KnowledgeNode>;
  edges: Map<string, KnowledgeEdge>;
  catalog: CatalogSnapshot;
  dependencyGraph: readonly PackageDependencyGraph[];
  /** Product registry dependency strings (e.g. platform-sdk) — evidence from Studio products. */
  productDependencies?: readonly {
    productId: string;
    dependencies: readonly string[];
  }[];
}): { added: number } {
  const { nodes, edges, catalog, dependencyGraph } = input;
  const byPath = catalogByPath(catalog);
  let added = 0;

  const addE = (e: KnowledgeEdge) => {
    if (!nodes.has(e.from) || !nodes.has(e.to)) return;
    if (edges.has(e.id)) return;
    edges.set(e.id, e);
    added += 1;
  };

  const services = [...nodes.values()].filter((n) => n.kind === "service");
  const apis = [...nodes.values()].filter((n) => n.kind === "api");
  const entities = [...nodes.values()].filter(
    (n) => n.kind === "entity" || n.kind === "twin_mapping"
  );
  const events = [...nodes.values()].filter((n) => n.kind === "event");
  const tests = [...nodes.values()].filter(
    (n) => n.kind === "test" || n.kind === "test_suite"
  );
  const docs = [...nodes.values()].filter((n) => n.kind === "document");
  const modules = [...nodes.values()].filter((n) => n.kind === "module");
  const packages = [...nodes.values()].filter((n) => n.kind === "package");
  const pers = [...nodes.values()].filter((n) => n.kind === "per");
  const releases = [...nodes.values()].filter((n) => n.kind === "release");
  const providers = [...nodes.values()].filter(
    (n) => n.kind === "insight_provider"
  );
  const migrations = [...nodes.values()].filter(
    (n) =>
      n.kind === "document" &&
      (n.path?.includes("migration") ||
        n.keywords.includes("migration") ||
        n.id.includes("migration"))
  );
  // Also catalog migration kind nodes if present as path-based
  for (const e of catalog.entries.filter((x) => x.kind === "migration")) {
    const id = `migration:${e.path}`;
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        kind: "document",
        label: e.name,
        path: e.path,
        ownerPackage: e.ownerPackage,
        productId: e.ownerPackage,
        metadata: Object.freeze({ kind: "migration" }),
        keywords: Object.freeze(["migration", ...tokens(e.path)]),
        updatedAt: e.updatedAt,
      });
    }
    migrations.push(nodes.get(id)!);
  }

  // --- Package DEPENDS_ON from intelligence dependency graph ---
  for (const g of dependencyGraph) {
    const from = `package:${g.packageId}`;
    if (!nodes.has(from)) continue;
    for (const dep of [...g.dependencies, ...g.devDependencies]) {
      const local = dep
        .replace(/^@jag\//, "")
        .replace(/^@/, "")
        .replace(/^workspace:/, "")
        .split("/")[0]!;
      // Map common aliases to graph package ids
      const aliasMap: Record<string, string> = {
        academyos: "package:academyos",
        studio: "package:studio",
        "platform-sdk": "package:platform-sdk",
        "digital-twin": "package:digital-twin",
        connectors: "package:connector-runtime",
        "connector-runtime": "package:connector-runtime",
        "executive-intelligence": "package:executive-intelligence",
        "organizational-memory": "package:organizational-memory",
        platform: "package:platform-foundation",
      };
      const mapped = aliasMap[local] ?? aliasMap[dep];
      const candidates = [
        ...(mapped ? [mapped] : []),
        `package:${local}`,
        ...packages
          .map((p) => p.id)
          .filter(
            (id) =>
              id === `package:${local}` ||
              id.endsWith(`:${local}`) ||
              local.length > 3 && id.includes(local)
          ),
      ];
      for (const to of [...new Set(candidates)]) {
        if (to === from || !nodes.has(to)) continue;
        addE(
          edge(
            "DEPENDS_ON",
            from,
            to,
            `package dependency evidence ${dep}`,
            1
          )
        );
        addE(
          edge("CONSUMES", from, to, `package consumes ${dep}`, 0.5)
        );
        break;
      }
    }
  }

  // Product registry dependencies → package DEPENDS_ON
  for (const pd of input.productDependencies ?? []) {
    const from = `package:${pd.productId}`;
    if (!nodes.has(from)) continue;
    for (const dep of pd.dependencies) {
      const aliasMap: Record<string, string> = {
        "platform-sdk": "package:platform-sdk",
        "digital-twin": "package:digital-twin",
        connectors: "package:connector-runtime",
        "connector-runtime": "package:connector-runtime",
        studio: "package:studio",
        academyos: "package:academyos",
      };
      const to = aliasMap[dep] ?? `package:${dep}`;
      if (!nodes.has(to) || to === from) continue;
      addE(
        edge(
          "DEPENDS_ON",
          from,
          to,
          `product registry dependency ${pd.productId} → ${dep}`,
          1
        )
      );
    }
  }

  // --- Service EXPOSES API (path/name evidence) ---
  for (const svc of services) {
    const stem = stemService(svc.label);
    const svcTok = tokens(`${svc.label} ${svc.path ?? ""} ${svc.keywords.join(" ")}`);
    for (const api of apis) {
      if (svc.ownerPackage && api.ownerPackage && svc.ownerPackage !== api.ownerPackage)
        continue;
      const apiTok = tokens(`${api.path ?? ""} ${api.label} ${api.keywords.join(" ")}`);
      const pathHit =
        (api.path?.toLowerCase().includes(stem) ?? false) ||
        overlap(svcTok, apiTok) >= 2;
      if (!pathHit) continue;
      addE(
        edge(
          "EXPOSES",
          svc.id,
          api.id,
          `service ${svc.label} path/name overlap with ${api.path}`,
          0.8
        )
      );
    }
  }

  // Package-level: if same package segment in API path matches service folder
  for (const api of apis) {
    const segs = tokens(api.path ?? "");
    for (const svc of services) {
      if (svc.ownerPackage !== api.ownerPackage) continue;
      const folder = tokens(svc.path ?? "");
      if (overlap(segs, folder) >= 2) {
        addE(
          edge(
            "EXPOSES",
            svc.id,
            api.id,
            `shared path segments ${svc.path} ↔ ${api.path}`,
            0.6
          )
        );
      }
    }
  }

  // --- API RETURNS Entity / twin ---
  for (const api of apis) {
    const apiTok = tokens(`${api.path ?? ""} ${api.keywords.join(" ")}`);
    for (const ent of entities) {
      if (api.ownerPackage && ent.ownerPackage && api.ownerPackage !== ent.ownerPackage)
        continue;
      const entTok = tokens(`${ent.label} ${ent.path ?? ""} ${ent.keywords.join(" ")}`);
      if (overlap(apiTok, entTok) >= 1 || apiTok.some((t) => ent.label.toLowerCase().includes(t))) {
        addE(
          edge(
            "RETURNS",
            api.id,
            ent.id,
            `API ${api.path} keyword overlap with entity ${ent.label}`,
            0.5
          )
        );
        if (ent.kind === "twin_mapping") {
          addE(
            edge(
              "MAPS_TO",
              api.id,
              ent.id,
              `API maps twin ${ent.label}`,
              0.4
            )
          );
        }
      }
    }
  }

  // --- API EMITS Event ---
  for (const api of apis) {
    const apiTok = tokens(`${api.path ?? ""} ${api.keywords.join(" ")}`);
    for (const ev of events) {
      if (api.ownerPackage && ev.ownerPackage && api.ownerPackage !== ev.ownerPackage)
        continue;
      const evTok = tokens(`${ev.label} ${ev.path ?? ""}`);
      if (overlap(apiTok, evTok) >= 1) {
        addE(
          edge(
            "EMITS",
            api.id,
            ev.id,
            `API ${api.path} shares tokens with event ${ev.label}`,
            0.5
          )
        );
      }
    }
  }

  // --- Tests VALIDATES / VALIDATED_BY services & modules (catalog.tests + path) ---
  for (const svc of services) {
    const cat = svc.path ? byPath.get(svc.path) : undefined;
    const linkedTests = new Set<string>([
      ...(cat?.tests ?? []),
      ...tests
        .filter((t) => {
          const tTok = tokens(`${t.path ?? ""} ${t.label}`);
          const sTok = tokens(`${svc.label} ${svc.path ?? ""}`);
          return (
            (svc.ownerPackage &&
              t.ownerPackage === svc.ownerPackage &&
              overlap(tTok, sTok) >= 1) ||
            (t.path?.toLowerCase().includes(stemService(svc.label)) ?? false)
          );
        })
        .map((t) => t.path ?? t.id),
    ]);

    for (const testPath of linkedTests) {
      const tid = testPath.startsWith("test:") ? testPath : `test:${testPath}`;
      const tnode =
        nodes.get(tid) ??
        tests.find((t) => t.path === testPath || t.id === tid);
      if (!tnode) continue;
      addE(
        edge(
          "VALIDATES",
          tnode.id,
          svc.id,
          `test ${tnode.path ?? tnode.label} validates service ${svc.label}`,
          1
        )
      );
      addE(
        edge(
          "VALIDATED_BY",
          svc.id,
          tnode.id,
          `service ${svc.label} validated by ${tnode.path ?? tnode.label}`,
          1
        )
      );
    }
  }

  // Module VALIDATED_BY tests
  for (const mod of modules) {
    const modName = mod.label.toLowerCase();
    for (const t of tests) {
      const p = (t.path ?? "").toLowerCase();
      if (
        p.includes(modName) ||
        t.keywords.includes(modName) ||
        (mod.ownerPackage &&
          t.ownerPackage === mod.ownerPackage &&
          tokens(p).includes(modName))
      ) {
        addE(
          edge(
            "VALIDATES",
            t.id,
            mod.id,
            `test ${t.path} validates module ${mod.label}`,
            1
          )
        );
        addE(
          edge(
            "VALIDATED_BY",
            mod.id,
            t.id,
            `module ${mod.label} validated by ${t.path}`,
            1
          )
        );
      }
    }
    // Validation / Hardening modules ← suite names
    for (const t of tests.filter((x) => x.kind === "test_suite")) {
      if (
        (mod.label === "Validation" && /valid|rc-?1/i.test(t.label)) ||
        (mod.label === "Hardening" && /hard|rc-?2|security/i.test(t.label))
      ) {
        addE(
          edge(
            "VALIDATES",
            t.id,
            mod.id,
            `suite ${t.label} validates ${mod.label}`,
            1
          )
        );
        addE(
          edge(
            "VALIDATED_BY",
            mod.id,
            t.id,
            `module ${mod.label} validated by suite ${t.label}`,
            1
          )
        );
      }
    }
  }

  // API validated by tests from catalog
  for (const api of apis) {
    const cat = api.path ? byPath.get(api.path.replace(/^api:/, "")) : undefined;
    // catalog api entries use path without api: prefix
    const entry =
      cat ??
      catalog.entries.find(
        (e) => e.kind === "api" && `api:${e.path}` === api.id
      );
    for (const testPath of entry?.tests ?? []) {
      const tid = `test:${testPath}`;
      if (!nodes.has(tid)) continue;
      addE(
        edge("VALIDATES", tid, api.id, `test ${testPath} validates API ${api.path}`, 1)
      );
      addE(
        edge(
          "VALIDATED_BY",
          api.id,
          tid,
          `API ${api.path} validated by ${testPath}`,
          1
        )
      );
    }
    // path token match
    const apiTok = tokens(api.path ?? "");
    for (const t of tests) {
      if (overlap(apiTok, tokens(t.path ?? "")) >= 2) {
        addE(
          edge(
            "VALIDATES",
            t.id,
            api.id,
            `path overlap test↔api`,
            0.7
          )
        );
        addE(
          edge("VALIDATED_BY", api.id, t.id, `api validated by path overlap`, 0.7)
        );
      }
    }
  }

  // --- Package PROVIDES InsightProvider ---
  for (const ip of providers) {
    if (ip.ownerPackage && nodes.has(`package:${ip.ownerPackage}`)) {
      addE(
        edge(
          "PROVIDES",
          `package:${ip.ownerPackage}`,
          ip.id,
          `${ip.ownerPackage} provides insight provider ${ip.label}`,
          1
        )
      );
    }
  }

  // --- Document DOCUMENTS API ---
  for (const doc of docs) {
    const dTok = tokens(`${doc.path ?? ""} ${doc.label} ${doc.keywords.join(" ")}`);
    for (const api of apis) {
      const aTok = tokens(api.path ?? "");
      if (overlap(dTok, aTok) >= 2 || dTok.includes("api")) {
        // require at least one distinctive api segment
        const distinctive = aTok.filter((t) =>
          ["academyos", "studio", "finance", "sis", "workflow", "release", "knowledge"].includes(
            t
          )
        );
        if (distinctive.some((t) => dTok.includes(t)) || overlap(dTok, aTok) >= 3) {
          addE(
            edge(
              "DOCUMENTS",
              doc.id,
              api.id,
              `doc ${doc.path} documents API ${api.path}`,
              0.6
            )
          );
        }
      }
    }
  }

  // --- PER AFFECTS Package ---
  for (const per of pers) {
    for (const pack of packages) {
      const packId = pack.ownerPackage ?? pack.label;
      if (
        per.ownerPackage === packId ||
        per.keywords.includes(packId) ||
        per.productId === packId
      ) {
        addE(
          edge(
            "AFFECTS",
            per.id,
            pack.id,
            `PER ${per.label} affects package ${pack.label}`,
            1
          )
        );
        addE(
          edge(
            "REFERENCES",
            pack.id,
            per.id,
            `package ${pack.label} references PER ${per.label}`,
            0.8
          )
        );
      }
    }
  }

  // --- Release CONTAINS Package ---
  for (const rel of releases) {
    const prod = rel.productId ?? rel.ownerPackage;
    if (prod && nodes.has(`package:${prod}`)) {
      addE(
        edge(
          "CONTAINS",
          rel.id,
          `package:${prod}`,
          `release ${rel.label} contains package ${prod}`,
          1
        )
      );
    }
  }

  // --- Migration MODIFIES Entity ---
  for (const mig of migrations) {
    const mTok = tokens(`${mig.path ?? ""} ${mig.label}`);
    for (const ent of entities) {
      const eTok = tokens(ent.label);
      if (overlap(mTok, eTok) >= 1) {
        addE(
          edge(
            "MODIFIES",
            mig.id,
            ent.id,
            `migration ${mig.path} modifies entity ${ent.label}`,
            0.5
          )
        );
      }
    }
  }

  // Enrich API metadata from catalog (mutate node metadata via replace)
  for (const api of apis) {
    const entry = catalog.entries.find(
      (e) => e.kind === "api" && `api:${e.path}` === api.id
    );
    if (!entry) continue;
    const enriched: KnowledgeNode = {
      ...api,
      metadata: Object.freeze({
        ...api.metadata,
        methods: entry.routes.join(",") || entry.exports.join(","),
        testCount: String(entry.tests.length),
        docCount: String(entry.documentationLinks.length),
        ownerPackage: entry.ownerPackage ?? "",
        hasTests: String(entry.tests.length > 0),
        hasDocs: String(entry.documentationLinks.length > 0),
      }),
    };
    nodes.set(api.id, enriched);
  }

  return { added };
}
