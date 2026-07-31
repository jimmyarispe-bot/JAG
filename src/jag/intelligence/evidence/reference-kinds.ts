/**
 * Evidence may only reference public organizational model concepts.
 * No compiler/runtime internals. No provider output as evidence.
 */

export const ORGANIZATIONAL_EVIDENCE_KINDS = Object.freeze([
  "policy",
  "work",
  "report",
  "analytics",
  "decision",
  "document",
  "schedule",
  "identity",
  "organization_blueprint",
  "capability_pack",
  "runtime_state",
  "communication",
] as const);

export type OrganizationalEvidenceKind =
  (typeof ORGANIZATIONAL_EVIDENCE_KINDS)[number];

/** Forbidden evidence targets — opaque / internal / provider surfaces. */
export const FORBIDDEN_EVIDENCE_KINDS = Object.freeze([
  "compiler_internal",
  "runtime_generation_internal",
  "lifecycle_internal",
  "llm_raw_completion",
  "opaque_embedding",
  "provider_output",
] as const);

export type ForbiddenEvidenceKind =
  (typeof FORBIDDEN_EVIDENCE_KINDS)[number];

/** Primary evidence sources for Evidence Graph v1. */
export const EVIDENCE_GRAPH_SOURCE_KINDS = Object.freeze([
  "work",
  "decision",
  "policy",
  "report",
  "analytics",
  "document",
  "schedule",
  "identity",
] as const);

export type EvidenceGraphSourceKind =
  (typeof EVIDENCE_GRAPH_SOURCE_KINDS)[number];
