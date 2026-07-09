import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  ExecutiveKpiSnapshotInsertRow,
  KpiSnapshotScope,
} from "@/lib/platform/kpi-snapshots/types";
import { buildSnapshotPeriodKey } from "@/lib/platform/kpi-snapshots/period";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/**
 * Load existing period keys for duplicate detection within a snapshot date.
 * Scoped to the same hierarchy dimensions as the capture request.
 */
export async function loadExistingSnapshotPeriodKeys(
  supabase: AuthClient,
  scope: KpiSnapshotScope,
  snapshotDate: string
): Promise<Set<string>> {
  let query = supabase
    .from("executive_kpi_snapshots")
    .select("organization_id, region_id, school_id, campus_id, program, kpi_key, snapshot_date")
    .eq("snapshot_date", snapshotDate);

  if (scope.organizationId) query = query.eq("organization_id", scope.organizationId);
  else query = query.is("organization_id", null);

  if (scope.regionId) query = query.eq("region_id", scope.regionId);
  else query = query.is("region_id", null);

  if (scope.schoolId) query = query.eq("school_id", scope.schoolId);
  else query = query.is("school_id", null);

  if (scope.campusId) query = query.eq("campus_id", scope.campusId);
  else query = query.is("campus_id", null);

  if (scope.program) query = query.eq("program", scope.program);
  else query = query.is("program", null);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load existing KPI snapshots: ${error.message}`);
  }

  const keys = new Set<string>();
  for (const row of data ?? []) {
    keys.add(
      buildSnapshotPeriodKey({
        organizationId: row.organization_id,
        regionId: row.region_id,
        schoolId: row.school_id,
        campusId: row.campus_id,
        program: row.program,
        metricId: row.kpi_key,
        snapshotDate: row.snapshot_date,
      })
    );
  }
  return keys;
}

export async function insertKpiSnapshotRows(
  supabase: AuthClient,
  rows: ExecutiveKpiSnapshotInsertRow[]
): Promise<{ inserted: number; error?: string }> {
  if (!rows.length) return { inserted: 0 };

  const { error, count } = await supabase
    .from("executive_kpi_snapshots")
    .insert(rows, { count: "exact" });

  if (error) {
    return { inserted: 0, error: error.message };
  }

  return { inserted: count ?? rows.length };
}
