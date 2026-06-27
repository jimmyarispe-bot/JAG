import { notFound } from "next/navigation";
import { buildProfileEnvelopeBase } from "@/lib/platform/profile/envelope";
import { extractSchoolOrganizationId } from "@/lib/platform/shared/context";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type { EmployeeProfileEnvelope } from "@/lib/employees/profile/types";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function buildEmployeeProfileEnvelope(
  supabase: AuthClient,
  employeeId: string,
  identity: IdentityContext
): Promise<EmployeeProfileEnvelope | null> {
  const { data: employee } = await supabase
    .from("employees")
    .select(
      "id, school_id, user_id, employee_type, employment_status, hire_date, department, supervisor_employee_id, employee_profiles(display_name, job_title, contact_email, first_name, last_name), schools(name, organization_id)"
    )
    .eq("id", employeeId)
    .maybeSingle();

  if (!employee) return null;

  if (
    !identity.isFounder &&
    !identity.accessibleSchoolIds.includes(employee.school_id)
  ) {
    notFound();
  }

  const profile = Array.isArray(employee.employee_profiles)
    ? employee.employee_profiles[0]
    : employee.employee_profiles;

  const organizationId = extractSchoolOrganizationId(employee.schools);
  const displayName =
    profile?.display_name ??
    ([profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Employee");

  const base = await buildProfileEnvelopeBase(supabase, {
    profileKind: "employee",
    entityType: "employee",
    entityId: employee.id,
    organizationId,
    schoolId: employee.school_id,
    displayName,
    subtitle: profile?.job_title ?? "Employee Profile",
    basePath: "/dashboard/hr/employees",
    sectionParam: "section",
    defaultSection: "overview",
  });

  return {
    ...base,
    profileKind: "employee",
    employeeId: employee.id,
    userId: employee.user_id,
    employeeType: employee.employee_type,
    employmentStatus: employee.employment_status,
    hireDate: employee.hire_date,
    department: employee.department,
    supervisorEmployeeId: employee.supervisor_employee_id,
    jobTitle: profile?.job_title ?? null,
    contactEmail: profile?.contact_email ?? null,
  };
}
