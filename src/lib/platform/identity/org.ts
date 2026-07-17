import { createAuthClient } from "@/lib/supabase/server-auth";
import { resolvePrimaryOrganizationId } from "@/lib/platform/identity/org-membership";

export async function getOrganizationHierarchy(organizationId?: string | null) {
  const supabase = await createAuthClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedOrgId =
    organizationId ?? (await resolvePrimaryOrganizationId(user?.id, supabase));

  const orgQuery = resolvedOrgId
    ? supabase.from("org_organizations").select("*").eq("id", resolvedOrgId)
    : supabase.from("org_organizations").select("*").eq("slug", "the-academy-way");

  const { data: org } = await orgQuery.maybeSingle();

  const orgId = org?.id ?? null;

  const [{ data: regions }, { data: schools }, { data: campuses }, { data: programs }, { data: departments }] =
    await Promise.all([
      orgId
        ? supabase.from("org_regions").select("*").eq("organization_id", orgId).order("name")
        : supabase.from("org_regions").select("*").order("name"),
      orgId
        ? supabase
            .from("schools")
            .select("id, name, organization_id, region_id, timezone")
            .eq("organization_id", orgId)
            .order("name")
        : supabase
            .from("schools")
            .select("id, name, organization_id, region_id, timezone")
            .order("name"),
      supabase.from("campuses").select("id, school_id, name, code, is_primary, status").order("name"),
      supabase.from("org_programs").select("id, school_id, name, code, status").order("name"),
      supabase
        .from("org_departments")
        .select("id, school_id, campus_id, name, code, status")
        .order("name"),
    ]);

  const schoolIds = new Set((schools ?? []).map((s) => s.id));

  return {
    organization: org,
    regions: regions ?? [],
    schools: schools ?? [],
    campuses: (campuses ?? []).filter((c) => schoolIds.has(c.school_id)),
    programs: (programs ?? []).filter((p) => schoolIds.has(p.school_id)),
    departments: (departments ?? []).filter((d) => schoolIds.has(d.school_id)),
  };
}

export async function getSchoolConfiguration(schoolId: string) {
  const supabase = await createAuthClient();

  const [settings, branding, businessHours] = await Promise.all([
    supabase.from("school_settings").select("*").eq("school_id", schoolId).maybeSingle(),
    supabase.from("school_branding").select("*").eq("school_id", schoolId).maybeSingle(),
    supabase
      .from("platform_business_hours")
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_active", true),
  ]);

  return {
    settings: settings.data,
    branding: branding.data,
    businessHours: businessHours.data ?? [],
  };
}
