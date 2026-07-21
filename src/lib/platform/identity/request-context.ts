/**
 * Sprint P002 — request-scoped workspace context.
 *
 * Loads identity, branding, and primary organization once per RSC request.
 * Downstream pages/layouts should prefer this (or the underlying cached loaders)
 * instead of re-querying the same data.
 *
 * Does not change permissions or business rules — only deduplicates I/O.
 */

import { cache } from "react";
import { loadOrganizationBranding } from "@/lib/branding";
import type { OrganizationBranding } from "@/lib/branding/types";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getIdentityContext, type IdentityContext } from "@/lib/platform/identity/context";
import { resolvePrimaryOrganizationId } from "@/lib/platform/identity/org-membership";

export type RequestWorkspaceContext = {
  identity: IdentityContext;
  branding: OrganizationBranding;
  organizationId: string | null;
};

/**
 * Shared request context — identity + branding + primary org id.
 * Safe to call from layout and pages; subsequent calls reuse the same promise.
 */
export const getRequestWorkspaceContext = cache(
  async (): Promise<RequestWorkspaceContext | null> => {
    const identity = await getIdentityContext();
    if (!identity) return null;

    const supabase = await createAuthClient();
    const [branding, organizationId] = await Promise.all([
      loadOrganizationBranding(supabase),
      resolvePrimaryOrganizationId(identity.effectiveUserId, supabase),
    ]);

    return { identity, branding, organizationId };
  }
);
