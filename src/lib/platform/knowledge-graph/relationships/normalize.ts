import {
  RELATIONSHIP_ALIASES,
  UNIFIED_RELATIONSHIPS,
  type UnifiedRelationshipType,
} from "@/lib/platform/knowledge-graph/ontology/relationships";

const CANONICAL = new Set<string>(UNIFIED_RELATIONSHIPS);

export function normalizeRelationshipType(type: string): UnifiedRelationshipType {
  const upper = type.toUpperCase();
  if (RELATIONSHIP_ALIASES[upper]) return RELATIONSHIP_ALIASES[upper]!;
  if (RELATIONSHIP_ALIASES[type]) return RELATIONSHIP_ALIASES[type]!;
  if (CANONICAL.has(upper)) return upper as UnifiedRelationshipType;
  // Fallback: treat unknown domain edges as COMMUNICATED_WITH for graph connectivity.
  return "COMMUNICATED_WITH";
}

export function isCanonicalRelationship(type: string): boolean {
  return CANONICAL.has(type.toUpperCase());
}
