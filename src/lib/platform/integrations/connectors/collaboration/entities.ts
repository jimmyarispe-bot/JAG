/**
 * Collaboration Platforms (Sprint 076) — shared entity types.
 * Canonical types align with Google / Microsoft 365 productivity connectors.
 */

/** RC-3.02 — Slack, Teams Chat, Zoom, Google Meet metadata. */
export const COLLABORATION_PROVIDERS = [
  "slack",
  "teams",
  "zoom",
  "google_meet",
] as const;
export type CollaborationProvider = (typeof COLLABORATION_PROVIDERS)[number];

export const COLLABORATION_OBJECT_TYPES = [
  "channel",
  "thread",
  "message",
  "user",
  "reaction",
  "team",
  "chat",
  "meet",
  "recording",
  "attendance",
] as const;

export type CollaborationObjectType = (typeof COLLABORATION_OBJECT_TYPES)[number];

export type CollaborationRawEntity = {
  id: string;
  objectType: CollaborationObjectType;
  provider: CollaborationProvider;
  organizationId: string;
  updatedAt: string;
  version: number;
  payload: Record<string, unknown>;
};

export type CollaborationCanonicalEntity = {
  id: string;
  externalId: string;
  organizationId: string;
  sourceSystem: CollaborationProvider;
  syncedAt: string;
  version: number;
  objectType: CollaborationObjectType;
  canonicalType: string;
  attributes: Record<string, unknown>;
};

export const COLLABORATION_KG_KINDS = [
  "Person",
  "Meeting",
  "Communication",
  "Document",
  "Task",
  "Organization",
] as const;

export type CollaborationKgKind = (typeof COLLABORATION_KG_KINDS)[number];
