/**
 * Release Impact Analysis — estimate blast radius of a proposed change.
 */

import { createCatalogService } from "../catalog/indexer";
import { createGraphService } from "../graph/builder";
import { createProductRegistryService } from "../products/registry";

export type ImpactChangeKind =
  | "rename_interface"
  | "remove_api"
  | "promote_per"
  | "modify_service"
  | "generic";

export type ImpactReport = {
  readonly changeKind: ImpactChangeKind;
  readonly target: string;
  readonly analyzedAt: string;
  readonly affectedPackages: readonly string[];
  readonly affectedProducts: readonly string[];
  readonly affectedTests: readonly string[];
  readonly documentationUpdates: readonly string[];
  readonly affectedApis: readonly string[];
  readonly affectedNodes: readonly string[];
  readonly severity: "Low" | "Medium" | "High" | "Critical";
  readonly summary: string;
};

export function analyzeImpact(input: {
  target: string;
  changeKind?: ImpactChangeKind;
  root?: string;
}): ImpactReport {
  const changeKind = input.changeKind ?? "generic";
  const catalog = createCatalogService().ensure(input.root);
  const graph = createGraphService();
  const g = graph.build({ root: input.root });
  const q = input.target.trim().toLowerCase();

  const matched = catalog.entries.filter(
    (e) =>
      e.id.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.path.toLowerCase().includes(q) ||
      e.symbols.some((s) => s.toLowerCase().includes(q))
  );

  const nodeIds = new Set(matched.map((e) => e.id));
  // Walk dependents
  let frontier = [...nodeIds];
  for (let i = 0; i < 3 && frontier.length; i++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const d of graph.dependents(id, input.root)) {
        if (d.node && !nodeIds.has(d.node.id)) {
          nodeIds.add(d.node.id);
          next.push(d.node.id);
        }
      }
    }
    frontier = next;
  }

  const affectedEntries = catalog.entries.filter((e) => nodeIds.has(e.id));
  const affectedPackages = [
    ...new Set(
      affectedEntries
        .map((e) => e.ownerPackage)
        .filter((p): p is string => Boolean(p))
    ),
  ];
  const affectedTests = [
    ...new Set(affectedEntries.flatMap((e) => e.tests)),
  ];
  const documentationUpdates = [
    ...new Set(affectedEntries.flatMap((e) => e.documentationLinks)),
  ];
  const affectedApis = affectedEntries
    .filter((e) => e.kind === "api")
    .map((e) => e.path);

  const products = createProductRegistryService().list();
  const affectedProducts = products
    .filter((p) =>
      affectedPackages.some(
        (pkg) => pkg === p.id || p.dependencies.includes(pkg)
      )
    )
    .map((p) => p.id);

  // PER promotion special case
  if (changeKind === "promote_per" || q.startsWith("per-")) {
    const perEntries = catalog.entries.filter(
      (e) => e.kind === "per" && e.name.toLowerCase().includes(q.replace(/^per:/, ""))
    );
    for (const p of perEntries) {
      documentationUpdates.push(...p.documentationLinks);
      if (p.ownerPackage) affectedPackages.push(p.ownerPackage);
    }
  }

  const packageCount = new Set(affectedPackages).size;
  const severity =
    changeKind === "remove_api" && affectedApis.length > 0
      ? affectedPackages.length > 2
        ? "Critical"
        : "High"
      : packageCount >= 3
        ? "High"
        : packageCount === 2
          ? "Medium"
          : matched.length > 0
            ? "Low"
            : "Low";

  const uniquePackages = [...new Set(affectedPackages)];
  const uniqueDocs = [...new Set(documentationUpdates)];
  const uniqueTests = [...new Set(affectedTests)];

  return {
    changeKind,
    target: input.target,
    analyzedAt: new Date().toISOString(),
    affectedPackages: Object.freeze(uniquePackages),
    affectedProducts: Object.freeze([...new Set(affectedProducts)]),
    affectedTests: Object.freeze(uniqueTests),
    documentationUpdates: Object.freeze(uniqueDocs),
    affectedApis: Object.freeze(affectedApis),
    affectedNodes: Object.freeze([...nodeIds]),
    severity,
    summary: `Change to "${input.target}" (${changeKind}) impacts ${uniquePackages.length} package(s), ${uniqueTests.length} test file(s), ${uniqueDocs.length} doc(s); graph nodes=${nodeIds.size}, edges=${g.edges.length}.`,
  };
}

export function createImpactService() {
  return {
    analyze: analyzeImpact,
  };
}
