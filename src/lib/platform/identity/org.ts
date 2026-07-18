import { createAuthClient } from "@/lib/supabase/server-auth";
import { resolvePrimaryOrganizationId } from "@/lib/platform/identity/org-membership";

export async function getOrganizationHierarchy(organizationId?: string | null) {
  try {
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

    // Schools first so child queries can be scoped — never full-table scans under RLS.
    const { data: schools } = orgId
      ? await supabase
          .from("schools")
          .select("id, name, organization_id, region_id, timezone")
          .eq("organization_id", orgId)
          .order("name")
      : await supabase
          .from("schools")
          .select("id, name, organization_id, region_id, timezone")
          .order("name")
          .limit(100);

    const schoolList = schools ?? [];
    const schoolIds = schoolList.map((s) => s.id);

    if (!schoolIds.length) {
      const { data: regions } = orgId
        ? await supabase.from("org_regions").select("*").eq("organization_id", orgId).order("name")
        : { data: [] };
      return {
        organization: org,
        regions: regions ?? [],
        schools: schoolList,
        campuses: [],
        programs: [],
        departments: [],
      };
    }

    const [{ data: regions }, { data: campuses }, { data: programs }, { data: departments }] =
      await Promise.all([
        orgId
          ? supabase.from("org_regions").select("*").eq("organization_id", orgId).order("name")
          : Promise.resolve({ data: [] as never[] }),
        supabase
          .from("campuses")
          .select("id, school_id, name, code, is_primary, status")
          .in("school_id", schoolIds)
          .order("name"),
        supabase
          .from("org_programs")
          .select("id, school_id, name, code, status")
          .in("school_id", schoolIds)
          .order("name"),
        supabase
          .from("org_departments")
          .select("id, school_id, campus_id, name, code, status")
          .in("school_id", schoolIds)
          .order("name"),
      ]);

    return {
      organization: org,
      regions: regions ?? [],
      schools: schoolList,
      campuses: campuses ?? [],
      programs: programs ?? [],
      departments: departments ?? [],
    };
  } catch {
    // Never hang admin pages — empty hierarchy is a valid render state.
    return {
      organization: null,
      regions: [],
      schools: [],
      campuses: [],
      programs: [],
      departments: [],
    };
  }
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
