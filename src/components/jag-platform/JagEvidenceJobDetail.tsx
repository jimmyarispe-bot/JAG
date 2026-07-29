"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  EvidenceDocument,
  EvidenceProcessingEvent,
  EvidenceProcessingJob,
} from "@/lib/evidence-center";

export function JagEvidenceJobDetail({
  organizationId,
  job,
  events,
  evidence,
}: {
  readonly organizationId: string;
  readonly job: EvidenceProcessingJob;
  readonly events: readonly EvidenceProcessingEvent[];
  readonly evidence: EvidenceDocument | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const retry = async () => {
    setBusy(true);
    setError("");
    const response = await fetch("/api/jag-platform/evidence/pipeline/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, jobId: job.id }),
    });
    const payload = (await response.json()) as { ok?: boolean; error?: string };
    setBusy(false);
    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Retry failed.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/jag/evidence?org=${encodeURIComponent(organizationId)}&tab=pipeline`}
          className="text-sm text-slate-500 hover:underline"
        >
          ← Processing Pipeline™
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Processing Job
        </h2>
        <p className="mt-1 font-mono text-xs text-slate-500">{job.id}</p>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <dl className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
        <Row label="Current Stage" value={job.currentStage} />
        <Row label="Status" value={job.status} />
        <Row label="Retry Count" value={String(job.retryCount)} />
        <Row label="Errors" value={job.lastError ?? "—"} />
        <Row
          label="Started At"
          value={job.startedAt ? new Date(job.startedAt).toLocaleString() : "—"}
        />
        <Row
          label="Completed At"
          value={
            job.completedAt ? new Date(job.completedAt).toLocaleString() : "—"
          }
        />
        <Row
          label="Duration"
          value={job.durationMs != null ? `${job.durationMs} ms` : "—"}
        />
        <Row
          label="Related Evidence"
          value={
            evidence ? (
              <Link
                href={`/jag/evidence/${evidence.id}?org=${encodeURIComponent(organizationId)}`}
                className="underline"
              >
                {evidence.name}
              </Link>
            ) : (
              job.evidenceId
            )
          }
        />
      </dl>

      {(job.status === "Failed" || job.status === "Cancelled") && (
        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={busy}
          onClick={retry}
        >
          {busy ? "Retrying…" : "Retry Job"}
        </button>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Stage Timeline
        </h3>
        <ol className="mt-4 space-y-3 border-l border-slate-200 pl-4">
          {job.stageHistory.map((step, index) => (
            <li key={`${step.stage}-${index}`} className="text-sm">
              <p className="font-medium text-slate-900">
                {step.stage}{" "}
                <span className="text-xs font-normal text-slate-500">
                  ({step.status})
                </span>
              </p>
              <p className="text-xs text-slate-500">
                {new Date(step.at).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pipeline Events
        </h3>
        <ul className="mt-4 space-y-2 text-sm">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-slate-100 px-3 py-2"
            >
              <p className="font-medium text-slate-900">{event.eventName}</p>
              <p className="text-xs text-slate-500">
                {event.stage} · {new Date(event.at).toLocaleString()}
              </p>
              <p className="mt-1 text-slate-600">{event.message}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <ComingSoon title="OCR Results" />
        <ComingSoon title="AI Extraction" />
        <ComingSoon title="Entity Recognition" />
        <ComingSoon title="Executive Intelligence" />
      </section>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">Coming Soon</p>
    </div>
  );
}
