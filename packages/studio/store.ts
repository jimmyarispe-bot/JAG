import { clearCatalogSnapshot } from "./catalog/store";
import { clearRepositoryScanCache } from "./repository/scanner";
import type {
  StudioPer,
  StudioProduct,
  StudioRelease,
  TestRunRecord,
} from "./types";

/** Clear JS-003/JS-004 globals without importing heavy engines (avoids circular deps). */
function clearGovernanceGlobalsForTests(): void {
  const g = globalThis as typeof globalThis & {
    __jagStudioCertifications?: Map<string, unknown>;
    __jagStudioApprovals?: unknown[];
    __jagStudioPolicies?: Map<string, unknown>;
    __jagStudioQualityWeights?: unknown;
    __jagStudioKnowledgeGraph?: unknown;
  };
  g.__jagStudioCertifications = new Map();
  g.__jagStudioApprovals = [];
  g.__jagStudioPolicies = undefined;
  g.__jagStudioQualityWeights = undefined;
  g.__jagStudioKnowledgeGraph = null;
}

type StudioStore = {
  products: Map<string, StudioProduct>;
  releases: Map<string, StudioRelease>;
  pers: Map<string, StudioPer>;
  testRuns: TestRunRecord[];
  seeded: boolean;
};

const g = globalThis as typeof globalThis & {
  __jagStudioStore?: StudioStore;
};

function empty(): StudioStore {
  return {
    products: new Map(),
    releases: new Map(),
    pers: new Map(),
    testRuns: [],
    seeded: false,
  };
}

function store(): StudioStore {
  if (!g.__jagStudioStore) g.__jagStudioStore = empty();
  return g.__jagStudioStore;
}

export function resetStudioStoreForTests(): void {
  g.__jagStudioStore = empty();
  clearRepositoryScanCache();
  clearCatalogSnapshot();
  clearGovernanceGlobalsForTests();
}

export function markStudioSeeded(): void {
  store().seeded = true;
}

export function isStudioSeeded(): boolean {
  return store().seeded;
}

export function upsertProduct(p: StudioProduct): StudioProduct {
  store().products.set(p.id, p);
  return p;
}

export function getProduct(id: string): StudioProduct | null {
  return store().products.get(id) ?? null;
}

export function listProducts(): StudioProduct[] {
  return [...store().products.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function upsertRelease(r: StudioRelease): StudioRelease {
  store().releases.set(r.id, r);
  return r;
}

export function getRelease(id: string): StudioRelease | null {
  return store().releases.get(id) ?? null;
}

export function listReleases(productId?: string): StudioRelease[] {
  return [...store().releases.values()]
    .filter((r) => !productId || r.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertPer(p: StudioPer): StudioPer {
  store().pers.set(p.id, p);
  return p;
}

export function getPer(id: string): StudioPer | null {
  return store().pers.get(id) ?? null;
}

export function listPers(): StudioPer[] {
  return [...store().pers.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function appendTestRun(run: TestRunRecord): TestRunRecord {
  store().testRuns.push(run);
  return run;
}

export function listTestRuns(): TestRunRecord[] {
  return [...store().testRuns].sort((a, b) => b.ranAt.localeCompare(a.ranAt));
}
