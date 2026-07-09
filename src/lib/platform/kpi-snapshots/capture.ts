/**
 * Executive KPI Snapshot Engine — Sprint 002 Task 2.
 * Persists daily executive metrics using ONLY getExecutiveAggregateMetrics().
 */
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getExecutiveAggregateMetrics } from "@/lib/platform/executive-metrics";
import { recordActivity } from "@/lib/platform/activity";
import {
  filterDuplicateSnapshotRecords,
  mapAggregateToSnapshotRecords,
  scopeFromAggregate,
  snapshotRecordToInsertRow,
} from "@/lib/platform/kpi-snapshots/map";
import {
  assertSnapshotDate,
  enumerateSnapshotDates,
  todaySnapshotDate,
} from "@/lib/platform/kpi-snapshots/period";
import {
  insertKpiSnapshotRows,
  loadExistingSnapshotPeriodKeys,
} from "@/lib/platform/kpi-snapshots/persistence";
import type {
  BackfillSnapshotsOptions,
  BackfillSnapshotsResult,
  CaptureSnapshotOptions,
  CaptureSnapshotResult,
} from "@/lib/platform/kpi-snapshots/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

async function maybeRecordSnapshotActivity(
  supabase: AuthClient,
  result: CaptureSnapshotResult,
  actorUserId?: string | null
): Promise<void> {
  if (result.inserted <= 0) return;
  try {
    await recordActivity(supabase, {
      eventType: "executive.kpi_snapshot_written",
      moduleKey: "executive",
      entityType: "executive_kpi_snapshots",
      entityId: `${result.scope.organizationId ?? "org"}:${result.snapshotDate}`,
      title: "Executive KPI snapshot written",
      summary: `${result.inserted} metrics captured (${result.mode}) for ${result.snapshotDate}`,
      organizationId: result.scope.organizationId ?? undefined,
      schoolId: result.scope.schoolId ?? undefined,
      campusId: result.scope.campusId ?? undefined,
      actorUserId: actorUserId ?? undefined,
      actorType: actorUserId ? "user" : "system",
      classification: "system",
      visibility: "internal",
      payload: {
        mode: result.mode,
        snapshotDate: result.snapshotDate,
        inserted: result.inserted,
        skippedDuplicates: result.skippedDuplicates,
        attempted: result.attempted,
      },
    });
  } catch {
    // Activity is best-effort; snapshot persistence already succeeded.
  }
}

/**
 * Capture a snapshot for a single period from the aggregation layer.
 * Skips metrics already stored for the same scope + snapshot_date.
 */
export async function captureSnapshot(
  supabase: AuthClient,
  options: CaptureSnapshotOptions = {}
): Promise<CaptureSnapshotResult> {
  const mode = options.mode ?? "manual";
  const snapshotDate = assertSnapshotDate(options.snapshotDate ?? todaySnapshotDate());
  const skipDuplicates = options.skipDuplicates !== false;
  const filters = options.filters ?? {};
  const capturedAt = new Date().toISOString();
  const errors: string[] = [];

  const aggregate = await getExecutiveAggregateMetrics(supabase, filters);
  const scope = scopeFromAggregate(aggregate);
  const records = mapAggregateToSnapshotRecords(aggregate, snapshotDate, mode, capturedAt);

  let existingKeys = new Set<string>();
  if (skipDuplicates) {
    try {
      existingKeys = await loadExistingSnapshotPeriodKeys(supabase, scope, snapshotDate);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      return {
        mode,
        snapshotDate,
        scope,
        attempted: records.length,
        inserted: 0,
        skippedDuplicates: 0,
        rows: [],
        errors,
      };
    }
  }

  const { toInsert, skippedDuplicates } = skipDuplicates
    ? filterDuplicateSnapshotRecords(records, existingKeys)
    : { toInsert: records, skippedDuplicates: [] };

  let inserted = 0;
  if (toInsert.length) {
    const write = await insertKpiSnapshotRows(
      supabase,
      toInsert.map(snapshotRecordToInsertRow)
    );
    if (write.error) {
      errors.push(write.error);
    } else {
      inserted = write.inserted;
    }
  }

  const result: CaptureSnapshotResult = {
    mode,
    snapshotDate,
    scope,
    attempted: records.length,
    inserted,
    skippedDuplicates: skippedDuplicates.length,
    rows: inserted > 0 ? toInsert : [],
    errors,
  };

  if (options.recordActivityEvent !== false) {
    await maybeRecordSnapshotActivity(supabase, result, options.actorUserId);
  }

  return result;
}

/** Daily capture — same as captureSnapshot with mode=daily and today's date. */
export async function captureDailyExecutiveSnapshot(
  supabase: AuthClient,
  options: Omit<CaptureSnapshotOptions, "mode" | "snapshotDate"> & {
    snapshotDate?: string;
  } = {}
): Promise<CaptureSnapshotResult> {
  return captureSnapshot(supabase, {
    ...options,
    mode: "daily",
    snapshotDate: options.snapshotDate ?? todaySnapshotDate(),
  });
}

/**
 * Backfill snapshots for each calendar day in [fromDate, toDate].
 * Note: live aggregation reflects current state; historical backfill stamps
 * today's aggregate values onto each requested period (replay of live SSoT).
 */
export async function backfillSnapshots(
  supabase: AuthClient,
  options: BackfillSnapshotsOptions
): Promise<BackfillSnapshotsResult> {
  const dates = enumerateSnapshotDates(options.fromDate, options.toDate);
  const days: CaptureSnapshotResult[] = [];

  for (const snapshotDate of dates) {
    const day = await captureSnapshot(supabase, {
      filters: options.filters,
      snapshotDate,
      mode: "backfill",
      skipDuplicates: options.skipDuplicates,
      actorUserId: options.actorUserId,
      recordActivityEvent: options.recordActivityEvent,
    });
    days.push(day);
  }

  return {
    fromDate: options.fromDate,
    toDate: options.toDate,
    days,
    totals: {
      attempted: days.reduce((s, d) => s + d.attempted, 0),
      inserted: days.reduce((s, d) => s + d.inserted, 0),
      skippedDuplicates: days.reduce((s, d) => s + d.skippedDuplicates, 0),
    },
  };
}
