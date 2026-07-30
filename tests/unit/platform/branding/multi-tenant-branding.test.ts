import { beforeEach, describe, expect, it } from "vitest";
import {
  BrandRegistry,
  BrandResolver,
  BrandService,
  POWERED_BY_LINE,
  THE_JAG_MARK,
  ThemeEngine,
  buildBrandedEmail,
  buildBrandedPdf,
  clearBrandObservationsForTests,
  extractSubdomainFromHost,
  listBrandObservations,
} from "@/lib/platform/branding";

describe("Sprint 211 multi-tenant branding", () => {
  beforeEach(() => {
    BrandService.resetForTests();
    clearBrandObservationsForTests();
  });

  it("resolves academy.thejag.org to The Academy Way", () => {
    expect(extractSubdomainFromHost("academy.thejag.org")).toBe("academy");
    const brand = BrandResolver.resolveFromHost("academy.thejag.org");
    expect(brand.organization_id).toBe("org.the-academy-way");
    expect(brand.display_name).toBe("The Academy Way");
    expect(brand.powered_by_enabled).toBe(true);
  });

  it("resolves localhost ?subdomain=acme", () => {
    const brand = BrandService.resolveForRequest({
      host: "localhost:3000?subdomain=acme",
    });
    expect(brand.subdomain).toBe("acme");
    expect(brand.display_name).toBe("Acme Industries");
  });

  it("keeps custom-domain hook reserved", () => {
    expect(BrandResolver.resolveFromCustomDomain("brand.example.com")).toBeNull();
  });

  it("generates CSS variables, tokens, and page title", () => {
    const brand = BrandRegistry.getByOrganizationId("org.the-academy-way")!;
    const theme = ThemeEngine.buildTheme(brand);
    expect(theme.cssVariables["--brand-accent"]).toBe(brand.accent_color);
    expect(theme.metadata.title).toBe(
      "The Academy Way Executive Intelligence Platform"
    );
    expect(theme.metadata.poweredBy).toBe(POWERED_BY_LINE);

    const tokens = ThemeEngine.themeToTailwindTokens(theme);
    expect(tokens.brandAccent).toBe(brand.accent_color);

    const manifest = ThemeEngine.themeToManifest(brand, theme);
    expect(manifest.name).toContain("Executive Intelligence Platform");
  });

  it("never uses bare JAG as the platform mark", () => {
    const platform = BrandService.resolveForRequest({});
    expect(platform.display_name).toBe(THE_JAG_MARK);
    expect(platform.display_name).not.toBe("JAG");
    expect(BrandService.formatPageTitle(platform)).toContain(THE_JAG_MARK);
  });

  it("updates brand and records observability", () => {
    const updated = BrandService.updateBrand("org.the-academy-way", {
      accent_color: "#22C55E",
    });
    expect(updated.accent_color).toBe("#22C55E");
    const events = listBrandObservations(10);
    expect(events.some((e) => e.kind === "brand_update")).toBe(true);
  });

  it("restores tenant defaults", () => {
    BrandService.updateBrand("org-acme", { primary_color: "#FFFFFF" });
    const restored = BrandService.restoreDefaults("org-acme");
    expect(restored.primary_color).not.toBe("#FFFFFF");
    expect(restored.powered_by_enabled).toBe(true);
  });

  it("builds branded email and PDF footers with Powered by The JAG™", () => {
    const brand = BrandRegistry.getBySubdomain("signalcenters")!;
    const email = buildBrandedEmail(brand, { documentTitle: "Watcher Digest" });
    expect(email.footerText).toContain(POWERED_BY_LINE);
    expect(email.headerHtml).toContain("Watcher Digest");

    const pdf = buildBrandedPdf(brand);
    expect(pdf.footerText).toContain(POWERED_BY_LINE);
    expect(pdf.title).toContain("Signal Centers");
  });

  it("previewTheme does not spam theme_generation by default", () => {
    clearBrandObservationsForTests();
    BrandService.previewTheme({
      organization_id: "org.the-academy-way",
      accent_color: "#ABCDEF",
    });
    expect(listBrandObservations()).toHaveLength(0);

    BrandService.previewTheme(
      { organization_id: "org.the-academy-way", accent_color: "#ABCDEF" },
      { record: true }
    );
    expect(listBrandObservations()[0]?.kind).toBe("preview_generation");
  });
});
