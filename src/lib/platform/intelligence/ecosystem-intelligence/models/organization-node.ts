import type {
  EcosystemMemberInput,
  OrganizationNode,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export function toOrganizationNode(
  member: EcosystemMemberInput,
  authorized: boolean
): OrganizationNode {
  return {
    id: `node-${member.organizationId}`,
    organizationId: member.organizationId,
    displayName: member.displayName,
    kind: member.kind ?? "organization",
    authorized,
    region: member.region,
    state: member.state,
  };
}
