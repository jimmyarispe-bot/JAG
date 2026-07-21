/**
 * Sprint 064 — Decision Intelligence engine.
 */

import { generateOptionSeeds } from "@/lib/platform/intelligence/decision-intelligence/engine/option-generator";
import {
  evaluateOption,
  lookupHistory,
} from "@/lib/platform/intelligence/decision-intelligence/engine/evaluation-engine";
import { buildRecommendation } from "@/lib/platform/intelligence/decision-intelligence/engine/recommendation-engine";
import {
  DEFAULT_POLICIES,
} from "@/lib/platform/intelligence/decision-intelligence/policies/policy-engine";
import type {
  DecisionEvidence,
  DecisionIntelligenceRequest,
  DecisionIntelligenceResult,
  DecisionIssueKind,
  OrganizationalPolicy,
} from "@/lib/platform/intelligence/decision-intelligence/types";
import { DECISION_INTELLIGENCE_VERSION } from "@/lib/platform/intelligence/decision-intelligence/types";

export interface DecisionEngineDependencies {
  createId?: (prefix: string) => string;
  now?: () => Date;
  policies?: OrganizationalPolicy[];
}

let idSeq = 0;

function defaultCreateId(prefix: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}`;
}

export class DecisionIntelligenceEngine {
  private readonly createId: (prefix: string) => string;
  private readonly now: () => Date;
  private readonly defaultPolicies: OrganizationalPolicy[];

  constructor(deps: DecisionEngineDependencies = {}) {
    this.createId = deps.createId ?? defaultCreateId;
    this.now = deps.now ?? (() => new Date());
    this.defaultPolicies = deps.policies ?? DEFAULT_POLICIES;
  }

  build(request: DecisionIntelligenceRequest): DecisionIntelligenceResult {
    const nowIso = this.now().toISOString();
    const issue = resolveIssue(request);
    const evidence = collectEvidence(request);
    const hasContradiction = evidence.some((e) => !e.supporting);
    const historical = lookupHistory(
      request.memoryResult,
      issue.domains,
      issue.title
    );
    const policies = request.policies?.length
      ? request.policies
      : this.defaultPolicies;

    const seeds = generateOptionSeeds(issue.kind);
    const options = seeds.map((seed, i) =>
      evaluateOption({
        id: this.createId(`opt-${i}`),
        seed,
        issueDomains: issue.domains,
        issueSeverity: issue.severity,
        impactIfDelayed: issue.impactIfDelayed,
        evidence,
        historical,
        policies,
        hasContradiction,
      })
    );

    const recommendation = buildRecommendation({
      scope: request.scope,
      issueKind: issue.kind,
      issueTitle: issue.title,
      issueSummary: issue.summary,
      domains: issue.domains,
      options,
      evidence,
      createId: this.createId,
      nowIso,
    });

    const healthValue = options.length
      ? Math.min(100, 50 + recommendation.confidence * 0.4 + options.length * 3)
      : 25;

    return {
      requestId: request.requestId,
      version: DECISION_INTELLIGENCE_VERSION,
      scope: request.scope,
      generatedAt: nowIso,
      healthScore: {
        value: Math.round(healthValue),
        label:
          options.length === 0
            ? "empty"
            : healthValue >= 70
              ? "actionable"
              : healthValue >= 45
                ? "forming"
                : "weak",
      },
      recommendation,
      options: recommendation.rankedOptions,
      contributingDomains: [
        ...new Set([
          ...issue.domains,
          ...(request.briefingResult?.contributingDomains ?? []),
          ...(request.memoryResult?.contributingDomains ?? []),
        ]),
      ],
      metadata: {
        pipeline: "decision-intelligence",
        issueKind: issue.kind,
        optionCount: options.length,
        ...(request.metadata ?? {}),
      },
    };
  }
}

function resolveIssue(request: DecisionIntelligenceRequest): {
  kind: DecisionIssueKind;
  title: string;
  summary: string;
  domains: string[];
  severity?: number;
  impactIfDelayed?: boolean;
} {
  if (request.issue?.title) {
    return {
      kind: request.issue.kind ?? inferKind(request.issue.title, request.issue.domains),
      title: request.issue.title,
      summary: request.issue.summary ?? request.issue.title,
      domains: request.issue.domains ?? [],
      severity: 60,
      impactIfDelayed: true,
    };
  }

  const decision =
    request.briefingResult?.decisionQueue?.[0] ??
    request.briefingResult?.briefing?.sections?.decisionsWaiting?.[0];
  if (decision) {
    const title = decision.decisionNeeded ?? decision.title ?? "Executive decision";
    return {
      kind: inferKind(title, decision.domains),
      title,
      summary: decision.why ?? decision.recommendedDecision ?? title,
      domains: decision.domains ?? [],
      severity: 70,
      impactIfDelayed: Boolean(decision.impactIfDelayed),
    };
  }

  const risk = request.briefingResult?.briefing?.sections?.topRisks?.[0];
  if (risk) {
    return {
      kind: inferKind(risk.title ?? "risk", risk.domains),
      title: risk.title ?? "Top organizational risk",
      summary: risk.summary ?? risk.title ?? "Risk requires decision support",
      domains: risk.domains ?? [],
      severity: risk.severity,
      impactIfDelayed: true,
    };
  }

  const insight = request.briefingResult?.insights?.[0];
  if (insight) {
    return {
      kind: "strategic",
      title: insight.title ?? "Strategic issue",
      summary: insight.summary ?? insight.rootCause?.likelyCause ?? "Strategic decision needed",
      domains: insight.rootCause?.affectedDomains ?? [],
      severity: 55,
    };
  }

  return {
    kind: "generic",
    title: "No issue supplied",
    summary: "Decision Intelligence received empty context.",
    domains: [],
    severity: 20,
  };
}

function inferKind(text: string, domains?: string[]): DecisionIssueKind {
  const t = `${text} ${(domains ?? []).join(" ")}`.toLowerCase();
  if (/staff|teacher|hire|vacanc|turnover|human-capital/.test(t)) return "staffing";
  if (/cash|budget|financ|revenue|funding/.test(t)) return "financial";
  if (/enroll|parent|customer|retention/.test(t)) return "enrollment";
  if (/complian|legal|regul/.test(t)) return "compliance";
  if (/growth|expand|market/.test(t)) return "growth";
  if (/operat|process|system/.test(t)) return "operations";
  if (/strateg|wisdom/.test(t)) return "strategic";
  return "generic";
}

function collectEvidence(request: DecisionIntelligenceRequest): DecisionEvidence[] {
  const evidence: DecisionEvidence[] = [];
  let i = 0;
  const briefing = request.briefingResult;
  const summary =
    briefing?.briefing?.sections?.executiveSummary ??
    briefing?.insights?.[0]?.summary;
  if (summary) {
    evidence.push({
      id: `ev-${++i}`,
      statement: summary,
      supporting: true,
      source: "briefing",
      weight: 0.8,
      domain: briefing?.contributingDomains?.[0],
    });
  }
  for (const d of briefing?.decisionQueue ?? []) {
    if (d.why) {
      evidence.push({
        id: `ev-${++i}`,
        statement: d.why,
        supporting: true,
        source: "briefing",
        weight: 0.7,
        domain: d.domains?.[0],
      });
    }
  }
  for (const lesson of request.memoryResult?.lessons ?? []) {
    evidence.push({
      id: `ev-${++i}`,
      statement: lesson.summary ?? lesson.whatHappened ?? lesson.title ?? "Lesson",
      supporting: true,
      source: "executive-memory",
      weight: 0.65,
      domain: lesson.domains?.[0],
    });
    if (lesson.change?.length) {
      evidence.push({
        id: `ev-${++i}`,
        statement: `Historical caution: ${lesson.change[0]}`,
        supporting: false,
        source: "executive-memory",
        weight: 0.5,
        domain: lesson.domains?.[0],
      });
    }
  }
  if (!evidence.length) {
    evidence.push({
      id: "ev-empty",
      statement: "Limited evidence available — recommendations are provisional.",
      supporting: false,
      source: "assumption",
      weight: 0.3,
    });
  }
  return evidence;
}

export function resetDecisionIntelligenceIdSeqForTests(): void {
  idSeq = 0;
}
