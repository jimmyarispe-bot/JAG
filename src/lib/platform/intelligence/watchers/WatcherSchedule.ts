/**
 * WatcherSchedule — digest / evaluation cadence — Sprint 206.
 */

import type { DigestKind, WatcherScheduleKind } from "./WatcherRule";

export type WatcherSchedule = {
  readonly kind: WatcherScheduleKind;
  readonly label: string;
  readonly description: string;
};

export const WATCHER_SCHEDULES: readonly WatcherSchedule[] = [
  {
    kind: "continuous",
    label: "Continuous",
    description: "Evaluate whenever the inbox or digests are refreshed.",
  },
  {
    kind: "morning",
    label: "Morning",
    description: "Morning digest window.",
  },
  {
    kind: "afternoon",
    label: "Afternoon",
    description: "Afternoon digest window.",
  },
  {
    kind: "weekly",
    label: "Weekly",
    description: "Weekly executive review digest.",
  },
  {
    kind: "monthly",
    label: "Monthly",
    description: "Monthly board-ready digest.",
  },
  {
    kind: "board",
    label: "Board",
    description: "Board packet digest.",
  },
] as const;

export function digestLabel(kind: DigestKind): string {
  switch (kind) {
    case "morning":
      return "Morning Digest";
    case "afternoon":
      return "Afternoon Digest";
    case "weekly":
      return "Weekly Digest";
    case "monthly":
      return "Monthly Digest";
    case "board":
      return "Board Digest";
  }
}

/** Which alert severities to emphasize per digest. */
export function digestMinPriority(kind: DigestKind): number {
  switch (kind) {
    case "morning":
    case "afternoon":
      return 3; // medium+
    case "weekly":
      return 2; // low+
    case "monthly":
    case "board":
      return 2;
  }
}
