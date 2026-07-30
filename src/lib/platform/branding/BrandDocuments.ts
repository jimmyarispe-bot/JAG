/**
 * Sprint 211 — Branded email / PDF document fragments.
 * Application layer — consumers compose content; this supplies brand chrome.
 */

import { BrandService } from "./BrandService";
import { LogoService } from "./LogoService";
import { POWERED_BY_LINE, type OrganizationBrand } from "./types";

export type BrandedEmailDocument = {
  readonly subjectPrefix: string;
  readonly headerHtml: string;
  readonly footerHtml: string;
  readonly footerText: string;
  readonly primaryColor: string;
  readonly accentColor: string;
};

export type BrandedPdfDocument = {
  readonly title: string;
  readonly logoUrl: string;
  readonly primaryColor: string;
  readonly accentColor: string;
  readonly footerText: string;
  readonly poweredBy: string | null;
};

/** Executive Briefs, Watcher Digests, Decision Notifications. */
export function buildBrandedEmail(
  brand: OrganizationBrand,
  options?: { readonly documentTitle?: string }
): BrandedEmailDocument {
  const logo = LogoService.getLightLogo(brand) || LogoService.getDarkLogo(brand);
  const footerText = BrandService.emailFooter(brand);
  const powered = brand.powered_by_enabled ? POWERED_BY_LINE : null;
  const title = options?.documentTitle?.trim() || brand.display_name;

  const headerHtml = [
    `<div style="font-family:${brand.body_font || "IBM Plex Sans"},system-ui,sans-serif;border-bottom:3px solid ${brand.accent_color};padding:16px 0;margin-bottom:16px;">`,
    logo
      ? `<img src="${escapeAttr(logo)}" alt="${escapeAttr(brand.display_name)}" style="max-height:40px;display:block;margin-bottom:8px;" />`
      : "",
    `<div style="font-size:18px;font-weight:600;color:${brand.primary_color};">${escapeHtml(title)}</div>`,
    `<div style="font-size:12px;color:#64748b;margin-top:4px;">${escapeHtml(brand.display_name)} Executive Intelligence Platform</div>`,
    `</div>`,
  ].join("");

  const footerHtml = [
    `<div style="font-family:${brand.body_font || "IBM Plex Sans"},system-ui,sans-serif;border-top:1px solid #e2e8f0;margin-top:24px;padding-top:12px;font-size:11px;color:#64748b;">`,
    `<div>${escapeHtml(footerText)}</div>`,
    powered && !footerText.includes(POWERED_BY_LINE)
      ? `<div style="margin-top:4px;">${escapeHtml(powered)}</div>`
      : "",
    `</div>`,
  ].join("");

  return {
    subjectPrefix: brand.display_name,
    headerHtml,
    footerHtml,
    footerText,
    primaryColor: brand.primary_color,
    accentColor: brand.accent_color,
  };
}

/** Executive Briefs, Board Reports, Decision / Strategy Reports. */
export function buildBrandedPdf(brand: OrganizationBrand): BrandedPdfDocument {
  return {
    title: BrandService.formatPageTitle(brand),
    logoUrl: LogoService.getLightLogo(brand) || LogoService.getDarkLogo(brand),
    primaryColor: brand.primary_color,
    accentColor: brand.accent_color,
    footerText: BrandService.pdfFooter(brand),
    poweredBy: brand.powered_by_enabled ? POWERED_BY_LINE : null,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
