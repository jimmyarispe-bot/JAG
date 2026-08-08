/**
 * Phase 61 — Executive team editor must accept normal typing without
 * a stale per-keystroke / field-save response wiping the active row.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { BrandService } from "@/lib/platform/branding";
import { resetJagBusinessStoreForTests } from "@/lib/jag-business/store";
import {
  applyOnboardingSessionUpdate,
  bumpOnboardingSession,
  ChecklistService,
  clearOnboardingObservationsForTests,
  createExecutiveMember,
  ExecutiveOnboardingService,
  mergeExecutiveLists,
  type OnboardingSession,
} from "@/lib/platform/onboarding";
import { createEmptySession } from "@/lib/platform/onboarding/defaults";

/** Emulate server field_save: same executives payload, always-newer updatedAt. */
function serverPersist(snapshot: OnboardingSession): OnboardingSession {
  return {
    ...snapshot,
    executives: snapshot.executives.map((e) => ({ ...e })),
    updatedAt: new Date(Date.now() + 5_000).toISOString(),
  };
}

/**
 * Simulates local-first typing + out-of-order save responses (oldest last).
 */
function typeIntoExecutiveRow(
  local: OnboardingSession,
  rowId: string,
  field: "name" | "email" | "title",
  text: string
): OnboardingSession {
  let current = local;
  const pending: OnboardingSession[] = [];

  for (const ch of text) {
    current = bumpOnboardingSession({
      ...current,
      executives: current.executives.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: `${String(row[field] ?? "")}${ch}`,
            }
          : row
      ),
    });
    pending.push({
      ...current,
      executives: current.executives.map((e) => ({ ...e })),
    });
  }

  for (const snapshot of pending) {
    current = applyOnboardingSessionUpdate(current, {
      kind: "field_save",
      session: serverPersist(snapshot),
    });
  }

  return current;
}

describe("Phase 61 executive editor typing", () => {
  beforeEach(() => {
    ExecutiveOnboardingService.resetForTests();
    clearOnboardingObservationsForTests();
    ChecklistService.resetForTests();
    BrandService.resetForTests();
    resetJagBusinessStoreForTests();
  });

  it('keeps "Dann" / "example@example.com" / "Executive" after stale first-char saves', () => {
    const founder = createExecutiveMember({
      id: "exec.founder",
      name: "Founder",
      role: "founder",
      email: "founder@example.com",
      title: "Founder",
    });
    const draft = createExecutiveMember({
      id: "exec.dann",
      name: "",
      role: "executive",
      email: "",
      title: "",
    });

    let local: OnboardingSession = {
      ...createEmptySession({
        ownerUserId: "u-exec-type",
        ownerEmail: "founder@example.com",
        displayName: "Founder",
      }),
      status: "in_progress",
      currentStep: "executive_profile",
      completedSteps: ["welcome", "organization", "brand"],
      executives: [founder, draft],
      updatedAt: "2026-08-08T03:00:00.000Z",
    };

    local = typeIntoExecutiveRow(local, draft.id, "name", "Dann");
    expect(local.executives.find((e) => e.id === draft.id)?.name).toBe("Dann");

    local = typeIntoExecutiveRow(
      local,
      draft.id,
      "email",
      "example@example.com"
    );
    expect(local.executives.find((e) => e.id === draft.id)?.email).toBe(
      "example@example.com"
    );

    local = typeIntoExecutiveRow(local, draft.id, "title", "Executive");

    const row = local.executives.find((e) => e.id === draft.id)!;
    expect(row.name).toBe("Dann");
    expect(row.email).toBe("example@example.com");
    expect(row.title).toBe("Executive");
    expect(local.currentStep).toBe("executive_profile");
  });

  it("keeps two executive rows editing simultaneously under interleaved saves", () => {
    const a = createExecutiveMember({
      id: "exec.a",
      name: "",
      role: "executive",
      email: "",
      title: "",
    });
    const b = createExecutiveMember({
      id: "exec.b",
      name: "",
      role: "executive",
      email: "",
      title: "",
    });

    let local: OnboardingSession = {
      ...createEmptySession({
        ownerUserId: "u-two-exec",
        ownerEmail: "founder@example.com",
      }),
      status: "in_progress",
      currentStep: "executive_profile",
      completedSteps: ["welcome", "organization", "brand"],
      executives: [a, b],
      updatedAt: "2026-08-08T03:10:00.000Z",
    };

    const snapshots: OnboardingSession[] = [];
    const typeChar = (id: string, field: "name" | "email", ch: string) => {
      local = bumpOnboardingSession({
        ...local,
        executives: local.executives.map((row) =>
          row.id === id
            ? { ...row, [field]: `${String(row[field] ?? "")}${ch}` }
            : row
        ),
      });
      snapshots.push({
        ...local,
        executives: local.executives.map((e) => ({ ...e })),
        updatedAt: local.updatedAt,
      });
    };

    for (const ch of "Dann") typeChar(a.id, "name", ch);
    for (const ch of "Casey") typeChar(b.id, "name", ch);
    for (const ch of "a@ex.com") typeChar(a.id, "email", ch);
    for (const ch of "b@ex.com") typeChar(b.id, "email", ch);

    for (const snap of snapshots) {
      local = applyOnboardingSessionUpdate(local, {
        kind: "field_save",
        session: serverPersist(snap),
      });
    }

    expect(local.executives).toHaveLength(2);
    expect(local.executives.find((e) => e.id === a.id)).toMatchObject({
      name: "Dann",
      email: "a@ex.com",
    });
    expect(local.executives.find((e) => e.id === b.id)).toMatchObject({
      name: "Casey",
      email: "b@ex.com",
    });
  });

  it("mergeExecutiveLists never replaces local draft with first character", () => {
    const id = "exec.x";
    const merged = mergeExecutiveLists(
      [
        createExecutiveMember({
          id,
          name: "Dann",
          role: "executive",
          email: "example@example.com",
          title: "Executive",
        }),
      ],
      [
        createExecutiveMember({
          id,
          name: "D",
          role: "executive",
          email: "e",
          title: "E",
        }),
      ],
      "2026-08-08T03:00:00.000Z",
      "2026-08-08T03:00:10.000Z"
    );
    expect(merged[0]).toMatchObject({
      id,
      name: "Dann",
      email: "example@example.com",
      title: "Executive",
    });
  });
});
