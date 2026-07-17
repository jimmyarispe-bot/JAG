import type {
  EventCategory,
  EventDefinition,
  EventRegistrySnapshot,
} from "@/lib/platform/events/types";

const EVENT_REGISTRY = new Map<string, EventDefinition>();
const DUPLICATE_EVENT_TYPES: string[] = [];
let registered = false;

/** Register an event definition (idempotent per eventType). */
export function registerEventDefinition(definition: EventDefinition): void {
  if (EVENT_REGISTRY.has(definition.eventType)) {
    DUPLICATE_EVENT_TYPES.push(definition.eventType);
    return;
  }
  EVENT_REGISTRY.set(definition.eventType, { ...definition });
}

/** Replace an existing definition (version upgrade / docs update). */
export function upsertEventDefinition(definition: EventDefinition): void {
  EVENT_REGISTRY.set(definition.eventType, { ...definition });
}

export function registerEventDefinitions(definitions: EventDefinition[]): void {
  for (const definition of definitions) {
    registerEventDefinition(definition);
  }
}

export function getEventDefinition(eventType: string): EventDefinition | undefined {
  return EVENT_REGISTRY.get(eventType);
}

export function getEventDefinitionsByDomain(domain: string): EventDefinition[] {
  return [...EVENT_REGISTRY.values()]
    .filter((def) => def.domain === domain)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getActiveEventDefinitions(): EventDefinition[] {
  return [...EVENT_REGISTRY.values()]
    .filter((def) => def.status === "active")
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getAllEventDefinitions(): EventDefinition[] {
  return [...EVENT_REGISTRY.values()].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function getRegisteredEventDomains(): string[] {
  return [...new Set([...EVENT_REGISTRY.values()].map((def) => def.domain))].sort();
}

export function getEventRegistrySnapshot(): EventRegistrySnapshot {
  return {
    definitions: getAllEventDefinitions(),
    domains: getRegisteredEventDomains(),
    registeredAt: new Date().toISOString(),
  };
}

export function isEventRegistryRegistered(): boolean {
  return registered;
}

export function markEventRegistryRegistered(): void {
  registered = true;
}

/** Duplicate event types detected during registration (build-time validation). */
export function getDuplicateEventRegistrations(): string[] {
  return [...DUPLICATE_EVENT_TYPES];
}

export function isKnownEventType(eventType: string): boolean {
  return EVENT_REGISTRY.has(eventType);
}

export function getEventCatalogEntries(): EventDefinition[] {
  return getAllEventDefinitions();
}

/** Sprint 024 — discovery helpers. */
export function getEventDefinitionsByCategory(
  category: EventCategory
): EventDefinition[] {
  return getAllEventDefinitions().filter((def) => def.category === category);
}

export function getDeprecatedEventDefinitions(): EventDefinition[] {
  return getAllEventDefinitions().filter(
    (def) => def.deprecated === true || def.status === "deprecated"
  );
}

export function deprecateEventDefinition(
  eventType: string,
  options: { replacedBy?: string; documentation?: string } = {}
): EventDefinition | undefined {
  const existing = EVENT_REGISTRY.get(eventType);
  if (!existing) return undefined;
  const updated: EventDefinition = {
    ...existing,
    status: "deprecated",
    deprecated: true,
    deprecatedAt: new Date().toISOString(),
    replacedBy: options.replacedBy ?? existing.replacedBy,
    documentation: options.documentation ?? existing.documentation,
  };
  EVENT_REGISTRY.set(eventType, updated);
  return updated;
}

export function discoverEventDefinitions(query?: {
  category?: EventCategory;
  domain?: string;
  includeDeprecated?: boolean;
}): EventDefinition[] {
  return getAllEventDefinitions().filter((def) => {
    if (query?.category && def.category !== query.category) return false;
    if (query?.domain && def.domain !== query.domain) return false;
    if (!query?.includeDeprecated && (def.deprecated || def.status === "deprecated")) {
      return false;
    }
    return true;
  });
}
