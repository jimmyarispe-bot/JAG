/**
 * Sprint 211 — Brand typography resolution.
 */

import type { OrganizationBrand } from "./types";

export type ResolvedFonts = {
  heading: string;
  body: string;
  cssStack: string;
};

const FALLBACK_HEADING = "Source Serif 4, Georgia, 'Times New Roman', serif";
const FALLBACK_BODY =
  "IBM Plex Sans, 'Segoe UI', system-ui, -apple-system, sans-serif";

export const TypographyService = {
  resolveFonts(brand: OrganizationBrand): ResolvedFonts {
    const heading = brand.heading_font?.trim() || "Source Serif 4";
    const body = brand.body_font?.trim() || "IBM Plex Sans";
    const cssStack = [
      `--brand-heading-font: "${heading}", Georgia, "Times New Roman", serif`,
      `--brand-body-font: "${body}", "Segoe UI", system-ui, -apple-system, sans-serif`,
    ].join("; ");

    return {
      heading: heading || FALLBACK_HEADING,
      body: body || FALLBACK_BODY,
      cssStack,
    };
  },
};
