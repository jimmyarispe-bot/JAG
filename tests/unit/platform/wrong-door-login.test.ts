import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TENANT_SIGN_IN_PATH,
  buildWrongDoorFailure,
} from "@/lib/jag-platform/wrong-door";
import { GENERIC_JAG_AUTH_FAILURE } from "@/lib/jag-platform/auth";

/**
 * Being told your password is wrong when it is right.
 *
 * A parent account signed in at thejag.org/jag/login on 13 September 2026. The
 * password was correct; Supabase authenticated it. authorizeJagEntry then
 * refused her for lacking JAG_ACCESS, the session was signed back out, and the
 * screen said "Invalid credentials for The JAG™ Platform."
 *
 * So she reset the password. "Password updated." Signed in. Same message. Three
 * times. That was the founder, on software he built. A family would have
 * concluded the school's system was broken and stopped.
 *
 * The generic wording is correct where it guards something — a failed password
 * check must not confirm which addresses have accounts. It guards nothing here,
 * because the person reading the screen has just proved they hold the
 * credentials. These tests hold that line in both directions.
 */

describe("what the family is told", () => {
  const withHost = buildWrongDoorFailure("theacademyway.thejag.org");
  const withoutHost = buildWrongDoorFailure(null);

  /** THE SENTENCE THAT ENDS THE LOOP. */
  it("says the password was correct", () => {
    expect(withHost.message).toContain("Your password is correct");
    expect(withoutHost.message).toContain("Your password is correct");
  });

  it("says why they are being refused, without blaming them", () => {
    expect(withHost.message).toContain("not part of The JAG");
    expect(withHost.message).toMatch(/school's own address/);
  });

  it("never reuses the generic wording, which is what caused this", () => {
    expect(withHost.message).not.toBe(GENERIC_JAG_AUTH_FAILURE);
    expect(withoutHost.message).not.toBe(GENERIC_JAG_AUTH_FAILURE);
    expect(withHost.message).not.toContain("Invalid credentials");
    expect(withoutHost.message).not.toContain("Invalid credentials");
  });

  it("points at the campus sign-in page when the campus is known", () => {
    expect(withHost.helpHref).toBe("https://theacademyway.thejag.org/login");
    expect(withHost.helpLabel).toBe("theacademyway.thejag.org");
    expect(TENANT_SIGN_IN_PATH).toBe("/login");
  });

  /**
   * /jag/login is the door she cannot pass. Sending her back to it would be the
   * loop with extra steps.
   */
  it("never points back at the platform door", () => {
    expect(withHost.helpHref).not.toContain("/jag/login");
  });

  it("still gives a way forward when the campus cannot be worked out", () => {
    expect(withoutHost.helpHref).toBeNull();
    expect(withoutHost.helpLabel).toBeNull();
    expect(withoutHost.message).toMatch(/email your school sent you/);
    expect(withoutHost.message).toMatch(/admissions office/);
  });

  it("does not promise a link it is not providing", () => {
    // "Sign in here instead:" with nothing after it is worse than no sentence.
    expect(withoutHost.message).not.toContain("here instead:");
    expect(withHost.message).toContain("here instead:");
  });
});

describe("the link the form will accept", () => {
  /**
   * The form deliberately does NOT require same-origin — the whole purpose is
   * to send somebody to a different host. So it is pinned to https on our own
   * root domain, at the sign-in path, and nothing else. Without that, a value
   * reaching the browser from a 401 body would be an open redirect wearing a
   * helpful sentence.
   */
  const accepted = (href: string) =>
    /^https:\/\/[a-z0-9-]+\.thejag\.org\/login$/.test(href);

  it("accepts a campus sign-in page", () => {
    expect(accepted("https://theacademyway.thejag.org/login")).toBe(true);
    expect(accepted(buildWrongDoorFailure("academy-ga.thejag.org").helpHref!)).toBe(true);
  });

  it("refuses another domain dressed up as ours", () => {
    expect(accepted("https://thejag.org.evil.com/login")).toBe(false);
    expect(accepted("https://evil.com/thejag.org/login")).toBe(false);
  });

  it("refuses anything that is not https", () => {
    expect(accepted("http://theacademyway.thejag.org/login")).toBe(false);
    expect(accepted("javascript:alert(1)")).toBe(false);
  });

  it("refuses a different path on a real campus host", () => {
    expect(accepted("https://theacademyway.thejag.org/dashboard/admin/users")).toBe(false);
    expect(accepted("https://theacademyway.thejag.org/login?next=/x")).toBe(false);
  });

  it("refuses the apex itself, which redirects straight back to /jag/login", () => {
    expect(accepted("https://thejag.org/login")).toBe(false);
  });
});

describe("the generic message still guards the thing it guards", () => {
  /**
   * Nothing here changes the failed-password path. If a future edit routes a
   * wrong PASSWORD through buildWrongDoorFailure, the login form becomes an
   * oracle for which email addresses have accounts.
   */
  it("is unchanged and still says nothing", () => {
    expect(GENERIC_JAG_AUTH_FAILURE).toBe("Invalid credentials for The JAG™ Platform.");
    expect(GENERIC_JAG_AUTH_FAILURE).not.toContain("password is correct");
    expect(GENERIC_JAG_AUTH_FAILURE).not.toContain("thejag.org");
  });
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 14 September 2026 — the guard could not name the door.
 *
 * Heather Badger-Brown, a School Leader, signed in at thejag.org with the right
 * password and got the FALLBACK wording: "ask your school's admissions office
 * for the sign-in address." She is the admissions office.
 *
 * The named-address path existed and had never once run. resolveTenantSignInHost
 * read schools.organization_id — a uuid — and asked BrandRegistry, which is
 * keyed by synthetic text ids ("org.the-academy-way"). Production held exactly
 * one brand row under that synthetic key. A uuid could never match it, so every
 * school account fell through to the vague message.
 *
 * Migration 356 adds organization_brands.org_organization_id and fills it from
 * the campuses. These tests hold the bridge, because the bug was not in either
 * side — it was that nothing crossed between them.
 * ─────────────────────────────────────────────────────────────────────────────
 */
describe("the uuid a school actually carries resolves to a brand", () => {
  const src = readFileSync(
    join(__dirname, "..", "..", "..", "src/lib/jag-platform/wrong-door.ts"),
    "utf8"
  ).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  /** THE ONE THAT MATTERS. Without this column the lookup compares namespaces. */
  it("looks the brand up by the real organization uuid", () => {
    expect(src).toContain('.eq("org_organization_id", organizationId)');
    expect(src).toContain('.from("organization_brands")');
  });

  it("tries the real uuid before the synthetic registry", () => {
    expect(src.indexOf("subdomainForRealOrganization")).toBeLessThan(
      src.indexOf("BrandRegistry.getByOrganizationId")
    );
  });

  /**
   * Before 356 the column does not exist and PostgREST answers with an error
   * and a null body. Discarding that would turn a schema gap into a silent
   * fallback — the same costume the original bug wore.
   */
  it("checks the error rather than reading data blindly", () => {
    expect(src).toMatch(/if \(error\)[\s\S]{0,140}brand lookup by organization failed/);
  });

  it("still falls back to the registry rather than throwing", () => {
    expect(src).toContain("BrandRegistry.getByOrganizationId(organizationId)");
  });

  /** A resolution failure must never become a sign-in failure. */
  it("keeps the whole path wrapped", () => {
    expect(src).toContain("brand lookup threw");
  });
});
