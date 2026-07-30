/**
 * Sprint 211 — Logo / icon URL accessors.
 */

import type { OrganizationBrand } from "./types";

export const LogoService = {
  getLightLogo(brand: OrganizationBrand): string {
    return brand.light_logo_url ?? "";
  },

  getDarkLogo(brand: OrganizationBrand): string {
    return brand.dark_logo_url ?? "";
  },

  getFavicon(brand: OrganizationBrand): string {
    return brand.favicon_url ?? "";
  },

  getAppIcon(brand: OrganizationBrand): string {
    return brand.app_icon_url ?? "";
  },
};
