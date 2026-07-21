import type {
  EcosystemMemberInput,
  EcosystemRelationship,
  RelationshipKind,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export function buildRelationships(
  members: EcosystemMemberInput[],
  authorizedOrgIds: Set<string>,
  createId: (prefix: string) => string
): EcosystemRelationship[] {
  const edges: EcosystemRelationship[] = [];
  for (const member of members) {
    if (!authorizedOrgIds.has(member.organizationId)) continue;
    for (const rel of member.relationships ?? []) {
      if (!authorizedOrgIds.has(rel.toOrganizationId)) continue;
      edges.push({
        id: createId("rel"),
        kind: rel.kind,
        fromId: `node-${member.organizationId}`,
        toId: `node-${rel.toOrganizationId}`,
        label: rel.label ?? defaultLabel(rel.kind),
        strength: rel.strength ?? 0.5,
      });
    }
  }
  return edges;
}

function defaultLabel(kind: RelationshipKind): string {
  return kind.replaceAll("_", " ");
}
