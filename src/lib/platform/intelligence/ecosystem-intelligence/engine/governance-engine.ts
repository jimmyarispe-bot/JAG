import { auditEntry } from "@/lib/platform/intelligence/ecosystem-intelligence/models/governance";
import type {
  EcosystemMemberInput,
  EcosystemPermissionContext,
  GovernanceAuditEntry,
} from "@/lib/platform/intelligence/ecosystem-intelligence/types";

export class GovernanceEngine {
  evaluate(input: {
    at: string;
    members: EcosystemMemberInput[];
    permissions: EcosystemPermissionContext;
  }): GovernanceAuditEntry[] {
    const log: GovernanceAuditEntry[] = [
      auditEntry(
        input.at,
        "federation.begin",
        input.permissions.actorOrganizationId,
        true,
        `Actor roles: ${input.permissions.actorRoles.join(", ") || "none"}`
      ),
    ];

    for (const member of input.members) {
      const allowed = input.permissions.visibleOrganizationIds.includes(
        member.organizationId
      );
      log.push(
        auditEntry(
          input.at,
          "federation.include",
          input.permissions.actorOrganizationId,
          allowed && member.authorized !== false,
          allowed
            ? "Visible under sharing agreement or home tenant."
            : "Excluded — no active sharing agreement or insufficient role.",
          member.organizationId
        )
      );
    }

    return log;
  }
}
