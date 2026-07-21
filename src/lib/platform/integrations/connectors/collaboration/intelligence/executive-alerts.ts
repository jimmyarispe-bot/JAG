/**
 * RC-3.02 — Executive collaboration alerts from Communication Graph signals.
 */

import type { CollaborationCanonicalEntity } from "@/lib/platform/integrations/connectors/collaboration/entities";

export type CollaborationExecutiveAlertKind =
  | "isolated_teams"
  | "overloaded_managers"
  | "communication_bottlenecks";

export type CollaborationExecutiveAlert = {
  id: string;
  kind: CollaborationExecutiveAlertKind;
  title: string;
  severity: "low" | "medium" | "high";
  explainability: string;
  subjectId?: string;
};

type AlertSilo = {
  id: string;
  channelOrTeamId: string;
  label: string;
  severity: "low" | "medium" | "high";
  explainability: string;
};

type AlertBottleneck = {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  explainability: string;
};

function isManagerTitle(title: unknown): boolean {
  const t = String(title ?? "").toLowerCase();
  return (
    t.includes("manager") ||
    t.includes("director") ||
    t.includes("cfo") ||
    t.includes("ceo") ||
    t.includes("vp") ||
    t.includes("head of")
  );
}

function num(v: unknown): number {
  return Number(v ?? 0);
}

export function buildCollaborationExecutiveAlerts(input: {
  silos: readonly AlertSilo[];
  bottlenecks: readonly AlertBottleneck[];
  users: readonly CollaborationCanonicalEntity[];
  messages: readonly CollaborationCanonicalEntity[];
  meets: readonly CollaborationCanonicalEntity[];
}): CollaborationExecutiveAlert[] {
  const alerts: CollaborationExecutiveAlert[] = [];

  for (const silo of input.silos.filter((s) => s.severity !== "low")) {
    alerts.push(isolatedTeamAlert(silo));
  }

  const meetMinutesByEmail = new Map<string, number>();
  for (const meet of input.meets) {
    const participants = Array.isArray(meet.attributes.participants)
      ? (meet.attributes.participants as string[])
      : [];
    const share =
      participants.length > 0
        ? num(meet.attributes.durationMinutes) / participants.length
        : num(meet.attributes.durationMinutes);
    for (const email of participants) {
      if (typeof email !== "string") continue;
      meetMinutesByEmail.set(
        email.toLowerCase(),
        (meetMinutesByEmail.get(email.toLowerCase()) ?? 0) + share
      );
    }
  }

  const messagesByUser = new Map<string, number>();
  for (const message of input.messages) {
    const userId = String(message.attributes.userId ?? "");
    if (!userId) continue;
    messagesByUser.set(userId, (messagesByUser.get(userId) ?? 0) + 1);
  }

  for (const user of input.users) {
    if (!isManagerTitle(user.attributes.title)) continue;
    const email = String(user.attributes.email ?? "").toLowerCase();
    const msgCount = messagesByUser.get(user.externalId) ?? 0;
    const meetMins = email ? meetMinutesByEmail.get(email) ?? 0 : 0;
    const load = msgCount * 10 + meetMins;
    if (load < 80 && msgCount < 2) continue;
    const severity: CollaborationExecutiveAlert["severity"] =
      load >= 150 || meetMins >= 90 ? "high" : "medium";
    alerts.push({
      id: `alert-mgr-${user.externalId}`,
      kind: "overloaded_managers",
      title: String(user.attributes.name ?? user.externalId),
      severity,
      subjectId: user.externalId,
      explainability: `${msgCount} messages · ~${Math.round(meetMins)} meeting minutes — manager collaboration load elevated.`,
    });
  }

  for (const bottleneck of input.bottlenecks.filter((b) => b.severity !== "low")) {
    alerts.push(bottleneckAlert(bottleneck));
  }

  return alerts;
}

function isolatedTeamAlert(silo: AlertSilo): CollaborationExecutiveAlert {
  return {
    id: `alert-isolated-${silo.id}`,
    kind: "isolated_teams",
    title: silo.label,
    severity: silo.severity,
    subjectId: silo.channelOrTeamId,
    explainability: silo.explainability,
  };
}

function bottleneckAlert(bn: AlertBottleneck): CollaborationExecutiveAlert {
  return {
    id: `alert-bn-${bn.id}`,
    kind: "communication_bottlenecks",
    title: bn.label,
    severity: bn.severity,
    explainability: bn.explainability,
  };
}
