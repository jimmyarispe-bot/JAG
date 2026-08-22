/**
 * JAG Global Search — authorization + behavior.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { buildAuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import { permissionsForMappedRole } from "@/lib/platform/identity/permission-groups";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  applyJagSearchFinanceGate,
  sanitizeJagSearchQuery,
  searchJagGlobal,
  toJagSearchResult,
} from "@/lib/jag-command-center/global-search";
import type { JagSearchItem } from "@/lib/jag-command-center/search-filter";
import {
  resetBriefingStoreForTests,
  resetDecisionExecutionStoreForTests,
  resetDecisionStatusStoreForTests,
  resetJagIntelligenceStoreForTests,
} from "@/lib/jag-command-center";

function session(
  overrides: Partial<JagPlatformSession> = {}
): JagPlatformSession {
  return {
    userId: "jag-search-user",
    email: "founder@jag.platform",
    displayName: "JAG Founder",
    role: "FOUNDER",
    authority: "platform",
    organizationId: null,
    issuedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("JAG global search", () => {
  beforeEach(() => {
    resetJagIntelligenceStoreForTests();
    resetDecisionStatusStoreForTests();
    resetDecisionExecutionStoreForTests();
    resetBriefingStoreForTests();
  });

  it("allows FOUNDER with JAG_ACCESS to search JAG content", () => {
    const keys = permissionsForMappedRole("FOUNDER");
    expect(keys).toContain("JAG_ACCESS");
    const authz = buildAuthzSnapshot("u-founder", ["FOUNDER"]);
    const result = searchJagGlobal({
      session: session({ role: "FOUNDER", authority: "platform" }),
      query: "decision",
      authz,
      workspaceMode: "platform",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results.every((r) => r.href.startsWith("/jag"))).toBe(true);
  });

  it("allows JAG_ORG_ACCESS user where policy permits (customer mode)", () => {
    const authz = buildAuthzSnapshot("u-org", ["JAG_ORG_ADMIN"]);
    expect(permissionsForMappedRole("JAG_ORG_ADMIN")).toContain(
      "JAG_ORG_ACCESS"
    );
    const result = searchJagGlobal({
      session: session({
        role: "ORG_OWNER",
        authority: "organization",
        organizationId: "org-customer-1",
        email: "admin@customer.example",
      }),
      query: "",
      authz,
      workspaceMode: "customer",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Customer mode must not leak platform-only org directory.
    expect(result.results.every((r) => r.type !== "organization")).toBe(true);
    expect(result.results.every((r) => r.href.startsWith("/jag"))).toBe(true);
  });

  it("denies callers without a JAG session", () => {
    const result = searchJagGlobal({
      session: null,
      query: "strategy",
      authz: buildAuthzSnapshot("u-aos", ["TEAM_MEMBER"]),
    });
    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });

  it("denies AcademyOS-only authz even if a session object is present", () => {
    const authz = buildAuthzSnapshot("u-danni", ["TEAM_MEMBER"]);
    expect(permissionsForMappedRole("TEAM_MEMBER")).not.toContain(
      "JAG_ORG_ACCESS"
    );
    expect(permissionsForMappedRole("TEAM_MEMBER")).not.toContain("JAG_ACCESS");
    const result = searchJagGlobal({
      session: session({
        role: "ORG_OWNER",
        authority: "organization",
        organizationId: "org-1",
      }),
      query: "decision",
      authz,
    });
    expect(result).toEqual({ ok: false, error: "unauthorized" });
  });

  it("does not return unauthorized financial content", () => {
    const financeItem: JagSearchItem = {
      id: "finance:leak",
      kind: "navigation",
      title: "Payroll",
      subtitle: "Finance",
      href: "/dashboard/finance?view=payroll",
    };
    const safeItem: JagSearchItem = {
      id: "nav:strategy",
      kind: "navigation",
      title: "Strategy",
      subtitle: "Navigate",
      href: "/jag/strategy",
    };
    const withoutFinance = applyJagSearchFinanceGate(
      [financeItem, safeItem],
      buildAuthzSnapshot("u-no-finance", ["JAG_ORG_ADMIN"])
    );
    expect(withoutFinance.map((i) => i.id)).toEqual(["nav:strategy"]);

    const withFinance = applyJagSearchFinanceGate(
      [financeItem, safeItem],
      buildAuthzSnapshot("u-finance", ["FOUNDER"])
    );
    expect(withFinance.map((i) => i.id)).toContain("finance:leak");
  });

  it("handles empty query safely (nav defaults, no throw)", () => {
    const result = searchJagGlobal({
      session: session(),
      query: "   ",
      authz: buildAuthzSnapshot("u-founder", ["FOUNDER"]),
      workspaceMode: "platform",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query).toBe("");
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results.every((r) => r.type === "navigation")).toBe(true);
  });

  it("returns empty results for a no-match query", () => {
    const result = searchJagGlobal({
      session: session(),
      query: "zzznomatch-query-xyz",
      authz: buildAuthzSnapshot("u-founder", ["FOUNDER"]),
      workspaceMode: "platform",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results).toEqual([]);
    expect(result.groups).toEqual([]);
  });

  it("rejects oversized/invalid queries without leaking data", () => {
    expect(sanitizeJagSearchQuery("a".repeat(200))).toBeNull();
    const result = searchJagGlobal({
      session: session(),
      query: "a".repeat(200),
      authz: buildAuthzSnapshot("u-founder", ["FOUNDER"]),
    });
    expect(result).toEqual({ ok: false, error: "invalid_query" });
  });

  it("normalizes results without sensitive payload fields", () => {
    const item: JagSearchItem = {
      id: "goal:strategy",
      kind: "goal",
      title: "Strategic goals",
      subtitle: "Strategy · goals",
      href: "/jag/strategy",
    };
    const normalized = toJagSearchResult(item);
    expect(normalized).toEqual({
      id: "goal:strategy",
      title: "Strategic goals",
      type: "goal",
      domain: "Strategy",
      href: "/jag/strategy",
      description: "Strategy · goals",
    });
    expect(Object.keys(normalized).sort()).toEqual(
      ["description", "domain", "href", "id", "title", "type"].sort()
    );
  });
});
