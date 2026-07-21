/**
 * RC-5 — Executive Copilot 2.0 engine.
 * Soft-reads KG + domain feeds; answers cross-domain executive questions.
 */

import { assembleCopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import { detectCopilotV2Intent } from "@/lib/platform/executive-copilot/planners/intent";
import { reasonCrossDomain } from "@/lib/platform/executive-copilot/reasoning/cross-domain";
import {
  investigateDisconnectedDepartments,
  investigateInitiativeImpact,
  investigateOrganization,
} from "@/lib/platform/executive-copilot/reasoning/organizational-investigation";
import {
  analyzeRevenueDecline,
  analyzeRootCause,
} from "@/lib/platform/executive-copilot/reasoning/root-cause";
import {
  buildDecisionSupport,
  identifyDecisionMakers,
} from "@/lib/platform/executive-copilot/reasoning/decision-support";
import { buildExecutiveNarrative } from "@/lib/platform/executive-copilot/reasoning/narratives";
import { prepareBoardPackage } from "@/lib/platform/executive-copilot/reasoning/board-preparation";
import { reasonDigitalTwin } from "@/lib/platform/executive-copilot/reasoning/digital-twin";
import { reasonTimeline } from "@/lib/platform/executive-copilot/reasoning/timeline";
import { reasonMemory } from "@/lib/platform/executive-copilot/reasoning/memory";
import { surfaceOrganizationalRisks } from "@/lib/platform/executive-copilot/reasoning/risks";
import {
  EXECUTIVE_COPILOT_V2_VERSION,
  type CopilotV2Answer,
  type CopilotV2Capability,
  type CopilotV2Evidence,
} from "@/lib/platform/executive-copilot/types";

export type CopilotV2Request = {
  organizationId: string;
  question: string;
  /** Optional Sprint 067 memory lights — never required. */
  memoryLights?: {
    decisions?: Array<{ title: string; decision: string }>;
    lessons?: Array<{ title?: string; lesson?: string; summary?: string }>;
    timeline?: Array<{ title?: string; summary?: string }>;
  };
};

function mergeEvidence(...lists: CopilotV2Evidence[][]): CopilotV2Evidence[] {
  return lists.flat().slice(0, 24);
}

export function answerExecutiveCopilotV2(request: CopilotV2Request): CopilotV2Answer {
  const ctx = assembleCopilotV2SoftContext(request.organizationId);
  const intent = detectCopilotV2Intent(request.question);
  const capabilitiesUsed: CopilotV2Capability[] = [];
  let answer = "";
  let narrative: string | undefined;
  let rootCauses: string[] | undefined;
  let decisionSupport: string[] | undefined;
  let boardPrep: CopilotV2Answer["boardPrep"];
  let investigation: CopilotV2Answer["investigation"];
  let evidence: CopilotV2Evidence[] = [];
  let confidence = 0.5;
  const followUps: string[] = [];

  switch (intent) {
    case "revenue_decline": {
      capabilitiesUsed.push("root_cause_analysis", "cross_domain_reasoning");
      const rc = analyzeRevenueDecline(ctx);
      answer = rc.narrative;
      rootCauses = rc.causes;
      evidence = rc.evidence;
      confidence = rc.confidence;
      followUps.push("Show organizational risks this month.");
      followUps.push("Who are the key decision makers?");
      break;
    }
    case "disconnected_departments": {
      capabilitiesUsed.push("organizational_investigation", "cross_domain_reasoning");
      const inv = investigateDisconnectedDepartments(ctx);
      investigation = inv;
      answer = inv.findings.join(" ");
      evidence = inv.evidence;
      confidence = inv.findings.length ? 0.7 : 0.3;
      followUps.push("Summarize everything affecting Initiative Alpha.");
      break;
    }
    case "initiative_impact": {
      capabilitiesUsed.push("organizational_investigation", "timeline_reasoning");
      const inv = investigateInitiativeImpact(ctx, request.question);
      investigation = inv;
      answer = `Initiative impact: ${inv.findings.slice(0, 4).join(" ")} Risks: ${inv.risks.slice(0, 3).join("; ") || "none flagged"}.`;
      evidence = inv.evidence;
      confidence = 0.65;
      followUps.push("Prepare a board package.");
      break;
    }
    case "decision_makers": {
      capabilitiesUsed.push("decision_support", "memory_reasoning");
      const dm = identifyDecisionMakers(ctx);
      answer = dm.answer;
      decisionSupport = dm.recommendations;
      evidence = dm.evidence;
      confidence = dm.makers.length ? 0.75 : 0.35;
      followUps.push("What decisions are pending for the board?");
      break;
    }
    case "organizational_risks": {
      capabilitiesUsed.push("organizational_investigation", "timeline_reasoning");
      const r = surfaceOrganizationalRisks(ctx);
      answer = r.answer;
      investigation = {
        topic: "organizational_risks",
        findings: r.risks,
        risks: r.risks,
        nextSteps: ["Review top risks in ECC and assign owners."],
      };
      evidence = r.evidence;
      confidence = 0.7;
      followUps.push("Why is revenue declining?");
      break;
    }
    case "board_prep": {
      capabilitiesUsed.push("board_preparation", "executive_narratives", "decision_support");
      const pack = prepareBoardPackage(ctx);
      boardPrep = pack;
      answer = pack.briefingSummary;
      narrative = pack.briefingSummary;
      decisionSupport = pack.decisions;
      confidence = 0.72;
      followUps.push("Show organizational risks this month.");
      break;
    }
    case "digital_twin": {
      capabilitiesUsed.push("digital_twin_reasoning", "cross_domain_reasoning");
      const twin = reasonDigitalTwin(ctx);
      answer = twin.scenarios.join(" ");
      evidence = twin.evidence;
      confidence = twin.confidence;
      followUps.push("Prepare a board package.");
      break;
    }
    case "timeline": {
      capabilitiesUsed.push("timeline_reasoning");
      const tl = reasonTimeline(ctx);
      answer = tl.answer;
      evidence = tl.evidence;
      confidence = tl.entries.length ? 0.7 : 0.3;
      break;
    }
    case "memory": {
      capabilitiesUsed.push("memory_reasoning");
      const mem = reasonMemory(ctx, request.memoryLights);
      answer = mem.answer;
      evidence = mem.evidence;
      confidence = mem.memories.length ? 0.68 : 0.3;
      break;
    }
    case "root_cause": {
      capabilitiesUsed.push("root_cause_analysis", "cross_domain_reasoning");
      const rc = analyzeRootCause(ctx, request.question);
      answer = rc.narrative;
      rootCauses = rc.causes;
      evidence = rc.evidence;
      confidence = rc.confidence;
      break;
    }
    case "narrative": {
      capabilitiesUsed.push("executive_narratives", "cross_domain_reasoning");
      const n = buildExecutiveNarrative(ctx);
      answer = n.narrative;
      narrative = n.narrative;
      confidence = ctx.domainsPresent.length ? 0.7 : 0.25;
      break;
    }
    case "cross_domain":
    case "general_investigate":
    default: {
      capabilitiesUsed.push("cross_domain_reasoning", "organizational_investigation");
      const xd = reasonCrossDomain(ctx);
      const inv = investigateOrganization(ctx, request.question);
      investigation = inv;
      answer = `${xd.summary} ${inv.findings.slice(0, 3).join(" ")}`;
      evidence = mergeEvidence(xd.evidence, inv.evidence);
      confidence = xd.confidence;
      followUps.push("Why is revenue declining?");
      followUps.push("Which departments are disconnected?");
      followUps.push("Show organizational risks this month.");
      break;
    }
  }

  if (!capabilitiesUsed.includes("cross_domain_reasoning") && ctx.domainsPresent.length > 1) {
    capabilitiesUsed.push("cross_domain_reasoning");
  }

  return {
    version: EXECUTIVE_COPILOT_V2_VERSION,
    organizationId: request.organizationId,
    question: request.question,
    intent,
    capabilitiesUsed: [...new Set(capabilitiesUsed)],
    answer,
    narrative,
    rootCauses,
    decisionSupport,
    boardPrep,
    investigation,
    evidence,
    contributingDomains: [
      "executive-copilot-v2",
      ...ctx.domainsPresent,
    ],
    confidence,
    followUps:
      followUps.length > 0
        ? followUps
        : [
            "Why is revenue declining?",
            "Which departments are disconnected?",
            "Who are the key decision makers?",
          ],
  };
}

