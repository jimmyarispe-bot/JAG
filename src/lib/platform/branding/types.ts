/**
 * Sprint 211 — Multi-tenant branding types.
 * Application-layer brand records for tenant theming.
 */

export const THE_JAG_MARK = "The JAG™" as const;
export const POWERED_BY_LINE = "Powered by The JAG™" as const;
export const DEFAULT_ROOT_DOMAIN = "thejag.org" as const;

/** Persisted / registry organization brand record. */
export type OrganizationBrand = {
  organization_id: string;
  subdomain: string;
  organization_name: string;
  display_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  danger_color: string;
  light_logo_url: string;
  dark_logo_url: string;
  favicon_url: string;
  app_icon_url: string;
  heading_font: string;
  body_font: string;
  login_background_url: string;
  dashboard_background_url: string;
  email_footer: string;
  pdf_footer: string;
  powered_by_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type BrandAssetKind =
  | "light_logo"
  | "dark_logo"
  | "favicon"
  | "app_icon"
  | "login_background"
  | "dashboard_background";

export type BrandResolveInput = {
  host?: string;
  organizationId?: string;
};

export type BrandThemeIcons = {
  lightLogo: string;
  darkLogo: string;
  favicon: string;
  appIcon: string;
};

export type BrandThemeMetadata = {
  title: string;
  description: string;
  poweredBy: string | null;
};

/** Generated theme consumed by UI shells. */
export type BrandTheme = {
  cssVariables: Record<string, string>;
  metadata: BrandThemeMetadata;
  icons: BrandThemeIcons;
};

export type BrandObservationKind =
  | "brand_update"
  | "theme_generation"
  | "asset_change"
  | "logo_upload"
  | "preview_generation";

export type BrandObservation = {
  readonly id: string;
  readonly kind: BrandObservationKind;
  readonly at: string;
  readonly organizationId: string;
  readonly detail: string;
};
