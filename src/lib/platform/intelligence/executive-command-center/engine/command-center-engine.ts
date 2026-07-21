/**
 * Executive Command Center orchestrator (Sprint 068).
 * Single workspace; widgets consume existing domain soft-reads only.
 */

import { DEFAULT_DRILL_DOWNS } from "@/lib/platform/intelligence/executive-command-center/actions/drill-downs";
import { LayoutEngine } from "@/lib/platform/intelligence/executive-command-center/engine/layout-engine";
import { RefreshEngine } from "@/lib/platform/intelligence/executive-command-center/engine/refresh-engine";
import { WorkspaceComposer } from "@/lib/platform/intelligence/executive-command-center/engine/workspace-composer";
import type {
  CommandCenterRequest,
  CommandCenterResult,
} from "@/lib/platform/intelligence/executive-command-center/types";
import { EXECUTIVE_COMMAND_CENTER_VERSION } from "@/lib/platform/intelligence/executive-command-center/types";
/**
 * RC-4 — ECC soft-reads domain widgets via knowledge-graph facade only
 * (never connector vendor APIs).
 */
import {
  buildGoogleWorkspaceEccWidgets,
  buildMicrosoft365EccWidgets,
  buildEnterpriseEccWidgets,
  buildHrEccWidgets,
  buildCollaborationEccWidgets,
  buildFinanceEccWidgets,
  buildCrmEccWidgets,
  buildEducationEccWidgets,
  buildKnowledgeGraphEccWidgets,
} from "@/lib/platform/knowledge-graph";
import { buildMissionControl } from "@/lib/platform/executive-command-center";

export interface CommandCenterEngineDeps {
  createId?: (prefix: string) => string;
  now?: () => Date;
}

export class CommandCenterEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly layouts: LayoutEngine;
  private readonly composer: WorkspaceComposer;
  private readonly refresh: RefreshEngine;

  constructor(deps: CommandCenterEngineDeps = {}) {
    let seq = 0;
    this.createId = deps.createId ?? ((p) => `${p}-${++seq}`);
    this.now = deps.now ?? (() => new Date());
    this.layouts = new LayoutEngine();
    this.composer = new WorkspaceComposer();
    this.refresh = new RefreshEngine();
  }

  build(request: CommandCenterRequest): CommandCenterResult {
    const role = request.role ?? "ceo";
    const layout = this.layouts.resolve(role);
    const nowIso = this.now().toISOString();

    // RC-2.06 / RC-3.01 — soft-read Workspace + Microsoft 365 widgets when org scope is present.
    const googleWorkspace = request.scope.organizationId
      ? buildGoogleWorkspaceEccWidgets(request.scope.organizationId)
      : null;
    const microsoft365 = request.scope.organizationId
      ? buildMicrosoft365EccWidgets(request.scope.organizationId)
      : null;
    const enterprise = request.scope.organizationId
      ? buildEnterpriseEccWidgets(request.scope.organizationId)
      : null;
    const hr = request.scope.organizationId
      ? buildHrEccWidgets(request.scope.organizationId)
      : null;
    const collaboration = request.scope.organizationId
      ? buildCollaborationEccWidgets(request.scope.organizationId)
      : null;
    const finance = request.scope.organizationId
      ? buildFinanceEccWidgets(request.scope.organizationId)
      : null;
    const crm = request.scope.organizationId
      ? buildCrmEccWidgets(request.scope.organizationId)
      : null;
    const education = request.scope.organizationId
      ? buildEducationEccWidgets(request.scope.organizationId)
      : null;
    const knowledgeGraph = request.scope.organizationId
      ? buildKnowledgeGraphEccWidgets(request.scope.organizationId)
      : null;

    // RC-6 — Mission Control soft-read (never connector vendor APIs).
    const missionControl = request.scope.organizationId
      ? buildMissionControl({
          organizationId: request.scope.organizationId,
          now: () => this.now(),
          lights: {
            briefing: request.briefingResult,
            autonomous: request.autonomousResult,
            initiative: request.initiativeResult,
            portfolio: request.portfolioResult,
            digitalTwin: request.digitalTwinResult,
            memory: request.memoryResult,
            decision: request.decisionResult,
            predictive: request.predictiveResult,
            copilot: request.copilotResult
              ? {
                  answer: request.copilotResult.answer,
                  intent: request.copilotResult.intent,
                  contributingDomains: request.copilotResult.contributingDomains,
                }
              : undefined,
          },
        })
      : null;

    const widgets = this.composer.compose(layout, {
      synthesis: request.synthesisResult,
      briefing: request.briefingResult,
      memory: request.memoryResult,
      decision: request.decisionResult,
      predictive: request.predictiveResult,
      autonomous: request.autonomousResult,
      copilot: request.copilotResult,
      initiative: request.initiativeResult,
      portfolio: request.portfolioResult,
      digitalTwin: request.digitalTwinResult,
      ecosystemIntelligence: request.ecosystemIntelligenceResult,
      googleWorkspace,
      microsoft365,
      enterprise,
      hr,
      collaboration,
      finance,
      crm,
      education,
      knowledgeGraph,
      missionControl,
      createId: this.createId,
      nowIso,
    });

    const contributing = new Set<string>(["executive-command-center"]);
    for (const d of request.synthesisResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.briefingResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.memoryResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.decisionResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.predictiveResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.autonomousResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.copilotResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.initiativeResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.portfolioResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.digitalTwinResult?.contributingDomains ?? []) contributing.add(d);
    for (const d of request.ecosystemIntelligenceResult?.contributingDomains ?? [])
      contributing.add(d);
    for (const w of widgets) contributing.add(w.sourceDomain);
    if (missionControl) {
      for (const d of missionControl.contributingDomains) contributing.add(d);
    }

    const health =
      request.briefingResult?.healthScore ??
      request.predictiveResult?.healthScore ??
      (missionControl
        ? {
            value: missionControl.healthScore.value,
            label: missionControl.healthScore.label,
          }
        : {
            value: 50,
            label: "unknown",
          });

    const refresh = this.refresh.snapshot({
      nowIso,
      domains: [...contributing],
    });

    return {
      requestId: request.requestId,
      version: EXECUTIVE_COMMAND_CENTER_VERSION,
      scope: request.scope,
      generatedAt: nowIso,
      role,
      layout,
      widgets,
      healthScore: {
        value: health.value ?? 50,
        label: health.label ?? "unknown",
      },
      refresh,
      drillDownActions: [...DEFAULT_DRILL_DOWNS],
      contributingDomains: [...contributing],
      metadata: {
        ...(request.metadata ?? {}),
        periodLabel: request.periodLabel,
        widgetCount: widgets.length,
        duplicatesDomainLogic: false,
        pipelineRefresh: true,
        missionControl: Boolean(missionControl),
        missionControlVersion: missionControl?.version,
        missionPanelCount: missionControl?.panelOrder.length,
      },
    };
  }
}
