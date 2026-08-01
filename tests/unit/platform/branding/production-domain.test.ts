import { afterEach, describe, expect, it } from "vitest";
import {
  CANONICAL_JAG_PRODUCTION_ORIGIN,
  DEFAULT_ROOT_DOMAIN,
  THE_JAG_MARK,
  BrandService,
  extractSubdomainFromHost,
  isJagPlatformApexHost,
} from "@/lib/platform/branding";
import {
  isCanonicalJagProductionAppUrl,
  resolveAuthAppUrl,
} from "@/lib/platform/auth-email/links";
import { GENERIC_BRANDING_DEFAULTS } from "@/lib/branding/defaults";

describe("JAG production domain + product identity", () => {
  const priorAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const priorSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (priorAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = priorAppUrl;
    if (priorSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = priorSiteUrl;
  });

  it("treats apex and www as JAG platform hosts", () => {
    expect(isJagPlatformApexHost("thejag.org")).toBe(true);
    expect(isJagPlatformApexHost("www.thejag.org")).toBe(true);
    expect(isJagPlatformApexHost("www.thejag.org:443")).toBe(true);
    expect(isJagPlatformApexHost(`https://www.${DEFAULT_ROOT_DOMAIN}`)).toBe(true);
  });

  it("does not treat tenant, localhost, or preview hosts as platform apex", () => {
    expect(isJagPlatformApexHost("academy.thejag.org")).toBe(false);
    expect(isJagPlatformApexHost("localhost:3000")).toBe(false);
    expect(isJagPlatformApexHost("jag-git-main.vercel.app")).toBe(false);
    expect(extractSubdomainFromHost("academy.thejag.org")).toBe("academy");
    expect(extractSubdomainFromHost("www.thejag.org")).toBeNull();
  });

  it("resolves JAG platform brand (not School Platform) for apex hosts", () => {
    const brand = BrandService.resolveForRequest({ host: "www.thejag.org" });
    expect(brand.display_name).toBe(THE_JAG_MARK);
    expect(brand.display_name).not.toBe("School Platform");
    expect(BrandService.formatPageTitle(brand)).toContain(THE_JAG_MARK);
    expect(BrandService.formatPageTitle(brand)).not.toContain("School Platform");
  });

  it("keeps AcademyOS org fallback tagline distinct from JAG platform mark", () => {
    expect(GENERIC_BRANDING_DEFAULTS.product_tagline).toBe("Education Operating System");
    expect(GENERIC_BRANDING_DEFAULTS.product_tagline).not.toBe(
      "Staff dashboard and parent application portal"
    );
    expect(THE_JAG_MARK).not.toBe("School Platform");
  });

  it("resolves production app URL from NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = CANONICAL_JAG_PRODUCTION_ORIGIN;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(resolveAuthAppUrl()).toBe(CANONICAL_JAG_PRODUCTION_ORIGIN);
    expect(isCanonicalJagProductionAppUrl()).toBe(true);
  });

  it("keeps local development URL behavior", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(resolveAuthAppUrl()).toBe("http://localhost:3000");
    expect(isCanonicalJagProductionAppUrl()).toBe(false);
  });

  it("documents canonical production origin as www", () => {
    expect(CANONICAL_JAG_PRODUCTION_ORIGIN).toBe("https://www.thejag.org");
  });
});