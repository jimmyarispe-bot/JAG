import type {
  TwinEntity,
  TwinRelationship,
  TwinTimelineEntry,
} from "@/lib/digital-twin/types";

type TwinStore = {
  entities: Map<string, TwinEntity>;
  relationships: Map<string, TwinRelationship>;
  timeline: TwinTimelineEntry[];
};

const g = globalThis as typeof globalThis & {
  __jagDigitalTwinStore?: TwinStore;
};

function store(): TwinStore {
  if (!g.__jagDigitalTwinStore) {
    g.__jagDigitalTwinStore = {
      entities: new Map(),
      relationships: new Map(),
      timeline: [],
    };
  }
  return g.__jagDigitalTwinStore;
}

export function resetDigitalTwinStoreForTests(): void {
  g.__jagDigitalTwinStore = {
    entities: new Map(),
    relationships: new Map(),
    timeline: [],
  };
}

export function upsertTwinEntity(entity: TwinEntity): TwinEntity {
  store().entities.set(entity.id, entity);
  return entity;
}

export function getTwinEntity(
  organizationId: string,
  twinId: string
): TwinEntity | null {
  const row = store().entities.get(twinId);
  if (!row || row.organizationId !== organizationId) return null;
  return row;
}

export function listTwinEntities(
  organizationId: string
): readonly TwinEntity[] {
  return Object.freeze(
    [...store().entities.values()]
      .filter((e) => e.organizationId === organizationId)
      .sort((a, b) => a.label.localeCompare(b.label))
  );
}

export function findTwinByExternalKey(
  organizationId: string,
  entityType: TwinEntity["entityType"],
  externalKey: string
): TwinEntity | null {
  return (
    [...store().entities.values()].find(
      (e) =>
        e.organizationId === organizationId &&
        e.entityType === entityType &&
        e.externalKey === externalKey
    ) ?? null
  );
}

export function upsertTwinRelationship(
  relationship: TwinRelationship
): TwinRelationship {
  store().relationships.set(relationship.id, relationship);
  return relationship;
}

export function getTwinRelationship(
  organizationId: string,
  relationshipId: string
): TwinRelationship | null {
  const row = store().relationships.get(relationshipId);
  if (!row || row.organizationId !== organizationId) return null;
  return row;
}

export function listTwinRelationships(
  organizationId: string
): readonly TwinRelationship[] {
  return Object.freeze(
    [...store().relationships.values()]
      .filter((r) => r.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export function findTwinRelationshipBetween(
  organizationId: string,
  fromTwinId: string,
  toTwinId: string,
  relationshipType: TwinRelationship["relationshipType"]
): TwinRelationship | null {
  return (
    [...store().relationships.values()].find(
      (r) =>
        r.organizationId === organizationId &&
        r.fromTwinId === fromTwinId &&
        r.toTwinId === toTwinId &&
        r.relationshipType === relationshipType
    ) ?? null
  );
}

export function appendTwinTimeline(
  entry: TwinTimelineEntry
): TwinTimelineEntry {
  store().timeline.push(entry);
  if (store().timeline.length > 8000) {
    store().timeline = store().timeline.slice(-6000);
  }
  return entry;
}

export function listTwinTimeline(
  organizationId: string,
  twinId?: string
): readonly TwinTimelineEntry[] {
  return Object.freeze(
    store()
      .timeline.filter(
        (e) =>
          e.organizationId === organizationId &&
          (!twinId || e.twinId === twinId)
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}
