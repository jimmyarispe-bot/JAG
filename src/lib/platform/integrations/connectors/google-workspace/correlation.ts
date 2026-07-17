/**
 * Cross-system correlation: Google Calendar / Tasks ↔ AcademyOS, QuickBooks, Square, Plaid.
 * Composition only — no intelligence package changes.
 */

import { academyOsStore } from "@/lib/platform/integrations/connectors/academyos/store";
import { plaidStore } from "@/lib/platform/integrations/connectors/plaid/store";
import { quickbooksStore } from "@/lib/platform/integrations/connectors/quickbooks/store";
import { squareStore } from "@/lib/platform/integrations/connectors/square/store";
import { googleWorkspaceStore, type GoogleWorkspaceStoreSnapshot } from "./store";

export type WorkspaceCorrelationKind =
  | "budget_meeting_qb_variance"
  | "grant_deadline_plaid_cash"
  | "board_meeting_exec_brief"
  | "school_calendar_academyos"
  | "task_to_project"
  | "calendar_to_financial_event";

export type WorkspaceCorrelationLink = {
  id: string;
  kind: WorkspaceCorrelationKind;
  title: string;
  detail: string;
  googleEventId: string | null;
  googleTaskId: string | null;
  relatedSystems: Array<"google-workspace" | "academyos" | "quickbooks" | "square" | "plaid">;
  at: string;
};

export type GoogleWorkspaceCorrelation = {
  organizationId: string;
  correlatedAt: string;
  googleConnected: boolean;
  links: WorkspaceCorrelationLink[];
  summaryBullets: string[];
};

function num(v: unknown): number {
  return Number(v ?? 0);
}

/**
 * Correlate Google Workspace calendar/tasks with other connector caches when present.
 */
export function correlateGoogleWorkspace(
  organizationId: string,
  options?: { google?: GoogleWorkspaceStoreSnapshot | null }
): GoogleWorkspaceCorrelation {
  const google = options?.google ?? googleWorkspaceStore.get(organizationId);
  const correlatedAt = new Date().toISOString();

  if (!google?.records.length) {
    return {
      organizationId,
      correlatedAt,
      googleConnected: false,
      links: [],
      summaryBullets: [],
    };
  }

  const events = google.byType.calendar_event ?? [];
  const tasks = google.byType.task ?? [];
  const academy = academyOsStore.get(organizationId);
  const qb = quickbooksStore.get(organizationId);
  const square = squareStore.get(organizationId);
  const plaid = plaidStore.get(organizationId);

  const links: WorkspaceCorrelationLink[] = [];

  const budgetEvt = events.find((e) => e.attributes.correlationKey === "qb_budget_variance");
  if (budgetEvt && qb) {
    const budget = qb.byType.budget?.[0]?.attributes;
    const revenueActual = num(budget?.actualRevenue);
    const revenueBudget = num(budget?.revenueBudget);
    links.push({
      id: "corr-budget-qb",
      kind: "budget_meeting_qb_variance",
      title: "Budget meeting → QuickBooks variance",
      detail: `Calendar "${String(budgetEvt.attributes.title)}" follows QB revenue $${revenueActual.toLocaleString()} / budget $${revenueBudget.toLocaleString()}.`,
      googleEventId: budgetEvt.externalId,
      googleTaskId: null,
      relatedSystems: ["google-workspace", "quickbooks"],
      at: String(budgetEvt.attributes.startAt ?? budgetEvt.syncedAt),
    });
  }

  const grantEvt = events.find((e) => e.attributes.correlationKey === "plaid_grant_cash");
  if (grantEvt && plaid) {
    const forecast = plaid.byType.balance
      ? // use feed-like soft number from balances
        (plaid.byType.balance ?? []).reduce(
          (s, b) => s + Math.max(0, num(b.attributes.available)),
          0
        )
      : 0;
    links.push({
      id: "corr-grant-plaid",
      kind: "grant_deadline_plaid_cash",
      title: "Grant deadline → Plaid cash forecast",
      detail: `Grant calendar event correlates with Plaid available cash $${forecast.toLocaleString()}.`,
      googleEventId: grantEvt.externalId,
      googleTaskId: null,
      relatedSystems: ["google-workspace", "plaid"],
      at: String(grantEvt.attributes.startAt ?? grantEvt.syncedAt),
    });
  }

  const boardEvt = events.find((e) => e.attributes.correlationKey === "exec_board_brief");
  if (boardEvt) {
    links.push({
      id: "corr-board-brief",
      kind: "board_meeting_exec_brief",
      title: "Board meeting → Executive Brief",
      detail: `Board meeting "${String(boardEvt.attributes.title)}" is queued for Executive Brief and packet review.`,
      googleEventId: boardEvt.externalId,
      googleTaskId: tasks.find((t) => t.attributes.correlationKey === "exec_board_brief")
        ?.externalId ?? null,
      relatedSystems: ["google-workspace"],
      at: String(boardEvt.attributes.startAt ?? boardEvt.syncedAt),
    });
  }

  const schoolEvt = events.find(
    (e) => e.attributes.correlationKey === "academyos_school_calendar"
  );
  if (schoolEvt && academy) {
    const studentCount = (academy.byType.student ?? []).length;
    links.push({
      id: "corr-school-aos",
      kind: "school_calendar_academyos",
      title: "School calendar → AcademyOS events",
      detail: `Workspace event "${String(schoolEvt.attributes.title)}" aligns with AcademyOS roster (${studentCount} students synced).`,
      googleEventId: schoolEvt.externalId,
      googleTaskId: null,
      relatedSystems: ["google-workspace", "academyos"],
      at: String(schoolEvt.attributes.startAt ?? schoolEvt.syncedAt),
    });
  }

  for (const task of tasks.filter((t) => !t.attributes.completed && t.attributes.correlationKey)) {
    const key = String(task.attributes.correlationKey);
    if (key === "qb_budget_variance" && qb) {
      links.push({
        id: `corr-task-qb-${task.externalId}`,
        kind: "task_to_project",
        title: "Task → financial follow-up",
        detail: `Open task "${String(task.attributes.name)}" linked to QuickBooks financial review.`,
        googleEventId: null,
        googleTaskId: task.externalId,
        relatedSystems: ["google-workspace", "quickbooks"],
        at: String(task.attributes.dueAt ?? task.syncedAt),
      });
    }
    if (key === "plaid_grant_cash" && plaid) {
      links.push({
        id: `corr-task-plaid-${task.externalId}`,
        kind: "task_to_project",
        title: "Task → cash / grant action",
        detail: `Open task "${String(task.attributes.name)}" linked to Plaid cash posture and grant deadline.`,
        googleEventId: null,
        googleTaskId: task.externalId,
        relatedSystems: ["google-workspace", "plaid"],
        at: String(task.attributes.dueAt ?? task.syncedAt),
      });
    }
  }

  if (square && budgetEvt) {
    const payments = (square.byType.payment ?? []).length;
    links.push({
      id: "corr-cal-fin-square",
      kind: "calendar_to_financial_event",
      title: "Calendar → commerce context",
      detail: `Budget calendar activity sits alongside ${payments} Square payment(s) in the executive timeline.`,
      googleEventId: budgetEvt.externalId,
      googleTaskId: null,
      relatedSystems: ["google-workspace", "square"],
      at: String(budgetEvt.attributes.startAt ?? budgetEvt.syncedAt),
    });
  }

  // Dedupe by id
  const unique = [...new Map(links.map((l) => [l.id, l])).values()];

  return {
    organizationId,
    correlatedAt,
    googleConnected: true,
    links: unique,
    summaryBullets: unique.map((l) => l.detail),
  };
}
