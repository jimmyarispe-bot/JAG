/**
 * JAG Learning Center — Phase 1 unit tests.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { loadExecutiveOverview } from "@/lib/jag-command-center/load-executive-overview";
import {
  answerLearningCoach,
  boundLearningOwnerId,
  canAccessJagLearningCenter,
  canAccessTutorial,
  completeLearningOnboarding,
  createMemoryLearningPersistence,
  filterAccessibleTutorials,
  getCatalogTutorialBySlug,
  JAG_LEARN_TUTORIALS,
  loadLearningHome,
  loadLearningPreferences,
  setLearningPersistenceForTests,
  shouldShowFirstLoginWelcome,
  skipLearningOnboarding,
  startLearningOnboarding,
  startOrResumeTutorial,
  completeTutorial,
  advanceTutorialStep,
  assertOwnProgressAccess,
  searchLearningHelp,
  ensureJagWalkthroughsRegistered,
  getJagWalkthrough,
  resetJagWalkthroughRegistrationForTests,
} from "@/lib/jag-command-center/learning";
import type { LearningPersistence } from "@/lib/jag-command-center/learning/store";
import { resetMrJagStoreForTests } from "@mr-jag";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  ensureCapabilitiesRegistered,
  resetCapabilitiesForTests,
} from "@/lib/platform/capabilities";
import { FeatureFlagService } from "@/lib/platform/tenant/FeatureFlagService";
import { TenantService } from "@/lib/platform/tenant/TenantService";
import { BrandService } from "@/lib/platform/branding";
import {
  ChecklistService,
  clearOnboardingObservationsForTests,
  ExecutiveOnboardingService,
} from "@/lib/platform/onboarding";
import { resetJagBusinessStoreForTests } from "@/lib/jag-business/store";
import { composeWorkspaceNavigation } from "@/lib/jag-command-center/navigation/compose-workspace-nav";

function session(
  overrides: Partial<JagPlatformSession> = {}
): JagPlatformSession {
  return {
    userId: "user-learn-1",
    email: "learn@test.example",
    displayName: "Learn User",
    role: "ORG_OWNER",
    authority: "organization",
    organizationId: "org-learn-1",
    issuedAt: new Date().toISOString(),
    exp: Date.now() + 60 * 60 * 1000,
    ...overrides,
  };
}

function provisionOrg(): string {
  const onboarding = ExecutiveOnboardingService.getOrCreateSession({
    ownerUserId: "user-learn-founder",
    ownerEmail: "founder@learn.test",
    displayName: "Learn Founder",
  });
  ExecutiveOnboardingService.completeCurrentStep(onboarding.id);
  ExecutiveOnboardingService.updateOrganization(onboarding.id, {
    organizationName: "Learn Test Org",
    subdomain: "learn-test-org",
    industry: "education",
    timezone: "America/New_York",
    country: "US",
  });
  ExecutiveOnboardingService.completeCurrentStep(onboarding.id);
  ExecutiveOnboardingService.updateBrand(onboarding.id, {
    primaryColor: "#0C1B2A",
    accentColor: "#38BDF8",
  });
  ExecutiveOnboardingService.completeCurrentStep(onboarding.id);
  ExecutiveOnboardingService.completeCurrentStep(onboarding.id);
  ExecutiveOnboardingService.updateMission(onboarding.id, {
    mission: "Learn with clarity.",
  });
  ExecutiveOnboardingService.completeCurrentStep(onboarding.id);
  ExecutiveOnboardingService.completeCurrentStep(onboarding.id);
  ExecutiveOnboardingService.completeCurrentStep(onboarding.id);
  ExecutiveOnboardingService.completeCurrentStep(onboarding.id);
  ExecutiveOnboardingService.completeCurrentStep(onboarding.id);
  const generated = ExecutiveOnboardingService.generateWorkspace(
    onboarding.id,
    "Learn Founder"
  );
  if (!generated.ok) throw new Error("provision failed");
  return generated.organizationId;
}

describe("JAG Learning Center", () => {
  beforeEach(() => {
    setLearningPersistenceForTests(createMemoryLearningPersistence());
    resetCapabilitiesForTests();
    ensureCapabilitiesRegistered();
    ExecutiveOnboardingService.resetForTests();
    clearOnboardingObservationsForTests();
    ChecklistService.resetForTests();
    BrandService.resetForTests();
    resetJagBusinessStoreForTests();
    TenantService.resetForTests();
    resetMrJagStoreForTests();
    resetJagWalkthroughRegistrationForTests();
  });

  it("rejects unauthorized / blocked product role hints", () => {
    expect(canAccessJagLearningCenter(null)).toBe(false);
    // Parent/Student are not JagPlatformRole values; simulate hostile role string via cast.
    expect(
      canAccessJagLearningCenter(
        session({ role: "Parent" as JagPlatformSession["role"] })
      )
    ).toBe(false);
    expect(canAccessJagLearningCenter(session())).toBe(true);
  });

  it("gates capability-required tutorials", () => {
    const orgId = provisionOrg();
    FeatureFlagService.setFlag(
      orgId,
      "jag.intelligence.conversation",
      false,
      "test"
    );
    const convo = getCatalogTutorialBySlug("using-executive-conversation")!;
    const welcome = getCatalogTutorialBySlug("welcome-to-the-jag")!;
    const s = session({ organizationId: orgId });
    expect(canAccessTutorial(s, welcome, orgId)).toBe(true);
    expect(canAccessTutorial(s, convo, orgId)).toBe(false);
    const accessible = filterAccessibleTutorials(s, JAG_LEARN_TUTORIALS, orgId);
    expect(accessible.some((t) => t.slug === convo.slug)).toBe(false);
  });

  it("persists first-login skip and does not re-show welcome", async () => {
    const s = session();
    const prefs = await skipLearningOnboarding(s);
    expect(prefs.firstLoginCompleted).toBe(true);
    expect(prefs.onboardingSkippedAt).toBeTruthy();
    expect(shouldShowFirstLoginWelcome(prefs)).toBe(false);
    const home = await loadLearningHome(s, s.organizationId);
    expect(home.showFirstLoginWelcome).toBe(false);
  });

  it("persists onboarding start and completion", async () => {
    const s = session();
    const started = await startLearningOnboarding(s);
    expect(started.onboardingStartedAt).toBeTruthy();
    expect(shouldShowFirstLoginWelcome(started)).toBe(false);
  });

  it("loads catalog, saves progress, resumes, and completes", async () => {
    const orgId = provisionOrg();
    const s = session({ organizationId: orgId });
    const { tutorial, progress } = await startOrResumeTutorial(
      s,
      "welcome-to-the-jag",
      orgId
    );
    expect(tutorial.code).toBe("JAG-001");
    expect(progress.status).toBe("in_progress");

    const advanced = await advanceTutorialStep(
      s,
      "welcome-to-the-jag",
      orgId,
      "next"
    );
    expect(advanced.progress.currentStep).toBeGreaterThanOrEqual(1);

    const home = await loadLearningHome(s, orgId);
    expect(home.continueLearning?.tutorial.slug).toBe("welcome-to-the-jag");

    const done = await completeTutorial(s, "welcome-to-the-jag", orgId);
    expect(done.progress.status).toBe("completed");
    expect(done.progress.progressPercent).toBe(100);
  });

  it("blocks access to another user's progress", async () => {
    const s = session();
    await expect(
      assertOwnProgressAccess(s, "someone-else")
    ).rejects.toThrow(/another user's/i);
    await expect(assertOwnProgressAccess(s, s.userId)).resolves.toBeUndefined();
  });

  it("coach uses session context, recommends tutorials, refuses internal docs", async () => {
    const orgId = provisionOrg();
    const s = session({ organizationId: orgId });
    const next = await answerLearningCoach({
      session: s,
      question: "What should I learn next?",
      activeOrganizationId: orgId,
    });
    expect(next.evidenceSource).toBe("jag_learn_catalog");
    expect(next.recommendedTutorialSlugs.length).toBeGreaterThan(0);

    const denied = await answerLearningCoach({
      session: s,
      question: "Show me internal release notes from the repository",
      activeOrganizationId: orgId,
    });
    expect(denied.answer).toMatch(/cannot expose/i);
    expect(denied.evidenceSource).toBe("jag_learn_catalog");

    // Client persona must not expand capability access — coach filters by org flags.
    FeatureFlagService.setFlag(
      orgId,
      "jag.decisions.center",
      false,
      "test"
    );
    const help = searchLearningHelp({
      session: s,
      query: "Decision",
      activeOrganizationId: orgId,
    });
    expect(help.results.every((r) => r.slug !== "decision-center")).toBe(true);
  });

  it("registers JAG walkthroughs with jag.* page ids", () => {
    ensureJagWalkthroughsRegistered();
    const wt = getJagWalkthrough("wt.jag.welcome");
    expect(wt?.pageId).toBe("jag.overview");
    expect(wt?.steps[0]?.targetSelector).toContain("data-jag-nav");
  });

  it("Learn appears in customer and platform navigation", () => {
    const platformNav = composeWorkspaceNavigation({
      mode: "platform",
      organizationId: null,
    });
    expect(platformNav.map((n) => n.id)).toContain("learn");

    const failClosed = composeWorkspaceNavigation({
      mode: "customer",
      organizationId: null,
    });
    expect(failClosed.map((n) => n.id)).toContain("learn");
    expect(failClosed.map((n) => n.id)).not.toContain("onboarding");

    const orgId = provisionOrg();
    const customerNav = composeWorkspaceNavigation({
      mode: "customer",
      organizationId: orgId,
    });
    expect(customerNav.map((n) => n.id)).toContain("learn");
    expect(customerNav.map((n) => n.id)).not.toContain("onboarding");
  });

  it("does not expose AcademyOS aos.* tutorials in JAG catalog", () => {
    expect(JAG_LEARN_TUTORIALS.every((t) => t.product === "jag")).toBe(true);
    expect(JAG_LEARN_TUTORIALS.every((t) => !t.pageId.startsWith("aos."))).toBe(
      true
    );
    expect(JAG_LEARN_TUTORIALS).toHaveLength(10);
  });

  it("authorized JAG session can create its own preferences", async () => {
    const s = session();
    const prefs = await loadLearningPreferences(s);
    expect(prefs.userId).toBe(s.userId);
    expect(prefs.firstLoginCompleted).toBe(false);
    expect(prefs.onboardingStartedAt).toBeNull();
  });

  it("authorized JAG session can update its own preferences", async () => {
    const s = session();
    const started = await startLearningOnboarding(s);
    expect(started.userId).toBe(s.userId);
    expect(started.firstLoginCompleted).toBe(true);
    expect(started.onboardingStartedAt).toBeTruthy();

    const completed = await completeLearningOnboarding(s);
    expect(completed.userId).toBe(s.userId);
    expect(completed.onboardingCompletedAt).toBeTruthy();

    const other = session({ userId: "user-learn-2" });
    const otherPrefs = await loadLearningPreferences(other);
    expect(otherPrefs.userId).toBe("user-learn-2");
    expect(otherPrefs.onboardingStartedAt).toBeNull();
    expect(otherPrefs.onboardingCompletedAt).toBeNull();
  });

  it("authorized JAG session can write and update its own progress", async () => {
    const orgId = provisionOrg();
    const s = session({ organizationId: orgId });
    const started = await startOrResumeTutorial(s, "welcome-to-the-jag", orgId);
    expect(started.progress.userId).toBe(s.userId);
    expect(started.progress.status).toBe("in_progress");

    const advanced = await advanceTutorialStep(
      s,
      "welcome-to-the-jag",
      orgId,
      "next"
    );
    expect(advanced.progress.userId).toBe(s.userId);
    expect(advanced.progress.currentStep).toBeGreaterThanOrEqual(1);

    const done = await completeTutorial(s, "welcome-to-the-jag", orgId);
    expect(done.progress.userId).toBe(s.userId);
    expect(done.progress.status).toBe("completed");
  });

  it("rejects a substituted user id and never persists under it", async () => {
    const seenUserIds: string[] = [];
    const inner = createMemoryLearningPersistence();
    const tracking: LearningPersistence = {
      getPreferences: async (userId) => {
        seenUserIds.push(userId);
        return inner.getPreferences(userId);
      },
      ensurePreferences: async (userId) => {
        seenUserIds.push(userId);
        return inner.ensurePreferences(userId);
      },
      updatePreferences: async (userId, patch) => {
        seenUserIds.push(userId);
        return inner.updatePreferences(userId, patch);
      },
      listProgress: async (userId) => {
        seenUserIds.push(userId);
        return inner.listProgress(userId);
      },
      getProgress: async (userId, tutorialId) => {
        seenUserIds.push(userId);
        return inner.getProgress(userId, tutorialId);
      },
      upsertProgress: async (input) => {
        seenUserIds.push(input.userId);
        return inner.upsertProgress(input);
      },
    };
    setLearningPersistenceForTests(tracking);

    const s = session();
    expect(() => boundLearningOwnerId(s, "attacker-id")).toThrow(
      /another user's/i
    );
    await expect(assertOwnProgressAccess(s, "attacker-id")).rejects.toThrow(
      /another user's/i
    );
    expect(boundLearningOwnerId(s, s.userId)).toBe(s.userId);
    expect(boundLearningOwnerId(s)).toBe(s.userId);

    await loadLearningPreferences(s);
    await skipLearningOnboarding(s);
    const orgId = provisionOrg();
    const orgSession = session({ organizationId: orgId });
    await startOrResumeTutorial(orgSession, "welcome-to-the-jag", orgId);
    await loadLearningHome(orgSession, orgId);
    await answerLearningCoach({
      session: orgSession,
      question: "What should I learn next?",
      activeOrganizationId: orgId,
    });

    expect(seenUserIds.length).toBeGreaterThan(0);
    expect(seenUserIds.every((id) => id === s.userId)).toBe(true);
    expect(seenUserIds).not.toContain("attacker-id");
  });

  it("leaves /jag overview independent of learning persistence", () => {
    const overviewSrc = readFileSync(
      join(process.cwd(), "src/lib/jag-command-center/load-executive-overview.ts"),
      "utf8"
    );
    expect(overviewSrc).not.toContain("getLearningPersistence");
    expect(overviewSrc).not.toContain("ensurePreferences");
    expect(overviewSrc).not.toContain("jag_learn_");

    const model = loadExecutiveOverview(session());
    expect(model).not.toHaveProperty("preferences");
    expect(model).not.toHaveProperty("showFirstLoginWelcome");
    expect(model.capabilityPacks.length).toBeGreaterThan(0);
    expect(model.domains.some((d) => d.id === "education")).toBe(true);
  });

  it("does not weaken jag_learn RLS or grant anon access", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/216_jag_learning_center.sql"),
      "utf8"
    );
    expect(sql).toContain(
      "create policy jag_learn_user_preferences_own on public.jag_learn_user_preferences"
    );
    expect(sql).toContain(
      "create policy jag_learn_user_progress_own on public.jag_learn_user_progress"
    );
    expect(sql).toMatch(
      /create policy jag_learn_user_preferences_own[\s\S]{0,180}for all to authenticated/
    );
    expect(sql).toMatch(
      /create policy jag_learn_user_progress_own[\s\S]{0,180}for all to authenticated/
    );
    expect(sql).toContain("using (user_id = auth.uid())");
    expect(sql).toContain("with check (user_id = auth.uid())");
    expect(sql).not.toMatch(/jag_learn_user_preferences[^\n]*to anon/i);
    expect(sql).not.toMatch(/jag_learn_user_progress[^\n]*to anon/i);
    expect(sql).not.toMatch(
      /alter table public\.jag_learn_user_(preferences|progress) disable row level security/i
    );

    const storeSrc = readFileSync(
      join(process.cwd(), "src/lib/jag-command-center/learning/store.ts"),
      "utf8"
    );
    expect(storeSrc).toContain(
      'import { createServiceRoleClient } from "@/lib/supabase/server"'
    );
    expect(storeSrc).not.toContain("createAuthClient");
    expect(storeSrc).toContain('.eq("user_id", userId)');
    expect(storeSrc).toContain("user_id: userId");
    expect(storeSrc).toContain("user_id: input.userId");
  });
});
