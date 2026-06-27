import { notFound } from "next/navigation";
import { canAccessFamilyProfile } from "@/lib/families/profile/access";
import type { FamilyProfileEnvelope } from "@/lib/families/profile/types";
import { buildProfileEnvelopeBase } from "@/lib/platform/profile/envelope";
import { extractSchoolOrganizationId } from "@/lib/platform/shared/context";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function buildFamilyProfileEnvelope(
  supabase: AuthClient,
  familyId: string,
  identity: IdentityContext
): Promise<FamilyProfileEnvelope | null> {
  const { data: family } = await supabase
    .from("families")
    .select("id, school_id, family_name, billing_email, status, schools(name, organization_id)")
    .eq("id", familyId)
    .maybeSingle();

  if (!family) return null;

  if (!(await canAccessFamilyProfile(supabase, identity, family))) {
    notFound();
  }

  const organizationId = extractSchoolOrganizationId(family.schools);

  const base = await buildProfileEnvelopeBase(supabase, {
    profileKind: "family",
    entityType: "family",
    entityId: family.id,
    organizationId,
    schoolId: family.school_id,
    displayName: family.family_name,
    subtitle: "Family Profile",
    basePath: "/dashboard/families",
    sectionParam: "section",
    defaultSection: "overview",
  });

  return {
    ...base,
    profileKind: "family",
    familyId: family.id,
    familyName: family.family_name,
    billingEmail: family.billing_email,
    status: family.status,
  };
}
