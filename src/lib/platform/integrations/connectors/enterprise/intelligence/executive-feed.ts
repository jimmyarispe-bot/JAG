/**
 * Enterprise → executive intelligence soft feed (Sprint 078).
 * Consumes normalized store / KG — never raw connector APIs.
 */

import { enterpriseStore } from "@/lib/platform/integrations/connectors/enterprise/services/store";
import {
  buildEnterpriseGraph,
  computeScores,
} from "@/lib/platform/integrations/connectors/enterprise/intelligence/enterprise-graph";
import { ENTERPRISE_KG_KINDS } from "@/lib/platform/integrations/connectors/enterprise/entities";

export type EnterpriseExecutiveFeed = {
  sourceSystem: "enterprise";
  live: true;
  syncedAt: string;
  organizationId: string;
  providersConnected: string[];
  domainsConnected: string[];
  crm: { pipelineValue: number; openDeals: number };
  hr: { headcount: number; openRoles: number };
  education: { activeStudents: number; attendanceRate: number };
  government: { programFunding: number; openCompliance: number };
  /** Shared KG kinds present after sync — phase exit evidence. */
  canonicalGraphKinds: readonly string[];
  kgKindsCovered: string[];
  briefBullets: string[];
  softLights: {
    opportunity: { healthScore: { value: number }; opportunityScore: { value: number } };
    risk: { healthScore: { value: number }; riskScore: { value: number } };
    portfolio: { healthScore: { value: number }; portfolioScore: { value: number } };
    decision: { healthScore: { value: number }; decisionScore: { value: number } };
  };
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function buildEnterpriseExecutiveFeed(
  organizationId: string
): EnterpriseExecutiveFeed | null {
  const records = enterpriseStore.allRecords(organizationId);
  const graph = buildEnterpriseGraph(organizationId);
  if (!graph) return null;

  const scores = computeScores(records, organizationId);
  const opportunityScore = clamp(
    50 + Math.min(30, scores.pipelineValue / 2000) + scores.openDeals * 4
  );
  const riskScore = clamp(40 + scores.openCompliance * 12 + (100 - scores.attendanceRate) * 0.4);
  const portfolioScore = clamp(
    (scores.operationalHealth + opportunityScore + (100 - Math.min(riskScore, 80))) / 3
  );
  const decisionScore = clamp(scores.operationalHealth * 0.7 + opportunityScore * 0.3);

  const syncedAt =
    enterpriseStore.listForOrganization(organizationId)[0]?.syncedAt ??
    new Date().toISOString();

  return {
    sourceSystem: "enterprise",
    live: true,
    syncedAt,
    organizationId,
    providersConnected: graph.providersConnected,
    domainsConnected: graph.domainsConnected,
    crm: {
      pipelineValue: scores.pipelineValue,
      openDeals: scores.openDeals,
    },
    hr: {
      headcount: scores.headcount,
      openRoles: scores.openRoles,
    },
    education: {
      activeStudents: scores.activeStudents,
      attendanceRate: scores.attendanceRate,
    },
    government: {
      programFunding: scores.programFunding,
      openCompliance: scores.openCompliance,
    },
    canonicalGraphKinds: ENTERPRISE_KG_KINDS,
    kgKindsCovered: graph.kgKindsPresent,
    briefBullets: [
      `CRM pipeline $${scores.pipelineValue.toLocaleString()} across ${scores.openDeals} open deal(s).`,
      `Workforce ${scores.headcount} employee(s) · ${scores.openRoles} open role(s).`,
      `${scores.activeStudents} active student(s) · attendance ${scores.attendanceRate}%.`,
      `Program funding $${scores.programFunding.toLocaleString()} · ${scores.openCompliance} compliance item(s).`,
      `Canonical KG kinds covered: ${graph.kgKindsPresent.slice(0, 6).join(", ") || "none"}.`,
    ],
    softLights: {
      opportunity: {
        healthScore: { value: opportunityScore },
        opportunityScore: { value: opportunityScore },
      },
      risk: {
        healthScore: { value: 100 - Math.min(riskScore, 90) },
        riskScore: { value: riskScore },
      },
      portfolio: {
        healthScore: { value: portfolioScore },
        portfolioScore: { value: portfolioScore },
      },
      decision: {
        healthScore: { value: decisionScore },
        decisionScore: { value: decisionScore },
      },
    },
  };
}

export function getEnterpriseExecutiveFeed(
  organizationId: string
): EnterpriseExecutiveFeed | null {
  return buildEnterpriseExecutiveFeed(organizationId);
}
