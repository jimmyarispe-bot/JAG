/**
 * CSP must permit Supabase Storage signed media for Learning video playback.
 */

import { describe, expect, it } from "vitest";
import {
  CONTENT_SECURITY_POLICY,
  JAG_SUPABASE_MEDIA_ORIGIN,
  cspAllowsMediaUrl,
} from "@/lib/platform/security/content-security-policy";

describe("Content-Security-Policy media-src (Learning videos)", () => {
  it("declares media-src allowing Supabase Storage origins", () => {
    expect(CONTENT_SECURITY_POLICY).toContain(
      "media-src 'self' https://*.supabase.co"
    );
    // Without media-src, <video> falls back to default-src 'self' and blocks
    // signed Supabase playback URLs in production.
    expect(CONTENT_SECURITY_POLICY).toMatch(/media-src [^;]*supabase\.co/);
  });

  it("permits the production Supabase project origin for video media", () => {
    const signed = `${JAG_SUPABASE_MEDIA_ORIGIN}/storage/v1/object/sign/jag-learn-media/tutorials/JAG-001/mr-jag.mp4?token=test`;
    expect(JAG_SUPABASE_MEDIA_ORIGIN).toBe(
      "https://ybcpaffklggaloxhnqkl.supabase.co"
    );
    expect(cspAllowsMediaUrl(signed)).toBe(true);
  });

  it("does not treat connect-src as sufficient for media playback", () => {
    // Regression guard: connect-src already allowed *.supabase.co before the
    // Learning video bug; media elements require media-src explicitly.
    expect(CONTENT_SECURITY_POLICY).toContain("connect-src");
    expect(CONTENT_SECURITY_POLICY).toContain("media-src");
    expect(CONTENT_SECURITY_POLICY.indexOf("media-src")).not.toBe(
      CONTENT_SECURITY_POLICY.indexOf("connect-src")
    );
  });
});
