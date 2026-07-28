/** JS-002 — Persistent repository catalog. */

export type CatalogEntryKind =
  | "package"
  | "service"
  | "api"
  | "entity"
  | "event"
  | "connector"
  | "insight_provider"
  | "twin_mapping"
  | "per"
  | "test"
  | "doc"
  | "migration"
  | "schema"
  | "route"
  | "export"
  | "import";

export type CatalogEntry = {
  readonly id: string;
  readonly kind: CatalogEntryKind;
  readonly name: string;
  readonly path: string;
  readonly ownerPackage: string | null;
  readonly exports: readonly string[];
  readonly imports: readonly string[];
  readonly routes: readonly string[];
  readonly schemas: readonly string[];
  readonly migrations: readonly string[];
  readonly tests: readonly string[];
  readonly documentationLinks: readonly string[];
  readonly symbols: readonly string[];
  readonly keywords: readonly string[];
  readonly updatedAt: string;
};

export type CatalogSnapshot = {
  readonly root: string;
  readonly indexedAt: string;
  readonly version: string;
  readonly entries: readonly CatalogEntry[];
  readonly counts: Readonly<Record<CatalogEntryKind, number>>;
};
