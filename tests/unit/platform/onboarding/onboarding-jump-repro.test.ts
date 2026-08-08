/**
 * Phase 60B — exact browser jump sequences must not regress currentStep.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  applyOnboardingSessionUpdate,
  ExecutiveOnboardingService,
  mergeFieldSaveIntoSession,
  type OnboardingSession,
} from "@/lib/platform/onboarding";
import { createEmptySession } from "@/lib/platform/onboarding/defaults";
import {
  ChecklistService,
  clearOnboardingObservationsForTests,
} from "@/lib/platform/onboarding";
import { BrandService } from "@/lib/platform/branding";
import { resetJagBusinessStoreForTests } from "@/lib/jag-business/store";

describe("Phase 60B onboarding step regression fix", () => {
  beforeEach(() => {
    ExecutiveOnboardingService.resetForTests();
    clearOnboardingObservationsForTests();
    ChecklistService.resetForTests();
    BrandService.resetForTests();
    resetJagBusinessStoreForTests();
  });

  it("Organization save after Continue must leave client on Brand", () => {
    // 1. Client on Organization
    let local: OnboardingSession = {
      ...createEmptySession({
        ownerUserId: "u-race",
        ownerEmail: "race@example.com",
        displayName: "Race",
      }),
      status: "in_progress",
      currentStep: "organization",
      completedSteps: ["welcome"],
      organization: {
        organizationName: "Race Org",
        subdomain: "race-org",
        industry: "education",
        timezone: "UTC",
        logoUrl: "",
        country: "US",
      },
      updatedAt: "2026-08-08T02:00:00.000Z",
    };

    // 2–3. Continue resolves first → Brand
    const continueResponse: OnboardingSession = {
      ...local,
      currentStep: "brand",
      completedSteps: ["welcome", "organization"],
      updatedAt: "2026-08-08T02:00:01.000Z",
    };
    local = applyOnboardingSessionUpdate(local, {
      kind: "navigation",
      session: continueResponse,
      requestedStep: "brand",
    });
    expect(local.currentStep).toBe("brand");

    // 4–6. Older Organization save resolves afterward (NEWER clock, OLDER step)
    const lateOrgSave: OnboardingSession = {
      ...local,
      currentStep: "organization",
      completedSteps: ["welcome"],
      updatedAt: "2026-08-08T02:00:05.000Z",
      organization: {
        ...local.organization,
        organizationName: "Race Org",
        subdomain: "race-org",
      },
    };
    local = applyOnboardingSessionUpdate(local, {
      kind: "field_save",
      session: lateOrgSave,
    });

    // 7–9
    expect(local.currentStep).toBe("brand");
    expect(local.organization.organizationName).toBe("Race Org");
    expect(local.organization.subdomain).toBe("race-org");
    expect(local.currentStep).not.toBe("welcome");
    expect(local.currentStep).not.toBe("organization");
  });

  it("field save after explicit Back must keep the requested step", () => {
    let local: OnboardingSession = {
      ...createEmptySession({
        ownerUserId: "u-back",
        ownerEmail: "back@example.com",
      }),
      status: "in_progress",
      currentStep: "mission_strategy",
      completedSteps: [
        "welcome",
        "organization",
        "brand",
        "executive_profile",
      ],
      mission: {
        mission: "Clarity",
        vision: "Scale",
        coreValues: [],
        strategicPillars: [],
        goals: [],
      },
      updatedAt: "2026-08-08T03:00:00.000Z",
    };

    // Back → executive_profile
    local = applyOnboardingSessionUpdate(local, {
      kind: "navigation",
      session: { ...local, currentStep: "executive_profile" },
      requestedStep: "executive_profile",
    });
    expect(local.currentStep).toBe("executive_profile");

    // In-flight mission field save resolves with mission_strategy step
    local = applyOnboardingSessionUpdate(local, {
      kind: "field_save",
      session: {
        ...local,
        currentStep: "mission_strategy",
        updatedAt: "2026-08-08T03:00:10.000Z",
        mission: {
          mission: "Clarity",
          vision: "Scale",
          coreValues: [],
          strategicPillars: [],
          goals: ["Launch"],
        },
      },
    });

    expect(local.currentStep).toBe("executive_profile");
    expect(local.mission.goals).toEqual(["Launch"]);
  });

  it("cold worker restores client brand snapshot instead of creating Welcome", () => {
    const snapshot: OnboardingSession = {
      ...createEmptySession({
        ownerUserId: "u-cold",
        ownerEmail: "cold@example.com",
        displayName: "Cold",
      }),
      status: "in_progress",
      currentStep: "brand",
      completedSteps: ["welcome", "organization"],
      organization: {
        organizationName: "Cold Org",
        subdomain: "cold-org",
        industry: "education",
        timezone: "UTC",
        logoUrl: "",
        country: "US",
      },
      updatedAt: "2026-08-08T04:00:00.000Z",
    };

    // Memory empty (cold worker)
    expect(
      ExecutiveOnboardingService.getSessionForOwner("u-cold")
    ).toBeNull();

    const restored = ExecutiveOnboardingService.restoreFromClientSnapshot(
      { ownerUserId: "u-cold", ownerEmail: "cold@example.com" },
      snapshot
    );
    expect(restored).not.toBeNull();
    expect(restored!.currentStep).toBe("brand");
    expect(restored!.organization.organizationName).toBe("Cold Org");
    expect(restored!.currentStep).not.toBe("welcome");

    const again = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "u-cold",
      ownerEmail: "cold@example.com",
    });
    expect(again.id).toBe(snapshot.id);
    expect(again.currentStep).toBe("brand");
  });

  it("mergeFieldSaveIntoSession never changes currentStep even with newer updatedAt", () => {
    const local = {
      ...createEmptySession({
        ownerUserId: "u1",
        ownerEmail: "a@b.c",
      }),
      currentStep: "mission_strategy" as const,
      completedSteps: ["welcome", "organization", "brand", "executive_profile"],
      updatedAt: "2026-08-08T01:00:00.000Z",
      organization: {
        organizationName: "Keep",
        subdomain: "keep",
        industry: "education",
        timezone: "UTC",
        logoUrl: "",
        country: "US",
      },
    };
    const incoming = {
      ...local,
      currentStep: "organization" as const,
      updatedAt: "2026-08-08T01:00:05.000Z",
    };
    const merged = mergeFieldSaveIntoSession(local, incoming);
    expect(merged.currentStep).toBe("mission_strategy");
  });
});
