/**
 * Phase 65F-H/I — bound durable org_organizations UUID resolves display identity.
 * No hard-coded Academy Way ids/names in production logic under test.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { BrandService } from "@/lib/platform/branding";
import { BrandRegistry } from "@/lib/platform/branding/BrandRegistry";
import {
  clearDurableOrganizationIdentitiesForTests,
  rememberDurableOrganizationIdentity,
} from "@/lib/jag-business/durable-organization-identity";
import {
  resolveAuthoritativeOrganizationIdentity,
  resolveOrganizationDisplayName,
} from "@/lib/jag-business/organization-display";
import {
  resetJagBusinessStoreForTests,
  saveProvisionedOrganization,
} from "@/lib/jag-business/store";
import { buildJagCommandShellModel } from "@/lib/jag-command-center/build-command-shell";
import { loadJagBrandForSession } from "@/lib/jag-command-center/branding/load-branding";
import { resolveActiveWorkspaceOrganization } from "@/lib/jag-platform/active-organization";
import { resolveJagWorkspaceMode } from "@/lib/jag-platform/workspace-mode";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  ChecklistService,
  clearOnboardingObservationsForTests,
  ExecutiveOnboardingService,
} from "@/lib/platform/onboarding";
import { TenantService } from "@/lib/platform/tenant/TenantService";
import { composeWorkspaceNavigation } from "@/lib/jag-command-center/navigation/compose-workspace-nav";

const DURABLE_ID = "11111111-2222-4333-8444-555555555555";
const DURABLE_NAME = "Contoso Learning Network";
const TEMP_ORG_STAR_ID = "org.contoso-learning.msjo798c";
const TEMP_ORG_STAR_NAME = "Contoso Learning Network of Schools";

function platformSession(
  overrides: Partial<JagPlatformSession> = {}
): JagPlatformSession {
  return {
    userId: "user-durable",
    email: "owner@example.com",
    displayName: "Owner",
    role: "FOUNDER",
    authority: "platform",
    organizationId: DURABLE_ID,
    issuedAt: new Date().toISOString(),
    exp: Date.now() + 60 * 60 * 1000,
    ...overrides,
  };
}

describe("Phase 65F durable org_organizations identity resolve", () => {
  beforeEach(() => {
    ExecutiveOnboardingService.resetForTests();
    clearOnboardingObservationsForTests();
    ChecklistService.resetForTests();
    BrandService.resetForTests();
    resetJagBusinessStoreForTests();
    TenantService.resetForTests();
    clearDurableOrganizationIdentitiesForTests();
  });

  it("A. bound durable UUID resolves org_organizations.name", () => {
    rememberDurableOrganizationIdentity({
      id: DURABLE_ID,
      name: DURABLE_NAME,
      slug: "contoso-learning",
    });
    expect(resolveOrganizationDisplayName(DURABLE_ID)).toBe(DURABLE_NAME);
    expect(resolveAuthoritativeOrganizationIdentity(DURABLE_ID).name).toBe(
      DURABLE_NAME
    );

    const active = resolveActiveWorkspaceOrganization(platformSession(), null, {
      allowSoftPick: false,
    });
    expect(active?.id).toBe(DURABLE_ID);
    expect(active?.name).toBe(DURABLE_NAME);
  });

  it("B. missing in-memory provisioned data does not yield Organization when durable exists", () => {
    resetJagBusinessStoreForTests();
    rememberDurableOrganizationIdentity({
      id: DURABLE_ID,
      name: DURABLE_NAME,
    });
    expect(resolveOrganizationDisplayName(DURABLE_ID)).toBe(DURABLE_NAME);
    expect(resolveOrganizationDisplayName(DURABLE_ID)).not.toBe("Organization");
  });

  it("C. missing brand data does not yield Organization when durable exists", () => {
    BrandRegistry.remove(DURABLE_ID);
    expect(BrandService.getBrand(DURABLE_ID)).toBeNull();
    rememberDurableOrganizationIdentity({
      id: DURABLE_ID,
      name: DURABLE_NAME,
    });
    const session = platformSession();
    const shell = buildJagCommandShellModel(session, {
      workspaceParam: null,
      preferredOrg: null,
      pathname: "/jag",
    });
    expect(shell.activeOrganizationId).toBe(DURABLE_ID);
    expect(shell.activeOrganizationLabel).toBe(DURABLE_NAME);
    expect(shell.activeOrganizationLabel).not.toBe("Organization");
  });

  it("D. org.* onboarding/provisioned id still resolves via existing path", () => {
    saveProvisionedOrganization({
      organizationId: TEMP_ORG_STAR_ID,
      organizationName: TEMP_ORG_STAR_NAME,
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
    expect(resolveOrganizationDisplayName(TEMP_ORG_STAR_ID)).toBe(
      TEMP_ORG_STAR_NAME
    );
  });

  it("E. ensureOrganization cannot overwrite durable identity with Organization", () => {
    rememberDurableOrganizationIdentity({
      id: DURABLE_ID,
      name: DURABLE_NAME,
    });
    const session = platformSession();
    loadJagBrandForSession(session, "localhost:3010", null);
    expect(BrandService.getBrand(DURABLE_ID)?.display_name).toBe(DURABLE_NAME);

    const after = BrandService.ensureOrganization(DURABLE_ID, "Organization");
    expect(after.display_name).toBe(DURABLE_NAME);
    expect(BrandService.getBrand(DURABLE_ID)?.display_name).toBe(DURABLE_NAME);
    expect(BrandService.getBrand(DURABLE_ID)?.display_name).not.toBe(
      "Organization"
    );
  });

  it("F. customer → platform → customer preserves the same durable organization ID", () => {
    rememberDurableOrganizationIdentity({
      id: DURABLE_ID,
      name: DURABLE_NAME,
    });
    const session = platformSession();

    const customer = buildJagCommandShellModel(session, {
      workspaceParam: null,
      preferredOrg: DURABLE_ID,
      pathname: "/jag",
    });
    expect(customer.workspaceMode).toBe("customer");
    expect(customer.activeOrganizationId).toBe(DURABLE_ID);

    const platform = buildJagCommandShellModel(session, {
      workspaceParam: "platform",
      preferredOrg: null,
      pathname: "/jag",
    });
    expect(platform.workspaceMode).toBe("platform");
    expect(platform.activeOrganizationId).toBe(DURABLE_ID);

    const back = buildJagCommandShellModel(session, {
      workspaceParam: null,
      preferredOrg: DURABLE_ID,
      pathname: "/jag",
    });
    expect(back.workspaceMode).toBe("customer");
    expect(back.activeOrganizationId).toBe(DURABLE_ID);
    expect(back.activeOrganizationLabel).toBe(DURABLE_NAME);
  });

  it("G. workspace=platform still requires platform authority", () => {
    rememberDurableOrganizationIdentity({
      id: DURABLE_ID,
      name: DURABLE_NAME,
    });
    const session = platformSession({
      authority: "organization",
      role: "ORG_OWNER",
    });
    const mode = resolveJagWorkspaceMode({
      session,
      activeOrganizationId: DURABLE_ID,
      workspaceParam: "platform",
    });
    expect(mode).toBe("customer");
    const nav = composeWorkspaceNavigation({
      mode,
      organizationId: DURABLE_ID,
    });
    expect(nav.map((n) => n.id)).not.toContain("organizations");
  });

  it("H. new logic has no hard-coded Academy Way name dependency", () => {
    // Resolver must accept any durable name primed from org_organizations.
    rememberDurableOrganizationIdentity({
      id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      name: "Northwind Education Cooperative",
    });
    expect(
      resolveOrganizationDisplayName("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
    ).toBe("Northwind Education Cooperative");
  });

  it("rejects caching generic Organization as durable identity", () => {
    const remembered = rememberDurableOrganizationIdentity({
      id: DURABLE_ID,
      name: "Organization",
    });
    expect(remembered).toBeNull();
    expect(resolveOrganizationDisplayName(DURABLE_ID)).toBe("Organization");
  });
});
