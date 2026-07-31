/**
 * Incident + captured knowledge store (P-002).
 */

import type { CapturedKnowledgeEntry, HelpIncident } from "../types";

type IntelStore = {
  incidents: Map<string, HelpIncident>;
  knowledge: Map<string, CapturedKnowledgeEntry>;
};

const g = globalThis as typeof globalThis & {
  __jagMrJagIntelStore?: IntelStore;
};

function store(): IntelStore {
  if (!g.__jagMrJagIntelStore) {
    g.__jagMrJagIntelStore = {
      incidents: new Map(),
      knowledge: new Map(),
    };
  }
  return g.__jagMrJagIntelStore;
}

export function resetIntelligentHelpStoreForTests(): void {
  g.__jagMrJagIntelStore = {
    incidents: new Map(),
    knowledge: new Map(),
  };
}

export function upsertIncident(incident: HelpIncident): HelpIncident {
  store().incidents.set(incident.id, incident);
  return incident;
}

export function getIncident(id: string): HelpIncident | null {
  return store().incidents.get(id) ?? null;
}

export function listIncidents(filter?: {
  organizationId?: string;
  status?: HelpIncident["status"];
  limit?: number;
}): readonly HelpIncident[] {
  let rows = [...store().incidents.values()];
  if (filter?.organizationId) {
    rows = rows.filter((i) => i.organizationId === filter.organizationId);
  }
  if (filter?.status) {
    rows = rows.filter((i) => i.status === filter.status);
  }
  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return Object.freeze(rows.slice(0, filter?.limit ?? 50));
}

export function upsertCapturedKnowledge(
  entry: CapturedKnowledgeEntry
): CapturedKnowledgeEntry {
  store().knowledge.set(entry.id, entry);
  return entry;
}

export function listCapturedKnowledge(
  limit = 40
): readonly CapturedKnowledgeEntry[] {
  return Object.freeze(
    [...store().knowledge.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  );
}
