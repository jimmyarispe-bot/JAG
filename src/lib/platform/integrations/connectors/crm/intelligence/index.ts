export {
  computeCrmSignals,
  type CrmIntelligenceSignals,
  type RevenueAttributionSlice,
} from "./signals";
export {
  buildExecutiveRelationshipGraph,
  type ExecutiveRelationshipGraph,
  type RelationshipGraphNode,
  type RelationshipGraphEdge,
} from "./relationship-graph";
export {
  buildCrmEccWidgets,
  type CrmEccWidgets,
  type CrmPipelineWidget,
  type SalesForecastWidget,
  type PipelineHealthWidget,
  type CustomerConcentrationWidget,
  type ExecutiveRelationshipGraphWidget,
  type RevenueAttributionWidget,
} from "./ecc-widgets";
export {
  buildCrmExecutiveFeed,
  getCrmExecutiveFeed,
  type CrmExecutiveFeed,
} from "./executive-feed";
