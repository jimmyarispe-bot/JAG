/**
 * Soft-read facade for domain ECC widgets.
 * Intelligence / ECC import this module instead of connector packages,
 * so they never depend on connector APIs — only canonical stores via domain builders.
 */

export { buildCrmEccWidgets } from "@/lib/platform/integrations/connectors/crm/intelligence/ecc-widgets";
export { buildHrEccWidgets } from "@/lib/platform/integrations/connectors/hr/intelligence/ecc-widgets";
export { buildFinanceEccWidgets } from "@/lib/platform/integrations/connectors/finance/intelligence/ecc-widgets";
export { buildEducationEccWidgets } from "@/lib/platform/integrations/connectors/education/intelligence/ecc-widgets";
export { buildEnterpriseEccWidgets } from "@/lib/platform/integrations/connectors/enterprise/intelligence/ecc-widgets";
export { buildCollaborationEccWidgets } from "@/lib/platform/integrations/connectors/collaboration/intelligence/ecc-widgets";
export { buildGoogleWorkspaceEccWidgets } from "@/lib/platform/integrations/connectors/google-workspace/services/ecc-widgets";
export { buildMicrosoft365EccWidgets } from "@/lib/platform/integrations/connectors/microsoft-365/services/ecc-widgets";
export { buildKnowledgeGraphEccWidgets } from "@/lib/platform/knowledge-graph/widgets/organizational-graph";
