/**
 * Communication Graph intelligence (Sprint 076 + RC-3.02).
 * Communication Graph, Collaboration Network, Response Latency, Department Interaction,
 * Meeting Density, Communication Trends + executive alerts.
 */

import type { CollaborationCanonicalEntity } from "@/lib/platform/integrations/connectors/collaboration/entities";
import { collaborationStore } from "@/lib/platform/integrations/connectors/collaboration/services/store";
import { buildCollaborationKnowledgeGraph } from "@/lib/platform/integrations/connectors/collaboration/mapping";
import {
  buildCollaborationExecutiveAlerts,
  type CollaborationExecutiveAlert,
} from "@/lib/platform/integrations/connectors/collaboration/intelligence/executive-alerts";

export type CommunicationGraphNode = {
  id: string;
  kind: "Person" | "Organization" | "Meeting" | "Communication";
  label: string;
  provider?: string;
  metrics?: {
    messageCount?: number;
    avgResponseLatencyMinutes?: number;
    meetingMinutes?: number;
  };
};

export type CommunicationGraphEdge = {
  id: string;
  type: string;
  from: string;
  to: string;
  weight: number;
};

export type SiloSignal = {
  id: string;
  channelOrTeamId: string;
  label: string;
  memberCount: number;
  crossGroupLinks: number;
  severity: "low" | "medium" | "high";
  explainability: string;
};

export type LatencySignal = {
  id: string;
  label: string;
  avgResponseLatencyMinutes: number;
  sampleSize: number;
  severity: "low" | "medium" | "high";
};

export type DensitySignal = {
  id: string;
  label: string;
  density: number;
  activeParticipants: number;
  messageCount: number;
};

export type BottleneckSignal = {
  id: string;
  label: string;
  kind: "latency" | "silo" | "meeting_load" | "single_point";
  severity: "low" | "medium" | "high";
  explainability: string;
};

/** Weighted person↔person / person↔team links for Collaboration Network. */
export type CollaborationNetworkLink = {
  id: string;
  from: string;
  to: string;
  weight: number;
  type: string;
};

export type DepartmentInteraction = {
  id: string;
  fromDepartment: string;
  toDepartment: string;
  messageCount: number;
  strength: number;
};

export type MeetingDensitySignal = {
  id: string;
  label: string;
  meetingCount: number;
  totalMinutes: number;
  avgParticipants: number;
  densityScore: number;
};

export type CommunicationTrendPoint = {
  day: string;
  messages: number;
  meetings: number;
  meetingMinutes: number;
};

export type CommunicationGraph = {
  organizationId: string;
  builtAt: string;
  nodes: CommunicationGraphNode[];
  edges: CommunicationGraphEdge[];
  /** Alias surface — Collaboration Network */
  collaborationNetwork: CollaborationNetworkLink[];
  silos: SiloSignal[];
  responseLatency: LatencySignal[];
  collaborationDensity: DensitySignal[];
  departmentInteraction: DepartmentInteraction[];
  meetingDensity: MeetingDensitySignal[];
  communicationTrends: CommunicationTrendPoint[];
  bottlenecks: BottleneckSignal[];
  executiveAlerts: CollaborationExecutiveAlert[];
  scores: {
    communicationHealth: number;
    avgResponseMinutes: number;
    activeTeams: number;
    meetingLoadMinutes: number;
    meetingDensityScore: number;
  };
};

function num(v: unknown): number {
  return Number(v ?? 0);
}

function severityFromLatency(minutes: number): "low" | "medium" | "high" {
  if (minutes >= 120) return "high";
  if (minutes >= 45) return "medium";
  return "low";
}

export function buildCommunicationGraph(organizationId: string): CommunicationGraph | null {
  const records = collaborationStore.allRecords(organizationId);
  if (!records.length) return null;

  const kg = buildCollaborationKnowledgeGraph(records);
  const nodes: CommunicationGraphNode[] = kg.nodes.map((n) => ({
    id: n.nodeId,
    kind: n.entityType as CommunicationGraphNode["kind"],
    label: n.label,
    provider: typeof n.properties.provider === "string" ? n.properties.provider : undefined,
  }));

  const edges: CommunicationGraphEdge[] = kg.relationships.map((r) => ({
    id: r.relationshipId,
    type: r.type,
    from: r.fromNodeId,
    to: r.toNodeId,
    weight: 1,
  }));

  // Add user↔channel participation edges from message attributes.
  const users = records.filter((r) => r.objectType === "user");
  const channels = records.filter(
    (r) => r.objectType === "channel" || r.objectType === "team"
  );
  const messages = records.filter(
    (r) => r.objectType === "message" || r.objectType === "chat"
  );
  const meets = records.filter((r) => r.objectType === "meet");

  const participation = new Map<string, Set<string>>();
  for (const message of messages) {
    const userId = String(message.attributes.userId ?? "");
    const channelId = String(
      message.attributes.channelId ?? message.attributes.teamId ?? ""
    );
    if (!userId || !channelId) continue;
    const set = participation.get(channelId) ?? new Set();
    set.add(userId);
    participation.set(channelId, set);
    edges.push({
      id: `edge-${userId}-${channelId}`,
      type: "ACTIVE_IN",
      from: `prod:Person:${userId}`,
      to: `prod:Organization:${channelId}`,
      weight: 1,
    });
  }

  const silos = detectSilos(channels, participation, users.length);
  const responseLatency = detectResponseLatency(messages);
  const collaborationDensity = detectDensity(channels, messages, participation);
  const bottlenecks = detectBottlenecks(silos, responseLatency, meets, users, messages);
  const collaborationNetwork = buildCollaborationNetwork(edges, participation);
  const departmentInteraction = detectDepartmentInteraction(users, messages);
  const meetingDensity = detectMeetingDensity(meets);
  const communicationTrends = buildCommunicationTrends(messages, meets);

  const avgResponseMinutes =
    responseLatency.length === 0
      ? 0
      : responseLatency.reduce((s, r) => s + r.avgResponseLatencyMinutes, 0) /
        responseLatency.length;

  const meetingLoadMinutes = meets.reduce((s, m) => s + num(m.attributes.durationMinutes), 0);
  const activeTeams = channels.filter((c) => (participation.get(c.externalId)?.size ?? 0) > 0)
    .length;
  const meetingDensityScore =
    meetingDensity.length === 0
      ? 0
      : Math.round(
          meetingDensity.reduce((s, d) => s + d.densityScore, 0) / meetingDensity.length
        );

  const communicationHealth = clamp(
    100 -
      silos.filter((s) => s.severity === "high").length * 12 -
      responseLatency.filter((r) => r.severity === "high").length * 10 -
      bottlenecks.filter((b) => b.severity === "high").length * 8 +
      collaborationDensity.reduce((s, d) => s + d.density, 0) * 2
  );

  // Attach metrics to person nodes.
  for (const node of nodes) {
    if (node.kind !== "Person") continue;
    const userMessages = messages.filter(
      (m) => String(m.attributes.userId) === node.id.replace("prod:Person:", "")
    );
    const latencies = userMessages
      .map((m) => num(m.attributes.responseLatencyMinutes))
      .filter((n) => n > 0);
    node.metrics = {
      messageCount: userMessages.length,
      avgResponseLatencyMinutes:
        latencies.length === 0
          ? 0
          : latencies.reduce((a, b) => a + b, 0) / latencies.length,
      meetingMinutes: meets
        .filter((m) => {
          const parts = m.attributes.participants;
          const email = users.find(
            (u) => u.externalId === node.id.replace("prod:Person:", "")
          )?.attributes.email;
          return (
            Array.isArray(parts) &&
            typeof email === "string" &&
            parts.map(String).includes(email)
          );
        })
        .reduce((s, m) => s + num(m.attributes.durationMinutes), 0),
    };
  }

  const executiveAlerts = buildCollaborationExecutiveAlerts({
    silos,
    bottlenecks,
    users,
    messages,
    meets,
  });

  return {
    organizationId,
    builtAt: new Date().toISOString(),
    nodes,
    edges,
    collaborationNetwork,
    silos,
    responseLatency,
    collaborationDensity,
    departmentInteraction,
    meetingDensity,
    communicationTrends,
    bottlenecks,
    executiveAlerts,
    scores: {
      communicationHealth,
      avgResponseMinutes: Math.round(avgResponseMinutes * 10) / 10,
      activeTeams,
      meetingLoadMinutes,
      meetingDensityScore,
    },
  };
}

function detectSilos(
  channels: CollaborationCanonicalEntity[],
  participation: Map<string, Set<string>>,
  totalUsers: number
): SiloSignal[] {
  return channels
    .map((channel, idx) => {
      const members = participation.get(channel.externalId)?.size ?? num(channel.attributes.memberCount);
      const crossGroupLinks = Math.max(0, members > 0 ? totalUsers - members : 0);
      const siloHint = channel.attributes.siloHint === true || members <= 2;
      const ratio = totalUsers ? members / totalUsers : 0;
      const severity: SiloSignal["severity"] =
        siloHint || ratio <= 0.25 ? "high" : ratio <= 0.5 ? "medium" : "low";
      return {
        id: `silo-${idx}`,
        channelOrTeamId: channel.externalId,
        label: String(channel.attributes.name ?? channel.externalId),
        memberCount: members,
        crossGroupLinks,
        severity,
        explainability: siloHint
          ? "Low cross-team participation — potential communication silo."
          : "Healthy membership relative to org size.",
      };
    })
    .filter((s) => s.severity !== "low");
}

function detectResponseLatency(
  messages: CollaborationCanonicalEntity[]
): LatencySignal[] {
  const byChannel = new Map<string, number[]>();
  for (const message of messages) {
    const channelId = String(
      message.attributes.channelId ?? message.attributes.teamId ?? "org"
    );
    const latency = num(message.attributes.responseLatencyMinutes);
    if (latency <= 0) continue;
    const list = byChannel.get(channelId) ?? [];
    list.push(latency);
    byChannel.set(channelId, list);
  }
  return [...byChannel.entries()].map(([channelId, samples], idx) => {
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    return {
      id: `lat-${idx}`,
      label: channelId,
      avgResponseLatencyMinutes: Math.round(avg * 10) / 10,
      sampleSize: samples.length,
      severity: severityFromLatency(avg),
    };
  });
}

function detectDensity(
  channels: CollaborationCanonicalEntity[],
  messages: CollaborationCanonicalEntity[],
  participation: Map<string, Set<string>>
): DensitySignal[] {
  return channels.map((channel, idx) => {
    const channelMessages = messages.filter(
      (m) =>
        String(m.attributes.channelId ?? m.attributes.teamId) === channel.externalId
    );
    const activeParticipants = participation.get(channel.externalId)?.size ?? 0;
    const memberCount = Math.max(
      activeParticipants,
      num(channel.attributes.memberCount),
      1
    );
    const density = Math.round((activeParticipants / memberCount) * 100);
    return {
      id: `den-${idx}`,
      label: String(channel.attributes.name ?? channel.externalId),
      density,
      activeParticipants,
      messageCount: channelMessages.length,
    };
  });
}

function detectBottlenecks(
  silos: SiloSignal[],
  latency: LatencySignal[],
  meets: CollaborationCanonicalEntity[],
  users: CollaborationCanonicalEntity[],
  messages: CollaborationCanonicalEntity[]
): BottleneckSignal[] {
  const out: BottleneckSignal[] = [];

  for (const silo of silos.filter((s) => s.severity === "high")) {
    out.push({
      id: `bn-silo-${silo.id}`,
      label: silo.label,
      kind: "silo",
      severity: "high",
      explainability: silo.explainability,
    });
  }

  for (const lat of latency.filter((l) => l.severity !== "low")) {
    out.push({
      id: `bn-lat-${lat.id}`,
      label: lat.label,
      kind: "latency",
      severity: lat.severity,
      explainability: `Average response latency ${lat.avgResponseLatencyMinutes} minutes across ${lat.sampleSize} samples.`,
    });
  }

  const meetingLoad = meets.reduce((s, m) => s + num(m.attributes.durationMinutes), 0);
  if (meetingLoad >= 90) {
    out.push({
      id: "bn-meet-load",
      label: "Meeting load",
      kind: "meeting_load",
      severity: meetingLoad >= 120 ? "high" : "medium",
      explainability: `${meetingLoad} meeting minutes observed — collaboration capacity pressure.`,
    });
  }

  // Single-point: one user dominates message volume.
  const byUser = new Map<string, number>();
  for (const message of messages) {
    const userId = String(message.attributes.userId ?? "");
    if (!userId) continue;
    byUser.set(userId, (byUser.get(userId) ?? 0) + 1);
  }
  if (messages.length > 0 && users.length > 1) {
    const top = [...byUser.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] / messages.length >= 0.5) {
      const user = users.find((u) => u.externalId === top[0]);
      out.push({
        id: "bn-single-point",
        label: String(user?.attributes.name ?? top[0]),
        kind: "single_point",
        severity: "medium",
        explainability: "One participant accounts for ≥50% of messages — potential bottleneck.",
      });
    }
  }

  return out;
}

function buildCollaborationNetwork(
  edges: CommunicationGraphEdge[],
  participation: Map<string, Set<string>>
): CollaborationNetworkLink[] {
  const weights = new Map<string, CollaborationNetworkLink>();
  for (const edge of edges) {
    const key = `${edge.from}->${edge.to}:${edge.type}`;
    const existing = weights.get(key);
    if (existing) {
      existing.weight += edge.weight;
    } else {
      weights.set(key, {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        weight: edge.weight,
        type: edge.type,
      });
    }
  }
  // Co-participation links between users in the same channel.
  for (const [channelId, members] of participation.entries()) {
    const list = [...members];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        const from = `prod:Person:${a}`;
        const to = `prod:Person:${b}`;
        const key = `${from}->${to}:COLLABORATES_WITH`;
        const existing = weights.get(key);
        if (existing) existing.weight += 1;
        else {
          weights.set(key, {
            id: `net-${channelId}-${a}-${b}`,
            from,
            to,
            weight: 1,
            type: "COLLABORATES_WITH",
          });
        }
      }
    }
  }
  return [...weights.values()].sort((a, b) => b.weight - a.weight);
}

function detectDepartmentInteraction(
  users: CollaborationCanonicalEntity[],
  messages: CollaborationCanonicalEntity[]
): DepartmentInteraction[] {
  const deptByUser = new Map<string, string>();
  for (const user of users) {
    const dept = String(user.attributes.department ?? "Unknown");
    deptByUser.set(user.externalId, dept);
  }
  const counts = new Map<string, number>();
  for (const message of messages) {
    const fromDept = deptByUser.get(String(message.attributes.userId ?? "")) ?? "Unknown";
    // Treat channel/team as a soft "to" department when tagged; else mirror sender.
    const toDept =
      String(message.attributes.toDepartment ?? message.attributes.department ?? "") ||
      fromDept;
    const key = `${fromDept}::${toDept}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const max = Math.max(1, ...counts.values());
  return [...counts.entries()].map(([key, messageCount], idx) => {
    const [fromDepartment, toDepartment] = key.split("::");
    return {
      id: `dept-${idx}`,
      fromDepartment: fromDepartment ?? "Unknown",
      toDepartment: toDepartment ?? "Unknown",
      messageCount,
      strength: Math.round((messageCount / max) * 100),
    };
  });
}

function detectMeetingDensity(
  meets: CollaborationCanonicalEntity[]
): MeetingDensitySignal[] {
  if (!meets.length) return [];
  const byDay = new Map<string, CollaborationCanonicalEntity[]>();
  for (const meet of meets) {
    const day = String(meet.attributes.startAt ?? meet.syncedAt).slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(meet);
    byDay.set(day, list);
  }
  return [...byDay.entries()].map(([day, dayMeets], idx) => {
    const totalMinutes = dayMeets.reduce(
      (s, m) => s + num(m.attributes.durationMinutes),
      0
    );
    const avgParticipants =
      dayMeets.reduce((s, m) => s + num(m.attributes.participantCount), 0) /
      dayMeets.length;
    const densityScore = clamp(dayMeets.length * 12 + totalMinutes / 5 + avgParticipants * 4);
    return {
      id: `md-${idx}`,
      label: day,
      meetingCount: dayMeets.length,
      totalMinutes,
      avgParticipants: Math.round(avgParticipants * 10) / 10,
      densityScore,
    };
  });
}

function buildCommunicationTrends(
  messages: CollaborationCanonicalEntity[],
  meets: CollaborationCanonicalEntity[]
): CommunicationTrendPoint[] {
  const byDay = new Map<string, CommunicationTrendPoint>();
  const ensure = (day: string) => {
    const existing = byDay.get(day);
    if (existing) return existing;
    const point: CommunicationTrendPoint = {
      day,
      messages: 0,
      meetings: 0,
      meetingMinutes: 0,
    };
    byDay.set(day, point);
    return point;
  };
  for (const message of messages) {
    const day = String(
      message.attributes.sentAt ?? message.syncedAt ?? message.attributes.updatedAt ?? ""
    ).slice(0, 10);
    if (!day) continue;
    ensure(day).messages += 1;
  }
  for (const meet of meets) {
    const day = String(meet.attributes.startAt ?? meet.syncedAt).slice(0, 10);
    if (!day) continue;
    const point = ensure(day);
    point.meetings += 1;
    point.meetingMinutes += num(meet.attributes.durationMinutes);
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
