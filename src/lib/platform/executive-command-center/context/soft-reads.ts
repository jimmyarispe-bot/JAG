/**
 * Mission Control soft-reads — KG + domain feeds + Copilot 2.0 only.
 */

import {
  softReadOrganizationalGraph,
  softReadTimeline,
  softReadSearch,
  type OrganizationalGraphSoftRead,
  type TimelineEntry,
  type UnifiedGraphNode,
} from "@/lib/platform/knowledge-graph";
import { getFinanceExecutiveFeed } from "@/lib/platform/integrations/connectors/finance";
import { getCrmExecutiveFeed } from "@/lib/platform/integrations/connectors/crm";
import { getHrExecutiveFeed } from "@/lib/platform/integrations/connectors/hr";
import { buildCollaborationEccWidgets } from "@/lib/platform/integrations/connectors/collaboration/intelligence/ecc-widgets";
import {
  assembleCopilotV2SoftContext,
  answerExecutiveCopilotV2,
  surfaceOrganizationalRisks,
  type CopilotV2SoftContext,
} from "@/lib/platform/executive-copilot";
import type { MissionControlLights } from "@/lib/platform/executive-command-center/types";

export type MissionControlSoftContext = {
  organizationId: string;
  knowledgeGraph: OrganizationalGraphSoftRead | null;
  timeline: TimelineEntry[];
  people: UnifiedGraphNode[];
  initiatives: UnifiedGraphNode[];
  risks: UnifiedGraphNode[];
  decisions: UnifiedGraphNode[];
  finance: ReturnType<typeof getFinanceExecutiveFeed>;
  crm: ReturnType<typeof getCrmExecutiveFeed>;
  hr: ReturnType<typeof getHrExecutiveFeed>;
  collaboration: ReturnType<typeof buildCollaborationEccWidgets>;
  copilotCtx: CopilotV2SoftContext;
  orgRisks: ReturnType<typeof surfaceOrganizationalRisks>;
  aiPulse: ReturnType<typeof answerExecutiveCopilotV2> | null;
  lights: MissionControlLights;
  domainsPresent: string[];
};

export function assembleMissionControlSoftContext(
  organizationId: string,
  lights: MissionControlLights = {}
): MissionControlSoftContext {
  const copilotCtx = assembleCopilotV2SoftContext(organizationId);
  const knowledgeGraph = softReadOrganizationalGraph(organizationId);
  const timeline = softReadTimeline(organizationId, 40);
  const people = softReadSearch(organizationId, {
    kinds: ["Person", "Employee", "Teacher"],
    limit: 20,
  });
  const initiatives = softReadSearch(organizationId, {
    kinds: ["Initiative"],
    limit: 20,
  });
  const risks = softReadSearch(organizationId, {
    kinds: ["Risk"],
    limit: 20,
  });
  const decisions = softReadSearch(organizationId, {
    kinds: ["Decision"],
    limit: 15,
  });
  const finance = getFinanceExecutiveFeed(organizationId);
  const crm = getCrmExecutiveFeed(organizationId);
  const hr = getHrExecutiveFeed(organizationId);
  const collaboration = buildCollaborationEccWidgets(organizationId);
  const orgRisks = surfaceOrganizationalRisks(copilotCtx);

  let aiPulse: ReturnType<typeof answerExecutiveCopilotV2> | null = null;
  try {
    aiPulse = answerExecutiveCopilotV2({
      organizationId,
      question: "Across domains, what should mission control watch right now?",
    });
  } catch {
    aiPulse = null;
  }

  const domainsPresent = [
    ...copilotCtx.domainsPresent,
    aiPulse ? "executive-copilot-v2" : null,
    lights.briefing ? "briefing" : null,
    lights.initiative ? "initiative" : null,
    lights.portfolio ? "portfolio" : null,
    lights.digitalTwin ? "digital-twin" : null,
    lights.autonomous ? "executive-autonomous" : null,
  ].filter((d, i, arr): d is string => Boolean(d) && arr.indexOf(d) === i);

  return {
    organizationId,
    knowledgeGraph,
    timeline,
    people,
    initiatives,
    risks,
    decisions,
    finance,
    crm,
    hr,
    collaboration,
    copilotCtx,
    orgRisks,
    aiPulse,
    lights,
    domainsPresent,
  };
}
