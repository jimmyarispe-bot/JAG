import { isActiveDecision, sortDecisions } from "@/lib/platform/decisions/decision";
import type {
  DecisionHistoryEntry,
  PlatformDecision,
} from "@/lib/platform/decisions/types";
import { HistoryRepository } from "@/lib/platform/persistence/history-repository";
import {
  dirtySets,
  markDirty,
  memoryStore,
} from "@/lib/platform/persistence/memory-store";
import type { PersistenceClient } from "@/lib/platform/persistence/types";

function withHistory(decision: PlatformDecision): PlatformDecision {
  const fromRepo = HistoryRepository.listDecisionHistory(decision.id);
  const history = fromRepo.length > 0 ? fromRepo : decision.history;
  return { ...decision, history: [...history], signalIds: [...decision.signalIds] };
}

export const DecisionRepository = {
  getById(id: string): PlatformDecision | null {
    const row = memoryStore.decisions.get(id);
    return row ? withHistory(row) : null;
  },

  upsert(decision: PlatformDecision): PlatformDecision {
    const stored: PlatformDecision = {
      ...decision,
      signalIds: [...decision.signalIds],
      history: [...decision.history],
    };
    memoryStore.decisions.set(stored.id, stored);
    markDirty("decisions", stored.id);
    HistoryRepository.replaceDecisionHistory(stored.id, stored.history);
    return withHistory(stored);
  },

  list(organizationId?: string | null): PlatformDecision[] {
    const all = [...memoryStore.decisions.values()].map(withHistory);
    if (organizationId === undefined) return sortDecisions(all);
    if (organizationId === null) {
      return sortDecisions(all.filter((d) => d.organizationId == null));
    }
    return sortDecisions(all.filter((d) => d.organizationId === organizationId));
  },

  findActiveByMergeKey(mergeKey: string): PlatformDecision | null {
    for (const d of memoryStore.decisions.values()) {
      if (d.mergeKey === mergeKey && isActiveDecision(d)) {
        return withHistory(d);
      }
    }
    return null;
  },

  /** Load from Supabase into memory working set. */
  async hydrate(client: PersistenceClient): Promise<number> {
    const { data: rows, error } = await client
      .from("platform_decisions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(2000);
    if (error) {
      throw new Error(`Decision hydrate failed: ${error.message}`);
    }
    if (!rows) return 0;

    const { data: histRows } = await client
      .from("platform_decision_history")
      .select("*")
      .limit(20000);

    const historyByDecision = new Map<string, DecisionHistoryEntry[]>();
    for (const h of histRows ?? []) {
      const decisionId = String(h.decision_id);
      const entry: DecisionHistoryEntry = {
        id: String(h.id),
        action: h.action as DecisionHistoryEntry["action"],
        actorUserId: (h.actor_user_id as string | null) ?? null,
        actorRole: (h.actor_role as DecisionHistoryEntry["actorRole"]) ?? null,
        timestamp: String(h.timestamp),
        reason: (h.reason as string | null) ?? null,
        toStatus: (h.to_status as DecisionHistoryEntry["toStatus"]) ?? null,
        toOwnerRole: (h.to_owner_role as DecisionHistoryEntry["toOwnerRole"]) ?? null,
        toOwnerUserId: (h.to_owner_user_id as string | null) ?? null,
      };
      const list = historyByDecision.get(decisionId) ?? [];
      list.push(entry);
      historyByDecision.set(decisionId, list);
      memoryStore.decisionHistory.set(entry.id, { ...entry, decisionId });
    }

    for (const row of rows) {
      const id = String(row.id);
      const history = (historyByDecision.get(id) ?? []).sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
      );
      const decision: PlatformDecision = {
        id,
        mergeKey: String(row.merge_key),
        sourceInsightId: (row.source_insight_id as string | null) ?? null,
        sourceRecommendationId:
          (row.source_recommendation_id as string | null) ?? null,
        signalIds: Array.isArray(row.signal_ids)
          ? (row.signal_ids as string[])
          : [],
        title: String(row.title),
        description: String(row.description ?? ""),
        organizationId: (row.organization_id as string | null) ?? null,
        applicationId: (row.application_id as string | null) ?? null,
        priority: row.priority as PlatformDecision["priority"],
        owner:
          row.owner_role != null
            ? {
                role: row.owner_role as NonNullable<PlatformDecision["owner"]>["role"],
                userId: (row.owner_user_id as string | null) ?? null,
                displayName: (row.owner_display_name as string | null) ?? null,
              }
            : null,
        status: row.status as PlatformDecision["status"],
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
        dueDate: (row.due_date as string | null) ?? null,
        completedAt: (row.completed_at as string | null) ?? null,
        outcome: (row.outcome as string | null) ?? null,
        history,
      };
      memoryStore.decisions.set(id, decision);
    }
    return rows.length;
  },

  async flush(client: PersistenceClient): Promise<void> {
    const decisionIds = [...dirtySets.decisions];
    if (decisionIds.length === 0 && dirtySets.decisionHistory.size === 0) return;

    for (const id of decisionIds) {
      const d = memoryStore.decisions.get(id);
      if (!d) continue;
      const { error } = await client.from("platform_decisions").upsert({
        id: d.id,
        merge_key: d.mergeKey,
        source_insight_id: d.sourceInsightId,
        source_recommendation_id: d.sourceRecommendationId,
        signal_ids: d.signalIds,
        title: d.title,
        description: d.description,
        organization_id: d.organizationId,
        application_id: d.applicationId,
        priority: d.priority,
        owner_role: d.owner?.role ?? null,
        owner_user_id: d.owner?.userId ?? null,
        owner_display_name: d.owner?.displayName ?? null,
        status: d.status,
        created_at: d.createdAt,
        updated_at: d.updatedAt,
        due_date: d.dueDate,
        completed_at: d.completedAt,
        outcome: d.outcome,
        payload: {},
      });
      if (error) throw new Error(`Decision flush failed: ${error.message}`);
    }

    for (const id of dirtySets.decisionHistory) {
      const h = memoryStore.decisionHistory.get(id);
      if (!h) continue;
      const { error } = await client.from("platform_decision_history").upsert({
        id: h.id,
        decision_id: h.decisionId,
        action: h.action,
        actor_user_id: h.actorUserId,
        actor_role: h.actorRole,
        timestamp: h.timestamp,
        reason: h.reason,
        to_status: h.toStatus,
        to_owner_role: h.toOwnerRole,
        to_owner_user_id: h.toOwnerUserId,
      });
      if (error) throw new Error(`Decision history flush failed: ${error.message}`);
    }
  },
} as const;
