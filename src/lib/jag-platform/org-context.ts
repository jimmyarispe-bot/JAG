/**
 * Canonical JAG organization context resolution.
 *
 * Fail-closed for customer org operators: no membership → no org context.
 * Platform stewards may operate without a bound org (organizationId null)
 * and must never be silently rewritten to The Academy Way seed.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import {
  isJagOrganizationOperator,
  isJagPlatformSteward,
  type JagAuthorityKind,
  resolveJagAuthorityKind,
} from "@/lib/platform/identity/jag-authority";
import type { MembershipRole } from "@/lib/platform/identity/org-membership";

export type JagOrganizationContext = {
  readonly authority: JagAuthorityKind;
  /** Bound organization UUID when known; null only for unbound platform stewards. */
  readonly organizationId: string | null;
  readonly membershipRole: MembershipRole | null;
};

type MembershipRow = {
  organization_id: string;
  membership_role: string;
  is_primary: boolean;
};

type OrgClient = Pick<SupabaseClient, "from">;

function asMembershipRole(value: string): MembershipRole | null {
  if (
    value === "owner" ||
    value === "admin" ||
    value === "member" ||
    value === "guest"
  ) {
    return value;
  }
  return null;
}

async function loadActiveMemberships(
  supabase: OrgClient,
  userId: string
): Promise<MembershipRow[]> {
  const { data } = await supabase
    .from("user_organization_memberships")
    .select("organization_id, membership_role, is_primary")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("is_primary", { ascending: false });
  return (data ?? []) as MembershipRow[];
}

/**
 * Resolve organization context for a JAG session mint.
 * Does not fall back to `the-academy-way` or "first org in the database".
 */
export async function resolveJagOrganizationContext(
  supabase: OrgClient,
  userId: string,
  snapshot: AuthzSnapshot,
  preferredOrganizationId?: string | null
): Promise<JagOrganizationContext | null> {
  const authority = resolveJagAuthorityKind(snapshot);
  if (!authority) return null;

  const memberships = await loadActiveMemberships(supabase, userId);
  const preferred =
    preferredOrganizationId &&
    memberships.some((m) => m.organization_id === preferredOrganizationId)
      ? preferredOrganizationId
      : null;

  if (isJagOrganizationOperator(snapshot)) {
    if (memberships.length === 0) return null;

    // Explicit preferred membership wins (must already be validated above).
    if (preferred) {
      const chosen = memberships.find((m) => m.organization_id === preferred)!;
      return {
        authority: "organization",
        organizationId: chosen.organization_id,
        membershipRole: asMembershipRole(chosen.membership_role),
      };
    }

    const primaries = memberships.filter((m) => m.is_primary);
    if (primaries.length === 1) {
      const chosen = primaries[0]!;
      return {
        authority: "organization",
        organizationId: chosen.organization_id,
        membershipRole: asMembershipRole(chosen.membership_role),
      };
    }

    // Single membership — unambiguous bind.
    if (memberships.length === 1) {
      const chosen = memberships[0]!;
      return {
        authority: "organization",
        organizationId: chosen.organization_id,
        membershipRole: asMembershipRole(chosen.membership_role),
      };
    }

    // Multi-org without preferred/unique primary — fail closed (no silent first pick).
    return null;
  }

  // Platform steward — bind preferred/unique primary when present; else unbound.
  // Never silently pick memberships[0] when multiple orgs are ambiguous.
  if (isJagPlatformSteward(snapshot)) {
    if (memberships.length === 0) {
      return {
        authority: "platform",
        organizationId: null,
        membershipRole: null,
      };
    }

    if (preferred) {
      const chosen = memberships.find((m) => m.organization_id === preferred);
      if (!chosen) {
        return {
          authority: "platform",
          organizationId: null,
          membershipRole: null,
        };
      }
      return {
        authority: "platform",
        organizationId: chosen.organization_id,
        membershipRole: asMembershipRole(chosen.membership_role),
      };
    }

    const primaries = memberships.filter((m) => m.is_primary);
    if (primaries.length === 1) {
      const chosen = primaries[0]!;
      return {
        authority: "platform",
        organizationId: chosen.organization_id,
        membershipRole: asMembershipRole(chosen.membership_role),
      };
    }

    if (memberships.length === 1) {
      const chosen = memberships[0]!;
      return {
        authority: "platform",
        organizationId: chosen.organization_id,
        membershipRole: asMembershipRole(chosen.membership_role),
      };
    }

    return {
      authority: "platform",
      organizationId: null,
      membershipRole: null,
    };
  }

  return null;
}

/**
 * Whether a JAG session may access data for `organizationId`.
 * Platform stewards: yes (control plane). Org operators: only their bound org.
 */
export function sessionCanAccessOrganization(
  session: {
    readonly authority?: JagAuthorityKind | null;
    readonly organizationId?: string | null;
  },
  organizationId: string
): boolean {
  if (!organizationId) return false;
  if (session.authority === "platform") return true;
  return (
    session.authority === "organization" &&
    session.organizationId === organizationId
  );
}
