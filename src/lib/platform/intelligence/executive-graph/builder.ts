/**
 * Executive Graph Analyzer — GraphBuilder (Sprint 025).
 *
 * Ingests Admissions, Finance, HR, Operations, Executive, and Founder signals
 * into one organizational reasoning graph.
 */

import type { GraphBuilder as GraphBuilderContract } from "@/lib/platform/intelligence/executive-graph/contracts";
import { buildEdge } from "@/lib/platform/intelligence/executive-graph/edges";
import { createEvidence } from "@/lib/platform/intelligence/executive-graph/evidence";
import {
  createNode,
  nodeId,
  upsertNode,
} from "@/lib/platform/intelligence/executive-graph/model";
import { DomainNodeCatalog } from "@/lib/platform/intelligence/executive-graph/nodes";
import {
  severityToScore,
  statusToPressure,
} from "@/lib/platform/intelligence/executive-graph/scorer";
import type {
  DomainSignalInput,
  ExecutiveGraphDomain,
  Graph,
  GraphBuildInput,
  GraphEdge,
  GraphNode,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";

export interface GraphBuilderDependencies {
  catalog?: DomainNodeCatalog;
  now?: () => Date;
  createId?: (prefix: string) => string;
}

function resolveScope(input: GraphBuildInput): GraphScope {
  return {
    organizationId: input.scope?.organizationId ?? null,
    schoolId: input.scope?.schoolId ?? null,
    regionId: input.scope?.regionId ?? null,
    campusId: input.scope?.campusId ?? null,
  };
}

function domainFromKey(key: string): ExecutiveGraphDomain {
  const prefix = key.split(".")[0];
  switch (prefix) {
    case "admissions":
    case "finance":
    case "hr":
    case "operations":
    case "executive":
    case "founder":
      return prefix;
    default:
      return "executive";
  }
}

/**
 * GraphBuilder — materializes a multi-domain executive reasoning graph.
 */
export class GraphBuilder implements GraphBuilderContract {
  private readonly catalog: DomainNodeCatalog;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(dependencies: GraphBuilderDependencies = {}) {
    this.catalog = dependencies.catalog ?? new DomainNodeCatalog();
    this.now = dependencies.now ?? (() => new Date());
    this.createId =
      dependencies.createId ??
      ((prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  }

  build(input: GraphBuildInput = {}): Graph {
    const builtAt = input.builtAt ?? this.now().toISOString();
    const scope = resolveScope(input);
    const nodeMap = new Map<string, GraphNode>();

    for (const signal of this.catalog.defaultSignals()) {
      this.upsertSignal(nodeMap, signal, builtAt);
    }

    this.applyExecutiveSignals(nodeMap, input, builtAt);
    this.applyOrganizationHealth(nodeMap, input, builtAt);
    this.applyFounderSignals(nodeMap, input, builtAt);

    for (const signal of input.signals ?? []) {
      this.upsertSignal(nodeMap, signal, builtAt);
    }

    const edges: GraphEdge[] = [];
    const keyToId = new Map(
      Array.from(nodeMap.values()).map((n) => [n.key, n.id] as const)
    );

    const relations = [
      ...this.catalog.defaultRelations(),
      ...(input.relations ?? []),
    ];

    for (const relation of relations) {
      const sourceId = keyToId.get(relation.sourceKey);
      const targetId = keyToId.get(relation.targetKey);
      if (!sourceId || !targetId) continue;
      edges.push(
        buildEdge({
          kind: relation.kind,
          sourceId,
          targetId,
          weight: relation.weight,
          confidence: relation.confidence,
          direction: relation.direction,
          ruleId: relation.ruleId,
          reason: relation.reason,
        })
      );
    }

    return {
      id: this.createId("graph"),
      builtAt,
      scope,
      nodes: Array.from(nodeMap.values()),
      edges,
      metadata: {
        ...(input.metadata ?? {}),
        domainCount: 6,
        builder: "GraphBuilder",
        version: "0.1.0",
      },
    };
  }

  private upsertSignal(
    nodeMap: Map<string, GraphNode>,
    signal: DomainSignalInput,
    builtAt: string
  ): void {
    const domain = signal.domain ?? domainFromKey(signal.key);
    const id = nodeId(domain, signal.key);
    const existing = nodeMap.get(id);
    const criticality = Math.max(
      existing?.criticality ?? 0,
      statusToPressure(signal.status) * 0.5 + severityToScore(signal.severity) * 0.5
    );

    upsertNode(
      nodeMap,
      createNode({
        id,
        key: signal.key,
        label: signal.label,
        domain,
        kind: signal.kind ?? "signal",
        value: signal.value ?? existing?.value ?? null,
        status: signal.status ?? existing?.status ?? null,
        severity: signal.severity ?? existing?.severity ?? null,
        criticality,
        confidence: signal.confidence ?? existing?.confidence ?? 0.6,
        evidence: [
          ...(existing?.evidence ?? []),
          ...(signal.evidence ?? []),
          createEvidence({
            label: `${signal.label} signal`,
            sourceDomain: domain,
            value: signal.value ?? null,
          }),
        ],
        metadata: {
          ...(existing?.metadata ?? {}),
          ...(signal.metadata ?? {}),
          updatedAt: builtAt,
        },
      })
    );
  }

  private applyExecutiveSignals(
    nodeMap: Map<string, GraphNode>,
    input: GraphBuildInput,
    builtAt: string
  ): void {
    const exec = input.executive;
    if (!exec) return;

    const pairs: Array<[string, number | undefined, string]> = [
      ["admissions.pipeline", exec.admissions, "Admissions Pipeline"],
      ["operations.enrollment", exec.enrollment, "Enrollment"],
      ["finance.revenue", exec.revenue, "Revenue"],
      ["finance.outstanding", exec.outstanding, "Outstanding AR"],
      ["hr.staffing", exec.staff, "Staffing Level"],
      ["operations.attendance", exec.studentAttendance, "Student Attendance"],
      ["hr.teacher_attendance", exec.teacherAttendance, "Teacher Attendance"],
    ];

    for (const [key, value, label] of pairs) {
      if (value === undefined) continue;
      const status =
        key.includes("attendance") && value < 90
          ? "warning"
          : key === "finance.outstanding" && value > 10000
            ? "warning"
            : "healthy";
      this.upsertSignal(
        nodeMap,
        {
          key,
          label,
          domain: domainFromKey(key),
          kind: "kpi",
          value,
          status,
          confidence: 0.8,
        },
        builtAt
      );
    }
  }

  private applyOrganizationHealth(
    nodeMap: Map<string, GraphNode>,
    input: GraphBuildInput,
    builtAt: string
  ): void {
    const health = input.organizationHealth;
    if (!health) return;

    if (health.overallScore !== undefined) {
      this.upsertSignal(
        nodeMap,
        {
          key: "executive.health",
          label: "Organization Health Score",
          domain: "executive",
          kind: "health",
          value: health.overallScore,
          status:
            health.overallScore >= 80
              ? "healthy"
              : health.overallScore >= 60
                ? "warning"
                : "critical",
          confidence: 0.85,
        },
        builtAt
      );
    }

    const pillarMap: Array<[string, number | undefined, ExecutiveGraphDomain, string]> = [
      ["operations.enrollment", health.enrollmentScore, "operations", "Enrollment Health"],
      ["finance.cash", health.financialScore, "finance", "Financial Health"],
      ["operations.attendance", health.academicScore, "operations", "Academic Health"],
      ["hr.staffing", health.workforceScore, "hr", "Workforce Health"],
      ["executive.alerts", health.complianceScore, "executive", "Compliance Health"],
      ["operations.scheduling", health.operationsScore, "operations", "Operations Health"],
    ];

    for (const [key, score, domain, label] of pillarMap) {
      if (score === undefined) continue;
      this.upsertSignal(
        nodeMap,
        {
          key,
          label,
          domain,
          kind: "health",
          value: score,
          status: score >= 80 ? "healthy" : score >= 60 ? "warning" : "critical",
          confidence: 0.75,
        },
        builtAt
      );
    }
  }

  private applyFounderSignals(
    nodeMap: Map<string, GraphNode>,
    input: GraphBuildInput,
    builtAt: string
  ): void {
    const founder = input.founder;
    if (!founder) return;

    if (founder.healthScore !== undefined) {
      this.upsertSignal(
        nodeMap,
        {
          key: "founder.brief",
          label: "Founder Brief Health",
          domain: "founder",
          kind: "summary",
          value: founder.healthScore,
          status: founder.healthStatus ?? null,
          confidence: 0.8,
        },
        builtAt
      );
    }

    for (const priority of founder.priorities ?? []) {
      this.upsertSignal(
        nodeMap,
        {
          key: `founder.priority.${priority.id}`,
          label: priority.title,
          domain: "founder",
          kind: "priority",
          severity: (priority.severity as DomainSignalInput["severity"]) ?? "medium",
          confidence: priority.confidence,
          metadata: { priorityId: priority.id },
        },
        builtAt
      );
    }

    for (const risk of founder.risks ?? []) {
      this.upsertSignal(
        nodeMap,
        {
          key: `founder.risk.${risk.id}`,
          label: risk.title,
          domain: "founder",
          kind: "risk",
          value: risk.probability * risk.impact,
          severity: (risk.severity as DomainSignalInput["severity"]) ?? "medium",
          confidence: 0.7,
        },
        builtAt
      );
    }

    for (const opportunity of founder.opportunities ?? []) {
      this.upsertSignal(
        nodeMap,
        {
          key: `founder.opportunity.${opportunity.id}`,
          label: opportunity.title,
          domain: "founder",
          kind: "opportunity",
          value: opportunity.estimatedValue,
          confidence: opportunity.confidence,
        },
        builtAt
      );
    }

    this.upsertSignal(
      nodeMap,
      {
        key: "founder.priorities",
        label: "Founder Priorities",
        domain: "founder",
        kind: "priority",
        value: founder.priorities?.length ?? 0,
        confidence: 0.75,
      },
      builtAt
    );
  }
}
