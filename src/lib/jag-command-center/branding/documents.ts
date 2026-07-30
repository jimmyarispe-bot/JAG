/**
 * Sprint 211 — Resolve branded email / PDF chrome for an organization.
 */

import {
  BrandService,
  buildBrandedEmail,
  buildBrandedPdf,
  type BrandedEmailDocument,
  type BrandedPdfDocument,
} from "@/lib/platform/branding";

export function brandEmailForOrganization(
  organizationId: string | null | undefined,
  options?: { readonly documentTitle?: string }
): BrandedEmailDocument {
  const brand = organizationId
    ? BrandService.resolveForRequest({ organizationId })
    : BrandService.resolveForRequest({});
  return buildBrandedEmail(brand, options);
}

export function brandPdfForOrganization(
  organizationId: string | null | undefined
): BrandedPdfDocument {
  const brand = organizationId
    ? BrandService.resolveForRequest({ organizationId })
    : BrandService.resolveForRequest({});
  return buildBrandedPdf(brand);
}
