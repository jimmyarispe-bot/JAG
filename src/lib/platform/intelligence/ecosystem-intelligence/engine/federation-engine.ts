import { projectAuthorizedSummaries } from "@/lib/platform/intelligence/ecosystem-intelligence/federation/summaries";
import { resolveVisibleOrganizations } from "@/lib/platform/intelligence/ecosystem-intelligence/federation/permissions";
import {
  defaultMembersForScope,
  partitionMembers,
} from "@/lib/platform/intelligence/ecosystem-intelligence/federation/tenants";
import { synchronizeFederatedSummaries } from "@/lib/platform/intelligence/ecosystem-intelligence/federation/synchronization";
import type {
  EcosystemMemberInput,
  EcosystemPermissionContext,
  EcosystemFederationRequest,
  FederatedOrgSummary,
  SharingAgreement,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export class FederationEngine {
  prepare(request: EcosystemFederationRequest): {
    members: EcosystemMemberInput[];
    agreements: SharingAgreement[];
    permissions: EcosystemPermissionContext;
    excluded: EcosystemMemberInput[];
  } {
    const rootId = request.scope.organizationId;
    const members =
      request.members && request.members.length > 0
        ? request.members
        : defaultMembersForScope(rootId);
    const agreements = request.agreements ?? defaultAgreements(rootId, members);
    const permissions = resolveVisibleOrganizations({
      scope: request.scope,
      members,
      agreements,
    });
    const { authorized, excluded } = partitionMembers(
      members,
      permissions.visibleOrganizationIds
    );
    return { members: authorized, agreements, permissions, excluded };
  }

  project(
    summaries: FederatedOrgSummary[],
    permissions: EcosystemPermissionContext,
    nowIso: string
  ) {
    const projected = projectAuthorizedSummaries(summaries, permissions);
    return {
      summaries: projected,
      sync: synchronizeFederatedSummaries(projected, nowIso),
    };
  }
}

function defaultAgreements(
  rootId: string | null,
  members: EcosystemMemberInput[]
): SharingAgreement[] {
  if (!rootId) return [];
  const kinds = [
    "health",
    "portfolio",
    "initiative",
    "financial",
    "risk",
    "kpi",
  ] as const;
  return members
    .filter((m) => m.organizationId !== rootId && m.sharingAgreementId)
    .map((m) => ({
      id: m.sharingAgreementId!,
      fromOrganizationId: rootId,
      toOrganizationId: m.organizationId,
      allowedSummaries: [...kinds],
      active: true,
      audited: true,
    }));
}
