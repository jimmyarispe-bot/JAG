import type { CopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import type { CopilotV2Evidence } from "@/lib/platform/executive-copilot/types";

export type OrgInvestigation = {
  topic: string;
  findings: string[];
  risks: string[];
  nextSteps: string[];
  evidence: CopilotV2Evidence[];
};

export function investigateOrganization(
  ctx: CopilotV2SoftContext,
  topic: string
): OrgInvestigation {
  const findings: string[] = [];
  const risks: string[] = [];
  const nextSteps: string[] = [];
  const evidence: CopilotV2Evidence[] = [];
  let eid = 0;

  if (ctx.knowledgeGraph) {
    const g = ctx.knowledgeGraph;
    findings.push(
      `Org graph: ${g.counts.nodes} entities, ${g.counts.edges} relationships.`
    );
    evidence.push({
      id: `inv-${++eid}`,
      statement: `Graph domains: ${g.graph.domainsConnected.join(", ") || "none"}.`,
      domain: "knowledge-graph",
      supporting: true,
    });
  }

  if (ctx.collaboration) {
    const h = ctx.collaboration.communicationHealth;
    findings.push(
      `Communication health ${h.score}/100 with ${h.siloCount} silo cluster(s).`
    );
    if (h.siloCount > 0) {
      risks.push(`${h.siloCount} collaboration silo(s) may block cross-team execution.`);
      nextSteps.push("Review collaboration heatmap and assign bridge owners between siloed teams.");
    }
    evidence.push({
      id: `inv-${++eid}`,
      statement: h.explainability,
      domain: "collaboration",
      supporting: true,
    });
  }

  if (ctx.hr && ctx.hr.signals.capacityGapFte > 0) {
    findings.push(`Capacity gap of ${ctx.hr.signals.capacityGapFte} FTE.`);
    risks.push("Open capacity gap can slow initiative delivery.");
    nextSteps.push("Prioritize critical open roles against initiative critical path.");
  }

  if (ctx.finance?.briefBullets?.[0]) {
    findings.push(ctx.finance.briefBullets[0]);
  }

  if (ctx.crm && ctx.crm.crm.pipelineHealth < 55) {
    risks.push(`Pipeline health weak at ${ctx.crm.crm.pipelineHealth}/100.`);
    nextSteps.push("Inspect stage conversion and top-deal concentration in CRM.");
  }

  if (findings.length === 0) {
    findings.push(`No live soft-reads for topic "${topic}" — sync domain connectors first.`);
    nextSteps.push("Run connector syncs and rebuild the unified knowledge graph.");
  }

  return { topic, findings, risks, nextSteps, evidence };
}

/** Example: Which departments are disconnected? */
export function investigateDisconnectedDepartments(
  ctx: CopilotV2SoftContext
): OrgInvestigation {
  const findings: string[] = [];
  const risks: string[] = [];
  const nextSteps: string[] = [];
  const evidence: CopilotV2Evidence[] = [];

  const heatmap = ctx.collaboration?.collaborationHeatmap;
  const health = ctx.collaboration?.communicationHealth;

  if (heatmap && heatmap.cells.length) {
    const byRow = new Map<string, number>();
    for (const cell of heatmap.cells) {
      byRow.set(cell.row, (byRow.get(cell.row) ?? 0) + cell.value);
    }
    const ranked = [...byRow.entries()].sort((a, b) => a[1] - b[1]);
    const weak = ranked.slice(0, 3).filter(([, v]) => v < 5);
    if (weak.length) {
      findings.push(
        `Lowest collaboration intensity: ${weak.map(([d, v]) => `${d} (${v.toFixed(1)})`).join(", ")}.`
      );
      risks.push("Low-intensity teams are candidates for organizational silos.");
    } else {
      findings.push("No extreme low-intensity departments in the collaboration heatmap.");
    }
    evidence.push({
      id: "disc-1",
      statement: `Heatmap covers ${heatmap.rows.length} × ${heatmap.columns.length} department pairs.`,
      domain: "collaboration",
      supporting: true,
    });
  } else if (health) {
    findings.push(
      `${health.siloCount} silo(s) and ${health.bottleneckCount} bottleneck(s) detected in communication graph.`
    );
    if (health.siloCount > 0) {
      risks.push("Siloed communication clusters reduce cross-department awareness.");
      nextSteps.push("Schedule cross-silo standup or shared channel for critical initiatives.");
    }
    evidence.push({
      id: "disc-1",
      statement: health.explainability,
      domain: "collaboration",
      supporting: true,
    });
  } else {
    findings.push("Collaboration soft-read unavailable — connect Slack/Teams/Zoom to detect silos.");
    nextSteps.push("Sync collaboration connectors, then re-ask about disconnected departments.");
  }

  if (ctx.knowledgeGraph) {
    const deptCount = ctx.knowledgeGraph.graph.nodes.filter((n) => n.kind === "Department").length;
    if (deptCount > 0) {
      findings.push(`Graph contains ${deptCount} Department entities.`);
    }
  }

  return {
    topic: "disconnected_departments",
    findings,
    risks,
    nextSteps:
      nextSteps.length > 0
        ? nextSteps
        : ["Monitor collaboration health weekly via ECC communication widgets."],
    evidence,
  };
}

/** Example: Summarize everything affecting Initiative Alpha. */
export function investigateInitiativeImpact(
  ctx: CopilotV2SoftContext,
  question: string
): OrgInvestigation {
  const nameMatch = question.match(/initiative\s+([A-Za-z0-9 _-]+)/i);
  const needle = (nameMatch?.[1] ?? "Alpha").trim().toLowerCase();

  const matched = ctx.initiatives.filter((n) => n.label.toLowerCase().includes(needle));
  const findings: string[] = [];
  const risks: string[] = [];
  const nextSteps: string[] = [];
  const evidence: CopilotV2Evidence[] = [];

  if (matched.length) {
    for (const init of matched.slice(0, 3)) {
      findings.push(`Initiative "${init.label}" present in knowledge graph (${init.id}).`);
      const related = ctx.knowledgeGraph?.graph.edges.filter(
        (e) => e.from === init.id || e.to === init.id
      );
      if (related?.length) {
        findings.push(`"${init.label}" has ${related.length} graph relationship(s).`);
      }
      evidence.push({
        id: `init-${init.id}`,
        statement: `Initiative node ${init.label} from domain ${init.domain ?? "unknown"}.`,
        domain: "knowledge-graph",
        supporting: true,
      });
    }
  } else {
    findings.push(
      `No Initiative labeled like "${needle}" in the graph — summarizing org-wide pressures instead.`
    );
  }

  if (ctx.finance?.briefBullets?.[0]) findings.push(`Finance: ${ctx.finance.briefBullets[0]}`);
  if (ctx.crm) {
    findings.push(
      `CRM: pipeline health ${ctx.crm.crm.pipelineHealth}/100, forecast $${Math.round(ctx.crm.crm.salesForecast).toLocaleString()}.`
    );
  }
  if (ctx.hr) {
    findings.push(
      `HR: capacity gap ${ctx.hr.signals.capacityGapFte} FTE, turnover ${ctx.hr.signals.turnoverRate}%.`
    );
    if (ctx.hr.signals.capacityGapFte > 0) {
      risks.push("Staffing gap may delay initiative milestones.");
    }
  }
  if (ctx.collaboration && ctx.collaboration.communicationHealth.siloCount > 0) {
    risks.push("Collaboration silos may fragment initiative execution.");
  }
  for (const r of ctx.risks.slice(0, 3)) {
    risks.push(`Graph risk: ${r.label}`);
  }

  nextSteps.push("Map initiative owners and critical dependencies in the knowledge graph.");
  nextSteps.push("Align finance runway and CRM forecast with initiative milestone dates.");

  return {
    topic: `initiative_impact:${needle}`,
    findings,
    risks,
    nextSteps,
    evidence,
  };
}
