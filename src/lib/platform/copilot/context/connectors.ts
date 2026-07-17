/**
 * Map connector feeds into copilot snapshots (display/metrics only).
 */

import type { ConnectorSystemSnapshot } from "../types";

type FeedLike = {
  syncedAt?: string;
  briefBullets?: string[];
} | null | undefined;

export function snapshotAcademyOs(feed: FeedLike & {
  enrollmentScore?: number;
  workforceScore?: number;
  financial?: { cash?: number | null };
  counts?: { students?: number; enrollments?: number; campuses?: number };
} | null): ConnectorSystemSnapshot {
  if (!feed) {
    return {
      system: "academyos",
      connected: false,
      syncedAt: null,
      bullets: [],
      metrics: [],
    };
  }
  return {
    system: "academyos",
    connected: true,
    syncedAt: feed.syncedAt ?? null,
    bullets: feed.briefBullets?.slice(0, 5) ?? [],
    metrics: [
      { key: "enrollmentScore", label: "Enrollment score", value: feed.enrollmentScore ?? null },
      { key: "workforceScore", label: "Workforce score", value: feed.workforceScore ?? null },
      { key: "cash", label: "AcademyOS cash", value: feed.financial?.cash ?? null },
      { key: "students", label: "Students", value: feed.counts?.students ?? null },
    ],
  };
}

export function snapshotQuickBooks(feed: FeedLike & {
  financial?: { cash?: number; revenueActual?: number; ebitda?: number };
  financialScore?: number;
} | null): ConnectorSystemSnapshot {
  if (!feed) {
    return {
      system: "quickbooks",
      connected: false,
      syncedAt: null,
      bullets: [],
      metrics: [],
    };
  }
  return {
    system: "quickbooks",
    connected: true,
    syncedAt: feed.syncedAt ?? null,
    bullets: feed.briefBullets?.slice(0, 5) ?? [],
    metrics: [
      { key: "cash", label: "QB cash", value: feed.financial?.cash ?? null },
      { key: "revenue", label: "Revenue actual", value: feed.financial?.revenueActual ?? null },
      { key: "ebitda", label: "EBITDA", value: feed.financial?.ebitda ?? null },
      { key: "financialScore", label: "Financial score", value: feed.financialScore ?? null },
    ],
  };
}

export function snapshotSquare(feed: FeedLike & {
  payments?: { volumeCents7d?: number };
  revenueScore?: number;
  cashFlow?: { depositsPendingCents?: number };
} | null): ConnectorSystemSnapshot {
  if (!feed) {
    return {
      system: "square",
      connected: false,
      syncedAt: null,
      bullets: [],
      metrics: [],
    };
  }
  return {
    system: "square",
    connected: true,
    syncedAt: feed.syncedAt ?? null,
    bullets: feed.briefBullets?.slice(0, 5) ?? [],
    metrics: [
      {
        key: "volume7d",
        label: "Payment volume 7d ($)",
        value:
          feed.payments?.volumeCents7d != null
            ? Math.round(feed.payments.volumeCents7d / 100)
            : null,
      },
      { key: "revenueScore", label: "Revenue score", value: feed.revenueScore ?? null },
      {
        key: "depositsPending",
        label: "Deposits pending ($)",
        value:
          feed.cashFlow?.depositsPendingCents != null
            ? Math.round(feed.cashFlow.depositsPendingCents / 100)
            : null,
      },
    ],
  };
}

export function snapshotPlaid(feed: FeedLike & {
  cash?: { available?: number; burnRateMonthly?: number; cashForecast30d?: number };
  liquidityScore?: number;
} | null): ConnectorSystemSnapshot {
  if (!feed) {
    return {
      system: "plaid",
      connected: false,
      syncedAt: null,
      bullets: [],
      metrics: [],
    };
  }
  return {
    system: "plaid",
    connected: true,
    syncedAt: feed.syncedAt ?? null,
    bullets: feed.briefBullets?.slice(0, 5) ?? [],
    metrics: [
      { key: "availableCash", label: "Available cash", value: feed.cash?.available ?? null },
      { key: "burn", label: "Burn (monthly)", value: feed.cash?.burnRateMonthly ?? null },
      { key: "forecast30d", label: "Cash forecast 30d", value: feed.cash?.cashForecast30d ?? null },
      { key: "liquidityScore", label: "Liquidity score", value: feed.liquidityScore ?? null },
    ],
  };
}

export function snapshotGoogleWorkspace(feed: FeedLike & {
  collaboration?: { upcomingMeetings?: number; openTasks?: number };
  executiveCalendar?: Array<{ title: string; startAt: string }>;
  upcomingDecisions?: Array<{ title: string; dueAt: string }>;
} | null): ConnectorSystemSnapshot {
  if (!feed) {
    return {
      system: "google-workspace",
      connected: false,
      syncedAt: null,
      bullets: [],
      metrics: [],
    };
  }
  return {
    system: "google-workspace",
    connected: true,
    syncedAt: feed.syncedAt ?? null,
    bullets: feed.briefBullets?.slice(0, 5) ?? [],
    metrics: [
      {
        key: "upcomingMeetings",
        label: "Upcoming meetings",
        value: feed.collaboration?.upcomingMeetings ?? null,
      },
      {
        key: "openTasks",
        label: "Open tasks",
        value: feed.collaboration?.openTasks ?? null,
      },
    ],
  };
}

export function orderedConnectorSnapshots(parts: {
  academyos: ConnectorSystemSnapshot;
  quickbooks: ConnectorSystemSnapshot;
  square: ConnectorSystemSnapshot;
  plaid: ConnectorSystemSnapshot;
  googleWorkspace: ConnectorSystemSnapshot;
}): ConnectorSystemSnapshot[] {
  return [
    parts.academyos,
    parts.quickbooks,
    parts.square,
    parts.plaid,
    parts.googleWorkspace,
  ];
}
