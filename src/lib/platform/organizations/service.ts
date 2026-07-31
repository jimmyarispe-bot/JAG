import {
  organizationHasFeature,
} from "@/lib/platform/organizations/features";
import { resolveOrganizationContext } from "@/lib/platform/organizations/resolver";
import type {
  OrganizationContext,
  OrganizationFeatureKey,
  ResolveOrganizationInput,
} from "@/lib/platform/organizations/types";
import { PLATFORM_SEED_ORGANIZATION_SLUG } from "@/lib/platform/organizations/types";

/**
 * Single platform API for organization concerns (Sprint 061).
 *
 * Applications should resolve OrganizationContext here — not hardcode
 * tenant names, domains, branding, or feature switches.
 */
export const OrganizationService = {
  /** Platform seed tenant slug (Tenant #1). Prefer resolve() in call sites. */
  getSeedOrganizationSlug(): string {
    return PLATFORM_SEED_ORGANIZATION_SLUG;
  },

  /**
   * Resolve full OrganizationContext from id / host / slug / user.
   * Soft-defaults preserve existing AcademyOS / Tenant #1 behavior.
   */
  async resolve(input: ResolveOrganizationInput = {}): Promise<OrganizationContext> {
    return resolveOrganizationContext(input);
  },

  /** Feature gate — prefer over hardcoded enable/disable logic. */
  hasFeature(ctx: OrganizationContext, key: OrganizationFeatureKey): boolean {
    return organizationHasFeature(ctx.features, key);
  },

  /** Convenience: resolve + hasFeature in one call. */
  async organizationHasFeature(
    key: OrganizationFeatureKey,
    input: ResolveOrganizationInput = {}
  ): Promise<boolean> {
    const ctx = await resolveOrganizationContext(input);
    return organizationHasFeature(ctx.features, key);
  },
} as const;

export type OrganizationServiceApi = typeof OrganizationService;
