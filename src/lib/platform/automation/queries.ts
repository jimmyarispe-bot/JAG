import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { composeMissionControlCommandCenter } from "@/lib/platform/automation/mission-control-compose";

export async function getMissionControlDashboard() {
  const supabase = await createAuthClient();
  const ctx = await getIdentityContext();
  return composeMissionControlCommandCenter(supabase, ctx);
}
