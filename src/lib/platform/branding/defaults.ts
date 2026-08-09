/**
 * Sprint 211 — Platform and tenant brand defaults.
 */

import {
  POWERED_BY_LINE,
  THE_JAG_MARK,
  type OrganizationBrand,
} from "./types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GENERIC_ORGANIZATION_LABEL = "Organization" as const;

function nowIso(): string {
  return new Date().toISOString();
}

function isSafeTenantBrandName(
  organizationId: string,
  name: string
): boolean {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return false;
  if (trimmed === GENERIC_ORGANIZATION_LABEL) return false;
  if (trimmed === organizationId) return false;
  if (UUID_RE.test(trimmed)) return false;
  return true;
}

/** Never seed brand records with a UUID / opaque id as the visible name. */
function safeTenantBrandName(
  organizationId: string,
  name: string
): string {
  return isSafeTenantBrandName(organizationId, name)
    ? name.trim()
    : GENERIC_ORGANIZATION_LABEL;
}

/** Platform brand for The JAG™ itself (no “Powered by” line). */
export function platformDefaultBrand(): OrganizationBrand {
  const at = nowIso();
  return {
    organization_id: "platform",
    subdomain: "app",
    organization_name: THE_JAG_MARK,
    display_name: THE_JAG_MARK,
    primary_color: "#0F172A",
    secondary_color: "#1E293B",
    accent_color: "#0D9488",
    success_color: "#059669",
    warning_color: "#D97706",
    danger_color: "#DC2626",
    light_logo_url: "",
    dark_logo_url: "",
    favicon_url: "",
    app_icon_url: "",
    heading_font: "Source Serif 4",
    body_font: "IBM Plex Sans",
    login_background_url: "",
    dashboard_background_url: "",
    email_footer: `${THE_JAG_MARK} · Organizational Intelligence Operating System`,
    pdf_footer: THE_JAG_MARK,
    powered_by_enabled: false,
    created_at: at,
    updated_at: at,
  };
}

/** Sensible tenant defaults (Powered by The JAG™ enabled). */
export function tenantDefaultBrand(
  organizationId: string,
  name: string,
  subdomain?: string
): OrganizationBrand {
  const at = nowIso();
  const safeName = safeTenantBrandName(organizationId, name);
  const slugSource = subdomain?.trim()
    ? subdomain.trim()
    : isSafeTenantBrandName(organizationId, name)
      ? name.trim()
      : organizationId;
  const slug =
    subdomain?.trim().toLowerCase() ||
    slugSource
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    organizationId.toLowerCase();

  return {
    organization_id: organizationId,
    subdomain: slug,
    organization_name: safeName,
    display_name: safeName,
    primary_color: "#1E293B",
    secondary_color: "#334155",
    accent_color: "#0F766E",
    success_color: "#059669",
    warning_color: "#D97706",
    danger_color: "#DC2626",
    light_logo_url: "",
    dark_logo_url: "",
    favicon_url: "",
    app_icon_url: "",
    heading_font: "Source Serif 4",
    body_font: "IBM Plex Sans",
    login_background_url: "",
    dashboard_background_url: "",
    email_footer: `${safeName} · ${POWERED_BY_LINE}`,
    pdf_footer: `${safeName} · ${POWERED_BY_LINE}`,
    powered_by_enabled: true,
    created_at: at,
    updated_at: at,
  };
}
