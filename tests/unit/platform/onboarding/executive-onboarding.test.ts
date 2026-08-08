import { beforeEach, describe, expect, it } from "vitest";
import { BrandService } from "@/lib/platform/branding";
import { getBriefing } from "@/lib/jag-command-center/briefing-engine/store";
import { resetJagBusinessStoreForTests } from "@/lib/jag-business/store";
import {
  ChecklistService,
  clearOnboardingObservationsForTests,
  ExecutiveOnboardingService,
  applyOnboardingSessionUpdate,
  OnboardingStateMachine,
  ProgressTracker,
  WelcomeService,
} from "@/lib/platform/onboarding";

describe("Sprint 212 executive onboarding", () => {
  beforeEach(() => {
    ExecutiveOnboardingService.resetForTests();
    clearOnboardingObservationsForTests();
    ChecklistService.resetForTests();
    BrandService.resetForTests();
    resetJagBusinessStoreForTests();
  });

  it("creates a resumable session and tracks welcome progress", () => {
    const session = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "user-1",
      ownerEmail: "founder@example.com",
      displayName: "Ada Founder",
    });
    expect(session.currentStep).toBe("welcome");
    expect(session.executives[0]?.role).toBe("founder");

    const again = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "user-1",
      ownerEmail: "founder@example.com",
    });
    expect(again.id).toBe(session.id);

    const paused = ExecutiveOnboardingService.pause(session.id);
    expect(paused.ok).toBe(true);
    expect(paused.session?.status).toBe("paused");

    const resumed = ExecutiveOnboardingService.resume(session.id);
    expect(resumed.session?.status).toBe("in_progress");
  });

  it("validates organization step and advances the state machine", () => {
    const session = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "user-2",
      ownerEmail: "ceo@acme.test",
      displayName: "Casey CEO",
    });

    const blocked = ExecutiveOnboardingService.completeCurrentStep(session.id);
    expect(blocked.ok).toBe(true); // welcome has no validation

    const afterWelcome = ExecutiveOnboardingService.getSession(session.id)!;
    expect(afterWelcome.currentStep).toBe("organization");

    const failOrg = ExecutiveOnboardingService.completeCurrentStep(session.id);
    expect(failOrg.ok).toBe(false);

    ExecutiveOnboardingService.updateOrganization(session.id, {
      organizationName: "Acme Intelligence",
      subdomain: "acme-intel",
      industry: "education",
      timezone: "America/Chicago",
    });

    const okOrg = ExecutiveOnboardingService.completeCurrentStep(session.id);
    expect(okOrg.ok).toBe(true);
    expect(okOrg.session?.currentStep).toBe("brand");
  });

  it("provisions workspace, brand, welcome brief, and inbox tasks", () => {
    const session = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "user-3",
      ownerEmail: "ops@signal.test",
      displayName: "Sam Signal",
    });

    // Fast-forward drafts
    ExecutiveOnboardingService.updateOrganization(session.id, {
      organizationName: "Signal Centers",
      subdomain: "signalcenters",
      industry: "education",
      timezone: "America/New_York",
      logoUrl: "https://cdn.example/logo.svg",
    });
    ExecutiveOnboardingService.updateBrand(session.id, {
      primaryColor: "#0C1B2A",
      accentColor: "#38BDF8",
    });
    ExecutiveOnboardingService.updateMission(session.id, {
      mission: "Serve families with clarity.",
      vision: "Every leader has executive intelligence.",
      goals: ["Launch platform", "Connect SIS"],
    });

    // Complete steps through review
    for (const step of [
      "welcome",
      "organization",
      "brand",
      "executive_profile",
      "mission_strategy",
      "capabilities",
      "connect_systems",
      "review",
    ] as const) {
      const current = ExecutiveOnboardingService.getSession(session.id)!;
      if (current.currentStep !== step) {
        ExecutiveOnboardingService.goToStep(session.id, step);
      }
      const result = ExecutiveOnboardingService.completeCurrentStep(session.id);
      expect(result.ok, `${step}: ${result.error}`).toBe(true);
    }

    const generated = ExecutiveOnboardingService.generateWorkspace(
      session.id,
      "Sam Signal"
    );
    expect(generated.ok).toBe(true);
    if (!generated.ok) return;

    expect(generated.organizationId).toMatch(/^org\./);
    expect(generated.session.status).toBe("completed");

    const brand = BrandService.getBrand(generated.organizationId);
    expect(brand?.display_name).toBe("Signal Centers");
    expect(brand?.subdomain).toBe("signalcenters");

    const brief = getBriefing(generated.briefingId);
    expect(brief?.kindLabel).toBe("Welcome Executive Brief");
    expect(brief?.title).toContain("Signal Centers");

    const tasks = ChecklistService.listForOrganization(generated.organizationId);
    expect(tasks.length).toBeGreaterThanOrEqual(5);
    expect(tasks.some((t) => t.id === "invite_executives")).toBe(true);

    const progress = ProgressTracker.compute(generated.session);
    expect(progress.percentComplete).toBe(100);
    expect(progress.readinessScore).toBeGreaterThanOrEqual(90);
  });

  it("exposes welcome content powered by The JAG™", () => {
    const welcome = WelcomeService.introduce();
    expect(welcome.headline).toContain("The JAG™");
    expect(welcome.poweredBy).toBe("Powered by The JAG™");
  });

  it("rejects illegal forward jumps in the state machine", () => {
    const session = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "user-4",
      ownerEmail: "x@y.z",
    });
    const jump = OnboardingStateMachine.enterStep(session, "review");
    expect(jump.ok).toBe(false);
  });

  it("does not jump back to an earlier step when a stale field-save response arrives", () => {
    const session = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "user-race",
      ownerEmail: "race@example.com",
      displayName: "Race User",
    });

    ExecutiveOnboardingService.completeCurrentStep(session.id); // welcome → organization
    ExecutiveOnboardingService.updateOrganization(session.id, {
      organizationName: "Stable Org",
      subdomain: "stable-org",
      industry: "education",
      timezone: "America/New_York",
    });

    // Simulate an in-flight organization save that captured pre-navigation state.
    const staleSave = ExecutiveOnboardingService.getSession(session.id)!;
    expect(staleSave.currentStep).toBe("organization");

    const advanced = ExecutiveOnboardingService.completeCurrentStep(session.id);
    expect(advanced.ok).toBe(true);
    expect(advanced.session?.currentStep).toBe("brand");

    const local = advanced.session!;
    // Stale save response still reports organization step + older timestamp.
    const staleResponse = {
      ...staleSave,
      updatedAt: new Date(Date.parse(local.updatedAt) - 1000).toISOString(),
    };

    const merged = applyOnboardingSessionUpdate(local, {
      kind: "field_save",
      session: staleResponse,
    });
    expect(merged.currentStep).toBe("brand");
    expect(merged.organization.organizationName).toBe("Stable Org");
  });

  it("restores a client snapshot instead of creating an empty welcome session", () => {
    const session = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "user-restore",
      ownerEmail: "restore@example.com",
      displayName: "Restore User",
    });
    ExecutiveOnboardingService.completeCurrentStep(session.id);
    ExecutiveOnboardingService.updateOrganization(session.id, {
      organizationName: "Restored Org",
      subdomain: "restored-org",
      industry: "education",
      timezone: "UTC",
    });
    const snapshot = ExecutiveOnboardingService.getSession(session.id)!;
    expect(snapshot.currentStep).toBe("organization");

    // Cold worker: memory cleared.
    ExecutiveOnboardingService.resetForTests();
    expect(
      ExecutiveOnboardingService.getSessionForOwner("user-restore")
    ).toBeNull();

    const restored = ExecutiveOnboardingService.restoreFromClientSnapshot(
      { ownerUserId: "user-restore", ownerEmail: "restore@example.com" },
      snapshot
    );
    expect(restored?.currentStep).toBe("organization");
    expect(restored?.organization.organizationName).toBe("Restored Org");
    expect(restored?.status).not.toBe("completed");

    const again = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "user-restore",
      ownerEmail: "restore@example.com",
    });
    expect(again.id).toBe(snapshot.id);
    expect(again.currentStep).toBe("organization");
  });

  it("organization field patches do not wipe sibling fields via stale full drafts", () => {
    const session = ExecutiveOnboardingService.getOrCreateSession({
      ownerUserId: "user-patch",
      ownerEmail: "patch@example.com",
    });
    ExecutiveOnboardingService.updateOrganization(session.id, {
      organizationName: "Patch Org",
      subdomain: "patch-org",
    });
    // Patch-only update (as the UI now sends) must preserve name/subdomain.
    ExecutiveOnboardingService.updateOrganization(session.id, {
      industry: "healthcare",
    });
    const next = ExecutiveOnboardingService.getSession(session.id)!;
    expect(next.organization.organizationName).toBe("Patch Org");
    expect(next.organization.subdomain).toBe("patch-org");
    expect(next.organization.industry).toBe("healthcare");
  });
});
