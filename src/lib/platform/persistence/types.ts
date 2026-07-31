/**
 * Sprint 069 — Persistent Operations Platform types.
 */

import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { PlatformDecision } from "@/lib/platform/decisions/types";
import type { DecisionHistoryEntry } from "@/lib/platform/decisions/types";
import type {
  NotificationHistoryEntry,
  PlatformNotification,
} from "@/lib/platform/notifications/types";
import type { AutomationRun } from "@/lib/platform/automation/operating/types";

export type PersistenceClient = Awaited<ReturnType<typeof createAuthClient>>;

export type AutomationEvent = {
  id: string;
  runId: string;
  eventType: string;
  detail: string | null;
  createdAt: string;
  payload?: Record<string, unknown>;
};

export type PersistenceSnapshot = {
  decisions: PlatformDecision[];
  decisionHistory: Array<DecisionHistoryEntry & { decisionId: string }>;
  notifications: PlatformNotification[];
  notificationHistory: Array<NotificationHistoryEntry & { notificationId: string }>;
  automationRuns: AutomationRun[];
  automationEvents: AutomationEvent[];
};

export type DirtySets = {
  decisions: Set<string>;
  decisionHistory: Set<string>;
  notifications: Set<string>;
  notificationHistory: Set<string>;
  automationRuns: Set<string>;
  automationEvents: Set<string>;
};
