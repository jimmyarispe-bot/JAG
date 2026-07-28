import type { CatalogSnapshot } from "./types";

const g = globalThis as typeof globalThis & {
  __jagStudioCatalogSnapshot?: CatalogSnapshot | null;
};

export function getCatalogSnapshot(): CatalogSnapshot | null {
  return g.__jagStudioCatalogSnapshot ?? null;
}

export function setCatalogSnapshot(snapshot: CatalogSnapshot): CatalogSnapshot {
  g.__jagStudioCatalogSnapshot = snapshot;
  return snapshot;
}

export function clearCatalogSnapshot(): void {
  g.__jagStudioCatalogSnapshot = null;
}
