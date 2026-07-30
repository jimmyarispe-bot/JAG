/**
 * Sprint 211 — Platform and tenant brand defaults.
 */

import {
  POWERED_BY_LINE,
  THE_JAG_MARK,
  type OrganizationBrand,
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
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
  const slug =
    subdomain?.trim().toLowerCase() ||
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    organizationId.toLowerCase();

  return {
    organization_id: organizationId,
    subdomain: slug,
    organization_name: name,
    display_name: name,
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
    email_footer: `${name} · ${POWERED_BY_LINE}`,
    pdf_footer: `${name} · ${POWERED_BY_LINE}`,
    powered_by_enabled: true,
    created_at: at,
    updated_at: at,
  };
}
