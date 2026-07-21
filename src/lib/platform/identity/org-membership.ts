/**
 * Organization membership — durable user ↔ organization links.
 * Enables future multi-tenant isolation between organizations.
 */

import { cache } from "react";
import { createAuthClient } from "@/lib/supabase/server-auth";
import type { Json } from "@/types/database";
import {
  listOrganizations,
  type OrganizationEntity,
} from "@/lib/platform/identity/organizations";

export const MEMBERSHIP_ROLES = ["owner", "admin", "member", "guest"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_STATUSES = [
  "active",
  "invited",
  "suspended",
  "deactivated",
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export type OrgMembership = {
  id: string;
  organizationId: string;
  userId: string;
  membershipRole: MembershipRole;
  status: MembershipStatus;
  isPrimary: boolean;
  permissions: string[];
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

type MembershipRow = {
  id: string;
  organization_id: string;
  user_id: string;
  membership_role: string;
  status: string;
  is_primary: boolean;
  permissions: Json;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
};

function asStringArray(value: Json | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function mapMembership(row: MembershipRow): OrgMembership {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    membershipRole: row.membership_role as MembershipRole,
    status: row.status as MembershipStatus,
    isPrimary: row.is_primary,
    permissions: asStringArray(row.permissions),
    invitedAt: row.invited_at,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const MEMBERSHIP_SELECT =
  "id, organization_id, user_id, membership_role, status, is_primary, permissions, invited_at, joined_at, created_at, updated_at";

const listUserOrganizationMembershipsCached = cache(
  async (userId: string): Promise<OrgMembership[]> => {
    const client = await createAuthClient();
    const { data } = await client
      .from("user_organization_memberships")
      .select(MEMBERSHIP_SELECT)
      .eq("user_id", userId)
      .eq("status", "active")
      .order("is_primary", { ascending: false });
    return (data ?? []).map((row) => mapMembership(row as MembershipRow));
  }
);

/** Memberships — once per user per request (Sprint P002). */
export async function listUserOrganizationMemberships(
  userId: string,
  _supabase?: AuthClient
): Promise<OrgMembership[]> {
  return listUserOrganizationMembershipsCached(userId);
}

export async function getPrimaryOrganizationMembership(
  userId: string,
  supabase?: AuthClient
): Promise<OrgMembership | null> {
  const memberships = await listUserOrganizationMemberships(userId, supabase);
  return memberships.find((m) => m.isPrimary) ?? memberships[0] ?? null;
}

export async function getAccessibleOrganizationsForUser(
  userId: string,
  supabase?: AuthClient
): Promise<OrganizationEntity[]> {
  const client = supabase ?? (await createAuthClient());
  const memberships = await listUserOrganizationMemberships(userId, client);
  if (memberships.length === 0) return [];

  const allowed = new Set(memberships.map((m) => m.organizationId));
  const all = await listOrganizations(client);
  return all.filter((org) => allowed.has(org.id));
}

export async function userBelongsToOrganization(
  userId: string,
  organizationId: string,
  supabase?: AuthClient
): Promise<boolean> {
  const client = supabase ?? (await createAuthClient());
  const { data } = await client
    .from("user_organization_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

/** Per-request dedupe — branding, config, and hierarchy all resolve the primary org. */
const resolvePrimaryOrganizationIdCached = cache(
  async (userId: string | null): Promise<string | null> => {
    const client = await createAuthClient();

    if (userId) {
      const membership = await getPrimaryOrganizationMembership(userId, client);
      if (membership?.organizationId) return membership.organizationId;

      const { data: owned } = await client
        .from("org_organizations")
        .select("id")
        .eq("owner_user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (owned?.id) return owned.id;
    }

    const { data: seed } = await client
      .from("org_organizations")
      .select("id")
      .eq("slug", "the-academy-way")
      .maybeSingle();
    if (seed?.id) return seed.id;

    const { data: first } = await client
      .from("org_organizations")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    return first?.id ?? null;
  }
);

export async function resolvePrimaryOrganizationId(
  userId?: string | null,
  _supabase?: AuthClient
): Promise<string | null> {
  return resolvePrimaryOrganizationIdCached(userId ?? null);
}
