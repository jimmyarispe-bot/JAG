/**
 * Overview card data for the Executive Command Center.
 * Consumes existing domain / platform services only — never fabricates metrics.
 */

import {
  EDUCATION_DOMAIN_ID,
  EDUCATION_DOMAIN_NAME,
  EDUCATION_KNOWLEDGE_MODEL,
  createEducationPlanner,
  createEducationPolicyEngine,
  listCapabilityPacks,
  validateEducationCapabilityRegistry,
  validateEducationKnowledgeModel,
} from "@/lib/domains/education";
import { resolveOrganizationDisplayName } from "@/lib/jag-business/organization-display";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { resolveActiveWorkspaceOrganization } from "@/lib/jag-platform/active-organization";
import type { JagOverviewCardModel } from "@/components/jag/command-center";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export type JagCommandCenterContext = {
  readonly organizationOptions: readonly { id: string; label: string }[];
  readonly activeOrganizationId: string | null;
  readonly activeOrganizationLabel: string | null;
  readonly domainOptions: readonly { id: string; label: string }[];
  readonly cards: readonly JagOverviewCardModel[];
};

export function loadJagCommandCenterOverview(
  session: JagPlatformSession,
  preferredOrganizationId?: string | null
): JagCommandCenterContext {
  const active = resolveActiveWorkspaceOrganization(
    session,
    preferredOrganizationId
  );
  const organizations = listOrganizationsForSession({
    ...session,
    // Prefer listing with active org first when bound.
    organizationId: active?.id ?? session.organizationId,
  });
  const packs = listCapabilityPacks();
  const packValidation = validateEducationCapabilityRegistry();
  const knowledgeValidation = validateEducationKnowledgeModel(
    EDUCATION_KNOWLEDGE_MODEL
  );
  const planner = createEducationPlanner();
  const catalog = planner.catalog();
  const policyEngine = createEducationPolicyEngine();
  const policyCount = policyEngine.registry().list().length;

  const organizationOptions = organizations.map((o) => ({
    id: o.id,
    label: resolveOrganizationDisplayName(o.id, o.name),
  }));

  const domainOptions = [
    { id: EDUCATION_DOMAIN_ID, label: titleCase(EDUCATION_DOMAIN_NAME) },
  ];

  const healthyOrgs = organizations.filter((o) => o.health === "healthy").length;

  const cards: JagOverviewCardModel[] = [
    organizations.length === 0
      ? {
          id: "organization-health",
          title: "Organization Health",
          status: "empty",
          summary:
            "No organizations are visible for this session. Provision or select an organization to surface health.",
          href: "/jag/organizations",
        }
      : {
          id: "organization-health",
          title: "Organization Health",
          status: "ready",
          summary: `${organizations.length} organization(s) visible to ${session.displayName}.`,
          metricLabel: "Healthy",
          metricValue: String(healthyOrgs),
          detail: organizations.map((o) => o.name).join(" · "),
          href: "/jag/organizations",
        },
    {
      id: "executive-brief",
      title: "Executive Brief",
      status: "empty",
      summary:
        "No executive briefing result is bound to this session. Run Education Executive Intelligence to produce a brief.",
      href: "/jag/briefings",
    },
    {
      id: "domains",
      title: "Domains",
      status: "ready",
      summary: "Registered domain packages discoverable from the Education package.",
      metricLabel: "Domains",
      metricValue: String(domainOptions.length),
      detail: domainOptions.map((d) => d.label).join(" · "),
      href: "/jag/domains",
    },
    packs.length === 0
      ? {
          id: "capability-packs",
          title: "Capability Packs",
          status: "empty",
          summary: "No capability packs are registered.",
          href: "/jag/capability-packs",
        }
      : {
          id: "capability-packs",
          title: "Capability Packs",
          status: "ready",
          summary: packValidation.ok
            ? "Education capability pack registry validates successfully."
            : `Registry validation reported ${packValidation.errors.length} error(s).`,
          metricLabel: "Packs",
          metricValue: String(packs.length),
          detail: packs.map((p) => p.name).join(" · "),
          href: "/jag/capability-packs",
        },
    {
      id: "runtime-status",
      title: "Runtime Status",
      status: "empty",
      summary:
        "No persistent Jag Runtime session is bound to the Command Center UI. Runtime is available as a library service.",
      href: "/jag/runtime",
    },
    catalog.length === 0
      ? {
          id: "planner",
          title: "Planner",
          status: "empty",
          summary: "Education planner catalog has no contributors.",
          href: "/jag/intelligence-graph",
        }
      : {
          id: "planner",
          title: "Planner",
          status: "ready",
          summary:
            "Education Intelligence Planner catalog is loaded from the domain package.",
          metricLabel: "Contributors",
          metricValue: String(catalog.length),
          href: "/jag/intelligence-graph",
        },
    {
      id: "orchestrator",
      title: "Orchestrator",
      status: "empty",
      summary:
        "No orchestrator execution snapshot is available for this session. Invoke the Education Intelligence Orchestrator to produce one.",
      href: "/jag/observability",
    },
    policyCount === 0
      ? {
          id: "policy-engine",
          title: "Policy Engine",
          status: "empty",
          summary: "No policies are registered in the Education Policy Engine.",
          href: "/jag/policies",
        }
      : {
          id: "policy-engine",
          title: "Policy Engine",
          status: "ready",
          summary:
            "Education Policy Engine registry is available (metadata evaluation only).",
          metricLabel: "Policies",
          metricValue: String(policyCount),
          href: "/jag/policies",
        },
    {
      id: "knowledge-model",
      title: "Knowledge Model",
      status: knowledgeValidation.ok ? "ready" : "empty",
      summary: knowledgeValidation.ok
        ? "Education Knowledge Model validates successfully."
        : `Knowledge model validation reported ${knowledgeValidation.errors.length} issue(s).`,
      metricLabel: "Entities",
      metricValue: String(EDUCATION_KNOWLEDGE_MODEL.entities.length),
      detail: `v${EDUCATION_KNOWLEDGE_MODEL.version}`,
      href: "/jag/knowledge",
    },
    {
      id: "observability",
      title: "Observability",
      status: "empty",
      summary:
        "No execution traces, timelines, or metrics are bound to this UI session yet.",
      href: "/jag/observability",
    },
  ];

  return {
    organizationOptions,
    activeOrganizationId: active?.id ?? null,
    activeOrganizationLabel: active
      ? resolveOrganizationDisplayName(active.id, active.name)
      : null,
    domainOptions,
    cards,
  };
}

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
