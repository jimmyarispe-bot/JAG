/**
 * Durable Learning Center persistence.
 * Production: service-role client after JAG session authorization.
 * Callers must pass the bound session.userId only — never a browser-supplied id.
 * RLS on jag_learn_* remains unchanged (direct JWT/anon access still own-row).
 * Tests: injectable memory store (not globalThis; not client state).
 */

import { createServiceRoleClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";
import type {
  JagLearnProgressStatus,
  JagLearnUserPreferences,
  JagLearnUserProgress,
} from "./types";

export type LearningPersistence = {
  getPreferences(userId: string): Promise<JagLearnUserPreferences | null>;
  ensurePreferences(userId: string): Promise<JagLearnUserPreferences>;
  updatePreferences(
    userId: string,
    patch: Partial<{
      firstLoginCompleted: boolean;
      onboardingStartedAt: string | null;
      onboardingCompletedAt: string | null;
      onboardingSkippedAt: string | null;
    }>
  ): Promise<JagLearnUserPreferences>;
  listProgress(userId: string): Promise<readonly JagLearnUserProgress[]>;
  getProgress(
    userId: string,
    tutorialId: string
  ): Promise<JagLearnUserProgress | null>;
  upsertProgress(input: {
    userId: string;
    tutorialId: string;
    status: JagLearnProgressStatus;
    progressPercent: number;
    currentStep: number;
    startedAt?: string | null;
    completedAt?: string | null;
  }): Promise<JagLearnUserProgress>;
};

function emptyPrefs(userId: string): JagLearnUserPreferences {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    userId,
    firstLoginCompleted: false,
    onboardingStartedAt: null,
    onboardingCompletedAt: null,
    onboardingSkippedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function mapPrefs(row: Record<string, unknown>): JagLearnUserPreferences {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    firstLoginCompleted: Boolean(row.first_login_completed),
    onboardingStartedAt: (row.onboarding_started_at as string | null) ?? null,
    onboardingCompletedAt:
      (row.onboarding_completed_at as string | null) ?? null,
    onboardingSkippedAt: (row.onboarding_skipped_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapProgress(row: Record<string, unknown>): JagLearnUserProgress {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    tutorialId: String(row.tutorial_id),
    status: row.status as JagLearnProgressStatus,
    progressPercent: Number(row.progress_percent ?? 0),
    currentStep: Number(row.current_step ?? 0),
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    updatedAt: String(row.updated_at),
  };
}

/** In-memory persistence for unit tests only. */
export function createMemoryLearningPersistence(): LearningPersistence {
  const prefs = new Map<string, JagLearnUserPreferences>();
  const progress = new Map<string, JagLearnUserProgress>();
  const key = (userId: string, tutorialId: string) =>
    `${userId}::${tutorialId}`;

  return {
    async getPreferences(userId) {
      return prefs.get(userId) ?? null;
    },
    async ensurePreferences(userId) {
      const existing = prefs.get(userId);
      if (existing) return existing;
      const created = emptyPrefs(userId);
      prefs.set(userId, created);
      return created;
    },
    async updatePreferences(userId, patch) {
      const current = await this.ensurePreferences(userId);
      const next: JagLearnUserPreferences = {
        ...current,
        firstLoginCompleted:
          patch.firstLoginCompleted ?? current.firstLoginCompleted,
        onboardingStartedAt:
          patch.onboardingStartedAt !== undefined
            ? patch.onboardingStartedAt
            : current.onboardingStartedAt,
        onboardingCompletedAt:
          patch.onboardingCompletedAt !== undefined
            ? patch.onboardingCompletedAt
            : current.onboardingCompletedAt,
        onboardingSkippedAt:
          patch.onboardingSkippedAt !== undefined
            ? patch.onboardingSkippedAt
            : current.onboardingSkippedAt,
        updatedAt: new Date().toISOString(),
      };
      prefs.set(userId, next);
      return next;
    },
    async listProgress(userId) {
      return [...progress.values()].filter((p) => p.userId === userId);
    },
    async getProgress(userId, tutorialId) {
      return progress.get(key(userId, tutorialId)) ?? null;
    },
    async upsertProgress(input) {
      const existing = progress.get(key(input.userId, input.tutorialId));
      const now = new Date().toISOString();
      const next: JagLearnUserProgress = {
        id: existing?.id ?? randomUUID(),
        userId: input.userId,
        tutorialId: input.tutorialId,
        status: input.status,
        progressPercent: input.progressPercent,
        currentStep: input.currentStep,
        startedAt:
          input.startedAt !== undefined
            ? input.startedAt
            : (existing?.startedAt ?? now),
        completedAt:
          input.completedAt !== undefined
            ? input.completedAt
            : (existing?.completedAt ?? null),
        updatedAt: now,
      };
      progress.set(key(input.userId, input.tutorialId), next);
      return next;
    },
  };
}

// Tables added in 216_jag_learning_center.sql — typed after database.ts regen.
type LearnClient = {
  from: (table: string) => any;
};

function learnAdminClient(): LearnClient {
  return createServiceRoleClient() as unknown as LearnClient;
}

const supabasePersistence: LearningPersistence = {
  async getPreferences(userId) {
    const supabase = learnAdminClient();
    const { data, error } = await supabase
      .from("jag_learn_user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return mapPrefs(data as Record<string, unknown>);
  },

  async ensurePreferences(userId) {
    const existing = await this.getPreferences(userId);
    if (existing) return existing;
    const supabase = learnAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("jag_learn_user_preferences")
      .insert({
        user_id: userId,
        first_login_completed: false,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(
        `Learning preferences unavailable. Apply migration 216_jag_learning_center.sql (${error?.message ?? "no data"}).`
      );
    }
    return mapPrefs(data as Record<string, unknown>);
  },

  async updatePreferences(userId, patch) {
    await this.ensurePreferences(userId);
    const supabase = learnAdminClient();
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { updated_at: now };
    if (patch.firstLoginCompleted !== undefined) {
      update.first_login_completed = patch.firstLoginCompleted;
    }
    if (patch.onboardingStartedAt !== undefined) {
      update.onboarding_started_at = patch.onboardingStartedAt;
    }
    if (patch.onboardingCompletedAt !== undefined) {
      update.onboarding_completed_at = patch.onboardingCompletedAt;
    }
    if (patch.onboardingSkippedAt !== undefined) {
      update.onboarding_skipped_at = patch.onboardingSkippedAt;
    }
    const { data, error } = await supabase
      .from("jag_learn_user_preferences")
      .update(update)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to update learning preferences (${error?.message ?? "no data"}).`
      );
    }
    return mapPrefs(data as Record<string, unknown>);
  },

  async listProgress(userId) {
    const supabase = learnAdminClient();
    const { data, error } = await supabase
      .from("jag_learn_user_progress")
      .select("*")
      .eq("user_id", userId);
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map(mapProgress);
  },

  async getProgress(userId, tutorialId) {
    const supabase = learnAdminClient();
    const { data, error } = await supabase
      .from("jag_learn_user_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("tutorial_id", tutorialId)
      .maybeSingle();
    if (error || !data) return null;
    return mapProgress(data as Record<string, unknown>);
  },

  async upsertProgress(input) {
    const supabase = learnAdminClient();
    const now = new Date().toISOString();
    const existing = await this.getProgress(input.userId, input.tutorialId);
    const row = {
      user_id: input.userId,
      tutorial_id: input.tutorialId,
      status: input.status,
      progress_percent: input.progressPercent,
      current_step: input.currentStep,
      started_at:
        input.startedAt !== undefined
          ? input.startedAt
          : (existing?.startedAt ?? now),
      completed_at:
        input.completedAt !== undefined
          ? input.completedAt
          : (existing?.completedAt ?? null),
      updated_at: now,
    };
    const { data, error } = await supabase
      .from("jag_learn_user_progress")
      .upsert(row, { onConflict: "user_id,tutorial_id" })
      .select("*")
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to persist tutorial progress (${error?.message ?? "no data"}). Apply migration 216 if tables are missing.`
      );
    }
    return mapProgress(data as Record<string, unknown>);
  },
};

let testPersistence: LearningPersistence | null = null;

export function setLearningPersistenceForTests(
  store: LearningPersistence | null
): void {
  testPersistence = store;
}

export function getLearningPersistence(): LearningPersistence {
  return testPersistence ?? supabasePersistence;
}
