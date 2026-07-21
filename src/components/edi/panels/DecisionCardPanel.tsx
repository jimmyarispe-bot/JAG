"use client";

import type { DecisionCard } from "@/lib/edi/types";
import { formatCurrency } from "@/lib/format";
import { approveRecommendationAction, rejectRecommendationAction } from "@/lib/edi/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { ExplainBlock, Metric, PriorityBadge } from "@/components/edi/panels/shared";

export function DecisionCardPanel({ card, schoolId }: { card: DecisionCard; schoolId: string }) {
  const action = useActionFeedback({
    verb: "approve",
    successToast: "✓ Decision recorded.",
    errorToast: "Unable to update decision.",
    progressLabel: "Recording decision…",
  });

  function runDecision(kind: "approve" | "reject") {
    void action.run(async () => {
      const fd = new FormData();
      fd.set("school_id", schoolId);
      fd.set("recommendation_id", card.id ?? "");
      fd.set("financial_impact", String(card.financialImpact));
      if (kind === "approve") {
        await approveRecommendationAction(fd);
      } else {
        await rejectRecommendationAction(fd);
      }
      return { success: true };
    });
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{card.domain} · {card.recommendationType.replace(/_/g, " ")}</p>
          <h3 className="mt-1 font-semibold text-slate-900">{card.issue}</h3>
        </div>
        <PriorityBadge priority={card.priority} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ExplainBlock label="What happened" value={card.whatHappened} />
        <ExplainBlock label="Why it happened" value={card.whyHappened} />
        <ExplainBlock label="Likely next" value={card.likelyNext} />
        <ExplainBlock label="Evidence" value={card.evidence} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Metric label="Financial impact" value={formatCurrency(card.financialImpact)} />
        <Metric label="Confidence" value={`${card.confidenceScore}%`} />
        <Metric label="Score" value={card.recommendationScore} />
        {card.currentMargin != null && <Metric label="Current margin" value={`${card.currentMargin.toFixed(1)}%`} />}
        {card.projectedMargin != null && <Metric label="Projected margin" value={`${card.projectedMargin.toFixed(1)}%`} />}
        {card.breakEvenEnrollment != null && <Metric label="Break-even" value={card.breakEvenEnrollment} />}
      </div>

      <p className="mt-4 font-medium text-brand-800">→ {card.recommendedAction}</p>

      {card.alternativeOptions.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
          {card.alternativeOptions.map((alt, i) => (
            <li key={i}>{alt.action}{alt.impact ? ` — ${alt.impact}` : ""}</li>
          ))}
        </ul>
      )}

      {card.id && (
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton
            type="button"
            status={action.status}
            verb="approve"
            labels={{ idle: "Approve", loading: "Approving…", success: "✓ Approved" }}
            className="!rounded-lg !bg-emerald-600 !px-3 !py-1.5 !text-xs hover:!bg-emerald-700"
            onClick={() => runDecision("approve")}
          />
          <ActionButton
            type="button"
            status={action.status}
            verb="custom"
            variant="secondary"
            labels={{ idle: "Reject", loading: "Rejecting…", success: "✓ Rejected", error: "Unable to reject" }}
            className="!rounded-lg !px-3 !py-1.5 !text-xs"
            errorMessage={action.errorMessage}
            onClick={() => runDecision("reject")}
          />
        </div>
      )}
    </article>
  );
}
