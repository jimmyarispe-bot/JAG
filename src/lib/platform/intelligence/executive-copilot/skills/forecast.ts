import type { ExecutivePredictiveResultLight } from "@/lib/platform/intelligence/executive-copilot/types";

export function forecastAnswer(
  question: string,
  predictive?: ExecutivePredictiveResultLight
): { summary: string; uncertainties: string[] } {
  const uncertainties: string[] = [];
  if (!predictive?.forecasts?.length && !predictive?.scenarios?.length) {
    uncertainties.push("No predictive forecasts attached.");
    return {
      summary: `I do not yet have predictive context to answer "${question}". Run Executive Predictive or attach its result.`,
      uncertainties,
    };
  }

  const delayMatch = /delay|wait|postpone|(\d+)\s*days?/i.test(question);
  const horizonMatch = question.match(/(\d+)\s*days?/i);
  const horizon = horizonMatch?.[1] ? `${horizonMatch[1]}d` : "90d";

  const lines: string[] = [];
  const relevant = (predictive.forecasts ?? []).filter((f) => {
    const h = (f.horizon ?? "").toLowerCase();
    return !horizonMatch || h.includes(horizon.replace("d", "")) || h === horizon;
  });

  for (const f of (relevant.length ? relevant : predictive.forecasts ?? []).slice(0, 4)) {
    lines.push(
      `${f.subject ?? "subject"} over ${f.horizon ?? horizon}: ${f.direction ?? "mixed"} (confidence ${Math.round((f.confidence ?? 0.5) * 100)}%)`
    );
  }

  const worst = predictive.scenarios?.find((s) => s.kind === "worst");
  const expected = predictive.scenarios?.find((s) => s.kind === "expected");
  if (delayMatch && worst?.narrative) {
    lines.push(`If action is delayed, worst-case framing: ${worst.narrative}`);
  } else if (expected?.narrative) {
    lines.push(`Expected path: ${expected.narrative}`);
  }

  for (const signal of predictive.emergingSignals?.slice(0, 2) ?? []) {
    lines.push(`Watch: ${signal.title ?? signal.narrative}`);
  }

  uncertainties.push("Forecasts are advisory — not guarantees.");
  if (delayMatch) {
    uncertainties.push("Delay impact is estimated from scenario bands, not a simulation run.");
  }

  return {
    summary: lines.join(" "),
    uncertainties,
  };
}
