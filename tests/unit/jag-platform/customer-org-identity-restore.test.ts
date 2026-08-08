/**
 * Phase 65F-C — restore customer organization identity when volatile
 * provisioned/brand caches are empty but authoritative onboarding identity exists.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { BrandService } from "@/lib/platform/branding";
import { BrandRegistry } from "@/lib/platform/branding/BrandRegistry";
import {
  getProvisionedOrganization,
  resetJagBusinessStoreForTests,
  saveProvisionedOrganization,
} from "@/lib/jag-business/store";
import { clearDurableOrganizationIdentitiesForTests } from "@/lib/jag-business/durable-organization-identity";
import {
  isAuthoritativeOrganizationLabel,
  resolveOrganizationDisplayName,
} from "@/lib/jag-business/organization-display";
import { buildJagCommandShellModel } from "@/lib/jag-command-center/build-command-shell";
import { loadJagBrandForSession } from "@/lib/jag-command-center/branding/load-branding";
import {
  resolveActiveWorkspaceOrganization,
  shouldRebindSessionToActiveOrganization,
} from "@/lib/jag-platform/active-organization";
import { resolveJagWorkspaceMode } from "@/lib/jag-platform/workspace-mode";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  ChecklistService,
  clearOnboardingObservationsForTests,
  ExecutiveOnboardingService,
} from "@/lib/platform/onboarding";
import { TenantService } from "@/lib/platform/tenant/TenantService";
import { composeWorkspaceNavigation } from "@/lib/jag-command-center/navigation/compose-workspace-nav";

const AUTH_NAME = "The Academy Way Network of Schools";

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

function completeOnboardingToWorkspace(ownerUserId: string, ownerEmail: string) {
  const session = ExecutiveOnboardingService.getOrCreateSession({
    ownerUserId,
    ownerEmail,
    displayName: "Academy Founder",
  });
  ExecutiveOnboardingService.completeCurrentStep(session.id);
  ExecutiveOnboardingService.updateOrganization(session.id, {
    organizationName: AUTH_NAME,
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

/** Simulate volatile cache wipe while onboarding identity remains. */
function clearVolatileOrgCaches(organizationId: string) {
  resetJagBusinessStoreForTests();
  BrandRegistry.remove(organizationId);
  expect(getProvisionedOrganization(organizationId)).toBeUndefined();
  expect(BrandService.getBrand(organizationId)).toBeNull();
}

describe("Phase 65F-C customer organization identity restore", () => {
  beforeEach(() => {
    ExecutiveOnboardingService.resetForTests();
    clearOnboardingObservationsForTests();
    ChecklistService.resetForTests();
    BrandService.resetForTests();
    resetJagBusinessStoreForTests();
    TenantService.resetForTests();
    clearDurableOrganizationIdentitiesForTests();
  });

  it("A. bound customer organization with valid persisted identity resolves correct name", () => {
    const generated = completeOnboardingToWorkspace(
      "user-academy-founder",
      "founder@academyway.test"
    );
    if (!generated.ok) return;
    const session = platformSession({
      organizationId: generated.organizationId,
    });
    const active = resolveActiveWorkspaceOrganization(session, null, {
      allowSoftPick: false,
    });
    expect(active?.id).toBe(generated.organizationId);
    expect(active?.name).toBe(AUTH_NAME);
    expect(resolveOrganizationDisplayName(generated.organizationId)).toBe(
      AUTH_NAME
    );
  });

  it("B. empty in-memory provisioned cache + authoritative onboarding still resolves name", () => {
    const generated = completeOnboardingToWorkspace(
      "user-academy-founder",
      "founder@academyway.test"
    );
    if (!generated.ok) return;
    clearVolatileOrgCaches(generated.organizationId);

    const session = platformSession({
      organizationId: generated.organizationId,
    });
    const active = resolveActiveWorkspaceOrganization(session, null, {
      allowSoftPick: false,
    });
    expect(active?.id).toBe(generated.organizationId);
    expect(active?.name).toBe(AUTH_NAME);
    expect(active?.name).not.toBe("Organization");
  });

  it("C. missing display cache does not resolve to or persist Organization when authoritative identity exists", () => {
    const generated = completeOnboardingToWorkspace(
      "user-academy-founder",
      "founder@academyway.test"
    );
    if (!generated.ok) return;
    clearVolatileOrgCaches(generated.organizationId);

    const session = platformSession({
      organizationId: generated.organizationId,
    });
    const name = resolveOrganizationDisplayName(generated.organizationId);
    expect(name).toBe(AUTH_NAME);
    expect(name).not.toBe("Organization");

    const loaded = loadJagBrandForSession(session, "localhost:3010", null);
    expect(loaded.brand.display_name).toBe(AUTH_NAME);
    expect(BrandService.getBrand(generated.organizationId)?.display_name).toBe(
      AUTH_NAME
    );
    expect(
      BrandService.getBrand(generated.organizationId)?.display_name
    ).not.toBe("Organization");
  });

  it("exact bug: provisioned+brand empty, onboarding present — ensureOrganization must not freeze Organization", () => {
    const generated = completeOnboardingToWorkspace(
      "user-academy-founder",
      "founder@academyway.test"
    );
    if (!generated.ok) return;
    const boundId = generated.organizationId!;
    clearVolatileOrgCaches(boundId);

    // Pre-seed a frozen generic brand (legacy bug residue).
    BrandRegistry.upsert({
      ...BrandService.resolveForRequest({}),
      organization_id: boundId,
      display_name: "Organization",
      organization_name: "Organization",
      subdomain: "tmp",
    });

    const session = platformSession({ organizationId: boundId });
    const active = resolveActiveWorkspaceOrganization(session, null, {
      allowSoftPick: false,
    });
    expect(active?.id).toBe(boundId);
    expect(active?.name).toBe(AUTH_NAME);
    expect(active?.name).not.toBe("Organization");

    loadJagBrandForSession(session, "localhost:3010", null);
    expect(BrandService.getBrand(boundId)?.display_name).toBe(AUTH_NAME);

    // ensureOrganization with generic must not overwrite recovered identity.
    const after = BrandService.ensureOrganization(boundId, "Organization");
    expect(after.display_name).toBe(AUTH_NAME);
    expect(BrandService.getBrand(boundId)?.display_name).toBe(AUTH_NAME);
  });

  it("D. customer → platform → customer keeps organization ID unchanged", () => {
    const generated = completeOnboardingToWorkspace(
      "user-academy-founder",
      "founder@academyway.test"
    );
    if (!generated.ok) return;
    const session = platformSession({
      organizationId: generated.organizationId,
    });

    const customer = buildJagCommandShellModel(session, {
      workspaceParam: null,
      preferredOrg: null,
      pathname: "/jag",
    });
    expect(customer.workspaceMode).toBe("customer");
    expect(customer.activeOrganizationId).toBe(generated.organizationId);
    expect(customer.activeOrganizationLabel).toBe(AUTH_NAME);

    const platform = buildJagCommandShellModel(session, {
      workspaceParam: "platform",
      preferredOrg: null,
      pathname: "/jag",
    });
    expect(platform.workspaceMode).toBe("platform");
    expect(platform.activeOrganizationId).toBe(generated.organizationId);
    expect(platform.activeOrganizationLabel).toBe(AUTH_NAME);

    const back = buildJagCommandShellModel(session, {
      workspaceParam: null,
      preferredOrg: null,
      pathname: "/jag",
    });
    expect(back.workspaceMode).toBe("customer");
    expect(back.activeOrganizationId).toBe(generated.organizationId);
    expect(back.activeOrganizationLabel).toBe(AUTH_NAME);
  });

  it("E. hard refresh after platform mode keeps customer organization identity", () => {
    const generated = completeOnboardingToWorkspace(
      "user-academy-founder",
      "founder@academyway.test"
    );
    if (!generated.ok) return;
    const session = platformSession({
      organizationId: generated.organizationId,
      organizationDisplayName: AUTH_NAME,
    });

    // Simulate refresh: same bound session, no query params, caches wiped.
    clearVolatileOrgCaches(generated.organizationId!);
    const refreshed = buildJagCommandShellModel(session, {
      workspaceParam: null,
      preferredOrg: null,
      pathname: "/jag",
    });
    expect(refreshed.workspaceMode).toBe("customer");
    expect(refreshed.activeOrganizationId).toBe(generated.organizationId);
    expect(refreshed.activeOrganizationLabel).toBe(AUTH_NAME);
    expect(
      isAuthoritativeOrganizationLabel(
        refreshed.activeOrganizationLabel,
        refreshed.activeOrganizationId
      )
    ).toBe(true);
  });

  it("F. non-platform user cannot elevate to platform mode", () => {
    const generated = completeOnboardingToWorkspace(
      "user-org-op",
      "operator@example.com"
    );
    if (!generated.ok) return;
    const session = platformSession({
      userId: "user-org-op",
      email: "operator@example.com",
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

  it("stamps cookie rebind when display name recovered for same bound id", () => {
    const generated = completeOnboardingToWorkspace(
      "user-academy-founder",
      "founder@academyway.test"
    );
    if (!generated.ok) return;
    clearVolatileOrgCaches(generated.organizationId!);
    const session = platformSession({
      organizationId: generated.organizationId,
      organizationDisplayName: null,
    });
    const active = resolveActiveWorkspaceOrganization(session, null);
    expect(active?.name).toBe(AUTH_NAME);
    expect(shouldRebindSessionToActiveOrganization(session, active)).toBe(true);
  });

  it("session organizationDisplayName survives without provisioned/brand caches", () => {
    const orgId = "org.academy-way-network.survive1";
    saveProvisionedOrganization({
      organizationId: orgId,
      organizationName: AUTH_NAME,
      industry: "education",
      country: "US",
      timeZone: "UTC",
      founder: {
        userId: "u1",
        firstName: "A",
        lastName: "B",
        email: "a@example.com",
        password: "x",
      },
      subscription: { planId: "pilot", planName: "Pilot", status: "pilot" },
      workspace: { workspaceId: "w1", name: "W" },
      createdAt: new Date().toISOString(),
      settings: { locale: "en-US", productAvailability: "academyos_only" },
    });
    resetJagBusinessStoreForTests();
    BrandService.resetForTests();

    const session = platformSession({
      organizationId: orgId,
      organizationDisplayName: AUTH_NAME,
    });
    const active = resolveActiveWorkspaceOrganization(session, null, {
      allowSoftPick: false,
    });
    expect(active?.id).toBe(orgId);
    expect(active?.name).toBe(AUTH_NAME);
  });
});
