"use server";

import { revalidatePath } from "next/cache";
import { rebindJagPlatformSessionOrganization } from "@/lib/jag-platform/server-session";

/**
 * Switch the active JAG organization context (cookie rebind).
 */
export async function switchJagOrganizationAction(
  organizationId: string
): Promise<
  | { readonly ok: true; readonly organizationId: string; readonly href: string }
  | { readonly ok: false; readonly error: string }
> {
  const result = await rebindJagPlatformSessionOrganization(organizationId);
  if (!result.ok) return result;
  revalidatePath("/jag");
  return {
    ok: true,
    organizationId: result.session.organizationId!,
    href: `/jag?org=${encodeURIComponent(result.session.organizationId!)}`,
  };
}
