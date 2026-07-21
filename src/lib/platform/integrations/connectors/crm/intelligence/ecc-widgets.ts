/**
 * RC-3.04 CRM ECC widgets — Pipeline, Sales forecast, Pipeline health,
 * Customer concentration, Relationship graph, Revenue attribution.
 */

import { computeCrmSignals } from "@/lib/platform/integrations/connectors/crm/intelligence/signals";
import {
  buildExecutiveRelationshipGraph,
  type ExecutiveRelationshipGraph,
} from "@/lib/platform/integrations/connectors/crm/intelligence/relationship-graph";
import { crmStore } from "@/lib/platform/integrations/connectors/crm/services/store";
import type { RevenueAttributionSlice } from "@/lib/platform/integrations/connectors/crm/intelligence/signals";

export type CrmPipelineWidget = {
  kind: "crm_pipeline";
  title: string;
  pipelineValue: number;
  openDeals: number;
};

export type SalesForecastWidget = {
  kind: "sales_forecast";
  title: string;
  salesForecast: number;
  pipelineValue: number;
  openDeals: number;
};

export type PipelineHealthWidget = {
  kind: "pipeline_health";
  title: string;
  pipelineHealth: number;
  openDeals: number;
  activityCount: number;
};

export type CustomerConcentrationWidget = {
  kind: "customer_concentration";
  title: string;
  customerConcentration: number;
  topCustomerSharePct: number;
};

export type ExecutiveRelationshipGraphWidget = {
  kind: "executive_relationship_graph";
  title: string;
  nodeCount: number;
  edgeCount: number;
  density: number;
  graph: ExecutiveRelationshipGraph;
};

export type RevenueAttributionWidget = {
  kind: "revenue_attribution";
  title: string;
  byCompany: RevenueAttributionSlice[];
  bySource: RevenueAttributionSlice[];
};

export type CrmEccWidgets = {
  crmPipeline: CrmPipelineWidget;
  salesForecast: SalesForecastWidget;
  pipelineHealth: PipelineHealthWidget;
  customerConcentration: CustomerConcentrationWidget;
  executiveRelationshipGraph: ExecutiveRelationshipGraphWidget;
  revenueAttribution: RevenueAttributionWidget;
};

export function buildCrmEccWidgets(organizationId: string): CrmEccWidgets | null {
  const records = crmStore.allRecords(organizationId);
  if (!records.length) return null;
  const s = computeCrmSignals(records);
  const graph = buildExecutiveRelationshipGraph(organizationId, records);
  if (!graph) return null;

  return {
    crmPipeline: {
      kind: "crm_pipeline",
      title: "CRM Pipeline",
      pipelineValue: s.pipelineValue,
      openDeals: s.openDeals,
    },
    salesForecast: {
      kind: "sales_forecast",
      title: "Sales Forecast",
      salesForecast: s.salesForecast,
      pipelineValue: s.pipelineValue,
      openDeals: s.openDeals,
    },
    pipelineHealth: {
      kind: "pipeline_health",
      title: "Pipeline Health",
      pipelineHealth: s.pipelineHealth,
      openDeals: s.openDeals,
      activityCount: s.activityCount,
    },
    customerConcentration: {
      kind: "customer_concentration",
      title: "Customer Concentration",
      customerConcentration: s.customerConcentration,
      topCustomerSharePct: s.topCustomerSharePct,
    },
    executiveRelationshipGraph: {
      kind: "executive_relationship_graph",
      title: "Executive Relationship Graph",
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      density: graph.density,
      graph,
    },
    revenueAttribution: {
      kind: "revenue_attribution",
      title: "Revenue Attribution",
      byCompany: s.revenueAttributionByCompany,
      bySource: s.revenueAttributionBySource,
    },
  };
}
