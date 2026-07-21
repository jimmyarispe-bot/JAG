import { resolveActorUserId } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { FounderMemoryItem, MemoryType } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function listFounderMemory(
  supabase: AuthClient,
  options?: { organizationId?: string | null }
): Promise<FounderMemoryItem[]> {
  let q = supabase
    .from("founder_memory_items")
    .select("*")
    .eq("status", "active")
    .order("pinned", { ascending: false })
    .order("sort_order")
    .limit(100);
  if (options?.organizationId) q = q.eq("organization_id", options.organizationId);
  const { data } = await q;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    memoryType: row.memory_type as MemoryType,
    title: String(row.title),
    body: String(row.body ?? ""),
    status: String(row.status),
    pinned: Boolean(row.pinned),
    relatedDecisionId: (row.related_decision_id as string | null) ?? null,
    relatedInsightId: (row.related_insight_id as string | null) ?? null,
  }));
}

export async function upsertFounderMemory(
  supabase: AuthClient,
  input: {
    organizationId?: string | null;
    schoolId?: string | null;
    memoryType: MemoryType;
    title: string;
    body?: string;
    pinned?: boolean;
    relatedDecisionId?: string | null;
    relatedInsightId?: string | null;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const actorUserId = await resolveActorUserId(supabase);
  const { data, error } = await supabase
    .from("founder_memory_items")
    .insert({
      organization_id: input.organizationId ?? null,
      school_id: input.schoolId ?? null,
      memory_type: input.memoryType,
      title: input.title,
      body: input.body ?? "",
      pinned: input.pinned ?? input.memoryType === "pinned_priority",
      related_decision_id: input.relatedDecisionId ?? null,
      related_insight_id: input.relatedInsightId ?? null,
      created_by: actorUserId,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Failed" };
  return { ok: true, id: data.id };
}

export async function archiveFounderMemory(
  supabase: AuthClient,
  memoryId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("founder_memory_items")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", memoryId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
