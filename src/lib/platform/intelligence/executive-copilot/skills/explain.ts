import type {
  BriefingResultLight,
  CopilotEvidence,
  DecisionIntelligenceResultLight,
  ExecutiveMemoryResultLight,
  ExecutivePredictiveResultLight,
  SynthesisResultLight,
} from "@/lib/platform/intelligence/executive-copilot/types";

export function buildExplanation(input: {
  question: string;
  synthesis?: SynthesisResultLight;
  briefing?: BriefingResultLight;
  memory?: ExecutiveMemoryResultLight;
  decision?: DecisionIntelligenceResultLight;
  predictive?: ExecutivePredictiveResultLight;
  createId: (prefix: string) => string;
}): { summary: string; evidence: CopilotEvidence[]; uncertainties: string[] } {
  const evidence: CopilotEvidence[] = [];
  const parts: string[] = [];
  const uncertainties: string[] = [];

  const synthSummary =
    input.synthesis?.brief?.executiveSummary ?? input.synthesis?.brief?.headline;
  if (synthSummary) {
    parts.push(synthSummary);
    evidence.push({
      id: input.createId("ev-syn"),
      statement: synthSummary,
      domain: "synthesis",
      supporting: true,
      weight: 0.8,
    });
  }

  const briefSummary = input.briefing?.briefing?.sections?.executiveSummary;
  if (briefSummary) {
    parts.push(briefSummary);
    evidence.push({
      id: input.createId("ev-br"),
      statement: briefSummary,
      domain: "briefing",
      supporting: true,
      weight: 0.75,
    });
  }

  for (const risk of input.briefing?.briefing?.sections?.topRisks?.slice(0, 3) ?? []) {
    evidence.push({
      id: input.createId("ev-risk"),
      statement: risk.summary ?? risk.title ?? "Risk signal",
      domain: "briefing",
      supporting: false,
      weight: (risk.severity ?? 50) / 100,
    });
  }

  const decisionSummary = input.decision?.recommendation?.executiveSummary;
  if (decisionSummary) {
    parts.push(decisionSummary);
    evidence.push({
      id: input.createId("ev-di"),
      statement: decisionSummary,
      domain: "decision-intelligence",
      supporting: true,
      weight: input.decision?.recommendation?.confidence ?? 0.6,
    });
  }

  for (const signal of input.predictive?.emergingSignals?.slice(0, 2) ?? []) {
    evidence.push({
      id: input.createId("ev-sig"),
      statement: signal.narrative ?? signal.title ?? "Emerging signal",
      domain: "executive-predictive",
      supporting: true,
      weight: signal.strength ?? 0.5,
    });
  }

  for (const lesson of input.memory?.lessons?.slice(0, 2) ?? []) {
    evidence.push({
      id: input.createId("ev-mem"),
      statement: lesson.summary ?? lesson.title ?? "Historical lesson",
      domain: "executive-memory",
      supporting: true,
      weight: 0.55,
    });
  }

  if (parts.length === 0 && evidence.length === 0) {
    uncertainties.push("Limited upstream context — answer is directional only.");
    parts.push(
      `Based on available intelligence, I cannot yet fully explain "${input.question}". Attach briefing, synthesis, or decision context for a stronger answer.`
    );
  } else if (evidence.filter((e) => !e.supporting).length > 0 && evidence.filter((e) => e.supporting).length > 0) {
    uncertainties.push("Supporting and conflicting signals are both present.");
  }

  const summary =
    parts[0] ??
    `Here is a unified explanation for: ${input.question}`;

  return { summary, evidence, uncertainties };
}
