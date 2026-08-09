/**
 * Sprint 211 — Multi-tenant branding package.
 * Import via `@/lib/platform/branding` or `…/branding/index`.
 */

export {
  THE_JAG_MARK,
  POWERED_BY_LINE,
  DEFAULT_ROOT_DOMAIN,
  CANONICAL_JAG_PRODUCTION_ORIGIN,
  type OrganizationBrand,
  type BrandTheme,
  type BrandThemeIcons,
  type BrandThemeMetadata,
  type BrandResolveInput,
  type BrandAssetKind,
  type BrandObservation,
  type BrandObservationKind,
} from "./types";

export { resolvePublicAppOrigin } from "./public-origin";

export { platformDefaultBrand, tenantDefaultBrand } from "./defaults";

export { BrandRegistry } from "./BrandRegistry";

export {
  BrandResolver,
  resolveFromHost,
  resolveByOrganizationId,
  resolveDefault,
  resolveFromCustomDomain,
  extractSubdomainFromHost,
  isJagPlatformApexHost,
} from "./BrandResolver";

export {
  ThemeEngine,
  buildTheme,
  generateTheme,
  themeToStyle,
  themeToTailwindTokens,
  themeToManifest,
  type BrandTailwindTokens,
  type BrandWebManifest,
} from "./ThemeEngine";

export { LogoService } from "./LogoService";

export { TypographyService, type ResolvedFonts } from "./TypographyService";

export { AssetService, type BrandAssetRecord } from "./AssetService";

export { BrandService } from "./BrandService";

export {
  buildBrandedEmail,
  buildBrandedPdf,
  type BrandedEmailDocument,
  type BrandedPdfDocument,
} from "./BrandDocuments";

export {
  recordBrandObservation,
  listBrandObservations,
  clearBrandObservationsForTests,
} from "./BrandObservability";
