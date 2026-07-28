/**
 * JS-005 — Test / API coverage metrics from Knowledge Graph edges.
 */

import { buildKnowledgeGraph } from "../graph/builder";
import type { KnowledgeGraph } from "../graph/types";
import type { KnowledgeNode } from "../nodes/types";

export type CoverageBucket = {
  readonly id: string;
  readonly label: string;
  readonly total: number;
  readonly covered: number;
  readonly coveragePercent: number;
  readonly untested: readonly string[];
};

export type KnowledgeCoverageReport = {
  readonly generatedAt: string;
  readonly graphVersion: string;
  readonly byProduct: readonly CoverageBucket[];
  readonly byPackage: readonly CoverageBucket[];
  readonly byModule: readonly CoverageBucket[];
  readonly byService: readonly CoverageBucket[];
  readonly untestedServices: readonly string[];
  readonly weaklyTestedApis: readonly string[];
  readonly missingValidationScenarios: readonly string[];
  readonly undocumentedApis: readonly string[];
  readonly apiIntelligence: readonly {
    readonly apiId: string;
    readonly path: string | null;
    readonly ownerService: string | null;
    readonly ownerPackage: string | null;
    readonly methods: string;
    readonly hasTests: boolean;
    readonly hasDocs: boolean;
    readonly returnsEntities: number;
    readonly emitsEvents: number;
    readonly missing: readonly string[];
  }[];
};

function hasEdge(
  g: KnowledgeGraph,
  from: string,
  kinds: readonly string[],
  toKind?: string
): boolean {
  return g.edges.some((e) => {
    if (e.from !== from && e.to !== from) return false;
    if (!kinds.includes(e.kind)) return false;
    if (!toKind) return true;
    const other = e.from === from ? e.to : e.from;
    return g.nodes.some((n) => n.id === other && n.kind === toKind);
  });
}

function validated(g: KnowledgeGraph, id: string): boolean {
  return g.edges.some(
    (e) =>
      (e.to === id && e.kind === "VALIDATES") ||
      (e.from === id && e.kind === "VALIDATED_BY")
  );
}

function bucket(
  id: string,
  label: string,
  items: readonly KnowledgeNode[],
  g: KnowledgeGraph
): CoverageBucket {
  const untested = items.filter((n) => !validated(g, n.id)).map((n) => n.id);
  const covered = items.length - untested.length;
  return {
    id,
    label,
    total: items.length,
    covered,
    coveragePercent:
      items.length === 0
        ? 100
        : Math.round((covered / items.length) * 1000) / 10,
    untested: Object.freeze(untested.slice(0, 40)),
  };
}

export function buildKnowledgeCoverage(root?: string): KnowledgeCoverageReport {
  const g = buildKnowledgeGraph({ root });
  const services = g.nodes.filter((n) => n.kind === "service");
  const apis = g.nodes.filter((n) => n.kind === "api");
  const modules = g.nodes.filter((n) => n.kind === "module");
  const packages = g.nodes.filter((n) => n.kind === "package");
  const products = g.nodes.filter((n) => n.kind === "product");

  const byProduct = products.map((p) =>
    bucket(
      p.id,
      p.label,
      services.filter(
        (s) => s.productId === p.productId || s.ownerPackage === p.productId
      ),
      g
    )
  );
  const byPackage = packages.map((p) =>
    bucket(
      p.id,
      p.label,
      services.filter((s) => s.ownerPackage === p.ownerPackage || s.ownerPackage === p.label),
      g
    )
  );
  const byModule = modules.map((m) => {
    const linked = services.filter((s) =>
      g.edges.some(
        (e) =>
          e.kind === "USES" &&
          e.from === m.id &&
          e.to === s.id
      )
    );
    return bucket(m.id, m.label, linked, g);
  });
  const byService = services.map((s) =>
    bucket(s.id, s.label, [s], g)
  );

  const untestedServices = services
    .filter((s) => !validated(g, s.id))
    .map((s) => s.id)
    .sort();

  const weaklyTestedApis = apis
    .filter((a) => !validated(g, a.id))
    .map((a) => a.id)
    .sort();

  const missingValidationScenarios = modules
    .filter((m) => m.label === "Validation" || m.label === "Hardening")
    .filter((m) => !validated(g, m.id))
    .map((m) => m.id);

  const undocumentedApis = apis
    .filter(
      (a) =>
        !g.edges.some(
          (e) =>
            e.to === a.id &&
            (e.kind === "DOCUMENTS" || e.kind === "DESCRIBES")
        )
    )
    .map((a) => a.id)
    .sort();

  const apiIntelligence = apis
    .map((api) => {
      const ownerService =
        g.edges.find((e) => e.kind === "EXPOSES" && e.to === api.id && e.from.startsWith("service:"))
          ?.from ?? null;
      const returnsEntities = g.edges.filter(
        (e) => e.from === api.id && e.kind === "RETURNS"
      ).length;
      const emitsEvents = g.edges.filter(
        (e) => e.from === api.id && e.kind === "EMITS"
      ).length;
      const hasTests = validated(g, api.id);
      const hasDocs = g.edges.some(
        (e) =>
          e.to === api.id &&
          (e.kind === "DOCUMENTS" || e.kind === "DESCRIBES")
      );
      const missing: string[] = [];
      if (!ownerService) missing.push("owner_service");
      if (!api.ownerPackage) missing.push("owner_package");
      if (!hasTests) missing.push("tests");
      if (!hasDocs) missing.push("documentation");
      if (returnsEntities === 0) missing.push("response_entities");
      if (emitsEvents === 0) missing.push("emitted_events");
      if (!api.metadata.methods) missing.push("request_methods");

      return {
        apiId: api.id,
        path: api.path,
        ownerService,
        ownerPackage: api.ownerPackage,
        methods: api.metadata.methods ?? "",
        hasTests,
        hasDocs,
        returnsEntities,
        emitsEvents,
        missing: Object.freeze(missing),
      };
    })
    .sort((a, b) => (a.path ?? "").localeCompare(b.path ?? ""));

  void hasEdge;

  return {
    generatedAt: new Date().toISOString(),
    graphVersion: g.version,
    byProduct: Object.freeze(byProduct),
    byPackage: Object.freeze(byPackage),
    byModule: Object.freeze(byModule),
    byService: Object.freeze(byService.slice(0, 200)),
    untestedServices: Object.freeze(untestedServices),
    weaklyTestedApis: Object.freeze(weaklyTestedApis.slice(0, 100)),
    missingValidationScenarios: Object.freeze(missingValidationScenarios),
    undocumentedApis: Object.freeze(undocumentedApis.slice(0, 100)),
    apiIntelligence: Object.freeze(apiIntelligence.slice(0, 200)),
  };
}

export function createKnowledgeCoverageService() {
  return { build: buildKnowledgeCoverage };
}
