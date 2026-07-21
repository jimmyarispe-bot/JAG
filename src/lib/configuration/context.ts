import { cache } from "react";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { getAuthUser } from "@/lib/auth/auth-user";
import { createAuthClient as getAuthClient } from "@/lib/supabase/server-auth";
import { resolvePrimaryOrganizationId } from "@/lib/platform/identity/org-membership";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

/** Primary org id — once per request (Sprint P002). */
const getPrimaryOrganizationIdCached = cache(async (): Promise<string | null> => {
  const { user } = await getAuthUser();
  return resolvePrimaryOrganizationId(user?.id);
});

export async function getPrimaryOrganizationId(_supabase?: AuthClient): Promise<string | null> {
  return getPrimaryOrganizationIdCached();
}

const getOrganizationRecordCached = cache(async (organizationId: string) => {
  const supabase = await getAuthClient();
  const { data } = await supabase
    .from("org_organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();
  return data;
});

/** Organization row — once per request per id (Sprint P002). */
export async function getOrganizationRecord(
  _supabase: AuthClient | undefined,
  organizationId: string
) {
  return getOrganizationRecordCached(organizationId);
}
