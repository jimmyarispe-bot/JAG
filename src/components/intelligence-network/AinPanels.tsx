"use client";

import type { NetworkHubSummary } from "@/lib/intelligence-network/types";
import { dismissRecommendationAction, refreshNetworkAction } from "@/lib/intelligence-network/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { ExperienceForm } from "@/components/intelligence-platform/AipMutationControls";

export function NetworkSummaryPanel({ summary }: { summary: NetworkHubSummary }) {
  const items = [
    ["Participation", summary.participationStatus], ["Peer Organizations", summary.peerCount],
    ["Benchmarks", summary.benchmarkCount], ["Recommendations", summary.recommendationCount],
    ["Research Reports", summary.researchReportCount],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(([label, val]) => (
        <div key={String(label)} className="rounded-xl border bg-white p-3 text-sm">
          <p className="text-slate-500">{String(label)}</p>
          <p className="text-lg font-bold">{String(val)}</p>
        </div>
      ))}
    </div>
  );
}

export function BenchmarkTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No benchmark data yet. Opt in via Settings to contribute and receive peer comparisons.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left"><tr>
          {["Metric", "Segment", "P25", "Median", "P75", "Your Value", "vs Median"].map((h) => (
            <th key={h} className="px-4 py-2 font-medium">{h}</th>
          ))}
        </tr></thead>
        <tbody>{rows.map((row, i) => (
          <tr key={i} className="border-t">
            <td className="px-4 py-2">{String(row.metric_key ?? "—")}</td>
            <td className="px-4 py-2">{String(row.segment_key ?? "—")}</td>
            <td className="px-4 py-2">{String(row.percentile_25 ?? "—")}</td>
            <td className="px-4 py-2">{String(row.percentile_50 ?? "—")}</td>
            <td className="px-4 py-2">{String(row.percentile_75 ?? "—")}</td>
            <td className="px-4 py-2">{String(row.org_value ?? "—")}</td>
            <td className="px-4 py-2">{row.vs_median != null ? Number(row.vs_median).toFixed(1) : "—"}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function RefreshNetworkButton() {
  const action = useActionFeedback({
    verb: "sync",
    labels: { idle: "Sync network", loading: "Syncing…", success: "✓ Synced" },
    successToast: "✓ Network synced.",
    errorToast: "Unable to sync network.",
    progressLabel: "Syncing intelligence network…",
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb="sync"
      labels={{ idle: "Sync network", loading: "Syncing…", success: "✓ Synced" }}
      className="!bg-indigo-600 hover:!bg-indigo-700"
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          await refreshNetworkAction();
          return { success: true };
        });
      }}
    />
  );
}

export function AiReadinessNote() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm">
      <h2 className="font-semibold">AI readiness (architecture only)</h2>
      <p className="mt-1 text-slate-600">Future: detect trends, predict outcomes, recommend interventions, generate executive summaries. No AI in this release.</p>
    </section>
  );
}

export function PrivacyNotice() {
  return (
    <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
      All network data is opt-in, anonymized, and aggregated. No customer data is exposed to other organizations.
    </p>
  );
}

export function DismissRecommendationButton({ recommendationId }: { recommendationId: string }) {
  const action = useActionFeedback({
    verb: "custom",
    labels: { idle: "Dismiss", loading: "Dismissing…", success: "✓ Dismissed", error: "Unable to dismiss" },
    successToast: "✓ Recommendation dismissed.",
    errorToast: "Unable to dismiss.",
    progressLabel: "Dismissing recommendation…",
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb="custom"
      variant="secondary"
      labels={{ idle: "Dismiss", loading: "Dismissing…", success: "✓ Dismissed", error: "Unable to dismiss" }}
      className="!rounded !bg-slate-100 !px-3 !py-1 !text-xs"
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          const fd = new FormData();
          fd.set("recommendation_id", recommendationId);
          await dismissRecommendationAction(fd);
          return { success: true };
        });
      }}
    />
  );
}

export { ExperienceForm as NetworkExperienceForm };
