import type {
  EcosystemMemberInput,
  EcosystemPermissionContext,
  EcosystemFederationScope,
  SharingAgreement,
  SummaryKind,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

const EXEC_ROLES = new Set([
  "ceo",
  "founder",
  "board",
  "executive",
  "ecosystem_admin",
  "network_admin",
]);

export function hasEcosystemRole(roles: string[] | undefined): boolean {
  return (roles ?? []).some((r) => EXEC_ROLES.has(r.toLowerCase()));
}

export function resolveVisibleOrganizations(input: {
  scope: EcosystemFederationScope;
  members: EcosystemMemberInput[];
  agreements: SharingAgreement[];
}): EcosystemPermissionContext {
  const actorOrganizationId =
    input.scope.actorOrganizationId ?? input.scope.organizationId ?? null;
  const actorRoles = input.scope.actorRoles ?? ["ceo"];
  const canFederate = hasEcosystemRole(actorRoles);

  const visible = new Set<string>();
  if (actorOrganizationId) visible.add(actorOrganizationId);

  if (canFederate) {
    for (const agreement of input.agreements) {
      if (!agreement.active) continue;
      if (
        agreement.fromOrganizationId === actorOrganizationId ||
        agreement.toOrganizationId === actorOrganizationId
      ) {
        visible.add(agreement.fromOrganizationId);
        visible.add(agreement.toOrganizationId);
      }
    }
    for (const member of input.members) {
      if (member.authorized === false) continue;
      if (member.organizationId === actorOrganizationId) {
        visible.add(member.organizationId);
        continue;
      }
      if (member.sharingAgreementId) {
        const agreement = input.agreements.find((a) => a.id === member.sharingAgreementId);
        if (agreement?.active) visible.add(member.organizationId);
      }
    }
  }

  return {
    actorOrganizationId,
    actorRoles,
    agreements: input.agreements,
    visibleOrganizationIds: [...visible],
  };
}

export function mayReadSummary(
  permissions: EcosystemPermissionContext,
  organizationId: string,
  kind: SummaryKind
): boolean {
  if (!permissions.visibleOrganizationIds.includes(organizationId)) return false;
  if (organizationId === permissions.actorOrganizationId) return true;
  return permissions.agreements.some(
    (a) =>
      a.active &&
      a.allowedSummaries.includes(kind) &&
      ((a.fromOrganizationId === permissions.actorOrganizationId &&
        a.toOrganizationId === organizationId) ||
        (a.toOrganizationId === permissions.actorOrganizationId &&
          a.fromOrganizationId === organizationId))
  );
}
