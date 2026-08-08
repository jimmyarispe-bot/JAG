/**
 * Phase 59 — focused regression for the onboarding state-race fix.
 * Mirrors the browser workflow at the service + merge layer.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { BrandService } from "@/lib/platform/branding";
import {
  findOrganizationByFounderEmail,
  listProvisionedOrganizations,
  resetJagBusinessStoreForTests,
} from "@/lib/jag-business/store";
import {
  ChecklistService,
  clearOnboardingObservationsForTests,
  ExecutiveOnboardingService,
  applyOnboardingSessionUpdate,
  readOnboardingSessionFromStorage,
  writeOnboardingSessionToStorage,
  type OnboardingSession,
} from "@/lib/platform/onboarding";

function completeThrough(
  sessionId: string,
  steps: readonly OnboardingSession["currentStep"][]
) {
  for (const step of steps) {
    const current = ExecutiveOnboardingService.getSession(sessionId)!;
    if (current.currentStep !== step) {
      const nav = ExecutiveOnboardingService.goToStep(sessionId, step);
      expect(nav.ok, `nav ${step}: ${nav.error}`).toBe(true);
    }
    const result = ExecutiveOnboardingService.completeCurrentStep(sessionId);
    expect(result.ok, `complete ${step}: ${result.error}`).toBe(true);
  }
}

describe("Phase 59 onboarding regression workflow", () => {
  beforeEach(() => {
    ExecutiveOnboardingService.resetForTests();
    clearOnboardingObservationsForTests();
    ChecklistService.resetForTests();
    BrandService.resetForTests();
    resetJagBusinessStoreForTests();
  });

  it("preserves values across forward/back navigation, refresh, and stale save races", () => {
    const owner = {
      ownerUserId: "phase59-user",
      ownerEmail: "phase59@example.com",
      displayName: "Phase FiftyNine",
    };
    let session = ExecutiveOnboardingService.getOrCreateSession(owner);
    const sessionId = session.id;

    // 1–2 Organization
    completeThrough(sessionId, ["welcome"]);
    ExecutiveOnboardingService.updateOrganization(sessionId, {
      organizationName: "Phase59 Org",
      subdomain: "phase59-org",
      industry: "education",
      timezone: "America/Chicago",
      logoUrl: "https://cdn.example/p59.svg",
    });
    session = ExecutiveOnboardingService.getSession(sessionId)!;
    expect(session.currentStep).toBe("organization");
    expect(session.organization.organizationName).toBe("Phase59 Org");

    // 3–4 Brand
    expect(ExecutiveOnboardingService.completeCurrentStep(sessionId).ok).toBe(
      true
    );
    ExecutiveOnboardingService.updateBrand(sessionId, {
      primaryColor: "#112233",
      accentColor: "#445566",
      headingFont: "Source Serif 4",
    });
    session = ExecutiveOnboardingService.getSession(sessionId)!;
    expect(session.currentStep).toBe("brand");

    // 5–6 Executive profile
    expect(ExecutiveOnboardingService.completeCurrentStep(sessionId).ok).toBe(
      true
    );
    ExecutiveOnboardingService.updateExecutives(sessionId, [
      {
        id: "exec.founder.phase59",
        name: "Phase FiftyNine",
        role: "founder",
        email: "phase59@example.com",
        title: "Founder",
      },
      {
        id: "exec.ceo.phase59",
        name: "Casey CEO",
        role: "ceo",
        email: "ceo@phase59.test",
        title: "CEO",
      },
    ]);
    session = ExecutiveOnboardingService.getSession(sessionId)!;
    expect(session.currentStep).toBe("executive_profile");
    expect(session.executives).toHaveLength(2);

    // 7–8 Mission
    expect(ExecutiveOnboardingService.completeCurrentStep(sessionId).ok).toBe(
      true
    );
    ExecutiveOnboardingService.updateMission(sessionId, {
      mission: "Deliver executive clarity.",
      vision: "Every org has a twin.",
      goals: ["Launch", "Listen"],
    });
    session = ExecutiveOnboardingService.getSession(sessionId)!;
    expect(session.currentStep).toBe("mission_strategy");
    expect(session.mission.mission).toBe("Deliver executive clarity.");

    // Capture "stale" org save as of organization step (race simulation later).
    const staleOrgSave: OnboardingSession = {
      ...session,
      currentStep: "organization",
      updatedAt: new Date(Date.parse(session.updatedAt) - 5_000).toISOString(),
      organization: {
        ...session.organization,
        organizationName: "", // wiped sibling field signature
      },
    };

    // 9–10 Navigate back to Organization — values intact
    const back = ExecutiveOnboardingService.goToStep(sessionId, "organization");
    expect(back.ok).toBe(true);
    session = ExecutiveOnboardingService.getSession(sessionId)!;
    expect(session.currentStep).toBe("organization");
    expect(session.organization.organizationName).toBe("Phase59 Org");
    expect(session.organization.subdomain).toBe("phase59-org");
    expect(session.organization.timezone).toBe("America/Chicago");

    // 11–12 Forward again — all prior values intact
    for (const step of [
      "organization",
      "brand",
      "executive_profile",
      "mission_strategy",
    ] as const) {
      const nav = ExecutiveOnboardingService.goToStep(sessionId, step);
      expect(nav.ok).toBe(true);
    }
    session = ExecutiveOnboardingService.getSession(sessionId)!;
    expect(session.organization.organizationName).toBe("Phase59 Org");
    expect(session.brand.primaryColor).toBe("#112233");
    expect(session.executives).toHaveLength(2);
    expect(session.mission.mission).toBe("Deliver executive clarity.");

    // 13–14 Refresh via sessionStorage restore
    const memory: Record<string, string> = {};
    const fakeStorage = {
      getItem: (k: string) => memory[k] ?? null,
      setItem: (k: string, v: string) => {
        memory[k] = v;
      },
    };
    writeOnboardingSessionToStorage(fakeStorage, session);
    ExecutiveOnboardingService.resetForTests();
    expect(
      ExecutiveOnboardingService.getSessionForOwner(owner.ownerUserId)
    ).toBeNull();
    const fromStorage = readOnboardingSessionFromStorage(
      fakeStorage,
      owner.ownerUserId
    );
    expect(fromStorage?.organization.organizationName).toBe("Phase59 Org");
    const restored = ExecutiveOnboardingService.restoreFromClientSnapshot(
      { ownerUserId: owner.ownerUserId, ownerEmail: owner.ownerEmail },
      fromStorage!
    );
    expect(restored?.currentStep).toBe("mission_strategy");
    expect(restored?.organization.organizationName).toBe("Phase59 Org");
    expect(restored?.id).toBe(sessionId);

    // 15–16 Rapid continue while stale field-save returns — no jump back
    session = ExecutiveOnboardingService.getSession(sessionId)!;
    const afterNav = {
      ...session,
      currentStep: "capabilities" as const,
      updatedAt: new Date().toISOString(),
    };
    const merged = applyOnboardingSessionUpdate(afterNav, {
      kind: "field_save",
      session: staleOrgSave,
    });
    expect(merged.currentStep).toBe("capabilities");
    expect(merged.organization.organizationName).toBe("Phase59 Org");
    expect(merged.organization.organizationName).not.toBe("");

    // Continue remaining steps and generate once
    ExecutiveOnboardingService.goToStep(sessionId, "mission_strategy");
    completeThrough(sessionId, [
      "mission_strategy",
      "capabilities",
      "connect_systems",
      "review",
    ]);
    const generated = ExecutiveOnboardingService.generateWorkspace(
      sessionId,
      "Phase FiftyNine"
    );
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;

    // 17 No org-name validation after name was set / on activity trail
    expect(generated.session.lastError).toBeNull();
    const observations = ExecutiveOnboardingService.observations(sessionId, 50);
    const failuresAfterNamed = observations.filter(
      (o) =>
        o.kind === "validation_failure" &&
        o.detail === "Organization name is required."
    );
    // With this workflow we never complete organization without a name.
    expect(failuresAfterNamed).toHaveLength(0);

    // 18–19 Exactly one org; stable id
    const orgs = listProvisionedOrganizations();
    expect(orgs).toHaveLength(1);
    expect(orgs[0]?.organizationId).toBe(generated.organizationId);
    expect(generated.session.organizationId).toBe(generated.organizationId);
    expect(
      findOrganizationByFounderEmail(owner.ownerEmail)?.organizationId
    ).toBe(generated.organizationId);

    // Resume provision path must reuse the same org (no duplicate).
    const reused = findOrganizationByFounderEmail(owner.ownerEmail)!;
    expect(listProvisionedOrganizations()).toHaveLength(1);
    expect(reused.organizationId).toBe(generated.organizationId);
  });
});
