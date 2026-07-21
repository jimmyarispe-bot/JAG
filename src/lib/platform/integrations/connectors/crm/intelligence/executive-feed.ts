/**
 * CRM → executive intelligence soft feed (RC-3.04).
 */

import { computeCrmSignals } from "@/lib/platform/integrations/connectors/crm/intelligence/signals";
import { buildExecutiveRelationshipGraph } from "@/lib/platform/integrations/connectors/crm/intelligence/relationship-graph";
import { crmStore } from "@/lib/platform/integrations/connectors/crm/services/store";

export type CrmExecutiveFeed = {
  sourceSystem: "crm";
  live: true;
  syncedAt: string;
  organizationId: string;
  providersConnected: string[];
  crm: {
    pipelineValue: number;
    openDeals: number;
    salesForecast: number;
    pipelineHealth: number;
    customerConcentration: number;
    leadCount: number;
  };
  relationship: {
    nodes: number;
    edges: number;
    density: number;
  };
  attribution: {
    topCompanySharePct: number;
    topSource: string | null;
  };
  briefBullets: string[];
  softLights: {
    opportunity: { healthScore: { value: number }; opportunityScore: { value: number } };
    risk: { healthScore: { value: number }; riskScore: { value: number } };
  };
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function buildCrmExecutiveFeed(organizationId: string): CrmExecutiveFeed | null {
  const records = crmStore.allRecords(organizationId);
  if (!records.length) return null;

  const signals = computeCrmSignals(records);
  const graph = buildExecutiveRelationshipGraph(organizationId, records);
  const snaps = crmStore.listForOrganization(organizationId);
  const syncedAt = snaps[0]?.syncedAt ?? new Date().toISOString();
  const providersConnected = snaps.map((s) => s.provider);

  const opportunityScore = clamp(
    50 +
      (signals.salesForecast > 20000 ? 20 : 8) +
      signals.pipelineHealth * 0.2 -
      (signals.customerConcentration > 60 ? 12 : 0)
  );
  const riskScore = clamp(
    signals.customerConcentration * 0.7 +
      (signals.pipelineHealth < 50 ? 20 : 0) +
      (signals.openDeals === 0 ? 25 : 0)
  );

  const topSource = signals.revenueAttributionBySource[0]?.label ?? null;

  const briefBullets = [
    `Pipeline $${signals.pipelineValue.toLocaleString()} · ${signals.openDeals} open deal(s).`,
    `Sales forecast $${signals.salesForecast.toLocaleString()} · health ${signals.pipelineHealth}.`,
    `Customer concentration ${signals.customerConcentration} (top ${signals.topCustomerSharePct}%).`,
    graph
      ? `Relationship graph ${graph.nodes.length} nodes / ${graph.edges.length} edges.`
      : null,
    topSource ? `Top attributed source: ${topSource}.` : null,
  ].filter((b): b is string => Boolean(b));

  return {
    sourceSystem: "crm",
    live: true,
    syncedAt,
    organizationId,
    providersConnected,
    crm: {
      pipelineValue: signals.pipelineValue,
      openDeals: signals.openDeals,
      salesForecast: signals.salesForecast,
      pipelineHealth: signals.pipelineHealth,
      customerConcentration: signals.customerConcentration,
      leadCount: signals.leadCount,
    },
    relationship: {
      nodes: graph?.nodes.length ?? 0,
      edges: graph?.edges.length ?? 0,
      density: graph?.density ?? 0,
    },
    attribution: {
      topCompanySharePct: signals.topCustomerSharePct,
      topSource,
    },
    briefBullets,
    softLights: {
      opportunity: {
        healthScore: { value: opportunityScore },
        opportunityScore: { value: opportunityScore },
      },
      risk: {
        healthScore: { value: riskScore },
        riskScore: { value: riskScore },
      },
    },
  };
}

export function getCrmExecutiveFeed(organizationId: string): CrmExecutiveFeed | null {
  return buildCrmExecutiveFeed(organizationId);
}
