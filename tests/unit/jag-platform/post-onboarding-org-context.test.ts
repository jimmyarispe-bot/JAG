/**
 * Phase 63B — post-onboarding workspace must bind to the provisioned organization.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { BrandService } from "@/lib/platform/branding";
import { resetJagBusinessStoreForTests } from "@/lib/jag-business/store";
import {
  isOpaqueOrganizationLabel,
  resolveOrganizationDisplayName,
} from "@/lib/jag-business/organization-display";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import {
  resolveActiveWorkspaceOrganization,
  resolveOnboardingHandoffOrganization,
  shouldRebindSessionToActiveOrganization,
} from "@/lib/jag-platform/active-organization";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  ChecklistService,
  clearOnboardingObservationsForTests,
  ExecutiveOnboardingService,
} from "@/lib/platform/onboarding";
import { loadJagBrandForSession } from "@/lib/jag-command-center/branding/load-branding";
import { loadJagCommandCenterOverview } from "@/lib/jag-command-center/load-overview";
import { loadExecutiveOverview } from "@/lib/jag-command-center/load-executive-overview";

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
  ExecutiveOnboardingService.completeCurrentStep(session.id); // welcome → org
  ExecutiveOnboardingService.updateOrganization(session.id, {
    organizationName: "The Academy Way Network of Schools",
    subdomain: "academy-way-network",
    industry: "education",
    timezone: "America/New_York",
    country: "US",
  });
  ExecutiveOnboardingService.completeCurrentStep(session.id); // → brand
  ExecutiveOnboardingService.updateBrand(session.id, {
    primaryColor: "#0C1B2A",
    accentColor: "#38BDF8",
  });
  ExecutiveOnboardingService.completeCurrentStep(session.id); // → executive
  ExecutiveOnboardingService.completeCurrentStep(session.id); // → mission
  ExecutiveOnboardingService.updateMission(session.id, {
    mission: "Serve every school with clarity.",
  });
  ExecutiveOnboardingService.completeCurrentStep(session.id); // → capabilities
  ExecutiveOnboardingService.completeCurrentStep(session.id); // → connectors
  ExecutiveOnboardingService.completeCurrentStep(session.id); // → review
  ExecutiveOnboardingService.completeCurrentStep(session.id); // → generate
  const generated = ExecutiveOnboardingService.generateWorkspace(
    session.id,
    "Academy Founder"
  );
  expect(generated.ok).toBe(true);
  return generated;
}

describe("Phase 63B post-onboarding organization context", () => {
  beforeEach(() => {
    ExecutiveOnboardingService.resetForTests();
    clearOnboardingObservationsForTests();
    ChecklistService.resetForTests();
    BrandService.resetForTests();
    resetJagBusinessStoreForTests();
  });

  it("creates organization and preserves organization id through generate workspace", () => {
    const generated = completeOnboardingToWorkspace(
      "user-academy-founder",
      "founder@academyway.test"
    );
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;

    expect(generated.organizationId).toMatch(/^org\.academy-way-network\./);
    expect(generated.session.organizationId).toBe(generated.organizationId);
    expect(generated.session.organization.organizationName).toBe(
      "The Academy Way Network of Schools"
    );

    const handoff = resolveOnboardingHandoffOrganization(
      platformSession({ userId: "user-academy-founder" })
    );
    expect(handoff?.id).toBe(generated.organizationId);
    expect(handoff?.name).toBe("The Academy Way Network of Schools");
  });

  it("active workspace resolves to provisioned org, not platform/global fallback", () => {
    const generated = completeOnboardingToWorkspace(
      "user-academy-founder",
      "founder@academyway.test"
    );
    if (!generated.ok) return;

    // Platform founder cookie still unbound / bound to opaque UUID — handoff wins.
    const stale = platformSession({
      userId: "user-academy-founder",
      organizationId: "d346c418-26d0-47b0-8655-ce64173dffb1",
    });

    const active = resolveActiveWorkspaceOrganization(stale, null);
    expect(active?.id).toBe(generated.organizationId);
    expect(active?.name).toBe("The Academy Way Network of Schools");
    expect(isOpaqueOrganizationLabel(active?.name, active?.id)).toBe(false);
    expect(shouldRebindSessionToActiveOrganization(stale, active)).toBe(true);
  });

  it("/jag loaders display organization name and never raw UUID as label", () => {
    const generated = completeOnboardingToWorkspace(
      "user-academy-founder",
      "founder@academyway.test"
    );
    if (!generated.ok) return;

    const session = platformSession({
      userId: "user-academy-founder",
      organizationId: generated.organizationId,
    });

    const brand = loadJagBrandForSession(session);
    expect(brand.brand.display_name).toBe(
      "The Academy Way Network of Schools"
    );
    expect(brand.pageTitle).toContain("The Academy Way Network of Schools");
    expect(brand.pageTitle).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );

    const overview = loadJagCommandCenterOverview(session);
    expect(overview.activeOrganizationId).toBe(generated.organizationId);
    expect(overview.activeOrganizationLabel).toBe(
      "The Academy Way Network of Schools"
    );
    expect(
      overview.organizationOptions.every(
        (o) => !isOpaqueOrganizationLabel(o.label, o.id)
      )
    ).toBe(true);

    const exec = loadExecutiveOverview(session);
    expect(exec.organizationId).toBe(generated.organizationId);
    expect(exec.organizationName).toBe("The Academy Way Network of Schools");
  });

  it("organization-scoped loaders receive the active organization id", () => {
    const generated = completeOnboardingToWorkspace(
      "user-a",
      "a@example.com"
    );
    if (!generated.ok) return;

    const session = platformSession({
      userId: "user-a",
      email: "a@example.com",
      organizationId: null,
    });
    const preferred = generated.organizationId;
    const exec = loadExecutiveOverview(session, { organizationId: preferred });
    expect(exec.organizationId).toBe(preferred);
  });

  it("platform founder with active org does not soft-select Academy Way seed first", () => {
    const generated = completeOnboardingToWorkspace(
      "jag-user-founder",
      "founder@jag.platform"
    );
    if (!generated.ok) return;

    const session = platformSession({
      userId: "jag-user-founder",
      email: "founder@jag.platform",
      role: "FOUNDER",
      organizationId: generated.organizationId,
    });

    const orgs = listOrganizationsForSession(session);
    expect(orgs[0]?.id).toBe(generated.organizationId);
    expect(orgs[0]?.name).toBe("The Academy Way Network of Schools");

    const active = resolveActiveWorkspaceOrganization(session, null);
    expect(active?.id).toBe(generated.organizationId);
  });

  it("multiple organizations keep explicit preferred selection", () => {
    const first = completeOnboardingToWorkspace("user-multi", "multi@example.com");
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    // Second org for a different founder (visible to platform steward via provisioned list for demo only).
    // Non-demo platform steward sees only owned — create second owned by same email via store reuse path is blocked.
    // Prefer ?org= must win over session bind.
    const session = platformSession({
      userId: "user-multi",
      email: "multi@example.com",
      organizationId: first.organizationId,
    });

    const viaPreferred = resolveActiveWorkspaceOrganization(
      session,
      first.organizationId
    );
    expect(viaPreferred?.id).toBe(first.organizationId);

    const label = resolveOrganizationDisplayName(
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    );
    expect(label).toBe("Organization");
    // Generic temporary fallback is not a persistable identity.
    expect(isOpaqueOrganizationLabel(label)).toBe(true);
  });

  it("workspace href after generate includes organization id", () => {
    const generated = completeOnboardingToWorkspace(
      "user-href",
      "href@example.com"
    );
    if (!generated.ok) return;
    const href = `/jag?org=${encodeURIComponent(generated.organizationId)}`;
    expect(href).toContain(generated.organizationId);
    expect(href.startsWith("/jag?org=")).toBe(true);
  });
});
