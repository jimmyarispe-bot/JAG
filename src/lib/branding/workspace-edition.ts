import type { OrganizationBranding } from "@/lib/branding/types";
import { FALLBACK_ROLE_LABELS } from "@/lib/branding/defaults";

/**
 * Workspace edition chrome is identity-scoped.
 * Founder's Edition is only for Founder (JAG_ACCESS) users.
 */
export function resolveWorkspaceEditionLabel(input: {
  branding: OrganizationBranding;
  isFounder: boolean;
  isExecutiveDirector?: boolean;
  roleLabel?: string | null;
}): string {
  if (input.isFounder) {
    return input.branding.editionLabel?.trim() || "Founder's Edition";
  }
  if (input.isExecutiveDirector) {
    return (
      input.roleLabel?.trim() ||
      input.branding.roleTitles.EXECUTIVE_DIRECTOR?.trim() ||
      FALLBACK_ROLE_LABELS.EXECUTIVE_DIRECTOR
    );
  }
  return "";
}

export function formatWorkspaceProductLine(input: {
  branding: OrganizationBranding;
  isFounder: boolean;
  isExecutiveDirector?: boolean;
  roleLabel?: string | null;
}): string {
  const edition = resolveWorkspaceEditionLabel(input);
  return edition
    ? `${input.branding.productName} — ${edition}`
    : input.branding.productName;
}
