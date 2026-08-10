/**
 * Sprint 002 — Organizations as first-class platform entities.
 * Durable model: name, type, owner, subscription, status, timezone,
 * branding, users, schools, permissions — with tenant isolation helpers.
 */

import { createAuthClient } from "@/lib/supabase/server-auth";
import type { Json } from "@/types/database";

export const ORGANIZATION_TYPES = [
  "school_network",
  "single_school",
  "enterprise",
  "charter",
  "private",
  "other",
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const ORGANIZATION_STATUSES = [
  "active",
  "inactive",
  "archived",
  "suspended",
  "provisioning",
] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const ORGANIZATION_SUBSCRIPTION_STATUSES = [
  "none",
  "trial",
  "active",
  "past_due",
  "canceled",
  "suspended",
] as const;

export type OrganizationSubscriptionStatus =
  (typeof ORGANIZATION_SUBSCRIPTION_STATUSES)[number];

export type OrganizationBranding = {
  logoUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
  productName?: string;
  [key: string]: unknown;
};

export type OrganizationEntity = {
  id: string;
  name: string;
  slug: string;
  orgType: OrganizationType;
  ownerUserId: string | null;
  subscriptionPlanKey: string | null;
  subscriptionStatus: OrganizationSubscriptionStatus;
  status: OrganizationStatus;
  timezone: string;
  branding: OrganizationBranding;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationDetail = OrganizationEntity & {
  users: OrganizationUserSummary[];
  schools: OrganizationSchoolSummary[];
  permissions: string[];
};

export type OrganizationUserSummary = {
  userId: string;
  email: string | null;
  fullName: string | null;
  membershipRole: string;
  status: string;
  isPrimary: boolean;
  permissions: string[];
};

export type OrganizationSchoolSummary = {
  id: string;
  name: string;
  timezone: string | null;
};

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  owner_user_id: string | null;
  subscription_plan_key: string | null;
  subscription_status: string;
  status: string;
  timezone: string;
  branding: Json;
  settings: Json;
  created_at: string;
  updated_at: string;
};

function asRecord(value: Json | null | undefined): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asStringArray(value: Json | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function mapOrganization(row: OrgRow): OrganizationEntity {
  const branding = asRecord(row.branding);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    orgType: (row.org_type as OrganizationType) || "school_network",
    ownerUserId: row.owner_user_id,
    subscriptionPlanKey: row.subscription_plan_key,
    subscriptionStatus:
      (row.subscription_status as OrganizationSubscriptionStatus) || "none",
    status: (row.status as OrganizationStatus) || "active",
    timezone: row.timezone || "America/New_York",
    branding: branding as OrganizationBranding,
    settings: asRecord(row.settings),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ORG_SELECT =
  "id, name, slug, org_type, owner_user_id, subscription_plan_key, subscription_status, status, timezone, branding, settings, created_at, updated_at";

export async function listOrganizations(
  supabase?: AuthClient
): Promise<OrganizationEntity[]> {
  const client = supabase ?? (await createAuthClient());
  const { data } = await client
    .from("org_organizations")
    .select(ORG_SELECT)
    .order("name");
  return (data ?? []).map((row) => mapOrganization(row as OrgRow));
}

export async function getOrganizationById(
  organizationId: string,
  supabase?: AuthClient
): Promise<OrganizationEntity | null> {
  const client = supabase ?? (await createAuthClient());
  const { data } = await client
    .from("org_organizations")
    .select(ORG_SELECT)
    .eq("id", organizationId)
    .maybeSingle();
  return data ? mapOrganization(data as OrgRow) : null;
}

export async function getOrganizationBySlug(
  slug: string,
  supabase?: AuthClient
): Promise<OrganizationEntity | null> {
  const client = supabase ?? (await createAuthClient());
  const { data } = await client
    .from("org_organizations")
    .select(ORG_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  return data ? mapOrganization(data as OrgRow) : null;
}

export async function getOrganizationUsers(
  organizationId: string,
  supabase?: AuthClient
): Promise<OrganizationUserSummary[]> {
  const client = supabase ?? (await createAuthClient());
  const { data } = await client
    .from("user_organization_memberships")
    .select(
      "user_id, membership_role, status, is_primary, permissions, users(email, full_name, display_name)"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => {
    const users = row.users as
      | {
          email: string | null;
          full_name: string | null;
          display_name: string | null;
        }
      | {
          email: string | null;
          full_name: string | null;
          display_name: string | null;
        }[]
      | null;
    const profile = Array.isArray(users) ? users[0] : users;
    return {
      userId: row.user_id as string,
      email: profile?.email ?? null,
      fullName:
        profile?.display_name?.trim() || profile?.full_name?.trim() || null,
      membershipRole: row.membership_role as string,
      status: row.status as string,
      isPrimary: Boolean(row.is_primary),
      permissions: asStringArray(row.permissions as Json),
    };
  });
}

export async function getOrganizationSchools(
  organizationId: string,
  supabase?: AuthClient
): Promise<OrganizationSchoolSummary[]> {
  const client = supabase ?? (await createAuthClient());
  const { data } = await client
    .from("schools")
    .select("id, name, timezone")
    .eq("organization_id", organizationId)
    .order("name");
  return (data ?? []).map((school) => ({
    id: school.id,
    name: school.name,
    timezone: school.timezone,
  }));
}

export async function getOrganizationPermissions(
  organizationId: string,
  supabase?: AuthClient
): Promise<string[]> {
  const users = await getOrganizationUsers(organizationId, supabase);
  const keys = new Set<string>();
  for (const user of users) {
    for (const key of user.permissions) keys.add(key);
  }
  return Array.from(keys).sort();
}

export async function getOrganizationDetail(
  organizationId: string,
  supabase?: AuthClient
): Promise<OrganizationDetail | null> {
  const client = supabase ?? (await createAuthClient());
  const organization = await getOrganizationById(organizationId, client);
  if (!organization) return null;

  const [users, schools, permissions] = await Promise.all([
    getOrganizationUsers(organizationId, client),
    getOrganizationSchools(organizationId, client),
    getOrganizationPermissions(organizationId, client),
  ]);

  return {
    ...organization,
    users,
    schools,
    permissions,
  };
}

export async function assertOrganizationAccess(
  organizationId: string,
  userId: string,
  supabase?: AuthClient
): Promise<boolean> {
  const client = supabase ?? (await createAuthClient());

  const { data: membership } = await client
    .from("user_organization_memberships")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membership) return true;

  const { data: org } = await client
    .from("org_organizations")
    .select("owner_user_id")
    .eq("id", organizationId)
    .maybeSingle();

  return org?.owner_user_id === userId;
}

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  orgType?: OrganizationType;
  ownerUserId?: string | null;
  subscriptionPlanKey?: string | null;
  subscriptionStatus?: OrganizationSubscriptionStatus;
  status?: OrganizationStatus;
  timezone?: string;
  branding?: OrganizationBranding;
  settings?: Record<string, unknown>;
};

export async function createOrganization(
  input: CreateOrganizationInput,
  supabase?: AuthClient
): Promise<{ organization: OrganizationEntity | null; error?: string }> {
  const client = supabase ?? (await createAuthClient());
  const { data, error } = await client
    .from("org_organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      org_type: input.orgType ?? "school_network",
      owner_user_id: input.ownerUserId ?? null,
      subscription_plan_key: input.subscriptionPlanKey ?? null,
      subscription_status: input.subscriptionStatus ?? "none",
      status: input.status ?? "provisioning",
      timezone: input.timezone ?? "America/New_York",
      branding: (input.branding ?? {}) as Json,
      settings: (input.settings ?? {}) as Json,
    })
    .select(ORG_SELECT)
    .single();

  if (error) return { organization: null, error: error.message };

  const organization = mapOrganization(data as OrgRow);

  if (input.ownerUserId) {
    await client.from("user_organization_memberships").upsert(
      {
        organization_id: organization.id,
        user_id: input.ownerUserId,
        membership_role: "owner",
        status: "active",
        is_primary: true,
        permissions: [
          "org.view",
          "org.manage",
          "users.view",
          "users.manage",
        ] as unknown as Json,
        joined_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,user_id" }
    );
  }

  return { organization };
}
