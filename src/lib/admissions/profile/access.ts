import { canAccessSchool, hasUnrestrictedSchoolAccess } from "@/lib/platform/identity/school-access";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

interface CaseAccessRecord {
  id: string;
  school_id: string;
}

/** Admissions case visibility: admissions permissions + school assignment. */
export async function canAccessAdmissionsCaseProfile(
  _supabase: AuthClient,
  identity: IdentityContext,
  lead: CaseAccessRecord
): Promise<boolean> {
  if (hasUnrestrictedSchoolAccess(identity)) return true;
  if (!canAccessSchool(identity, lead.school_id)) return false;

  const perms = identity.permissions ?? [];
  return (
    perms.includes("admissions.view") ||
    perms.includes("admissions.manage") ||
    perms.includes("admissions.accept")
  );
}
