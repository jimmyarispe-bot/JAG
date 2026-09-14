import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isPublicApiPath } from "@/lib/auth/must-reset-password";

/**
 * Can a family without an account actually reach the upload route?
 *
 * Until 13 September 2026, no. isProtectedApi treats every /api/ path as
 * protected unless it is named in PUBLIC_API_PATHS, so middleware answered
 *
 *     {"error":"Unauthorized"}  401
 *
 * before the route ran. Everyone using the public inquiry form is by definition
 * somebody without an account, and both uploads on that form are required
 * fields — so no family who reached that section could submit at all. Proof of
 * income is the document GA GOAL asks for.
 *
 * It was invisible for two reasons. The client called .json() on whatever came
 * back, so on a large file the platform's plain-text 413 surfaced as a parser
 * error and hid the 401 underneath it. And nobody had filled the form in as a
 * family.
 */

describe("the public inquiry form can reach its own upload route", () => {
  /** THE ONE THAT MATTERS. */
  it("treats /api/apply/upload as public at the edge", () => {
    expect(isPublicApiPath("/api/apply/upload")).toBe(true);
  });

  it("does not make the whole /api/apply tree public by accident", () => {
    expect(isPublicApiPath("/api/apply")).toBe(false);
    expect(isPublicApiPath("/api/apply/upload/anything")).toBe(false);
  });

  /**
   * The allowlist is exact-match, and that is worth pinning: a prefix match here
   * would open far more than intended the first time somebody adds a path.
   */
  it("stays exact-match rather than prefix-match", () => {
    expect(isPublicApiPath("/api/health")).toBe(true);
    expect(isPublicApiPath("/api/health/secret")).toBe(false);
    expect(isPublicApiPath("/api/dashboard/users")).toBe(false);
    expect(isPublicApiPath("/api/admissions/leads")).toBe(false);
  });
});

/**
 * Public at the edge is not the same as unguarded, and the route has to keep
 * carrying its own weight now that middleware waves it through. These assert the
 * guards named in the allowlist comment actually exist — if one is removed, the
 * justification for the entry stops being true.
 */
describe("the route still guards itself", () => {
  const routeSrc = readFileSync(
    join(__dirname, "..", "..", "..", "src/app/api/apply/upload/route.ts"),
    "utf8"
  );
  const routeCode = routeSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("rate limits by IP", () => {
    expect(routeCode).toContain("checkRateLimitAsync");
    expect(routeCode).toContain("getClientIpFromHeaders");
  });

  it("checks the content type against an allowlist", () => {
    expect(routeCode).toContain("ALLOWED_UPLOAD_TYPES");
    expect(routeCode).toMatch(/if \(!extension\)/);
  });

  it("enforces a size cap of its own, not just the browser's", () => {
    expect(routeCode).toContain("MAX_UPLOAD_BYTES");
    expect(routeCode).toMatch(/file\.size > MAX_BYTES/);
  });

  /** A filename from a stranger is never a path. "../" is the oldest trick. */
  it("generates the storage path instead of trusting the filename", () => {
    expect(routeCode).toContain("randomUUID()");
    expect(routeCode).toMatch(/PREFIX.*randomUUID/s);
  });

  it("writes into a quarantine prefix, not the live document tree", () => {
    expect(routeCode).toContain('PREFIX = "interest-uploads"');
  });
});
