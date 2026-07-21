/**
 * RC-6 — build Mission Control workspace from soft-reads.
 */

import { assembleMissionControlSoftContext } from "@/lib/platform/executive-command-center/context/soft-reads";
import { PANEL_BUILDERS } from "@/lib/platform/executive-command-center/centers/panels";
import {
  EXECUTIVE_COMMAND_CENTER_V2_VERSION,
  MISSION_CONTROL_PANELS,
  type MissionControlLights,
  type MissionControlPanel,
  type MissionControlPanelId,
  type MissionControlWorkspace,
} from "@/lib/platform/executive-command-center/types";

export type BuildMissionControlInput = {
  organizationId: string;
  lights?: MissionControlLights;
  now?: () => Date;
};

export function buildMissionControl(
  input: BuildMissionControlInput
): MissionControlWorkspace {
  const nowIso = (input.now ?? (() => new Date()))().toISOString();
  const ctx = assembleMissionControlSoftContext(
    input.organizationId,
    input.lights ?? {}
  );

  const panels = {} as Record<MissionControlPanelId, MissionControlPanel>;
  for (const id of MISSION_CONTROL_PANELS) {
    panels[id] = PANEL_BUILDERS[id](ctx);
  }

  const healthValue =
    ctx.lights.briefing?.healthScore?.value ??
    ctx.lights.predictive?.healthScore?.value ??
    ctx.finance?.softLights.financial.healthScore.value ??
    (ctx.collaboration ? ctx.collaboration.communicationHealth.score : 50);

  const healthLabel =
    ctx.lights.briefing?.healthScore?.label ??
    ctx.lights.predictive?.healthScore?.label ??
    (healthValue >= 70 ? "stable" : healthValue >= 50 ? "watch" : "critical");

  const alertCount = panels.alert_center.cards.length;
  const riskCount = panels.risk_center.cards.length;
  const missionSummary = [
    `Mission Control online across ${ctx.domainsPresent.length} domain soft-read(s).`,
    `${alertCount} alert(s) · ${riskCount} risk signal(s).`,
    ctx.aiPulse ? `AI pulse: ${ctx.aiPulse.answer.slice(0, 160)}` : "AI pulse unavailable.",
  ].join(" ");

  return {
    version: EXECUTIVE_COMMAND_CENTER_V2_VERSION,
    organizationId: input.organizationId,
    generatedAt: nowIso,
    panels,
    panelOrder: [...MISSION_CONTROL_PANELS],
    healthScore: { value: Math.round(healthValue), label: healthLabel },
    contributingDomains: [
      "executive-command-center-v2",
      ...ctx.domainsPresent,
    ],
    missionSummary,
  };
}

