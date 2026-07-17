/**
 * Executive Workspace — server data loader (Sprint 015).
 *
 * Composes existing Intelligence / Execution / Collaboration APIs.
 * No duplicated business logic — projection and orchestration only.
 */

import { getSessionUser } from "@/lib/auth/session";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import { getExecutiveKPIs, type ExecutiveKPIs } from "@/lib/executive/kpis";
import { createGoalExecutionEngine } from "@/lib/platform/execution";
import type {
  ExecutionGoal,
  ExecutionProgressSnapshot,
  ExecutionScorecard,
} from "@/lib/platform/execution/types";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { requirePermission } from "@/lib/platform/identity/permissions";
import {
  createDecisionIntelligenceDomain,
  type DecisionIntelligenceResult,
} from "@/lib/platform/intelligence/decision";
import {
  createExecutiveIntelligenceDomain,
  type ExecutiveIntelligenceResult,
} from "@/lib/platform/intelligence/domains/executive";
import {
  createStrategicIntelligenceDomain,
  type StrategicIntelligenceResult,
} from "@/lib/platform/intelligence/domains/strategic";
import {
  createOrganizationalIntelligence,
  type OrganizationMetricSample,
  type OrganizationObservationResult,
} from "@/lib/platform/intelligence/organization";
import { createPersistentIntelligenceMemory } from "@/lib/platform/intelligence/memory/index";
import { createSharedIntelligenceContextBuilder } from "@/lib/platform/intelligence/context/builder";
import type { IntelligencePersistentMemoryRecord } from "@/lib/platform/intelligence/memory/types";
import {
  createJagCollaborationEngine,
  type JagCollaborationResult,
} from "@/lib/platform/jag/collaboration";
import { createAuthClient } from "@/lib/supabase/server-auth";

/** Linked context for conversation recommendations. */
export interface ExecutiveWorkspaceLinks {
  evidenceIds: string[];
  memoryIds: string[];
  goalIds: string[];
  executionIds: string[];
  decisionId: string | null;
  organizationRequestId: string | null;
}

export interface ExecutiveWorkspaceData {
  fullName: string;
  roleLabel: string;
  organizationId: string | null;
  schoolId: string | null;
  generatedAt: string;
  kpis: ExecutiveKPIs | null;
  sharedContextRequestId: string | null;
  organization: OrganizationObservationResult | null;
  executive: ExecutiveIntelligenceResult | null;
  strategic: StrategicIntelligenceResult | null;
  decision: DecisionIntelligenceResult | null;
  collaboration: JagCollaborationResult | null;
  executionGoals: ExecutionGoal[];
  executionProgress: ExecutionProgressSnapshot[];
  scorecards: ExecutionScorecard[];
  memories: IntelligencePersistentMemoryRecord[];
  links: ExecutiveWorkspaceLinks;
  accessError: string | null;
}

function mapKpisToMetrics(kpis: ExecutiveKPIs, observedAt: string): OrganizationMetricSample[] {
  return [
    {
      key: "enrollment_count",
      label: "Enrollment",
      value: kpis.enrollment,
      observedAt,
    },
    {
      key: "attendance_rate",
      label: "Student attendance",
      value: kpis.studentAttendance,
      unit: "%",
      observedAt,
    },
    {
      key: "kpi_on_track_pct",
      label: "Teacher attendance",
      value: kpis.teacherAttendance,
      unit: "%",
      observedAt,
    },
    {
      key: "budget_variance_pct",
      label: "Outstanding receivables proxy",
      value: kpis.revenue > 0 ? Math.round((kpis.outstanding / kpis.revenue) * 100) : 0,
      unit: "%",
      observedAt,
    },
    {
      key: "vacancy_related_staff",
      label: "Staff count",
      value: kpis.staff,
      observedAt,
    },
  ];
}

/**
 * Load the Executive Workspace from existing platform services.
 */
export async function loadExecutiveWorkspace(): Promise<ExecutiveWorkspaceData> {
  const generatedAt = new Date().toISOString();
  const sessionUser = await getSessionUser();
  const ctx = await getIdentityContext();

  if (!sessionUser || !ctx) {
    return emptyWorkspace("Unauthorized", generatedAt);
  }

  const supabase = await createAuthClient();
  const gate = await requirePermission(supabase, "executive.dashboard");
  const intelGate = gate.ok
    ? gate
    : await requirePermission(supabase, "executive.intelligence");
  if (!intelGate.ok) {
    return {
      ...emptyWorkspace("Forbidden", generatedAt),
      fullName: ctx.fullName,
      roleLabel: ctx.roleLabel,
    };
  }

  const organizationId = await getPrimaryOrganizationId(supabase);
  const schoolId =
    ctx.orgAssignments.find((a) => a.is_primary)?.school_id ||
    ctx.accessibleSchoolIds[0] ||
    null;

  let kpis: ExecutiveKPIs | null = null;
  try {
    kpis = await getExecutiveKPIs({ supabase });
  } catch {
    kpis = null;
  }

  const sharedBuilder = createSharedIntelligenceContextBuilder();
  const sharedContext = await sharedBuilder.build({
    organizationId,
    schoolId,
    userId: ctx.id,
    runId: `jag-workspace:${generatedAt}`,
  });

  const memory = createPersistentIntelligenceMemory();
  const subject = "Executive workspace continuous review";
  const description =
    "Organization health, strategic posture, decisions, and execution for the executive morning workspace";

  const executiveResolver = createExecutiveIntelligenceDomain();
  const strategicResolver = createStrategicIntelligenceDomain();
  const decisionResolver = createDecisionIntelligenceDomain();
  const { observer } = createOrganizationalIntelligence({ memory });
  const collaborationEngine = createJagCollaborationEngine({ memory });
  const goalEngine = createGoalExecutionEngine();

  const executive = executiveResolver.analyze({
    requestId: `exec-${generatedAt}`,
    subject,
    description,
    metadata: { sharedContext },
  });

  const strategic = strategicResolver.analyze({
    requestId: `strat-${generatedAt}`,
    subject,
    description,
    organizationId,
    schoolId,
    findings: kpis
      ? [
          {
            findingId: "kpi-enrollment",
            title: "Enrollment posture",
            summary: `Current enrollment ${kpis.enrollment}; attendance ${kpis.studentAttendance}%`,
            severity: kpis.studentAttendance < 90 ? "high" : "medium",
            kindHints: ["growth_opportunity"],
            confidence: { value: 0.7, level: "medium", factors: [] },
            signals: ["enrollment", "attendance"],
          },
        ]
      : undefined,
    metadata: { sharedContext },
  });

  const imported = await goalEngine.importStrategic({
    strategic,
    sharedContext,
    organizationId,
    schoolId,
  });

  const executionGoals = [...imported.goals];
  const executionProgress: ExecutionProgressSnapshot[] = [];
  const scorecards: ExecutionScorecard[] = [];
  for (const goal of executionGoals) {
    executionProgress.push(await goalEngine.progress.calculateGoal(goal.id));
    scorecards.push(await goalEngine.scorecards.generate(goal.id));
  }

  const organization = await observer.observe({
    requestId: `org-${generatedAt}`,
    organizationId,
    schoolId,
    observedAt: generatedAt,
    metrics: kpis ? mapKpisToMetrics(kpis, generatedAt) : [],
    sharedContext,
    strategic,
    executive,
    executionGoals,
    executionProgress,
  });

  const decision = decisionResolver.analyze({
    requestId: `decision-${generatedAt}`,
    subject: "Prioritize executive actions for this workspace cycle",
    description,
    organizationId,
    schoolId,
    sharedContext,
    strategic,
    executionGoals,
    executionProgress,
    memories: undefined,
    kpis: kpis
      ? [
          {
            key: "enrollment",
            label: "Enrollment",
            value: kpis.enrollment,
          },
          {
            key: "student_attendance",
            label: "Student attendance",
            value: kpis.studentAttendance,
            unit: "%",
            target: 95,
          },
        ]
      : undefined,
    metadata: { sharedContext },
  });

  const collaboration = await collaborationEngine.collaborate({
    requestId: `collab-${generatedAt}`,
    subject,
    description,
    organizationId,
    schoolId,
    sharedContext,
    preferredAgents: ["executive", "strategic", "decision"],
    evidenceRefs: decision.evidence.items.slice(0, 5).map((item) => ({
      evidenceId: item.evidenceId,
      label: item.title,
      weight: item.weight,
    })),
  });

  const memories = (
    await memory.findRelatedMemory({
      text: subject,
      organizationId,
      limit: 12,
    })
  );

  const links: ExecutiveWorkspaceLinks = {
    evidenceIds: decision.evidence.items.map((i) => i.evidenceId),
    memoryIds: memories.map((m) => m.id),
    goalIds: executionGoals.map((g) => g.id),
    executionIds: executionProgress.map((p) => p.subjectId),
    decisionId: decision.requestId,
    organizationRequestId: organization.requestId,
  };

  return {
    fullName: ctx.fullName,
    roleLabel: ctx.roleLabel,
    organizationId,
    schoolId,
    generatedAt,
    kpis,
    sharedContextRequestId: sharedContext.requestId,
    organization,
    executive,
    strategic,
    decision,
    collaboration,
    executionGoals,
    executionProgress,
    scorecards,
    memories,
    links,
    accessError: null,
  };
}

function emptyWorkspace(
  accessError: string,
  generatedAt: string
): ExecutiveWorkspaceData {
  return {
    fullName: "",
    roleLabel: "",
    organizationId: null,
    schoolId: null,
    generatedAt,
    kpis: null,
    sharedContextRequestId: null,
    organization: null,
    executive: null,
    strategic: null,
    decision: null,
    collaboration: null,
    executionGoals: [],
    executionProgress: [],
    scorecards: [],
    memories: [],
    links: {
      evidenceIds: [],
      memoryIds: [],
      goalIds: [],
      executionIds: [],
      decisionId: null,
      organizationRequestId: null,
    },
    accessError,
  };
}
