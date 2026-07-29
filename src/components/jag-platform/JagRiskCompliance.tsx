"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  JagControl,
  JagMitigation,
  JagRisk,
  RiskDashboard,
  RiskSeverity,
  RiskTimelineEntry,
} from "@/lib/risk";
import { RISK_CATEGORIES, RISK_STATUSES } from "@/lib/risk";

type OrgOption = { readonly id: string; readonly name: string };

function severityClass(severity: RiskSeverity): string {
  if (severity === "Critical") return "border-rose-200 bg-rose-50 text-rose-900";
  if (severity === "High") return "border-orange-200 bg-orange-50 text-orange-900";
  if (severity === "Medium") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-sky-200 bg-sky-50 text-sky-900";
}

export function JagRiskCompliance({
  organizations,
  organizationId,
  organizationName,
  risks,
  dashboard,
  controls,
  mitigations,
  history,
  selectedId,
}: {
  readonly organizations: readonly OrgOption[];
  readonly organizationId: string;
  readonly organizationName: string;
  readonly risks: readonly JagRisk[];
  readonly dashboard: RiskDashboard;
  readonly controls: readonly JagControl[];
  readonly mitigations: readonly JagMitigation[];
  readonly history: readonly RiskTimelineEntry[];
  readonly selectedId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<(typeof RISK_CATEGORIES)[number]>("Operational");
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);

  const selected =
    risks.find((r) => r.id === selectedId) ?? risks[0] ?? null;

  const selectedHistory = useMemo(
    () =>
      selected
        ? history.filter((h) => h.riskId === selected.id)
        : history.slice(0, 20),
    [history, selected]
  );

  const selectedControls = useMemo(
    () =>
      selected
        ? controls.filter((c) => c.riskId === selected.id)
        : [],
    [controls, selected]
  );

  const selectedMitigations = useMemo(
    () =>
      selected
        ? mitigations.filter((m) => m.riskId === selected.id)
        : [],
    [mitigations, selected]
  );

  function selectRisk(id: string) {
    router.push(
      `/jag/risk?org=${encodeURIComponent(organizationId)}&risk=${encodeURIComponent(id)}`
    );
  }

  function createRisk() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title,
          description,
          category,
          likelihood,
          impact,
          businessUnit: "Corporate",
          department: "Risk",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
        risk?: JagRisk;
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to create risk.");
        return;
      }
      setTitle("");
      setDescription("");
      if (data.risk) selectRisk(data.risk.id);
      else router.refresh();
    });
  }

  function patch(body: Record<string, unknown>) {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/risk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          riskId: selected.id,
          ...body,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        userMessage?: string;
      };
      if (!res.ok || data.ok === false) {
        setError(data.userMessage ?? "Unable to update risk.");
        return;
      }
      router.refresh();
    });
  }

  function addControl() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/risk/controls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          riskId: selected.id,
          name: `Control for ${selected.title}`,
          description: "Preventive control",
          controlType: "Preventive",
          effectiveness: "Partially Effective",
        }),
      });
      if (!res.ok) {
        setError("Unable to add control.");
        return;
      }
      router.refresh();
    });
  }

  function addMitigation() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/jag-platform/risk/mitigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          riskId: selected.id,
          title: `Mitigate ${selected.title}`,
          description: "Mitigation action",
        }),
      });
      if (!res.ok) {
        setError("Unable to add mitigation.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            The JAG™
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Risk & Compliance™
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Deterministic risk scoring, controls, mitigations, and compliance
            for {organizationName}. No AI.
          </p>
        </div>
        <label className="text-sm text-slate-600">
          Organization
          <select
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5"
            value={organizationId}
            onChange={(e) => {
              router.push(
                `/jag/risk?org=${encodeURIComponent(e.target.value)}`
              );
            }}
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Critical
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.criticalRisks}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">High</p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.highRisks}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Overdue reviews
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.overdueReviews}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Open mitigations
          </p>
          <p className="text-2xl font-semibold">
            {dashboard.summary.openMitigations}
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Risks ({risks.length})
          </h2>
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {risks.length === 0 ? (
              <li className="text-sm text-slate-500">No risks yet.</li>
            ) : (
              risks.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => selectRisk(r.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      selected?.id === r.id
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{r.title}</span>
                      <span className="text-xs text-slate-500">
                        {r.residualScore}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs">
                      <span
                        className={`rounded border px-1.5 py-0.5 ${severityClass(r.severity)}`}
                      >
                        {r.severity}
                      </span>
                      <span className="rounded border border-slate-200 px-1.5 py-0.5 text-slate-600">
                        {r.status}
                      </span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Selected risk
          </h2>
          {selected ? (
            <div className="mt-3 space-y-3 text-sm">
              <p className="text-lg font-semibold text-slate-900">
                {selected.title}
              </p>
              <p className="text-slate-600">{selected.description}</p>
              <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Category</dt>
                  <dd>{selected.category}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Inherent / Residual</dt>
                  <dd>
                    {selected.inherentScore} / {selected.residualScore}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Likelihood × Impact</dt>
                  <dd>
                    {selected.likelihood} × {selected.impact}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Twin</dt>
                  <dd className="truncate">{selected.twinEntityId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Review</dt>
                  <dd>{selected.reviewDate ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Compliance links</dt>
                  <dd>{selected.complianceRequirementIds.length}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-2">
                {RISK_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={pending || selected.status === status}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
                    onClick={() => patch({ status })}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white"
                  onClick={addControl}
                >
                  Add control
                </button>
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                  onClick={addMitigation}
                >
                  Add mitigation
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Controls
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-700">
                    {selectedControls.length === 0 ? (
                      <li>—</li>
                    ) : (
                      selectedControls.map((c) => (
                        <li key={c.id}>
                          {c.name} · {c.controlType} · {c.effectiveness}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Mitigations
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-700">
                    {selectedMitigations.length === 0 ? (
                      <li>—</li>
                    ) : (
                      selectedMitigations.map((m) => (
                        <li key={m.id}>
                          {m.title} · {m.status}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No risk selected.</p>
          )}
          {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Create risk
          </h2>
          <div className="mt-3 space-y-3">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof RISK_CATEGORIES)[number])
              }
            >
              {RISK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">
                Likelihood (1–5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={likelihood}
                  onChange={(e) => setLikelihood(Number(e.target.value) || 1)}
                />
              </label>
              <label className="text-xs text-slate-600">
                Impact (1–5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={impact}
                  onChange={(e) => setImpact(Number(e.target.value) || 1)}
                />
              </label>
            </div>
            <button
              type="button"
              disabled={pending || !title.trim() || !description.trim()}
              onClick={createRisk}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Timeline
          </h2>
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
            {selectedHistory.length === 0 ? (
              <li className="text-slate-500">No timeline events.</li>
            ) : (
              selectedHistory.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2"
                >
                  <span>
                    <span className="font-medium">{e.kind}</span> — {e.message}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(e.at).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Compliance
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Status:{" "}
          <span className="font-medium text-slate-900">
            {dashboard.summary.complianceStatus}
          </span>{" "}
          · {dashboard.summary.compliantRequirements}/
          {dashboard.summary.totalRequirements} requirements compliant ·{" "}
          {dashboard.compliance.length} tracked
        </p>
      </section>
    </div>
  );
}
