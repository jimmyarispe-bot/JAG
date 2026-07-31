import { cache } from "react";
import {
  ACADEMYOS_APPLICATION_KEY,
  PLATFORM_NAME,
} from "@/lib/platform/applications/catalog";
import { listFounderApplications, selectActiveApplication } from "@/lib/platform/founder/application-overview";
import { buildFounderMorningBrief } from "@/lib/platform/founder/briefing";
import { AutomationService } from "@/lib/platform/automation/operating";
import { DecisionService } from "@/lib/platform/decisions";
import { NotificationService } from "@/lib/platform/notifications";
import { ExecutiveIntelligenceService } from "@/lib/platform/intelligence/executive-layer";
import { ForecastingService } from "@/lib/platform/intelligence/forecasting";
import { OperationalPersistence } from "@/lib/platform/persistence";
import {
  aggregateOverallHealth,
  buildFounderMetrics,
} from "@/lib/platform/founder/health";
import {
  buildFounderNavigation,
  resolveFounderNavScope,
} from "@/lib/platform/founder/navigation";
import {
  buildOrganizationOverview,
  selectActiveOrganization,
} from "@/lib/platform/founder/organization-overview";
import {
  adaptExecutiveAlertsToFounder,
  alertsFromMetrics,
  countOpenRisks,
} from "@/lib/platform/founder/risk";
import type {
  FounderActor,
  FounderAlert,
  FounderMetric,
  FounderOrganizationSummary,
  FounderWorkspaceContext,
  ResolveFounderWorkspaceInput,
} from "@/lib/platform/founder/types";
import { getIdentityContext } from "@/lib/platform/identity/context";
import { hasPermission, toAuthzSnapshot } from "@/lib/platform/identity/authorization-service";
import { OrganizationService } from "@/lib/platform/organizations";
import { createAuthClient } from "@/lib/supabase/server-auth";

export type AssembleFounderWorkspaceInput = {
  actor: FounderActor;
  organizations: FounderOrganizationSummary[];
  metrics?: FounderMetric[];
  alerts?: FounderAlert[];
  organizationId?: string | null;
  applicationKey?: string | null;
  pendingApprovalCount?: number | null;
  systemHealthScore?: number | null;
  executiveMetrics?: import("@/lib/platform/executive-metrics/types").ExecutiveMetric[];
  generatedAt?: string;
};

/**
 * Pure assembly of FounderWorkspaceContext (unit-testable).
 * One object powers the Founder experience.
 */
export function assembleFounderWorkspace(
  input: AssembleFounderWorkspaceInput
): FounderWorkspaceContext {
  const scope = resolveFounderNavScope({
    organizationId: input.organizationId,
    applicationKey: input.applicationKey,
  });

  const applications = listFounderApplications(input.organizations);
  const activeOrganization = selectActiveOrganization(
    input.organizations,
    input.organizationId
  );
  const activeApplication = selectActiveApplication(
    applications,
    input.applicationKey ??
      (scope.kind === "application" || scope.kind === "application_organization"
        ? scope.applicationKey
        : null)
  );

  const seedAlerts = input.alerts ?? [];
  const metrics =
    input.metrics ??
    buildFounderMetrics({
      executiveMetrics: input.executiveMetrics,
      openRiskCount: countOpenRisks(seedAlerts),
      pendingApprovalCount: input.pendingApprovalCount ?? 0,
      systemHealthScore: input.systemHealthScore ?? null,
    });

  const metricAlerts = alertsFromMetrics(
    metrics,
    activeOrganization?.id ?? null
  );
  const alerts = dedupeAlerts([...seedAlerts, ...metricAlerts]);
  const unreadAlertCount = alerts.filter((a) => a.unread).length;
  const openRiskCount = countOpenRisks(alerts);
  const pendingFromMetric = metrics.find((m) => m.key === "pending_approvals")?.value;
  const pendingApprovalCount =
    input.pendingApprovalCount ??
    (typeof pendingFromMetric === "number" ? pendingFromMetric : 0);

  // Refresh open_risks / pending on metrics for consistency
  const metricsSynced = buildFounderMetrics({
    executiveMetrics: input.executiveMetrics,
    openRiskCount,
    pendingApprovalCount: typeof pendingApprovalCount === "number" ? pendingApprovalCount : 0,
    systemHealthScore:
      input.systemHealthScore ??
      metrics.find((m) => m.key === "system_health")?.value ??
      null,
  });

  const overall = aggregateOverallHealth(metricsSynced);
  const byOrganization: FounderWorkspaceContext["health"]["byOrganization"] = {};
  for (const org of input.organizations) {
    byOrganization[org.id] = {
      score: org.healthScore,
      band: org.healthBand,
    };
  }

  const navigation = buildFounderNavigation({
    organizations: input.organizations,
    applications,
    activeScope: scope,
  });

  const intelligence = ExecutiveIntelligenceService.analyzeFromFounderMetrics({
    organizationId: activeOrganization?.id ?? null,
    metrics: metricsSynced,
    observedAt: input.generatedAt,
  });

  DecisionService.syncFromIntelligence(intelligence, {
    applicationId: activeApplication?.key ?? "academyos",
    actorUserId: input.actor.userId,
    now: input.generatedAt,
  });

  const observedAt = input.generatedAt ?? new Date().toISOString();
  const automationStatus = AutomationService.syncFromIntelligenceSignals({
    organizationId: activeOrganization?.id ?? intelligence.organizationId,
    applicationId: activeApplication?.key ?? "academyos",
    observedAt,
    signals: intelligence.signals,
    actorUserId: input.actor.userId,
  });

  const decisionQueue = DecisionService.getQueue(
    activeOrganization?.id ?? intelligence.organizationId
  );
  const decisionAccountability = NotificationService.founderBuckets(
    decisionQueue.decisions,
    observedAt
  );

  const briefing = buildFounderMorningBrief({
    metrics: metricsSynced,
    alerts,
    scope,
    generatedAt: input.generatedAt,
    intelligence,
  });

  // Forecasting consumes metrics + Sprint 069 repos; does not alter EI.
  const forecasts = ForecastingService.analyzeFromFounderMetrics({
    organizationId: activeOrganization?.id ?? intelligence.organizationId,
    metrics: metricsSynced,
    observedAt,
    scenarioId: "baseline",
  });

  return {
    actor: input.actor,
    scope,
    platformName: PLATFORM_NAME,
    organizations: input.organizations,
    applications,
    activeOrganization,
    activeApplication,
    metrics: metricsSynced,
    alerts,
    unreadAlertCount,
    health: {
      overallScore: overall.score,
      overallBand: overall.band,
      byOrganization,
    },
    openRiskCount,
    pendingApprovalCount:
      typeof pendingApprovalCount === "number" ? pendingApprovalCount : 0,
    navigation,
    briefing,
    intelligence,
    decisionQueue,
    decisionAccountability,
    automationStatus,
    forecasts,
    generatedAt: observedAt,
  };
}

function dedupeAlerts(alerts: FounderAlert[]): FounderAlert[] {
  const seen = new Set<string>();
  const out: FounderAlert[] = [];
  for (const a of alerts) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}

async function loadOrganizationSummaries(
  focusOrganizationId?: string | null
): Promise<FounderOrganizationSummary[]> {
  const supabase = await createAuthClient();
  const { data: rows } = await supabase
    .from("org_organizations")
    .select("id, slug, name, status, settings")
    .eq("status", "active")
    .order("name")
    .limit(50);

  const list = rows ?? [];
  if (!list.length && focusOrganizationId) {
    const ctx = await OrganizationService.resolve({
      organizationId: focusOrganizationId,
    });
    return [
      buildOrganizationOverview({
        id: ctx.organization.id,
        slug: ctx.organization.slug,
        name: ctx.organization.name,
        status: ctx.organization.status,
        featureFlags: ctx.features,
        enabledApplicationKeys: ctx.application.snapshot.enabledApplicationKeys,
        healthScore: null,
      }),
    ];
  }

  const summaries: FounderOrganizationSummary[] = [];
  for (const row of list) {
    const ctx = await OrganizationService.resolve({ organizationId: row.id });
    summaries.push(
      buildOrganizationOverview({
        id: row.id,
        slug: row.slug,
        name: row.name,
        status: row.status,
        featureFlags: ctx.features,
        enabledApplicationKeys: ctx.application.snapshot.enabledApplicationKeys,
        healthScore: null,
      })
    );
  }
  return summaries;
}

const resolveFounderWorkspaceCached = cache(
  async (cacheKey: string): Promise<FounderWorkspaceContext | null> => {
    const input = JSON.parse(cacheKey) as ResolveFounderWorkspaceInput;
    const identity = await getIdentityContext();
    if (!identity) return null;

    const snapshot = toAuthzSnapshot(identity);
    if (!hasPermission(snapshot, "JAG_ACCESS")) {
      return null;
    }

    const actor: FounderActor = {
      userId: identity.effectiveUserId,
      displayName: identity.fullName?.trim() || identity.email || "Founder",
      email: identity.email ?? null,
      hasJagAccess: true,
    };

    const orgCtx = await OrganizationService.resolve({
      organizationId: input.organizationId ?? null,
      userId: identity.effectiveUserId,
      applicationKey: input.applicationKey ?? ACADEMYOS_APPLICATION_KEY,
    });

    const organizations = await loadOrganizationSummaries(
      input.organizationId ?? orgCtx.organization.id
    );

    let executiveMetrics: import("@/lib/platform/executive-metrics/types").ExecutiveMetric[] =
      [];
    let alerts: FounderAlert[] = [];
    let pendingApprovalCount = 0;

    try {
      const supabase = await createAuthClient();
      const orgId = input.organizationId ?? orgCtx.organization.id;
      const { getExecutiveAggregateMetrics } = await import(
        "@/lib/platform/executive-metrics"
      );
      const aggregate = await getExecutiveAggregateMetrics(supabase, {
        organizationId: orgId,
      });
      executiveMetrics = aggregate.metrics;

      const { getExecutiveAlerts } = await import(
        "@/lib/platform/executive-alerts"
      );
      const stream = await getExecutiveAlerts(supabase, {
        filters: { organizationId: orgId },
        limit: 40,
      });
      alerts = adaptExecutiveAlertsToFounder(
        stream.alerts.map((a) => ({
          id: a.id,
          title: a.title,
          message: a.description,
          severity: a.severity,
          category: a.category,
          organization: a.organization,
          createdAt: a.createdAt,
          status: a.status,
          recommendedAction: a.recommendedAction,
        })),
        input.applicationKey ?? ACADEMYOS_APPLICATION_KEY
      );
    } catch {
      // Soft-degrade: metrics/alerts optional for workspace shell.
    }

    try {
      const supabase = await createAuthClient();
      const { getExecutiveDecisionQueue } = await import(
        "@/lib/platform/executive-decisions"
      );
      const queue = await getExecutiveDecisionQueue(supabase, {
        filters: {
          organizationId: input.organizationId ?? orgCtx.organization.id,
        },
      });
      pendingApprovalCount = queue.decisions.length;
    } catch {
      pendingApprovalCount = 0;
    }

    // Ensure focus org present
    if (
      orgCtx.organization.id !== "platform" &&
      !organizations.some((o) => o.id === orgCtx.organization.id)
    ) {
      organizations.unshift(
        buildOrganizationOverview({
          id: orgCtx.organization.id,
          slug: orgCtx.organization.slug,
          name: orgCtx.organization.name,
          status: orgCtx.organization.status,
          featureFlags: orgCtx.features,
          enabledApplicationKeys: orgCtx.application.snapshot.enabledApplicationKeys,
        })
      );
    }

    const organizationId = input.organizationId ?? orgCtx.organization.id;
    const applicationKey = input.applicationKey ?? ACADEMYOS_APPLICATION_KEY;
    const assemble = () =>
      assembleFounderWorkspace({
        actor,
        organizations,
        organizationId,
        applicationKey,
        executiveMetrics,
        alerts,
        pendingApprovalCount,
        systemHealthScore: null,
      });

    try {
      const supabase = await createAuthClient();
      return await OperationalPersistence.runWithPersistence(
        supabase,
        assemble,
        { organizationId, applicationId: applicationKey }
      );
    } catch {
      // Soft-degrade when migrations are not applied yet — memory working set only.
      return assemble();
    }
  }
);

/**
 * Resolve Founder Workspace for the authenticated Founder (JAG_ACCESS).
 * Returns null when unauthenticated or lacking Founder access.
 */
export async function resolveFounderWorkspace(
  input: ResolveFounderWorkspaceInput = {}
): Promise<FounderWorkspaceContext | null> {
  const cacheKey = JSON.stringify({
    organizationId: input.organizationId ?? null,
    applicationKey: input.applicationKey ?? null,
  });
  return resolveFounderWorkspaceCached(cacheKey);
}

export const FounderWorkspaceService = {
  resolve: resolveFounderWorkspace,
  assemble: assembleFounderWorkspace,
} as const;
