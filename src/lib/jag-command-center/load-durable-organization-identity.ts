/**
 * Load durable org_organizations identity into the process-local cache.
 * Reuses getOrganizationById — does not invent a second organization store.
 */

import {
  getDurableOrganizationIdentity,
  isDurableOrganizationId,
  rememberDurableOrganizationIdentity,
} from "@/lib/jag-business/durable-organization-identity";
import { getOrganizationById } from "@/lib/platform/identity/organizations";

/**
 * Ensure durable identity for a bound organization id is available to sync resolvers.
 * No-op for non-UUID / temporary org.* ids.
 */
export async function ensureDurableOrganizationIdentityLoaded(
  organizationId: string | null | undefined
): Promise<void> {
  const id = organizationId?.trim() ?? "";
  if (!id || !isDurableOrganizationId(id)) return;
  if (getDurableOrganizationIdentity(id)) return;

  try {
    const org = await getOrganizationById(id);
    if (!org?.id || !org.name?.trim()) return;
    rememberDurableOrganizationIdentity({
      id: org.id,
      name: org.name,
      slug: org.slug,
    });
  } catch {
    // Fail closed — sync resolver keeps existing fallbacks.
  }
}

/** Prime durable identity for every candidate id used by a shell load. */
export async function ensureDurableOrganizationIdentitiesLoaded(
  organizationIds: readonly (string | null | undefined)[]
): Promise<void> {
  const unique = [
    ...new Set(
      organizationIds
        .map((id) => id?.trim() ?? "")
        .filter((id) => id && isDurableOrganizationId(id))
    ),
  ];
  await Promise.all(unique.map((id) => ensureDurableOrganizationIdentityLoaded(id)));
}
