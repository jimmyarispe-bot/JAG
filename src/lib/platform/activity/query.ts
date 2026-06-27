import type {
  ActivityFeedFilters,
  PlatformActivityEvent,
} from "@/lib/platform/activity/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getActivityFeed(
  supabase: AuthClient,
  filters: {
    studentId?: string;
    entityType?: string;
    entityId?: string;
    organizationId?: string;
  } & ActivityFeedFilters
): Promise<PlatformActivityEvent[]> {
  let q = supabase
    .from("platform_activity_events")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.studentId) q = q.eq("student_id", filters.studentId);
  if (filters.entityType && filters.entityId) {
    q = q.eq("entity_type", filters.entityType).eq("entity_id", filters.entityId);
  }
  if (filters.organizationId) q = q.eq("organization_id", filters.organizationId);
  if (filters.moduleKey) q = q.eq("module_key", filters.moduleKey);
  if (filters.eventType) q = q.eq("event_type", filters.eventType);
  if (filters.cursor) q = q.lt("occurred_at", filters.cursor);

  if (filters.classification) {
    const values = Array.isArray(filters.classification)
      ? filters.classification
      : [filters.classification];
    q = q.in("classification", values);
  }

  if (filters.visibility) {
    const values = Array.isArray(filters.visibility)
      ? filters.visibility
      : [filters.visibility];
    q = q.in("visibility", values);
  }

  const { data } = await q;
  return (data ?? []) as PlatformActivityEvent[];
}

export async function getEntityActivity(
  supabase: AuthClient,
  entityType: string,
  entityId: string,
  options?: ActivityFeedFilters
): Promise<PlatformActivityEvent[]> {
  return getActivityFeed(supabase, { entityType, entityId, ...options });
}

export async function getStudentActivityFeed(
  supabase: AuthClient,
  studentId: string,
  options?: ActivityFeedFilters
): Promise<PlatformActivityEvent[]> {
  return getActivityFeed(supabase, { studentId, ...options });
}

export async function getAuditActivity(
  supabase: AuthClient,
  filters: {
    studentId?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
  }
): Promise<PlatformActivityEvent[]> {
  return getActivityFeed(supabase, {
    ...filters,
    classification: ["audit", "system"],
  });
}

export async function countActivityAlerts(
  supabase: AuthClient,
  studentId: string
): Promise<{ warning: number; critical: number }> {
  const { data } = await supabase
    .from("platform_activity_events")
    .select("severity")
    .eq("student_id", studentId)
    .in("severity", ["warning", "critical"])
    .gte("occurred_at", new Date(Date.now() - 30 * 86400000).toISOString());

  const rows = data ?? [];
  return {
    warning: rows.filter((r) => r.severity === "warning").length,
    critical: rows.filter((r) => r.severity === "critical").length,
  };
}
