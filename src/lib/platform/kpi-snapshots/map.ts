import type { ExecutiveAggregateMetrics, ExecutiveMetric } from "@/lib/platform/executive-metrics";
import type {
  ExecutiveKpiSnapshotInsertRow,
  KpiSnapshotCaptureMode,
  KpiSnapshotRecord,
  KpiSnapshotScope,
} from "@/lib/platform/kpi-snapshots/types";
import { buildSnapshotPeriodKey } from "@/lib/platform/kpi-snapshots/period";

export function scopeFromAggregate(aggregate: ExecutiveAggregateMetrics): KpiSnapshotScope {
  return {
    organizationId: aggregate.scope.organizationId,
    regionId: aggregate.scope.regionId,
    schoolId: aggregate.scope.schoolId,
    campusId: aggregate.scope.campusId,
    program: aggregate.scope.program ?? aggregate.scope.programId,
  };
}

export function metricToSnapshotRecord(
  metric: ExecutiveMetric,
  scope: KpiSnapshotScope,
  snapshotDate: string,
  captureMode: KpiSnapshotCaptureMode,
  capturedAt: string
): KpiSnapshotRecord {
  return {
    organizationId: scope.organizationId,
    regionId: scope.regionId,
    schoolId: scope.schoolId,
    campusId: scope.campusId,
    program: scope.program,
    metricId: metric.id,
    metricName: metric.name,
    metricValue: metric.value,
    status: metric.status,
    trendDirection: metric.trend.direction,
    trendPct: metric.trend.pct,
    confidence: metric.confidence,
    source: metric.source,
    capturedAt,
    snapshotDate,
    captureMode,
    domain: metric.domain,
    unit: metric.unit,
  };
}

export function snapshotRecordToInsertRow(record: KpiSnapshotRecord): ExecutiveKpiSnapshotInsertRow {
  return {
    organization_id: record.organizationId,
    region_id: record.regionId,
    school_id: record.schoolId,
    campus_id: record.campusId,
    program: record.program,
    kpi_key: record.metricId,
    metric_name: record.metricName,
    actual_value: record.metricValue,
    status: record.status,
    trend_direction: record.trendDirection,
    trend_pct: record.trendPct,
    confidence: record.confidence,
    source: record.source,
    captured_at: record.capturedAt,
    snapshot_date: record.snapshotDate,
    capture_mode: record.captureMode,
    prior_period_value: null,
    target_value: null,
    metadata: {
      domain: record.domain ?? null,
      unit: record.unit ?? null,
      engine: "platform.kpi-snapshots",
      version: 1,
    },
  };
}

/** Map aggregate metrics → snapshot records for a period. */
export function mapAggregateToSnapshotRecords(
  aggregate: ExecutiveAggregateMetrics,
  snapshotDate: string,
  captureMode: KpiSnapshotCaptureMode,
  capturedAt: string = new Date().toISOString()
): KpiSnapshotRecord[] {
  const scope = scopeFromAggregate(aggregate);
  return aggregate.metrics.map((metric) =>
    metricToSnapshotRecord(metric, scope, snapshotDate, captureMode, capturedAt)
  );
}

/** Filter out records whose period key already exists. */
export function filterDuplicateSnapshotRecords(
  records: KpiSnapshotRecord[],
  existingPeriodKeys: ReadonlySet<string>
): { toInsert: KpiSnapshotRecord[]; skippedDuplicates: KpiSnapshotRecord[] } {
  const toInsert: KpiSnapshotRecord[] = [];
  const skippedDuplicates: KpiSnapshotRecord[] = [];

  for (const record of records) {
    const key = buildSnapshotPeriodKey({
      organizationId: record.organizationId,
      regionId: record.regionId,
      schoolId: record.schoolId,
      campusId: record.campusId,
      program: record.program,
      metricId: record.metricId,
      snapshotDate: record.snapshotDate,
    });
    if (existingPeriodKeys.has(key)) {
      skippedDuplicates.push(record);
    } else {
      toInsert.push(record);
    }
  }

  return { toInsert, skippedDuplicates };
}
