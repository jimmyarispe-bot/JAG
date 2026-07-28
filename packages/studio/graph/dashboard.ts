/**
 * Architecture Dashboard — visual summary maps from graph + catalog.
 */

import { createCatalogService } from "../catalog/indexer";
import { analyzeDependencies } from "../dependencies/analyzer";
import { createProductRegistryService } from "../products/registry";
import { generateRecommendations } from "../recommendations/engine";
import { buildArchitectureGraph } from "./builder";

export type ArchitectureDashboard = {
  readonly generatedAt: string;
  readonly packageDependencyGraph: {
    readonly nodes: readonly { id: string; label: string }[];
    readonly edges: readonly { from: string; to: string }[];
  };
  readonly productDependencyGraph: {
    readonly nodes: readonly { id: string; label: string }[];
    readonly edges: readonly { from: string; to: string }[];
  };
  readonly apiMap: readonly { path: string; packageId: string | null; methods: readonly string[] }[];
  readonly connectorMap: readonly { name: string; path: string; packageId: string | null }[];
  readonly insightProviderMap: readonly { id: string; packageId: string | null }[];
  readonly digitalTwinUsage: readonly { name: string; path: string; packageId: string | null }[];
  readonly testCoverageByPackage: Readonly<Record<string, { tests: number; services: number; coverageRatio: number }>>;
  readonly architectureHealthScore: number;
  readonly dependencyRisk: number;
  readonly documentationCoverage: number;
  readonly recommendationCounts: Readonly<Record<string, number>>;
};

export function buildArchitectureDashboard(root?: string): ArchitectureDashboard {
  const catalog = createCatalogService().ensure(root);
  const graph = buildArchitectureGraph({ root });
  const deps = analyzeDependencies({ root });
  const recs = generateRecommendations({ root });
  const products = createProductRegistryService().list();

  const packageNodes = graph.nodes
    .filter((n) => n.kind === "package")
    .map((n) => ({ id: n.id, label: n.label }));
  const packageEdges = graph.edges
    .filter((e) => e.kind === "depends_on" || e.kind === "consumes")
    .filter(
      (e) =>
        packageNodes.some((n) => n.id === e.from) &&
        packageNodes.some((n) => n.id === e.to)
    )
    .map((e) => ({ from: e.from, to: e.to }));

  const productNodes = products.map((p) => ({ id: p.id, label: p.name }));
  const productEdges: { from: string; to: string }[] = [];
  for (const p of products) {
    for (const d of p.dependencies) {
      if (products.some((x) => x.id === d)) {
        productEdges.push({ from: p.id, to: d });
      }
    }
  }

  const apiMap = catalog.entries
    .filter((e) => e.kind === "api")
    .map((e) => ({
      path: e.path,
      packageId: e.ownerPackage,
      methods: e.routes,
    }));

  const connectorMap = catalog.entries
    .filter((e) => e.kind === "connector")
    .map((e) => ({
      name: e.name,
      path: e.path,
      packageId: e.ownerPackage,
    }));

  const insightProviderMap = catalog.entries
    .filter((e) => e.kind === "insight_provider")
    .map((e) => ({ id: e.name, packageId: e.ownerPackage }));

  const digitalTwinUsage = catalog.entries
    .filter((e) => e.kind === "twin_mapping" || e.kind === "entity")
    .map((e) => ({
      name: e.name,
      path: e.path,
      packageId: e.ownerPackage,
    }));

  const packages = [
    ...new Set(
      catalog.entries
        .map((e) => e.ownerPackage)
        .filter((p): p is string => Boolean(p))
    ),
  ];
  const testCoverageByPackage: Record<
    string,
    { tests: number; services: number; coverageRatio: number }
  > = {};
  for (const pkg of packages) {
    const tests = catalog.entries.filter(
      (e) => e.kind === "test" && e.ownerPackage === pkg
    ).length;
    const services = catalog.entries.filter(
      (e) => e.kind === "service" && e.ownerPackage === pkg
    ).length;
    const withTests = catalog.entries.filter(
      (e) =>
        e.ownerPackage === pkg &&
        (e.kind === "service" || e.kind === "api") &&
        e.tests.length > 0
    ).length;
    const total = Math.max(
      1,
      catalog.entries.filter(
        (e) =>
          e.ownerPackage === pkg && (e.kind === "service" || e.kind === "api")
      ).length
    );
    testCoverageByPackage[pkg] = {
      tests,
      services,
      coverageRatio: Math.round((withTests / total) * 1000) / 10,
    };
  }

  const docs = catalog.counts.doc ?? 0;
  const apis = catalog.counts.api ?? 0;
  const documentedApis = catalog.entries.filter(
    (e) => e.kind === "api" && e.documentationLinks.length > 0
  ).length;
  const documentationCoverage =
    apis === 0
      ? 100
      : Math.round((documentedApis / apis) * 1000) / 10;

  const architectureHealthScore = Math.max(
    0,
    Math.round((100 - deps.riskScore * 0.6 + Math.min(20, docs / 5)) * 10) / 10
  );

  return {
    generatedAt: new Date().toISOString(),
    packageDependencyGraph: {
      nodes: Object.freeze(packageNodes),
      edges: Object.freeze(packageEdges),
    },
    productDependencyGraph: {
      nodes: Object.freeze(productNodes),
      edges: Object.freeze(productEdges),
    },
    apiMap: Object.freeze(apiMap),
    connectorMap: Object.freeze(connectorMap),
    insightProviderMap: Object.freeze(insightProviderMap),
    digitalTwinUsage: Object.freeze(digitalTwinUsage),
    testCoverageByPackage: Object.freeze(testCoverageByPackage),
    architectureHealthScore: Math.min(100, architectureHealthScore),
    dependencyRisk: deps.riskScore,
    documentationCoverage,
    recommendationCounts: Object.freeze({ ...recs.countsBySeverity }),
  };
}

export function createArchitectureDashboardService() {
  return {
    build: buildArchitectureDashboard,
  };
}
