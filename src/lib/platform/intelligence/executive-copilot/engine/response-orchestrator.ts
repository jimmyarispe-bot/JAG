/**
 * Response orchestrator — skill dispatch + explainability (Sprint 067).
 */

import type { AssembledContext } from "@/lib/platform/intelligence/executive-copilot/context/assemble";
import { planExecutionHandoff } from "@/lib/platform/intelligence/executive-copilot/planners/execution-plan";
import type { ReasoningPlan } from "@/lib/platform/intelligence/executive-copilot/planners/reasoning-plan";
import {
  compareRecommendations,
  compareScenarios,
  formatComparison,
} from "@/lib/platform/intelligence/executive-copilot/skills/compare";
import { buildExplanation } from "@/lib/platform/intelligence/executive-copilot/skills/explain";
import { forecastAnswer } from "@/lib/platform/intelligence/executive-copilot/skills/forecast";
import {
  formatInvestigation,
  investigateTopic,
} from "@/lib/platform/intelligence/executive-copilot/skills/investigate";
import { recommendAnswer } from "@/lib/platform/intelligence/executive-copilot/skills/recommend";
import { summarizeContext } from "@/lib/platform/intelligence/executive-copilot/skills/summarize";
import type {
  BriefingResultLight,
  CopilotBoardPrep,
  CopilotCompareItem,
  CopilotEvidence,
  CopilotExplainability,
  CopilotInvestigation,
  CopilotRequest,
  DomainTraceEntry,
} from "@/lib/platform/intelligence/executive-copilot/types";

export interface OrchestratedResponse {
  answer: string;
  explainability: CopilotExplainability;
  comparison?: CopilotCompareItem[];
  investigation?: CopilotInvestigation;
  boardPrep?: CopilotBoardPrep;
  executionPlanRefs?: ReturnType<typeof planExecutionHandoff>["refs"];
}

export class ResponseOrchestrator {
  constructor(private readonly createId: (prefix: string) => string) {}

  orchestrate(input: {
    request: CopilotRequest;
    context: AssembledContext;
    reasoning: ReasoningPlan;
    domainTrace: DomainTraceEntry[];
  }): OrchestratedResponse {
    const { request, context, reasoning, domainTrace } = input;
    let answer = "";
    let evidence: CopilotEvidence[] = [];
    let uncertainties: string[] = [];
    let comparison: CopilotCompareItem[] | undefined;
    let investigation: CopilotInvestigation | undefined;
    let boardPrep: CopilotBoardPrep | undefined;
    let executionPlanRefs: OrchestratedResponse["executionPlanRefs"];

    switch (reasoning.intent) {
      case "summarize": {
        answer = summarizeContext({
          periodLabel: request.periodLabel,
          synthesis: context.synthesis,
          briefing: context.briefing,
          decision: context.decision,
          predictive: context.predictive,
        });
        const explained = buildExplanation({
          question: request.question,
          ...context,
          createId: this.createId,
        });
        evidence = explained.evidence;
        uncertainties = explained.uncertainties;
        break;
      }
      case "compare": {
        comparison =
          compareRecommendations(context.decision).length > 0
            ? compareRecommendations(context.decision)
            : compareScenarios(context.predictive);
        answer = formatComparison(comparison);
        evidence = comparison.map((c, i) => ({
          id: this.createId(`ev-cmp-${i}`),
          statement: `${c.label}: ${c.summary}`,
          domain: c.domains?.[0] ?? "decision-intelligence",
          supporting: true,
          weight: (c.score ?? 50) / 100,
        }));
        break;
      }
      case "investigate": {
        investigation = investigateTopic({
          topic: request.question,
          ...context,
        });
        answer = formatInvestigation(investigation);
        evidence = [
          ...investigation.signals.slice(0, 3).map((s, i) => ({
            id: this.createId(`ev-sig-${i}`),
            statement: s,
            domain: "synthesis" as const,
            supporting: true,
          })),
          ...investigation.risks.slice(0, 2).map((s, i) => ({
            id: this.createId(`ev-risk-${i}`),
            statement: s,
            domain: "briefing" as const,
            supporting: false,
          })),
        ];
        break;
      }
      case "forecast": {
        const f = forecastAnswer(request.question, context.predictive);
        answer = f.summary;
        uncertainties = f.uncertainties;
        evidence = (context.predictive?.forecasts ?? []).slice(0, 3).map((fc, i) => ({
          id: this.createId(`ev-fc-${i}`),
          statement: `${fc.subject}: ${fc.direction} (${fc.horizon})`,
          domain: "executive-predictive",
          supporting: true,
          weight: fc.confidence,
        }));
        break;
      }
      case "recommend": {
        const r = recommendAnswer(context.decision);
        answer = r.summary;
        uncertainties = r.uncertainties;
        comparison = compareRecommendations(context.decision);
        evidence = (context.decision?.recommendation?.rankedOptions ?? [])
          .slice(0, 3)
          .map((o, i) => ({
            id: this.createId(`ev-rec-${i}`),
            statement: o.summary ?? o.title ?? "Option",
            domain: "decision-intelligence",
            supporting: true,
            weight: o.confidence,
          }));
        break;
      }
      case "recall": {
        const decisions = context.memory?.decisions ?? [];
        const timeline = context.memory?.timeline ?? [];
        if (decisions.length === 0 && timeline.length === 0) {
          answer =
            "Executive Memory has no matching decisions or timeline entries for this question yet.";
          uncertainties.push("Empty memory context");
        } else {
          const dLines = decisions
            .slice(0, 3)
            .map(
              (d) =>
                `${d.title ?? "Decision"}${d.actualOutcome ? `: ${d.actualOutcome}` : d.expectedOutcome ? ` (expected ${d.expectedOutcome})` : ""}`
            );
          const tLines = timeline
            .slice(0, 3)
            .map((t) => `${t.at ?? ""} ${t.title ?? t.summary ?? ""}`.trim());
          answer = `Memory recall: ${[...dLines, ...tLines].join("; ")}.`;
          evidence = [...dLines, ...tLines].map((statement, i) => ({
            id: this.createId(`ev-mem-${i}`),
            statement,
            domain: "executive-memory",
            supporting: true,
          }));
        }
        break;
      }
      case "plan": {
        boardPrep = this.buildBoardPrep(context);
        answer = [
          "Board / leadership prep package:",
          boardPrep.briefingSummary,
          boardPrep.highPriorityRisks.length
            ? `Risks: ${boardPrep.highPriorityRisks.join("; ")}.`
            : null,
          boardPrep.openDecisions.length
            ? `Open decisions: ${boardPrep.openDecisions.join("; ")}.`
            : null,
          boardPrep.pendingApprovals.length
            ? `Pending approvals: ${boardPrep.pendingApprovals.join("; ")}.`
            : null,
          boardPrep.forecasts.length
            ? `Forecasts: ${boardPrep.forecasts.join("; ")}.`
            : null,
          boardPrep.recentChanges.length
            ? `Recent changes: ${boardPrep.recentChanges.join("; ")}.`
            : null,
        ]
          .filter(Boolean)
          .join(" ");
        evidence = [
          ...boardPrep.highPriorityRisks.slice(0, 2).map((s, i) => ({
            id: this.createId(`ev-bp-r-${i}`),
            statement: s,
            domain: "briefing" as const,
            supporting: false,
          })),
          ...boardPrep.openDecisions.slice(0, 2).map((s, i) => ({
            id: this.createId(`ev-bp-d-${i}`),
            statement: s,
            domain: "decision-intelligence" as const,
            supporting: true,
          })),
        ];
        break;
      }
      case "explain":
      default: {
        const explained = buildExplanation({
          question: request.question,
          ...context,
          createId: this.createId,
        });
        answer = explained.summary;
        evidence = explained.evidence;
        uncertainties = explained.uncertainties;
        break;
      }
    }

    if (context.conflictingEvidence) {
      uncertainties.push("Conflicting evidence detected across upstream domains.");
    }
    if (context.availableDomainCount === 0) {
      uncertainties.push("No upstream intelligence domains attached.");
    }

    if (reasoning.attachExecutionRefs) {
      const handoff = planExecutionHandoff(context.autonomous);
      executionPlanRefs = handoff.refs;
      if (handoff.refs.length > 0) {
        answer = `${answer} ${handoff.governanceNote}`;
      } else if (request.requestExecutionPrep) {
        answer = `${answer} ${handoff.governanceNote}`;
      }
    }

    const contributing = [
      ...new Set([
        ...domainTrace.filter((d) => d.used).map((d) => d.domain),
        ...evidence.map((e) => e.domain),
      ]),
    ];

    const confidence = this.scoreConfidence(context, evidence, uncertainties);

    return {
      answer,
      comparison: reasoning.allowComparison ? comparison : undefined,
      investigation: reasoning.allowInvestigation ? investigation : undefined,
      boardPrep: reasoning.allowBoardPrep ? boardPrep : undefined,
      executionPlanRefs,
      explainability: {
        executiveSummary: answer.slice(0, 280),
        supportingEvidence: evidence,
        contributingDomains: contributing,
        confidence,
        knownUncertainties: uncertainties,
        domainTrace,
      },
    };
  }

  private buildBoardPrep(context: AssembledContext): CopilotBoardPrep {
    const briefing: BriefingResultLight | undefined = context.briefing;
    return {
      briefingSummary:
        briefing?.briefing?.sections?.executiveSummary ??
        context.synthesis?.brief?.executiveSummary ??
        "No briefing summary available.",
      openDecisions: [
        ...(briefing?.decisionQueue ?? []).map(
          (d) => d.title ?? d.decisionNeeded ?? "Open decision"
        ),
        ...(context.decision?.recommendation?.rankedOptions ?? [])
          .slice(0, 2)
          .map((o) => o.title ?? "Recommendation"),
      ],
      highPriorityRisks: (briefing?.briefing?.sections?.topRisks ?? [])
        .slice(0, 3)
        .map((r) => r.title ?? r.summary ?? "Risk"),
      pendingApprovals: (context.autonomous?.approvalQueue ?? [])
        .filter((a) => a.status === "pending")
        .map((a) => `${(a.role ?? "role").replace(/_/g, " ")}: ${a.rationale ?? "pending"}`),
      forecasts: (context.predictive?.forecasts ?? [])
        .slice(0, 3)
        .map((f) => `${f.subject} (${f.horizon}): ${f.direction}`),
      recentChanges: (context.memory?.timeline ?? [])
        .slice(0, 3)
        .map((t) => t.summary ?? t.title ?? "Change"),
    };
  }

  private scoreConfidence(
    context: AssembledContext,
    evidence: CopilotEvidence[],
    uncertainties: string[]
  ): number {
    const base = Math.min(0.85, 0.25 + context.availableDomainCount * 0.1 + evidence.length * 0.05);
    const penalty = uncertainties.length * 0.08 + (context.conflictingEvidence ? 0.12 : 0);
    return Math.max(0.15, Math.min(0.95, base - penalty));
  }
}
