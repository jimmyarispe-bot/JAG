import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import { RELATIONSHIP_TYPE_KEYS } from "@/lib/platform/relationships/catalog";
import { SYSTEM_TAG_SLUGS } from "@/lib/platform/tags/catalog";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface PlatformServiceHealthCheck {
  service: string;
  status: "healthy" | "degraded" | "unavailable";
  detail: string;
}

const PLATFORM_SERVICE_TABLES = [
  { service: "Activity Engine", table: "platform_activity_events" },
  { service: "Relationship Engine", table: "platform_relationships" },
  { service: "Tag Engine", table: "platform_tags" },
  { service: "Notes Engine", table: "platform_notes" },
] as const;

function catalogHealth(
  service: string,
  catalogSize: number,
  detail: string
): PlatformServiceHealthCheck {
  return {
    service,
    status: catalogSize > 0 ? "healthy" : "degraded",
    detail,
  };
}

/** Static catalog checks — always available without database access. */
export function getStaticPlatformServiceHealth(): PlatformServiceHealthCheck[] {
  return [
    catalogHealth(
      "Activity Engine (catalog)",
      Object.keys(ACTIVITY_EVENT_CATALOG).length,
      `${Object.keys(ACTIVITY_EVENT_CATALOG).length} event types registered`
    ),
    catalogHealth(
      "Relationship Engine (catalog)",
      RELATIONSHIP_TYPE_KEYS.length,
      `${RELATIONSHIP_TYPE_KEYS.length} relationship types registered`
    ),
    catalogHealth(
      "Tag Engine (catalog)",
      SYSTEM_TAG_SLUGS.length,
      `${SYSTEM_TAG_SLUGS.length} system tag slugs registered`
    ),
    {
      service: "Notes Engine (catalog)",
      status: "healthy",
      detail: "Visibility model and attachment validation available",
    },
  ];
}

/** Probe platform service tables with lightweight head requests. */
export async function probePlatformServiceTables(
  supabase: AuthClient
): Promise<PlatformServiceHealthCheck[]> {
  const checks: PlatformServiceHealthCheck[] = [];

  for (const { service, table } of PLATFORM_SERVICE_TABLES) {
    const { error } = await supabase.from(table).select("id", { head: true, count: "exact" });

    checks.push({
      service: `${service} (database)`,
      status: error ? "unavailable" : "healthy",
      detail: error ? error.message : `${table} reachable`,
    });
  }

  return checks;
}
