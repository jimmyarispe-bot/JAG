/**
 * Sprint 213 — Tenant / organization admin observability + audit trail.
 */

import type {
  OrganizationAdminAuditEvent,
  OrganizationAdminAuditKind,
  OrganizationObservation,
  OrganizationObservabilityKind,
} from "./types";

const MAX = 400;
const observations: OrganizationObservation[] = [];
const audit: OrganizationAdminAuditEvent[] = [];
let seq = 0;

export function recordOrganizationObservation(input: {
  kind: OrganizationObservabilityKind;
  organizationId: string;
  detail: string;
  metadata?: Readonly<Record<string, string>>;
  at?: string;
}): OrganizationObservation {
  const obs: OrganizationObservation = {
    id: `tenant-obs-${++seq}-${Date.now()}`,
    at: input.at ?? new Date().toISOString(),
    kind: input.kind,
    organizationId: input.organizationId,
    detail: input.detail,
    metadata: input.metadata,
  };
  observations.unshift(obs);
  if (observations.length > MAX) observations.length = MAX;
  return obs;
}

export function recordOrganizationAdminAudit(input: {
  kind: OrganizationAdminAuditKind;
  organizationId: string;
  actorLabel: string;
  detail: string;
  metadata?: Readonly<Record<string, string>>;
  at?: string;
}): OrganizationAdminAuditEvent {
  const event: OrganizationAdminAuditEvent = {
    id: `tenant-audit-${++seq}-${Date.now()}`,
    at: input.at ?? new Date().toISOString(),
    kind: input.kind,
    organizationId: input.organizationId,
    actorLabel: input.actorLabel,
    detail: input.detail,
    metadata: input.metadata,
  };
  audit.unshift(event);
  if (audit.length > MAX) audit.length = MAX;

  // Mirror into observability stream.
  const obsKind: OrganizationObservabilityKind =
    input.kind === "feature_flag_change" || input.kind === "capability_change"
      ? input.detail.includes("disable")
        ? "capability_disable"
        : input.kind === "feature_flag_change"
          ? "feature_toggle"
          : "capability_enable"
      : input.kind === "subscription_change"
        ? "subscription_change"
        : input.kind === "export"
          ? "export"
          : input.kind === "organization_update" ||
              input.kind === "settings_change"
            ? "organization_update"
            : "admin_action";

  recordOrganizationObservation({
    kind: obsKind,
    organizationId: input.organizationId,
    detail: input.detail,
    metadata: input.metadata,
    at: event.at,
  });

  return event;
}

export function listOrganizationObservations(
  limit = 50,
  organizationId?: string
): readonly OrganizationObservation[] {
  const items = organizationId
    ? observations.filter((o) => o.organizationId === organizationId)
    : observations;
  return items.slice(0, limit);
}

export function listOrganizationAdminAudit(
  limit = 50,
  organizationId?: string
): readonly OrganizationAdminAuditEvent[] {
  const items = organizationId
    ? audit.filter((o) => o.organizationId === organizationId)
    : audit;
  return items.slice(0, limit);
}

export function clearOrganizationObservabilityForTests(): void {
  observations.length = 0;
  audit.length = 0;
  seq = 0;
}
