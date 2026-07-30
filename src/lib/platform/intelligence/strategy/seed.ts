/**
 * Default strategic framework seed per organization — Sprint 205.
 */

import { GoalRegistry } from "./GoalRegistry";
import { InitiativeRegistry } from "./InitiativeRegistry";
import { MissionRegistry } from "./MissionRegistry";
import { StrategicPillarRegistry } from "./StrategicPillarRegistry";
import {
  STRATEGIC_PILLAR_KINDS,
  STRATEGIC_PILLAR_LABELS,
  type StrategicGoal,
  type StrategicInitiative,
  type StrategicPillar,
} from "./types";

const seededOrgs = new Set<string>();

export function resetStrategySeedForTests(): void {
  seededOrgs.clear();
}

export function ensureOrganizationStrategy(input: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly updatedBy?: string;
}): void {
  if (seededOrgs.has(input.organizationId)) return;
  if (MissionRegistry.get(input.organizationId)) {
    seededOrgs.add(input.organizationId);
    return;
  }

  const now = new Date();
  const iso = now.toISOString();
  const nextReview = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const target = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  MissionRegistry.upsert({
    id: `mission-${input.organizationId}`,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    mission: `Advance learning excellence and community trust at ${input.organizationName}.`,
    vision: `A resilient organization where every learner thrives and strategy guides daily decisions.`,
    coreValues: [
      "Student-centered excellence",
      "Evidence-informed stewardship",
      "Transparent leadership",
      "Operational integrity",
    ],
    planningHorizon: "18 months",
    reviewCadence: "Quarterly",
    nextReviewAt: nextReview,
    updatedAt: iso,
    updatedBy: input.updatedBy ?? "system",
  });

  const defaultKinds = STRATEGIC_PILLAR_KINDS.filter((k) => k !== "custom");
  const pillars: StrategicPillar[] = defaultKinds.map((kind, idx) => ({
    id: `pillar-${input.organizationId}-${kind}`,
    organizationId: input.organizationId,
    kind,
    label: STRATEGIC_PILLAR_LABELS[kind],
    description: `${STRATEGIC_PILLAR_LABELS[kind]} strategic pillar.`,
    sortOrder: idx,
    active: true,
  }));
  StrategicPillarRegistry.upsertMany(pillars);

  const goalSeeds: Array<{
    pillarKind: (typeof defaultKinds)[number];
    title: string;
    description: string;
    progress: number;
    health: StrategicGoal["health"];
    status: StrategicGoal["status"];
    priority: StrategicGoal["priority"];
    owner: string;
  }> = [
    {
      pillarKind: "student_outcomes",
      title: "Improve student mastery trajectories",
      description: "Raise grade-level mastery and close attendance-linked gaps.",
      progress: 0.42,
      health: "watch",
      status: "active",
      priority: "critical",
      owner: "Academic Lead",
    },
    {
      pillarKind: "family_experience",
      title: "Strengthen family engagement",
      description: "Increase conference participation and portal responsiveness.",
      progress: 0.58,
      health: "on_track",
      status: "active",
      priority: "high",
      owner: "Family Success",
    },
    {
      pillarKind: "financial_sustainability",
      title: "Stabilize funding readiness",
      description: "Protect runway and reduce unplanned budget pressure.",
      progress: 0.35,
      health: "at_risk",
      status: "at_risk",
      priority: "critical",
      owner: "Finance Lead",
    },
    {
      pillarKind: "team_excellence",
      title: "Reduce teacher turnover",
      description: "Retain instructional talent through targeted supports.",
      progress: 0.28,
      health: "at_risk",
      status: "active",
      priority: "high",
      owner: "People Ops",
    },
    {
      pillarKind: "operational_excellence",
      title: "Improve operational readiness",
      description: "Clear capacity bottlenecks and decision latency.",
      progress: 0.5,
      health: "on_track",
      status: "active",
      priority: "medium",
      owner: "Ops Lead",
    },
    {
      pillarKind: "compliance",
      title: "Maintain compliance posture",
      description: "Keep audits clean and policy reviews current.",
      progress: 0.72,
      health: "on_track",
      status: "active",
      priority: "high",
      owner: "Compliance",
    },
  ];

  const goals: StrategicGoal[] = goalSeeds.map((s, idx) => {
    const pillar = pillars.find((p) => p.kind === s.pillarKind)!;
    return {
      id: `goal-${input.organizationId}-${idx + 1}`,
      organizationId: input.organizationId,
      pillarId: pillar.id,
      title: s.title,
      description: s.description,
      owner: s.owner,
      priority: s.priority,
      status: s.status,
      progress: s.progress,
      health: s.health,
      confidence: 0.7,
      targetDate: target,
      evidence: [
        {
          id: `ev-goal-${idx + 1}`,
          source: "Strategy seed",
          summary: s.description,
        },
      ],
      relatedForecastIds: [],
      relatedScenarioIds: [],
      relatedDecisionIds: [],
      relatedOutcomeIds: [],
      relatedMemoryIds: [],
      programIds: [],
      projectIds: [],
      createdAt: iso,
      updatedAt: iso,
    };
  });
  GoalRegistry.upsertMany(goals);

  const initiatives: StrategicInitiative[] = [
    {
      id: `init-${input.organizationId}-1`,
      organizationId: input.organizationId,
      goalId: goals[0]!.id,
      title: "Attendance intervention sprint",
      description: "Targeted outreach for chronic absences.",
      owner: "Student Success",
      status: "active",
      progress: 0.4,
      impactScore: 0.78,
      targetDate: target,
      relatedDecisionIds: [],
      relatedExecutionIds: [],
      relatedOutcomeIds: [],
      createdAt: iso,
      updatedAt: iso,
    },
    {
      id: `init-${input.organizationId}-2`,
      organizationId: input.organizationId,
      goalId: goals[2]!.id,
      title: "Funding contingency plan",
      description: "Scenario-backed budget contingency.",
      owner: "Finance Lead",
      status: "behind",
      progress: 0.22,
      impactScore: 0.85,
      targetDate: target,
      relatedDecisionIds: [],
      relatedExecutionIds: [],
      relatedOutcomeIds: [],
      createdAt: iso,
      updatedAt: iso,
    },
    {
      id: `init-${input.organizationId}-3`,
      organizationId: input.organizationId,
      goalId: goals[3]!.id,
      title: "Retention stipend pilot",
      description: "Pilot retention supports for high-risk roles.",
      owner: "People Ops",
      status: "active",
      progress: 0.3,
      impactScore: 0.72,
      targetDate: target,
      relatedDecisionIds: [],
      relatedExecutionIds: [],
      relatedOutcomeIds: [],
      createdAt: iso,
      updatedAt: iso,
    },
    {
      id: `init-${input.organizationId}-4`,
      organizationId: input.organizationId,
      goalId: goals[1]!.id,
      title: "Family conference redesign",
      description: "Evening conference windows + clearer prep.",
      owner: "Family Success",
      status: "planned",
      progress: 0.1,
      impactScore: 0.6,
      targetDate: target,
      relatedDecisionIds: [],
      relatedExecutionIds: [],
      relatedOutcomeIds: [],
      createdAt: iso,
      updatedAt: iso,
    },
  ];
  InitiativeRegistry.upsertMany(initiatives);

  seededOrgs.add(input.organizationId);
}
