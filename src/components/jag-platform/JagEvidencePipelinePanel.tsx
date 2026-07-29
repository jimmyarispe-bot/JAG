"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  EvidenceProcessingJob,
  PipelineMetrics,
} from "@/lib/evidence-center";

type Props = {
  readonly organizationId: string;
  readonly jobs: readonly EvidenceProcessingJob[];
  readonly metrics: PipelineMetrics;
  readonly evidenceNames: Readonly<Record<string, string>>;
};

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function JagEvidencePipelinePanel({
  organizationId,
  jobs,
  metrics,
  evidenceNames,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const retry = async (jobId: string) => {
    setBusyId(jobId);
    setError("");
    const response = await fetch("/api/jag-platform/evidence/pipeline/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, jobId }),
    });
    const payload = (await response.json()) as { ok?: boolean; error?: string };
    setBusyId(null);
    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Retry failed.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Processing Pipeline™
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Orchestration only — stages are placeholders (no AI, OCR, or parsing).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Evidence Uploaded Today" value={metrics.evidenceUploadedToday} />
        <Metric label="Jobs Waiting" value={metrics.jobsWaiting} />
        <Metric label="Running Jobs" value={metrics.jobsRunning} />
        <Metric label="Completed Jobs" value={metrics.jobsCompleted} />
        <Metric label="Failed Jobs" value={metrics.jobsFailed} />
        <Metric
          label="Processing Success Rate"
          value={`${metrics.processingSuccessRate}%`}
        />
        <Metric
          label="Average Processing Time"
          value={`${metrics.averageProcessingTimeMs} ms`}
        />
        <Metric label="Largest Queue" value={metrics.largestQueue} />
        <Metric
          label="Total Evidence Processed"
          value={metrics.totalEvidenceProcessed}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Job</th>
              <th className="px-3 py-2 font-semibold">Evidence</th>
              <th className="px-3 py-2 font-semibold">Stage</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Retries</th>
              <th className="px-3 py-2 font-semibold">Duration</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-slate-500">
                  No processing jobs yet. Upload evidence to create a job.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">
                    <Link
                      href={`/jag/evidence/pipeline/${job.id}?org=${encodeURIComponent(organizationId)}`}
                      className="font-medium text-slate-900 underline-offset-2 hover:underline"
                    >
                      {job.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {evidenceNames[job.evidenceId] ?? job.evidenceId.slice(0, 8)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{job.currentStage}</td>
                  <td className="px-3 py-3 text-slate-700">{job.status}</td>
                  <td className="px-3 py-3 text-slate-600">{job.retryCount}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {job.durationMs != null ? `${job.durationMs} ms` : "—"}
                  </td>
                  <td className="px-3 py-3">
                    {(job.status === "Failed" || job.status === "Cancelled") && (
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                        disabled={busyId === job.id}
                        onClick={() => retry(job.id)}
                      >
                        {busyId === job.id ? "Retrying…" : "Retry"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
