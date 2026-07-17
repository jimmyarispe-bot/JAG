import type { createAuthClient } from "@/lib/supabase/server-auth";
import { resolvePrimaryOrganizationId } from "@/lib/platform/identity/org-membership";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getPrimaryOrganizationId(supabase: AuthClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return resolvePrimaryOrganizationId(user?.id, supabase);
}

export async function getOrganizationRecord(supabase: AuthClient, organizationId: string) {
  const { data } = await supabase.from("org_organizations").select("*").eq("id", organizationId).maybeSingle();
  return data;
}
