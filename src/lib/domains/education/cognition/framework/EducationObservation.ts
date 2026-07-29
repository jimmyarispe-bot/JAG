/**
 * Shared observation contracts — host-supplied, never loaded from a database.
 */

import type { CognitiveThinkRequest } from "@/lib/jag/runtime";

/** Base fields every Education observation should carry. */
export interface EducationObservationBase {
  organizationId: string;
  attributes?: Readonly<Record<string, unknown>>;
}

/**
 * Extract a typed observation from Intent or OrganizationalContext attributes.
 */
export function extractEducationObservation<T extends object>(
  request: CognitiveThinkRequest,
  attributeKey: string
): T | null {
  const fromIntent = request.intent?.attributes?.[attributeKey];
  const fromContext =
    request.organizationalContext?.attributes?.[attributeKey];
  const raw = fromIntent ?? fromContext;
  if (!raw || typeof raw !== "object") return null;
  return raw as T;
}

export function hasEducationDomainHint(
  request: CognitiveThinkRequest
): boolean {
  return request.intent?.domainHints?.includes("education") === true;
}

export function intentIdMatches(
  request: CognitiveThinkRequest,
  predicate: (intentId: string) => boolean
): boolean {
  const intentId = request.intent?.intentId ?? "";
  return predicate(intentId);
}
