import { assertEphemeralStoreAllowed } from "../runtime-guard";
import type {
  DimensionDefinition,
  DimensionTag,
  DimensionValue,
  FinancialStatement,
  ReportExport,
  ReportingDashboard,
  VarianceReport,
} from "./types";

type ReportingStore = {
  dimensions: Map<string, DimensionDefinition>;
  dimensionValues: Map<string, DimensionValue>;
  tags: Map<string, DimensionTag>;
  statements: Map<string, FinancialStatement>;
  variances: Map<string, VarianceReport>;
  dashboards: Map<string, ReportingDashboard>;
  exports: Map<string, ReportExport>;
};

const g = globalThis as typeof globalThis & {
  __jagReportingStore?: ReportingStore;
};

function empty(): ReportingStore {
  return {
    dimensions: new Map(),
    dimensionValues: new Map(),
    tags: new Map(),
    statements: new Map(),
    variances: new Map(),
    dashboards: new Map(),
    exports: new Map(),
  };
}

function store(): ReportingStore {
  assertEphemeralStoreAllowed("reporting");
  if (!g.__jagReportingStore) g.__jagReportingStore = empty();
  return g.__jagReportingStore;
}

export function resetReportingStoreForTests(): void {
  g.__jagReportingStore = empty();
}

function byOrg<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string
): T[] {
  return [...map.values()].filter((x) => x.organizationId === organizationId);
}

export function upsertDimension(d: DimensionDefinition): DimensionDefinition {
  store().dimensions.set(d.id, d);
  return d;
}
export function listDimensions(
  organizationId: string
): readonly DimensionDefinition[] {
  return Object.freeze(byOrg(store().dimensions, organizationId));
}

export function upsertDimensionValue(v: DimensionValue): DimensionValue {
  store().dimensionValues.set(v.id, v);
  return v;
}
export function listDimensionValues(
  organizationId: string,
  dimensionId?: string
): readonly DimensionValue[] {
  return Object.freeze(
    byOrg(store().dimensionValues, organizationId).filter((v) =>
      dimensionId ? v.dimensionId === dimensionId : true
    )
  );
}

export function upsertTag(t: DimensionTag): DimensionTag {
  store().tags.set(t.id, t);
  return t;
}
export function listTags(
  organizationId: string,
  recordType?: string,
  recordId?: string
): readonly DimensionTag[] {
  return Object.freeze(
    byOrg(store().tags, organizationId).filter(
      (t) =>
        (recordType ? t.recordType === recordType : true) &&
        (recordId ? t.recordId === recordId : true)
    )
  );
}

export function upsertStatement(s: FinancialStatement): FinancialStatement {
  store().statements.set(s.id, s);
  return s;
}
export function listStatements(
  organizationId: string
): readonly FinancialStatement[] {
  return Object.freeze(byOrg(store().statements, organizationId));
}
export function getStatement(id: string): FinancialStatement | null {
  return store().statements.get(id) ?? null;
}

export function upsertVariance(v: VarianceReport): VarianceReport {
  store().variances.set(v.id, v);
  return v;
}
export function listVariances(organizationId: string): readonly VarianceReport[] {
  return Object.freeze(byOrg(store().variances, organizationId));
}

export function upsertDashboard(d: ReportingDashboard): ReportingDashboard {
  store().dashboards.set(d.id, d);
  return d;
}
export function listDashboards(
  organizationId: string
): readonly ReportingDashboard[] {
  return Object.freeze(byOrg(store().dashboards, organizationId));
}

export function upsertExport(e: ReportExport): ReportExport {
  store().exports.set(e.id, e);
  return e;
}
export function listExports(organizationId: string): readonly ReportExport[] {
  return Object.freeze(byOrg(store().exports, organizationId));
}
