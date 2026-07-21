/**
 * Gather soft-reads for Copilot 2.0 — canonical stores / KG / feeds only.
 */

import {
  softReadOrganizationalGraph,
  softReadLineage,
  softReadTimeline,
  softReadSearch,
  type OrganizationalGraphSoftRead,
  type TimelineEntry,
  type LineageSlice,
  type UnifiedGraphNode,
} from "@/lib/platform/knowledge-graph";
import { getFinanceExecutiveFeed } from "@/lib/platform/integrations/connectors/finance";
import { getCrmExecutiveFeed } from "@/lib/platform/integrations/connectors/crm";
import { getHrExecutiveFeed } from "@/lib/platform/integrations/connectors/hr";
import { getEducationExecutiveFeed } from "@/lib/platform/integrations/connectors/education";
import { buildCollaborationEccWidgets } from "@/lib/platform/integrations/connectors/collaboration/intelligence/ecc-widgets";
import { getEnterpriseExecutiveFeed } from "@/lib/platform/integrations/connectors/enterprise";

export type CopilotV2SoftContext = {
  organizationId: string;
  knowledgeGraph: OrganizationalGraphSoftRead | null;
  timeline: TimelineEntry[];
  lineage: LineageSlice[];
  people: UnifiedGraphNode[];
  initiatives: UnifiedGraphNode[];
  risks: UnifiedGraphNode[];
  finance: ReturnType<typeof getFinanceExecutiveFeed>;
  crm: ReturnType<typeof getCrmExecutiveFeed>;
  hr: ReturnType<typeof getHrExecutiveFeed>;
  education: ReturnType<typeof getEducationExecutiveFeed>;
  collaboration: ReturnType<typeof buildCollaborationEccWidgets>;
  enterprise: ReturnType<typeof getEnterpriseExecutiveFeed>;
  domainsPresent: string[];
};

export function assembleCopilotV2SoftContext(
  organizationId: string
): CopilotV2SoftContext {
  const knowledgeGraph = softReadOrganizationalGraph(organizationId);
  const timeline = softReadTimeline(organizationId, 40);
  const lineage = softReadLineage(organizationId);
  const people = softReadSearch(organizationId, {
    kinds: ["Person", "Employee", "Teacher"],
    limit: 40,
  });
  const initiatives = softReadSearch(organizationId, {
    kinds: ["Initiative"],
    limit: 30,
  });
  const risks = softReadSearch(organizationId, {
    kinds: ["Risk"],
    limit: 30,
  });
  const finance = getFinanceExecutiveFeed(organizationId);
  const crm = getCrmExecutiveFeed(organizationId);
  const hr = getHrExecutiveFeed(organizationId);
  const education = getEducationExecutiveFeed(organizationId);
  const collaboration = buildCollaborationEccWidgets(organizationId);
  const enterprise = getEnterpriseExecutiveFeed(organizationId);

  const domainsPresent = [
    knowledgeGraph ? "knowledge-graph" : null,
    finance ? "finance" : null,
    crm ? "crm" : null,
    hr ? "hr" : null,
    education ? "education" : null,
    collaboration ? "collaboration" : null,
    enterprise ? "enterprise" : null,
  ].filter((d): d is string => Boolean(d));

  return {
    organizationId,
    knowledgeGraph,
    timeline,
    lineage,
    people,
    initiatives,
    risks,
    finance,
    crm,
    hr,
    education,
    collaboration,
    enterprise,
    domainsPresent,
  };
}
