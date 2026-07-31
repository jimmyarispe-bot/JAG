import { buildLivenessReport } from "@/lib/observability/health";

export type FounderSystemStatusItem = {
  id: string;
  label: string;
  status: "healthy" | "degraded" | "unavailable" | "not_monitored";
  detail: string;
};

/**
 * Presentation mapping for Founder System Status.
 * Uses existing probes where available; otherwise "Not yet monitored".
 * Does not invent health scores.
 */
export function buildFounderSystemStatusItems(input?: {
  organizationResolutionOk?: boolean | null;
  executiveIntelligenceOk?: boolean | null;
}): FounderSystemStatusItem[] {
  const liveness = buildLivenessReport();
  const appCheck = liveness.checks[0];

  return [
    {
      id: "authentication",
      label: "Authentication",
      status: "not_monitored",
      detail: "Not yet monitored — session gated by JAG_ACCESS at route layout.",
    },
    {
      id: "organization_resolution",
      label: "Organization Resolution",
      status:
        input?.organizationResolutionOk == null
          ? "not_monitored"
          : input.organizationResolutionOk
            ? "healthy"
            : "degraded",
      detail:
        input?.organizationResolutionOk == null
          ? "Not yet monitored"
          : input.organizationResolutionOk
            ? "OrganizationService.resolve returned an organization context"
            : "Organization context unavailable",
    },
    {
      id: "executive_intelligence",
      label: "Executive Intelligence",
      status:
        input?.executiveIntelligenceOk == null
          ? "not_monitored"
          : input.executiveIntelligenceOk
            ? "healthy"
            : "degraded",
      detail:
        input?.executiveIntelligenceOk == null
          ? "Not yet monitored"
          : input.executiveIntelligenceOk
            ? "ExecutiveIntelligenceService produced a brief"
            : "Intelligence result missing",
    },
    {
      id: "background_jobs",
      label: "Background Jobs",
      status: "not_monitored",
      detail: "Not yet monitored",
    },
    {
      id: "database",
      label: "Database",
      status:
        appCheck?.status === "healthy"
          ? "healthy"
          : appCheck?.status === "degraded"
            ? "degraded"
            : appCheck?.status === "unavailable"
              ? "unavailable"
              : "not_monitored",
      detail:
        appCheck?.detail ??
        "Liveness probe only — deep DB readiness not attached to this surface",
    },
    {
      id: "integrations",
      label: "Integrations",
      status: "not_monitored",
      detail: "Not yet monitored",
    },
  ];
}
