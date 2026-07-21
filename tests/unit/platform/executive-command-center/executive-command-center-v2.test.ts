/** RC-6 — Executive Command Center 2.0 (Mission Control) unit tests. */
import { beforeEach, describe, expect, it } from "vitest";
import {
  createIntegrationPlatformCore,
  registerCrmPlatformConnectors,
  registerHrPlatformConnectors,
  registerFinancePlatformConnectors,
  crmStore,
  hrStore,
  financeStore,
} from "@/lib/platform/integrations";
import {
  rebuildUnifiedKnowledgeGraph,
  unifiedGraphStore,
} from "@/lib/platform/knowledge-graph";
import {
  EXECUTIVE_COMMAND_CENTER_V2_VERSION,
  MISSION_CONTROL_PANELS,
  buildMissionControl,
} from "@/lib/platform/executive-command-center";
import {
  createExecutiveCommandCenter,
  getLayoutForRole,
} from "@/lib/platform/intelligence/executive-command-center";

describe("RC-6 — Executive Command Center 2.0 (Mission Control)", () => {
  beforeEach(() => {
    crmStore.clear();
    hrStore.clear();
    financeStore.clear();
    unifiedGraphStore.clear();
  });

  async function seedOrg(org = "org-ecc-v2-demo") {
    const platform = createIntegrationPlatformCore();
    registerCrmPlatformConnectors(platform);
    registerHrPlatformConnectors(platform);
    registerFinancePlatformConnectors(platform);

    for (const id of [`hubspot-${org}`, `gusto-${org}`, `stripe-${org}`]) {
      platform.lifecycle.seed(id, "connected");
    }
    await platform.syncNow("hubspot", `hubspot-${org}`, "full");
    await platform.syncNow("gusto", `gusto-${org}`, "full");
    await platform.syncNow("stripe", `stripe-${org}`, "full");
    rebuildUnifiedKnowledgeGraph(org);
    return org;
  }

  it("exports version and all mission-control panels", () => {
    expect(EXECUTIVE_COMMAND_CENTER_V2_VERSION).toBe("2.0.0");
    expect(MISSION_CONTROL_PANELS).toEqual(
      expect.arrayContaining([
        "organization_timeline",
        "alert_center",
        "approval_center",
        "investigation_workspace",
        "ai_workspace",
        "digital_twin_controls",
        "scenario_simulator",
        "risk_center",
        "initiative_monitor",
        "portfolio_health",
        "organization_graph_viewer",
      ])
    );
    expect(MISSION_CONTROL_PANELS).toHaveLength(11);
  });

  it("builds a full mission-control workspace from soft-reads", async () => {
    const org = await seedOrg();
    const workspace = buildMissionControl({
      organizationId: org,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
      lights: {
        briefing: {
          healthScore: { value: 61, label: "watch" },
          briefing: {
            sections: {
              topRisks: [{ title: "Pipeline pressure", summary: "Conversion soft", severity: 72 }],
            },
          },
          decisionQueue: [{ title: "Hiring plan", decisionNeeded: "Approve surge hiring" }],
        },
        autonomous: {
          approvalQueue: [
            { role: "ceo", status: "pending", rationale: "Budget override" },
          ],
        },
        initiative: {
          activeCount: 2,
          atRiskCount: 1,
          initiatives: [
            {
              id: "i1",
              title: "Initiative Alpha",
              state: "active",
              progress: { percentComplete: 40, healthStatus: "at_risk" },
            },
          ],
        },
        portfolio: {
          health: { value: 58, state: "watch", riskIndex: 42, explainability: "Capacity tight" },
        },
        digitalTwin: {
          scenarios: [{ id: "s1", kind: "expected", label: "Baseline" }],
          recommendation: { preferredScenarioId: "s1", majorRisks: ["Runway compression"] },
        },
      },
    });

    expect(workspace.version).toBe("2.0.0");
    expect(workspace.panelOrder).toHaveLength(11);
    expect(workspace.missionSummary.length).toBeGreaterThan(20);
    expect(workspace.panels.alert_center.cards.length).toBeGreaterThan(0);
    expect(workspace.panels.approval_center.cards.length).toBeGreaterThan(0);
    expect(workspace.panels.initiative_monitor.cards.length).toBeGreaterThan(0);
    expect(workspace.panels.digital_twin_controls.controls?.length).toBeGreaterThan(0);
    expect(workspace.panels.scenario_simulator.cards.length).toBeGreaterThan(0);
    expect(workspace.panels.ai_workspace.cards.length).toBeGreaterThan(0);
    expect(workspace.panels.organization_graph_viewer.cards.length).toBeGreaterThan(0);
    expect(workspace.contributingDomains).toContain("executive-command-center-v2");
  });

  it("wires Mission Control into Sprint 068 ECC role layout", async () => {
    const org = await seedOrg();
    const { service } = createExecutiveCommandCenter({
      createId: (p) => `${p}-mc`,
      now: () => new Date("2026-07-19T12:00:00.000Z"),
    });

    const result = service.build({
      requestId: "ecc-mc-1",
      scope: { organizationId: org, schoolId: null },
      role: "mission_control",
      briefingResult: {
        healthScore: { value: 64, label: "watch" },
        contributingDomains: ["briefing"],
        briefing: {
          sections: {
            executiveSummary: "Mission control validation brief",
            topRisks: [{ title: "Cash watch", summary: "Burn elevated", severity: 68 }],
          },
        },
      },
    });

    expect(result.metadata.missionControl).toBe(true);
    expect(result.metadata.missionControlVersion).toBe("2.0.0");
    expect(result.widgets.length).toBe(getLayoutForRole("mission_control").widgetOrder.length);

    const kinds = result.widgets.map((w) => w.kind);
    expect(kinds).toEqual(
      expect.arrayContaining([
        "mission_control_summary",
        "organization_timeline",
        "alert_center",
        "approval_center",
        "investigation_workspace",
        "ai_workspace",
        "digital_twin_controls",
        "scenario_simulator",
        "risk_center",
        "initiative_monitor",
        "organization_graph_viewer",
      ])
    );

    const summary = result.widgets.find((w) => w.kind === "mission_control_summary");
    expect(summary?.cards.length).toBeGreaterThan(0);
  });
});
