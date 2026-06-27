import { canAccessSchool, hasUnrestrictedSchoolAccess } from "@/lib/platform/identity/school-access";
import type { IdentityContext } from "@/lib/platform/identity/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

interface FamilyAccessRecord {
  id: string;
  school_id: string;
}

/**
 * Family profile visibility: school assignment, linked guardian, or executive unrestricted access.
 */
export async function canAccessFamilyProfile(
  supabase: AuthClient,
  identity: IdentityContext,
  family: FamilyAccessRecord
): Promise<boolean> {
  if (hasUnrestrictedSchoolAccess(identity)) return true;
  if (canAccessSchool(identity, family.school_id)) return true;

  if (!identity.effectiveUserId) return false;

  const { data: guardian } = await supabase
    .from("guardians")
    .select("id")
    .eq("family_id", family.id)
    .eq("user_id", identity.effectiveUserId)
    .maybeSingle();

  return Boolean(guardian);
}
