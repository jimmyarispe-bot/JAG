/** Executive KPI Snapshot Engine — Sprint 002 Task 2 */

export type {
  BackfillSnapshotsOptions,
  BackfillSnapshotsResult,
  CaptureSnapshotOptions,
  CaptureSnapshotResult,
  ExecutiveKpiSnapshotInsertRow,
  KpiSnapshotCaptureMode,
  KpiSnapshotRecord,
  KpiSnapshotScope,
} from "@/lib/platform/kpi-snapshots/types";

export {
  assertSnapshotDate,
  buildSnapshotPeriodKey,
  enumerateSnapshotDates,
  isValidSnapshotDate,
  todaySnapshotDate,
} from "@/lib/platform/kpi-snapshots/period";

export {
  filterDuplicateSnapshotRecords,
  mapAggregateToSnapshotRecords,
  metricToSnapshotRecord,
  scopeFromAggregate,
  snapshotRecordToInsertRow,
} from "@/lib/platform/kpi-snapshots/map";

export {
  insertKpiSnapshotRows,
  loadExistingSnapshotPeriodKeys,
} from "@/lib/platform/kpi-snapshots/persistence";

export {
  backfillSnapshots,
  captureDailyExecutiveSnapshot,
  captureSnapshot,
} from "@/lib/platform/kpi-snapshots/capture";
