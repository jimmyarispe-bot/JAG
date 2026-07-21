import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { FounderDomain } from "./types";
import { DOMAIN_EVENT_HINTS } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface EiEventSignal {
  id: string;
  eventType: string;
  moduleKey: string;
  title: string;
  summary: string | null;
  occurredAt: string;
  entityType: string | null;
  entityId: string | null;
  classification: string | null;
  payload: Record<string, unknown> | null;
}

/** Load recent EI activity for analysis — read-only consumption. */
export async function loadEiSignals(
  supabase: AuthClient,
  options?: {
    organizationId?: string | null;
    schoolId?: string | null;
    limit?: number;
    sinceHours?: number;
  }
): Promise<EiEventSignal[]> {
  const limit = options?.limit ?? 250;
  const sinceHours = options?.sinceHours ?? 72;
  const since = new Date(Date.now() - sinceHours * 3600_000).toISOString();

  let q = supabase
    .from("platform_activity_events")
    .select(
      "id, event_type, module_key, title, summary, occurred_at, entity_type, entity_id, classification, payload"
    )
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (options?.organizationId) {
    q = q.eq("organization_id", options.organizationId);
  }
  if (options?.schoolId) {
    q = q.eq("school_id", options.schoolId);
  }

  const { data, error } = await q;
  if (error || !data) return [];

  return data.map((row) => ({
    id: String(row.id),
    eventType: String(row.event_type ?? ""),
    moduleKey: String(row.module_key ?? ""),
    title: String(row.title ?? row.event_type ?? "Event"),
    summary: (row.summary as string | null) ?? null,
    occurredAt: String(row.occurred_at ?? new Date().toISOString()),
    entityType: (row.entity_type as string | null) ?? null,
    entityId: (row.entity_id as string | null) ?? null,
    classification: (row.classification as string | null) ?? null,
    payload: (row.payload as Record<string, unknown> | null) ?? null,
  }));
}

export function domainForEvent(eventType: string, moduleKey: string): FounderDomain {
  for (const [domain, hints] of Object.entries(DOMAIN_EVENT_HINTS) as Array<
    [FounderDomain, string[]]
  >) {
    if (domain === "organization") continue;
    if (hints.some((h) => eventType.startsWith(h) || eventType.includes(h))) {
      return domain;
    }
  }
  const moduleMap: Record<string, FounderDomain> = {
    admissions: "admissions",
    students: "students",
    sis: "students",
    families: "families",
    finance: "finance",
    billing: "finance",
    hr: "human_capital",
    communications: "communications",
    workflows: "workflows",
    platform: "technology",
    documents: "documents",
    calendar: "calendar",
    identity: "technology",
  };
  return moduleMap[moduleKey] ?? "organization";
}

export function countByDomain(signals: EiEventSignal[]): Record<FounderDomain, number> {
  const counts = {} as Record<FounderDomain, number>;
  for (const d of Object.keys(DOMAIN_EVENT_HINTS) as FounderDomain[]) {
    counts[d] = 0;
  }
  for (const s of signals) {
    const d = domainForEvent(s.eventType, s.moduleKey);
    counts[d] = (counts[d] ?? 0) + 1;
  }
  counts.organization = signals.length;
  return counts;
}

export function filterSignals(
  signals: EiEventSignal[],
  predicates: Array<(s: EiEventSignal) => boolean>
): EiEventSignal[] {
  return signals.filter((s) => predicates.some((p) => p(s)));
}

export function severityRank(eventType: string, classification: string | null): number {
  const t = eventType.toLowerCase();
  if (
    t.includes("failed") ||
    t.includes("terminated") ||
    t.includes("deleted") ||
    t.includes("overdue")
  ) {
    return 90;
  }
  if (
    t.includes("expiring") ||
    t.includes("risk") ||
    t.includes("escalat") ||
    classification === "alert"
  ) {
    return 75;
  }
  if (t.includes("approved") || t.includes("paid") || t.includes("hired")) {
    return 40;
  }
  return 50;
}
