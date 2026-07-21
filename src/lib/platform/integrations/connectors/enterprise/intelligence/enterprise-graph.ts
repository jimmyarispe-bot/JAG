/**
 * Enterprise operational graph (Sprint 078) — CRM / HR / Education / Government.
 */

import type { EnterpriseCanonicalEntity } from "@/lib/platform/integrations/connectors/enterprise/entities";
import { PROVIDER_DOMAIN } from "@/lib/platform/integrations/connectors/enterprise/entities";
import { enterpriseStore } from "@/lib/platform/integrations/connectors/enterprise/services/store";
import { buildEnterpriseKnowledgeGraph } from "@/lib/platform/integrations/connectors/enterprise/mapping";
import { computeHrSignals } from "@/lib/platform/integrations/connectors/hr/intelligence/signals";
import { hrStore } from "@/lib/platform/integrations/connectors/hr/services/store";
import { computeCrmSignals } from "@/lib/platform/integrations/connectors/crm/intelligence/signals";
import { crmStore } from "@/lib/platform/integrations/connectors/crm/services/store";
import { buildCrmKnowledgeGraph } from "@/lib/platform/integrations/connectors/crm/mapping";
import { computeEducationSignals } from "@/lib/platform/integrations/connectors/education/intelligence/signals";
import { educationStore } from "@/lib/platform/integrations/connectors/education/services/store";
import { buildEducationKnowledgeGraph } from "@/lib/platform/integrations/connectors/education/mapping";

export type EnterpriseGraphNode = {
  id: string;
  kind: string;
  label: string;
  provider?: string;
  domain?: string;
};

export type EnterpriseGraphEdge = {
  id: string;
  type: string;
  from: string;
  to: string;
};

export type EnterpriseScores = {
  pipelineValue: number;
  openDeals: number;
  headcount: number;
  openRoles: number;
  activeStudents: number;
  attendanceRate: number;
  programFunding: number;
  openCompliance: number;
  operationalHealth: number;
};

export type EnterpriseGraph = {
  organizationId: string;
  builtAt: string;
  nodes: EnterpriseGraphNode[];
  edges: EnterpriseGraphEdge[];
  providersConnected: string[];
  domainsConnected: string[];
  scores: EnterpriseScores;
  kgKindsPresent: string[];
};

function num(v: unknown): number {
  return Number(v ?? 0);
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export function buildEnterpriseGraph(organizationId: string): EnterpriseGraph | null {
  const snapshots = enterpriseStore.listForOrganization(organizationId);
  const records = enterpriseStore.allRecords(organizationId);
  const hrRecords = hrStore.allRecords(organizationId);
  const crmRecords = crmStore.allRecords(organizationId);
  const eduRecords = educationStore.allRecords(organizationId);
  if (!records.length && !hrRecords.length && !crmRecords.length && !eduRecords.length) {
    return null;
  }

  const kg = buildEnterpriseKnowledgeGraph(records);
  const crmKg = buildCrmKnowledgeGraph(crmRecords);
  const eduKg = buildEducationKnowledgeGraph(eduRecords);
  const nodes: EnterpriseGraphNode[] = [
    ...kg.nodes.map((n) => ({
      id: n.nodeId,
      kind: n.entityType,
      label: n.label,
      provider: typeof n.properties.provider === "string" ? n.properties.provider : undefined,
      domain:
        typeof n.properties.provider === "string"
          ? PROVIDER_DOMAIN[n.properties.provider as keyof typeof PROVIDER_DOMAIN]
          : undefined,
    })),
    ...crmKg.nodes.map((n) => ({
      id: n.nodeId,
      kind: n.entityType,
      label: n.label,
      provider: typeof n.properties.provider === "string" ? n.properties.provider : undefined,
      domain: "crm" as const,
    })),
    ...eduKg.nodes.map((n) => ({
      id: n.nodeId,
      kind: n.entityType,
      label: n.label,
      provider: typeof n.properties.provider === "string" ? n.properties.provider : undefined,
      domain: "education" as const,
    })),
  ];

  const edges: EnterpriseGraphEdge[] = [
    ...kg.relationships.map((r) => ({
      id: r.relationshipId,
      type: r.type,
      from: r.fromNodeId,
      to: r.toNodeId,
    })),
    ...crmKg.relationships.map((r) => ({
      id: r.relationshipId,
      type: r.type,
      from: r.fromNodeId,
      to: r.toNodeId,
    })),
    ...eduKg.relationships.map((r) => ({
      id: r.relationshipId,
      type: r.type,
      from: r.fromNodeId,
      to: r.toNodeId,
    })),
  ];

  const scores = computeScores(records, organizationId);
  const hrSnaps = hrStore.listForOrganization(organizationId);
  const crmSnaps = crmStore.listForOrganization(organizationId);
  const eduSnaps = educationStore.listForOrganization(organizationId);
  const kgKindsPresent = [...new Set(nodes.map((n) => n.kind))];
  if (hrRecords.length) kgKindsPresent.push("Employee");
  if (crmRecords.length) kgKindsPresent.push("Opportunity", "Person", "Organization");
  if (eduRecords.length) kgKindsPresent.push("Student");

  return {
    organizationId,
    builtAt: new Date().toISOString(),
    nodes,
    edges,
    providersConnected: [
      ...snapshots.map((s) => s.provider),
      ...hrSnaps.map((s) => s.provider),
      ...crmSnaps.map((s) => s.provider),
      ...eduSnaps.map((s) => s.provider),
    ],
    domainsConnected: [
      ...new Set([
        ...snapshots.map((s) => PROVIDER_DOMAIN[s.provider]),
        ...(hrSnaps.length ? (["hr"] as const) : []),
        ...(crmSnaps.length ? (["crm"] as const) : []),
        ...(eduSnaps.length ? (["education"] as const) : []),
      ]),
    ],
    scores,
    kgKindsPresent: [...new Set(kgKindsPresent)],
  };
}

export function computeScores(
  records: EnterpriseCanonicalEntity[],
  organizationId?: string
): EnterpriseScores {
  const deals = records.filter((r) => r.objectType === "deal");
  const employees = records.filter((r) => r.objectType === "employee");
  const hiring = records.filter((r) => r.objectType === "hiring");
  const students = records.filter((r) => r.objectType === "student");
  const attendance = records.filter((r) => r.objectType === "attendance");
  const awards = records.filter((r) => r.objectType === "award");
  const claims = records.filter((r) => r.objectType === "claim");
  const compliance = records.filter((r) => r.objectType === "compliance");

  const hrSignals =
    organizationId != null ? computeHrSignals(hrStore.allRecords(organizationId)) : null;
  const crmSignals =
    organizationId != null ? computeCrmSignals(crmStore.allRecords(organizationId)) : null;
  const eduSignals =
    organizationId != null
      ? computeEducationSignals(educationStore.allRecords(organizationId), organizationId)
      : null;

  const pipelineValue =
    crmSignals?.pipelineValue ??
    deals.reduce((s, d) => s + num(d.attributes.amount), 0);
  const openDeals =
    crmSignals?.openDeals ??
    deals.filter((d) => {
      const stage = String(d.attributes.stage ?? "");
      return stage !== "Enrolled" && stage !== "Closed Won";
    }).length;

  const present = attendance.filter((a) => String(a.attributes.status) === "present").length;
  const attendanceRate =
    eduSignals?.attendanceRate ??
    (attendance.length
      ? Math.round((present / attendance.length) * 1000) / 10
      : 100);

  const programFunding =
    awards.reduce((s, a) => s + num(a.attributes.totalAmt), 0) +
    claims.reduce((s, c) => s + num(c.attributes.totalAmt), 0);

  const openCompliance = compliance.filter((c) => {
    const status = String(c.attributes.status ?? "");
    return status === "due" || status === "open";
  }).length;

  const openRolesEnterprise = hiring.filter(
    (h) => String(h.attributes.status) === "open"
  ).length;
  const headcount = hrSignals?.headcount ?? employees.length;
  const openRoles = hrSignals?.openRoles ?? openRolesEnterprise;

  const activeStudents =
    eduSignals?.activeStudents ??
    students.filter((s) => String(s.attributes.status) === "active").length;

  const operationalHealth = clamp(
    55 +
      (pipelineValue > 20000 ? 10 : 4) +
      (headcount >= 2 ? 8 : 0) +
      (activeStudents >= 2 ? 8 : 0) +
      (attendanceRate >= 90 ? 8 : 0) +
      (programFunding > 0 ? 6 : 0) -
      openCompliance * 6 -
      (openRoles > 2 ? 5 : 0)
  );

  return {
    pipelineValue: Math.round(pipelineValue),
    openDeals,
    headcount,
    openRoles,
    activeStudents,
    attendanceRate,
    programFunding: Math.round(programFunding),
    openCompliance,
    operationalHealth,
  };
}
