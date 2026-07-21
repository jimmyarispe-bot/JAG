import type { EcosystemMemberInput } from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export function partitionMembers(
  members: EcosystemMemberInput[],
  visibleOrganizationIds: string[]
): { authorized: EcosystemMemberInput[]; excluded: EcosystemMemberInput[] } {
  const visible = new Set(visibleOrganizationIds);
  const authorized: EcosystemMemberInput[] = [];
  const excluded: EcosystemMemberInput[] = [];
  for (const member of members) {
    if (member.authorized === false || !visible.has(member.organizationId)) {
      excluded.push(member);
    } else {
      authorized.push(member);
    }
  }
  return { authorized, excluded };
}

export function defaultMembersForScope(organizationId: string | null): EcosystemMemberInput[] {
  if (!organizationId) return [];
  return [
    {
      organizationId,
      displayName: "Primary Organization",
      kind: "organization",
      authorized: true,
      region: "home",
      healthValue: 62,
      enrollmentIndex: 100,
    },
  ];
}
