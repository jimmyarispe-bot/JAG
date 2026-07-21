/**
 * RC-6 Mission Control panel builders — soft-read projection only.
 */

import type { MissionControlSoftContext } from "@/lib/platform/executive-command-center/context/soft-reads";
import type {
  MissionControlCard,
  MissionControlPanel,
  MissionControlPanelId,
} from "@/lib/platform/executive-command-center/types";

function cardsFrom(
  items: Array<Omit<MissionControlCard, "id"> & { id?: string }>,
  prefix: string
): MissionControlCard[] {
  return items.map((item, i) => ({
    id: item.id ?? `${prefix}-${i}`,
    title: item.title,
    summary: item.summary,
    severity: item.severity,
    score: item.score,
    domains: item.domains,
    meta: item.meta,
  }));
}

export function buildOrganizationTimeline(
  ctx: MissionControlSoftContext
): MissionControlPanel {
  const cards = cardsFrom(
    [
      ...ctx.timeline.slice(0, 10).map((t) => ({
        title: t.label,
        summary: `${t.at.slice(0, 10)} · ${t.kind}${t.domain ? ` · ${t.domain}` : ""}`,
        domains: [t.domain ?? "knowledge-graph"],
      })),
      ...(ctx.lights.memory?.timeline ?? []).slice(0, 3).map((t) => ({
        title: t.title ?? "Memory event",
        summary: t.summary ?? "Executive memory timeline entry",
        domains: ["executive-memory"],
      })),
    ],
    "tl"
  );

  return {
    id: "organization_timeline",
    title: "Organization Timeline",
    subtitle: "Chronological soft-read of graph and memory events",
    cards,
    emptyMessage: "No timeline events yet — sync connectors and rebuild the knowledge graph.",
  };
}

export function buildAlertCenter(ctx: MissionControlSoftContext): MissionControlPanel {
  const cards = cardsFrom(
    [
      ...ctx.orgRisks.risks.slice(0, 6).map((r) => ({
        title: "Org risk",
        summary: r,
        severity: 70,
        domains: ["risk"],
      })),
      ...(ctx.collaboration?.communicationHealth.alerts ?? []).slice(0, 3).map((a) => ({
        id: a.id,
        title: a.title ?? "Collaboration alert",
        summary: a.explainability ?? "Communication alert",
        severity: a.severity === "high" ? 85 : a.severity === "medium" ? 60 : 40,
        domains: ["collaboration"],
      })),
      ...(ctx.lights.briefing?.briefing?.sections?.topRisks ?? []).slice(0, 3).map((r) => ({
        title: r.title ?? "Briefing risk",
        summary: r.summary ?? "",
        severity: r.severity ?? 60,
        domains: ["briefing"],
      })),
      ...(ctx.lights.digitalTwin?.recommendation?.majorRisks ?? []).slice(0, 2).map((r) => ({
        title: "Twin risk",
        summary: r,
        severity: 75,
        domains: ["digital-twin"],
      })),
    ],
    "alert"
  );

  return {
    id: "alert_center",
    title: "Alert Center",
    subtitle: "Cross-domain alerts requiring executive attention",
    cards,
    emptyMessage: "No active alerts in current soft-reads.",
  };
}

export function buildApprovalCenter(ctx: MissionControlSoftContext): MissionControlPanel {
  const queue = ctx.lights.autonomous?.approvalQueue ?? [];
  const plans = ctx.lights.autonomous?.plans ?? [];
  const decisions = ctx.lights.briefing?.decisionQueue ?? [];

  const cards = cardsFrom(
    [
      ...queue.map((a) => ({
        title: `${a.role ?? "approver"} · ${a.status ?? "pending"}`,
        summary: a.rationale ?? "Pending approval",
        severity: a.status === "pending" ? 70 : 40,
        domains: ["executive-autonomous"],
      })),
      ...plans.slice(0, 3).map((p) => ({
        title: p.optionTitle ?? "Execution plan",
        summary: `Readiness: ${p.readiness ?? "unknown"}`,
        domains: ["executive-autonomous"],
      })),
      ...decisions.slice(0, 3).map((d) => ({
        title: d.title ?? "Decision",
        summary: d.decisionNeeded ?? "Decision needed",
        domains: ["briefing"],
      })),
      ...ctx.decisions.slice(0, 3).map((d) => ({
        title: d.label,
        summary: "Decision entity in knowledge graph",
        domains: ["knowledge-graph"],
      })),
    ],
    "appr"
  );

  return {
    id: "approval_center",
    title: "Approval Center",
    subtitle: "Pending approvals and decision queue",
    cards,
    emptyMessage: "No pending approvals — attach autonomous/briefing lights when available.",
    controls: [
      { id: "approve", label: "Approve selected", enabled: cards.length > 0 },
      { id: "defer", label: "Defer", enabled: cards.length > 0 },
    ],
  };
}

export function buildInvestigationWorkspace(
  ctx: MissionControlSoftContext
): MissionControlPanel {
  const inv = ctx.aiPulse?.investigation;
  const cards = cardsFrom(
    [
      ...(inv?.findings ?? []).slice(0, 4).map((f) => ({
        title: "Finding",
        summary: f,
        domains: ["executive-copilot-v2"],
      })),
      ...(inv?.risks ?? []).slice(0, 3).map((r) => ({
        title: "Investigation risk",
        summary: r,
        severity: 65,
        domains: ["executive-copilot-v2"],
      })),
      ...(inv?.nextSteps ?? []).slice(0, 3).map((s) => ({
        title: "Next step",
        summary: s,
        domains: ["executive-copilot-v2"],
      })),
      ...(ctx.lights.decision?.recommendation?.rankedOptions ?? []).slice(0, 2).map((o) => ({
        title: o.title ?? "Option",
        summary: o.summary ?? "",
        domains: ["decision-intelligence"],
      })),
    ],
    "inv"
  );

  return {
    id: "investigation_workspace",
    title: "Investigation Workspace",
    subtitle: "Active org investigations from Copilot 2.0 + decision soft-reads",
    cards:
      cards.length > 0
        ? cards
        : cardsFrom(
            [
              {
                title: "Open investigation",
                summary:
                  "Ask Copilot: Why is revenue declining? Which departments are disconnected?",
                domains: ["executive-copilot-v2"],
              },
            ],
            "inv-empty"
          ),
    emptyMessage: "No investigation soft-reads yet.",
    controls: [
      { id: "open_revenue", label: "Investigate revenue", enabled: true },
      { id: "open_silos", label: "Investigate silos", enabled: true },
    ],
  };
}

export function buildAiWorkspace(ctx: MissionControlSoftContext): MissionControlPanel {
  const cards = cardsFrom(
    [
      ...(ctx.aiPulse
        ? [
            {
              title: `AI pulse · ${ctx.aiPulse.intent}`,
              summary: ctx.aiPulse.answer,
              score: Math.round(ctx.aiPulse.confidence * 100),
              domains: ctx.aiPulse.contributingDomains.slice(0, 4),
            },
          ]
        : []),
      ...(ctx.lights.copilot?.answer
        ? [
            {
              title: `Copilot · ${ctx.lights.copilot.intent ?? "answer"}`,
              summary: ctx.lights.copilot.answer,
              domains: ctx.lights.copilot.contributingDomains ?? ["executive-copilot"],
            },
          ]
        : []),
      ...(ctx.aiPulse?.followUps ?? []).slice(0, 3).map((f) => ({
        title: "Suggested ask",
        summary: f,
        domains: ["executive-copilot-v2"],
      })),
    ],
    "ai"
  );

  return {
    id: "ai_workspace",
    title: "AI Workspace",
    subtitle: "Executive Copilot 2.0 mission pulse and follow-ups",
    cards,
    emptyMessage: "AI workspace idle — sync domains or attach copilot lights.",
    controls: [
      { id: "ask_copilot", label: "Ask Copilot", enabled: true },
      { id: "board_package", label: "Prepare board package", enabled: true },
    ],
  };
}

export function buildDigitalTwinControls(
  ctx: MissionControlSoftContext
): MissionControlPanel {
  const twin = ctx.lights.digitalTwin;
  const fin = ctx.finance;
  const cards = cardsFrom(
    [
      ...(fin
        ? [
            {
              title: "Finance twin baseline",
              summary: `Working capital $${fin.digitalTwin.workingCapital.toLocaleString()} · net cash flow $${fin.digitalTwin.netCashFlow.toLocaleString()} · twin score ${fin.softLights.digitalTwin.twinScore.value}`,
              score: fin.softLights.digitalTwin.twinScore.value,
              domains: ["finance"],
            },
            {
              title: "Runway control",
              summary: `Runway ${fin.forecasting.runwayMonths ?? "n/a"} months · burn $${fin.finance.burnRateMonthly.toLocaleString()}/mo`,
              domains: ["finance"],
            },
          ]
        : []),
      ...(twin?.simulations ?? []).slice(0, 3).map((s) => ({
        title: `Simulation ${s.id ?? s.scenarioId ?? "run"}`,
        summary: `valid=${s.valid ?? "?"} · confidence ${Math.round((s.confidence ?? 0) * 100)}%`,
        score: Math.round((s.confidence ?? 0) * 100),
        domains: ["digital-twin"],
      })),
      ...(twin?.recommendation?.tradeOffs ?? []).slice(0, 2).map((t) => ({
        title: "Trade-off",
        summary: t,
        domains: ["digital-twin"],
      })),
    ],
    "twin"
  );

  return {
    id: "digital_twin_controls",
    title: "Digital Twin Controls",
    subtitle: "Baseline twin lights and simulation controls (soft-read)",
    cards,
    emptyMessage: "No digital twin soft-reads — sync finance or attach twin lights.",
    controls: [
      { id: "run_baseline", label: "Run baseline", enabled: Boolean(fin || twin) },
      { id: "stress_burn", label: "Stress −20% burn", enabled: Boolean(fin) },
      { id: "stress_revenue", label: "Stress −15% revenue", enabled: Boolean(fin || ctx.crm) },
    ],
  };
}

export function buildScenarioSimulator(
  ctx: MissionControlSoftContext
): MissionControlPanel {
  const twin = ctx.lights.digitalTwin;
  const cards = cardsFrom(
    [
      ...(twin?.scenarios ?? []).slice(0, 5).map((s) => ({
        title: s.label ?? s.kind ?? s.id ?? "Scenario",
        summary: `Scenario ${s.id ?? ""} (${s.kind ?? "custom"})`,
        domains: ["digital-twin"],
      })),
      ...(twin?.comparisons ?? []).slice(0, 3).map((c) => ({
        title: "Comparison",
        summary: c.highlight ?? "Scenario comparison",
        domains: ["digital-twin"],
      })),
      ...(ctx.finance
        ? [
            {
              title: "What-if: extend runway",
              summary: `At current burn, runway ${ctx.finance.forecasting.runwayMonths ?? "n/a"} mo; 20% cut ≈ ${
                ctx.finance.forecasting.runwayMonths != null
                  ? Math.round((ctx.finance.forecasting.runwayMonths / 0.8) * 10) / 10
                  : "n/a"
              } mo`,
              domains: ["finance"],
            },
          ]
        : []),
      ...(ctx.crm
        ? [
            {
              title: "What-if: pipeline conversion",
              summary: `Pipeline health ${ctx.crm.crm.pipelineHealth}/100 · forecast $${Math.round(ctx.crm.crm.salesForecast).toLocaleString()}`,
              domains: ["crm"],
            },
          ]
        : []),
    ],
    "scen"
  );

  return {
    id: "scenario_simulator",
    title: "Scenario Simulator",
    subtitle: "Compare twin scenarios and finance/CRM what-ifs",
    cards,
    emptyMessage: "No scenarios available — attach digital-twin lights or sync finance/CRM.",
    controls: [
      { id: "compare", label: "Compare scenarios", enabled: cards.length > 1 },
      { id: "recommend", label: "Recommend scenario", enabled: Boolean(twin?.recommendation) },
    ],
  };
}

export function buildRiskCenter(ctx: MissionControlSoftContext): MissionControlPanel {
  const cards = cardsFrom(
    [
      ...ctx.orgRisks.risks.slice(0, 8).map((r) => ({
        title: "Organizational risk",
        summary: r,
        severity: 70,
        domains: ["risk"],
      })),
      ...ctx.risks.slice(0, 4).map((r) => ({
        title: r.label,
        summary: "Risk entity in knowledge graph",
        severity: 60,
        domains: [r.domain ?? "knowledge-graph"],
      })),
      ...(ctx.lights.portfolio?.capacity?.bottlenecks ?? []).slice(0, 2).map((b) => ({
        title: "Capacity bottleneck",
        summary: b,
        severity: 65,
        domains: ["portfolio"],
      })),
    ],
    "risk"
  );

  return {
    id: "risk_center",
    title: "Risk Center",
    subtitle: "Unified organizational and portfolio risks",
    cards,
    emptyMessage: "No elevated risks in current soft-reads.",
  };
}

export function buildInitiativeMonitor(
  ctx: MissionControlSoftContext
): MissionControlPanel {
  const lightInits = ctx.lights.initiative?.initiatives ?? [];
  const cards = cardsFrom(
    [
      ...lightInits.slice(0, 8).map((i) => ({
        id: i.id,
        title: i.title ?? "Initiative",
        summary: `${i.state ?? "active"} · ${i.progress?.percentComplete ?? 0}% · health ${i.progress?.healthStatus ?? "n/a"}`,
        score: i.progress?.percentComplete,
        severity: i.progress?.healthStatus === "at_risk" ? 80 : 40,
        domains: ["initiative"],
      })),
      ...ctx.initiatives.slice(0, 5).map((i) => ({
        id: i.id,
        title: i.label,
        summary: "Initiative node in knowledge graph",
        domains: [i.domain ?? "knowledge-graph"],
      })),
      ...(ctx.lights.initiative
        ? [
            {
              title: "Initiative rollup",
              summary: `Active ${ctx.lights.initiative.activeCount ?? lightInits.length} · at risk ${ctx.lights.initiative.atRiskCount ?? 0}`,
              domains: ["initiative"],
            },
          ]
        : []),
    ],
    "init"
  );

  return {
    id: "initiative_monitor",
    title: "Initiative Monitor",
    subtitle: "Active and at-risk initiatives",
    cards,
    emptyMessage: "No initiatives in graph or initiative soft-reads.",
  };
}

export function buildPortfolioHealthPanel(
  ctx: MissionControlSoftContext
): MissionControlPanel {
  const h = ctx.lights.portfolio?.health;
  const cards = cardsFrom(
    [
      ...(h
        ? [
            {
              title: `Portfolio health · ${h.state ?? "unknown"}`,
              summary: h.explainability ?? `Health ${h.value ?? "n/a"} · risk index ${h.riskIndex ?? "n/a"}`,
              score: h.value,
              domains: ["portfolio"],
            },
          ]
        : []),
      ...(ctx.lights.portfolio?.prioritization ?? []).slice(0, 5).map((p) => ({
        title: `#${p.rank ?? "?"} ${p.title ?? "Initiative"}`,
        summary: `Composite ${p.composite ?? "n/a"}`,
        score: p.composite,
        domains: ["portfolio"],
      })),
      ...(ctx.lights.portfolio?.capacity?.overcommitted
        ? [
            {
              title: "Capacity overcommitted",
              summary: (ctx.lights.portfolio.capacity.bottlenecks ?? []).join("; ") || "Overcommitted",
              severity: 80,
              domains: ["portfolio"],
            },
          ]
        : []),
      ...(ctx.finance
        ? [
            {
              title: "Financial coverage",
              summary: `Cash $${ctx.finance.finance.cashPosition.toLocaleString()} · portfolio liquidity ${ctx.finance.portfolio.liquidityScore}`,
              score: ctx.finance.portfolio.financialScore,
              domains: ["finance"],
            },
          ]
        : []),
    ],
    "port"
  );

  return {
    id: "portfolio_health",
    title: "Portfolio Health",
    subtitle: "Portfolio score, prioritization, and capacity",
    cards,
    emptyMessage: "No portfolio soft-reads attached yet.",
  };
}

export function buildOrganizationGraphViewer(
  ctx: MissionControlSoftContext
): MissionControlPanel {
  const g = ctx.knowledgeGraph;
  const cards = cardsFrom(
    [
      ...(g
        ? [
            {
              title: "Organizational graph",
              summary: `${g.counts.nodes} nodes · ${g.counts.edges} edges · ${g.counts.domains} domains · ${g.counts.kinds} kinds`,
              score: Math.min(100, g.counts.nodes),
              domains: ["knowledge-graph"],
            },
            {
              title: "Domains connected",
              summary: g.graph.domainsConnected.join(", ") || "none",
              domains: ["knowledge-graph"],
            },
            {
              title: "Kinds present",
              summary: g.graph.kindsPresent.slice(0, 12).join(", ") || "none",
              domains: ["knowledge-graph"],
            },
          ]
        : []),
      ...ctx.people.slice(0, 4).map((p) => ({
        title: p.label,
        summary: `${p.kind} entity`,
        domains: [p.domain ?? "knowledge-graph"],
      })),
    ],
    "graph"
  );

  return {
    id: "organization_graph_viewer",
    title: "Organization Graph Viewer",
    subtitle: "Unified knowledge graph soft-read",
    cards,
    emptyMessage: "Knowledge graph empty — sync connectors and rebuild.",
    controls: [
      { id: "rebuild", label: "Rebuild graph", enabled: true },
      { id: "search_people", label: "Search people", enabled: ctx.people.length > 0 },
    ],
  };
}

export const PANEL_BUILDERS: Record<
  MissionControlPanelId,
  (ctx: MissionControlSoftContext) => MissionControlPanel
> = {
  organization_timeline: buildOrganizationTimeline,
  alert_center: buildAlertCenter,
  approval_center: buildApprovalCenter,
  investigation_workspace: buildInvestigationWorkspace,
  ai_workspace: buildAiWorkspace,
  digital_twin_controls: buildDigitalTwinControls,
  scenario_simulator: buildScenarioSimulator,
  risk_center: buildRiskCenter,
  initiative_monitor: buildInitiativeMonitor,
  portfolio_health: buildPortfolioHealthPanel,
  organization_graph_viewer: buildOrganizationGraphViewer,
};
