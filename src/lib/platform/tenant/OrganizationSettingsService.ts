/**
 * Sprint 213 — Organization settings façade (profile + contacts + status).
 */

import {
  OrganizationService,
  type OrganizationProfilePatch,
} from "./OrganizationService";
import { recordOrganizationAdminAudit } from "./OrganizationObservability";
import { TenantRegistry } from "./TenantRegistry";
import type { OrganizationProfile } from "./types";

export const OrganizationSettingsService = {
  getSettings(organizationId: string): OrganizationProfile | null {
    TenantRegistry.syncFromSources();
    return OrganizationService.getProfile(organizationId);
  },

  saveSettings(
    organizationId: string,
    patch: OrganizationProfilePatch,
    actorLabel = "system"
  ): OrganizationProfile {
    const updated = OrganizationService.updateProfile(
      organizationId,
      patch,
      actorLabel
    );
    if (!updated) {
      throw new Error(`Organization ${organizationId} not found.`);
    }
    recordOrganizationAdminAudit({
      kind: "settings_change",
      organizationId,
      actorLabel,
      detail: "Organization settings saved",
    });
    return updated;
  },
};
