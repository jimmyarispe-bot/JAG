import type {
  PlatformEventEnvelope,
  PublishEventInput,
} from "@/lib/platform/events/types";

export type EventPermissionValidator = (input: {
  eventType: string;
  organizationId: string | null;
  actorId: string | null;
  permission?: string;
}) => boolean | Promise<boolean>;

export type EventSecurityOptions = {
  /** When set, publishes without matching org are rejected for org-scoped subscribers. */
  requireOrganizationId?: boolean;
  permissionValidator?: EventPermissionValidator | null;
  requiredPermission?: string;
};

export class EventSecurityError extends Error {
  readonly code:
    | "ORGANIZATION_REQUIRED"
    | "ORGANIZATION_MISMATCH"
    | "PERMISSION_DENIED";

  constructor(code: EventSecurityError["code"], message: string) {
    super(message);
    this.name = "EventSecurityError";
    this.code = code;
  }
}

export function assertPublishSecurity(
  input: PublishEventInput,
  options: EventSecurityOptions = {}
): void {
  if (options.requireOrganizationId && !input.organizationId) {
    throw new EventSecurityError(
      "ORGANIZATION_REQUIRED",
      `Event "${input.eventType}" requires organizationId`
    );
  }
}

export async function assertPublishPermission(
  input: PublishEventInput,
  options: EventSecurityOptions = {}
): Promise<void> {
  if (!options.permissionValidator || !options.requiredPermission) return;
  const allowed = await options.permissionValidator({
    eventType: input.eventType,
    organizationId: input.organizationId ?? null,
    actorId: input.actorId ?? null,
    permission: options.requiredPermission,
  });
  if (!allowed) {
    throw new EventSecurityError(
      "PERMISSION_DENIED",
      `Permission denied for event "${input.eventType}"`
    );
  }
}

export function assertSubscriberOrganizationIsolation(
  envelope: PlatformEventEnvelope,
  allowedOrganizationIds?: string[]
): boolean {
  if (!allowedOrganizationIds?.length) return true;
  if (!envelope.organizationId) return false;
  return allowedOrganizationIds.includes(envelope.organizationId);
}

export function enrichAuditMetadata(
  metadata: PublishEventInput["metadata"],
  extra: Record<string, unknown>
): NonNullable<PublishEventInput["metadata"]> {
  return {
    ...metadata,
    audit: {
      ...(typeof metadata?.audit === "object" && metadata.audit
        ? (metadata.audit as Record<string, unknown>)
        : {}),
      ...extra,
    },
  };
}
