/**
 * Phase 65 — platform vs customer workspace navigation composition.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { BrandService } from "@/lib/platform/branding";
import { resetJagBusinessStoreForTests } from "@/lib/jag-business/store";
import { composeWorkspaceNavigation } from "@/lib/jag-command-center/navigation/compose-workspace-nav";
import {
  resolveActiveWorkspaceOrganization,
} from "@/lib/jag-platform/active-organization";
import { resolveJagWorkspaceMode } from "@/lib/jag-platform/workspace-mode";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  ChecklistService,
  clearOnboardingObservationsForTests,
  ExecutiveOnboardingService,
  TenantProvisioner,
} from "@/lib/platform/onboarding";
import { FeatureFlagService } from "@/lib/platform/tenant/FeatureFlagService";
import { TenantService } from "@/lib/platform/tenant/TenantService";
import {
  ensureCapabilitiesRegistered,
  resetCapabilitiesForTests,
} from "@/lib/platform/capabilities";

function platformSession(
  overrides: Partial<JagPlatformSession> = {}
): JagPlatformSession {
  return {
    userId: "user-academy-founder",
    email: "founder@academyway.test",
    displayName: "Academy Founder",
    role: "FOUNDER",
    authority: "platform",
    organizationId: null,
    issuedAt: new Date().toISOString(),
    exp: Date.now() + 60 * 60 * 1000,
    ...overrides,
  };
}

function provisionCustomerOrg() {
  const session = ExecutiveOnboardingService.getOrCreateSession({
    ownerUserId: "user-academy-founder",
    ownerEmail: "founder@academyway.test",
    displayName: "Academy Founder",
  });
  ExecutiveOnboardingService.completeCurrentStep(session.id);
  ExecutiveOnboardingService.updateOrganization(session.id, {
    organizationName: "The Academy Way Network of Schools",
    subdomain: "academy-way-network",
    industry: "education",
    timezone: "America/New_York",
    country: "US",
  });
  ExecutiveOnboardingService.completeCurrentStep(session.id);
  ExecutiveOnboardingService.updateBrand(session.id, {
    primaryColor: "#0C1B2A",
    accentColor: "#38BDF8",
  });
  ExecutiveOnboardingService.completeCurrentStep(session.id);
  ExecutiveOnboardingService.completeCurrentStep(session.id);
  ExecutiveOnboardingService.updateMission(session.id, {
    mission: "Serve every school with clarity.",
  });
  ExecutiveOnboardingService.completeCurrentStep(session.id);
  ExecutiveOnboardingService.completeCurrentStep(session.id);
  ExecutiveOnboardingService.completeCurrentStep(session.id);
  ExecutiveOnboardingService.completeCurrentStep(session.id);
  ExecutiveOnboardingService.completeCurrentStep(session.id);
  const generated = ExecutiveOnboardingService.generateWorkspace(
    session.id,
    "Academy Founder"
  );
  expect(generated.ok).toBe(true);
  return generated;
}

describe("Phase 65 customer workspace navigation", () => {
  beforeEach(() => {
    resetCapabilitiesForTests();
    ensureCapabilitiesRegistered();
    ExecutiveOnboardingService.resetForTests();
    clearOnboardingObservationsForTests();
    ChecklistService.resetForTests();
    BrandService.resetForTests();
    resetJagBusinessStoreForTests();
    TenantService.resetForTests();
  });

  it("A. platform context keeps platform/admin navigation", () => {
    const nav = composeWorkspaceNavigation({
      mode: "platform",
      organizationId: null,
    });
    const ids = nav.map((n) => n.id);
    expect(ids).toContain("organizations");
    expect(ids).toContain("users");
    expect(ids).toContain("domains");
    expect(ids).toContain("observability");
    expect(ids).toContain("runtime");
    expect(ids).toContain("capabilities");
  });

  it("B/C. customer context for platform founder shows customer nav only", () => {
    const generated = provisionCustomerOrg();
    if (!generated.ok) return;

    const session = platformSession({
      organizationId: generated.organizationId,
    });
    const mode = resolveJagWorkspaceMode({
      session,
      activeOrganizationId: generated.organizationId,
      workspaceParam: null,
    });
    expect(mode).toBe("customer");

    const nav = composeWorkspaceNavigation({
      mode: "customer",
      organizationId: generated.organizationId,
    });
    const ids = nav.map((n) => n.id);
    expect(ids).toContain("overview");
    expect(ids).toContain("chat");
    expect(ids).toContain("inbox");
    expect(ids).toContain("decisions");
    expect(ids).toContain("briefings");
    expect(ids).toContain("strategy");
    expect(ids).toContain("memory");
    expect(ids).toContain("settings");
    expect(ids).not.toContain("organizations");
    expect(ids).not.toContain("users");
    expect(ids).not.toContain("domains");
    expect(ids).not.toContain("capability-packs");
    expect(ids).not.toContain("knowledge");
    expect(ids).not.toContain("policies");
    expect(ids).not.toContain("intelligence-graph");
    expect(ids).not.toContain("capabilities");
    expect(ids).not.toContain("observability");
    expect(ids).not.toContain("runtime");
    expect(ids).not.toContain("onboarding");
  });

  it("D/E. Academy Way customer nav includes Listening + Listening Intelligence", () => {
    const generated = provisionCustomerOrg();
    if (!generated.ok) return;

    expect(
      FeatureFlagService.isEnabled(
        generated.organizationId,
        "jag.intelligence.listening"
      )
    ).toBe(true);

    const nav = composeWorkspaceNavigation({
      mode: "customer",
      organizationId: generated.organizationId,
    });
    const labels = nav.map((n) => n.label);
    expect(labels.some((l) => /listening/i.test(l))).toBe(true);
    expect(
      nav.filter((n) => /listening/i.test(n.label)).length
    ).toBeGreaterThanOrEqual(2);
  });

  it("F. organization capability binding drives navigation", () => {
    const generated = provisionCustomerOrg();
    if (!generated.ok) return;

    FeatureFlagService.setFlag(
      generated.organizationId,
      "jag.intelligence.scenarios",
      false,
      "test"
    );
    const nav = composeWorkspaceNavigation({
      mode: "customer",
      organizationId: generated.organizationId,
    });
    expect(nav.some((n) => /scenario/i.test(n.label))).toBe(false);
  });

  it("G. customer context with no active org fails closed (no soft-pick)", () => {
    const session = platformSession({ organizationId: null });
    const active = resolveActiveWorkspaceOrganization(session, null, {
      allowSoftPick: false,
    });
    expect(active).toBeNull();

    const nav = composeWorkspaceNavigation({
      mode: "customer",
      organizationId: null,
    });
    const ids = nav.map((n) => n.id);
    expect(ids).toEqual(["overview", "learn", "settings"]);
  });

  it("H. explicit workspace=platform restores admin mode while org remains", () => {
    const generated = provisionCustomerOrg();
    if (!generated.ok) return;
    const session = platformSession({
      organizationId: generated.organizationId,
    });
    expect(
      resolveJagWorkspaceMode({
        session,
        activeOrganizationId: generated.organizationId,
        workspaceParam: "platform",
      })
    ).toBe("platform");

    const platformNav = composeWorkspaceNavigation({
      mode: "platform",
      organizationId: generated.organizationId,
    });
    const platformIds = platformNav.map((n) => n.id);
    expect(platformIds).toContain("organizations");
    expect(platformIds).toContain("domains");
    expect(platformIds).toContain("onboarding");
  });

  it("I. /jag without workspace stays customer when org is bound", () => {
    const generated = provisionCustomerOrg();
    if (!generated.ok) return;
    const session = platformSession({
      organizationId: generated.organizationId,
    });
    const mode = resolveJagWorkspaceMode({
      session,
      activeOrganizationId: generated.organizationId,
      workspaceParam: null,
    });
    expect(mode).toBe("customer");
    const nav = composeWorkspaceNavigation({
      mode,
      organizationId: generated.organizationId,
    });
    expect(nav.map((n) => n.id)).not.toContain("organizations");
    expect(nav.some((n) => /listening/i.test(n.label))).toBe(true);
  });

  it("J. switching workspace param platform → null returns customer nav", () => {
    const generated = provisionCustomerOrg();
    if (!generated.ok) return;
    const session = platformSession({
      organizationId: generated.organizationId,
    });
    const toPlatform = resolveJagWorkspaceMode({
      session,
      activeOrganizationId: generated.organizationId,
      workspaceParam: "platform",
    });
    expect(toPlatform).toBe("platform");
    expect(
      composeWorkspaceNavigation({
        mode: toPlatform,
        organizationId: generated.organizationId,
      }).some((n) => n.id === "organizations")
    ).toBe(true);

    const back = resolveJagWorkspaceMode({
      session,
      activeOrganizationId: generated.organizationId,
      workspaceParam: null,
    });
    expect(back).toBe("customer");
    expect(
      composeWorkspaceNavigation({
        mode: back,
        organizationId: generated.organizationId,
      }).some((n) => n.id === "organizations")
    ).toBe(false);
  });

  it("K. non-platform authority cannot elevate via workspace=platform", () => {
    const generated = provisionCustomerOrg();
    if (!generated.ok) return;
    const session = platformSession({
      authority: "organization",
      role: "ORG_OWNER",
      organizationId: generated.organizationId,
    });
    const mode = resolveJagWorkspaceMode({
      session,
      activeOrganizationId: generated.organizationId,
      workspaceParam: "platform",
    });
    expect(mode).toBe("customer");
    const nav = composeWorkspaceNavigation({
      mode,
      organizationId: generated.organizationId,
    });
    expect(nav.map((n) => n.id)).not.toContain("organizations");
    expect(nav.map((n) => n.id)).not.toContain("observability");
  });

  it("binds onboarding capabilities via TenantProvisioner", () => {
    const session = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "bind-user",
      ownerEmail: "bind@example.com",
      displayName: "Bind User",
    });
    ExecutiveOnboardingService.updateOrganization(session.id, {
      organizationName: "Bind Org",
      subdomain: "bind-org",
      industry: "education",
      timezone: "UTC",
    });
    const current = ExecutiveOnboardingService.getSession(session.id)!;
    const result = TenantProvisioner.provisionTenant(
      current,
      "org.bind.test"
    );
    expect(result.enabledCapabilityIds).toContain("jag.intelligence.listening");
    expect(
      FeatureFlagService.isEnabled("org.bind.test", "jag.intelligence.listening")
    ).toBe(true);
  });
});
