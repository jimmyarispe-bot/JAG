"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { JagEmptyState, JagSection } from "@/components/jag/command-center";
import { runListeningAnalysisAction } from "@/lib/jag-command-center/listening/intelligence-actions";
import type { ListeningIntelligenceWorkbenchModel } from "@/lib/jag-command-center/listening/intelligence-types";
import {
  LISTENING_SIGNAL_CLASSES,
  formatCompletionPct,
  formatConfidence,
} from "@/lib/platform/listening";
import { ListeningBanner } from "../ListeningBanner";
import { ListeningBreadcrumbs } from "../ListeningBreadcrumbs";
import { ListeningStatusPill } from "../ListeningStatusPill";

function buildHref(
  base: Record<string, string | undefined | null>,
  patch: Record<string, string | null | undefined>
): string {
  const params = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v != null && v !== "") params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/jag/listening/intelligence?${qs}` : "/jag/listening/intelligence";
}

export function ListeningIntelligenceWorkbench({
  model,
}: {
  readonly model: ListeningIntelligenceWorkbenchModel;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runCampaignId, setRunCampaignId] = useState(
    model.campaigns[0]?.id ?? ""
  );

  const queryBase = useMemo(
    () => ({
      campaign: model.filters.campaignId ?? undefined,
      initiative: model.filters.initiativeId ?? undefined,
      instrument: model.filters.instrumentId ?? undefined,
      segment: model.filters.segmentId ?? undefined,
      type: model.filters.signalClass || undefined,
      question: model.filters.questionId ?? undefined,
      from: model.filters.dateFrom ?? undefined,
      to: model.filters.dateTo ?? undefined,
      q: model.filters.query ?? undefined,
      sort: model.filters.sort ?? undefined,
      signal: model.selectedSignal?.id,
      compareA: model.compareCampaignA ?? undefined,
      compareB: model.compareCampaignB ?? undefined,
    }),
    [model]
  );

  const campaignTitle = (id: string) =>
    model.campaigns.find((c) => c.id === id)?.title ?? id;

  return (
    <div className="space-y-8" data-testid="listening-intelligence-workbench">
      <div>
        <ListeningBreadcrumbs
          items={[
            { label: "Listening", href: "/jag/listening" },
            { label: "Intelligence" },
          ]}
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--jag-muted)]">
              Listening Intelligence
            </p>
            <h1 className="mt-1 text-2xl font-medium text-[var(--jag-text)]">
              Workbench
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--jag-muted)]">
              Deterministic, evidence-backed findings for{" "}
              {model.organizationName}. No AI interpretation in this slice.
            </p>
          </div>
          {model.canAnalyze ? (
            <form
              className="flex flex-wrap items-end gap-2"
              action={(fd) => {
                start(async () => {
                  setError(null);
                  setMessage(null);
                  const result = await runListeningAnalysisAction(fd);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setMessage(
                    `Analysis complete — ${result.signalCount} signals, ${result.evidenceCount} evidence links.`
                  );
                  router.refresh();
                });
              }}
            >
              <input
                type="hidden"
                name="organizationId"
                value={model.organizationId}
              />
              <label className="text-xs text-[var(--jag-muted)]">
                Campaign
                <select
                  name="campaignId"
                  value={runCampaignId}
                  onChange={(e) => setRunCampaignId(e.target.value)}
                  className="mt-1 block min-w-[12rem] rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--jag-text)]"
                >
                  {model.campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={pending || !runCampaignId}
                data-testid="listening-run-analysis"
                className="rounded-md bg-[var(--jag-accent)] px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {pending ? "Running…" : "Run analysis"}
              </button>
            </form>
          ) : (
            <p className="text-xs text-[var(--jag-muted)]">
              LISTENING_ANALYZE + LISTENING_RAW required to run analysis.
            </p>
          )}
        </div>
      </div>

      {message ? (
        <ListeningBanner tone="success" onDismiss={() => setMessage(null)}>
          {message}
        </ListeningBanner>
      ) : null}
      {error ? (
        <ListeningBanner tone="info" onDismiss={() => setError(null)}>
          {error}
        </ListeningBanner>
      ) : null}

      <JagSection
        title="Recent analysis runs"
        description="Each run is deterministic and stores metrics with the analysis."
      >
        {model.runs.length === 0 ? (
          <JagEmptyState
            title="No analysis runs yet"
            description="Select a campaign and run analysis to generate evidence-backed signals."
          />
        ) : (
          <div className="overflow-x-auto rounded-md border border-[var(--jag-border)]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--jag-border)] text-xs uppercase tracking-[0.08em] text-[var(--jag-muted)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Campaign</th>
                  <th className="px-3 py-2 font-medium">Instrument</th>
                  <th className="px-3 py-2 font-medium">Run date</th>
                  <th className="px-3 py-2 font-medium">Completion</th>
                  <th className="px-3 py-2 font-medium">Signals</th>
                  <th className="px-3 py-2 font-medium">Evidence</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--jag-border)]">
                {model.runs.map((run) => (
                  <tr key={run.id} className="hover:bg-[var(--jag-panel)]">
                    <td className="px-3 py-2">
                      <Link
                        href={buildHref(queryBase, {
                          campaign: run.campaignId,
                          signal: null,
                        })}
                        className="text-[var(--jag-accent)] hover:underline"
                      >
                        {run.campaignTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-[var(--jag-muted)]">
                      {run.instrumentTitle ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-[var(--jag-muted)]">
                      {new Date(run.runDate).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {formatCompletionPct(run.completionRate)}
                    </td>
                    <td className="px-3 py-2">{run.signalCount}</td>
                    <td className="px-3 py-2">{run.evidenceCount}</td>
                    <td className="px-3 py-2">
                      <ListeningStatusPill label={run.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </JagSection>

      <JagSection title="Filters" description="Narrow findings before review.">
        <form
          className="grid gap-3 md:grid-cols-3 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const next: Record<string, string | null> = {};
            for (const key of [
              "campaign",
              "initiative",
              "instrument",
              "segment",
              "type",
              "question",
              "from",
              "to",
              "q",
              "sort",
            ]) {
              next[key] = String(fd.get(key) ?? "").trim() || null;
            }
            router.push(buildHref(queryBase, { ...next, signal: null }));
          }}
        >
          <FilterSelect
            name="campaign"
            label="Campaign"
            value={model.filters.campaignId ?? ""}
            options={model.campaigns.map((c) => ({
              value: c.id,
              label: c.title,
            }))}
          />
          <FilterSelect
            name="initiative"
            label="Initiative"
            value={model.filters.initiativeId ?? ""}
            options={model.initiatives.map((i) => ({
              value: i.id,
              label: i.title,
            }))}
          />
          <FilterSelect
            name="instrument"
            label="Instrument"
            value={model.filters.instrumentId ?? ""}
            options={model.instruments.map((i) => ({
              value: i.id,
              label: i.title,
            }))}
          />
          <FilterSelect
            name="segment"
            label="Segment"
            value={model.filters.segmentId ?? ""}
            options={model.segments.map((s) => ({
              value: s.id,
              label: s.label,
            }))}
            emptyLabel="All (none assigned)"
          />
          <FilterSelect
            name="type"
            label="Signal type"
            value={model.filters.signalClass ?? ""}
            options={LISTENING_SIGNAL_CLASSES.map((t) => ({
              value: t,
              label: t,
            }))}
          />
          <FilterSelect
            name="question"
            label="Question"
            value={model.filters.questionId ?? ""}
            options={model.questions.map((q) => ({
              value: q.id,
              label: q.prompt.slice(0, 60),
            }))}
          />
          <label className="text-xs text-[var(--jag-muted)]">
            From
            <input
              type="date"
              name="from"
              defaultValue={model.filters.dateFrom ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-[var(--jag-muted)]">
            To
            <input
              type="date"
              name="to"
              defaultValue={model.filters.dateTo ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-[var(--jag-muted)] md:col-span-2">
            Search
            <input
              name="q"
              defaultValue={model.filters.query ?? ""}
              placeholder="Title or description"
              className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5 text-sm"
            />
          </label>
          <FilterSelect
            name="sort"
            label="Sort"
            value={model.filters.sort ?? "support"}
            allowEmpty={false}
            options={[
              { value: "support", label: "Support count" },
              { value: "confidence", label: "Confidence" },
              { value: "recent", label: "Recent" },
              { value: "title", label: "Title" },
            ]}
          />
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-md bg-[var(--jag-accent)] px-3 py-1.5 text-sm text-white"
            >
              Apply
            </button>
            <Link
              href="/jag/listening/intelligence"
              className="rounded-md border border-[var(--jag-border)] px-3 py-1.5 text-sm"
            >
              Reset
            </Link>
          </div>
        </form>
      </JagSection>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <JagSection
          title="Signal explorer"
          description={`${model.filteredSignals.length} finding(s). Select one to inspect evidence.`}
        >
          {model.filteredSignals.length === 0 ? (
            <JagEmptyState
              title="No signals match"
              description="Run analysis or widen filters to review findings."
            />
          ) : (
            <ul
              className="divide-y divide-[var(--jag-border)] rounded-md border border-[var(--jag-border)]"
              data-testid="listening-signal-list"
            >
              {model.filteredSignals.map((s) => {
                const active = model.selectedSignal?.id === s.id;
                return (
                  <li key={s.id}>
                    <Link
                      href={buildHref(queryBase, { signal: s.id })}
                      className={`block px-3 py-3 text-sm hover:bg-[var(--jag-panel)] ${
                        active ? "bg-[var(--jag-panel)]" : ""
                      }`}
                      data-testid="listening-signal-row"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-[var(--jag-text)]">
                          {s.title}
                        </p>
                        <ListeningStatusPill label={s.signalClass} />
                      </div>
                      <p className="mt-1 text-xs text-[var(--jag-muted)]">
                        Support {s.supportCount} · Confidence{" "}
                        {formatConfidence(s.confidence)} ·{" "}
                        {campaignTitle(s.campaignId)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </JagSection>

        <JagSection
          title="Evidence"
          description={
            model.canRaw
              ? "Supporting excerpts and context."
              : model.canViewEvidence
                ? "Excerpts redacted — LISTENING_RAW required for raw text."
                : "LISTENING_ANALYZE or LISTENING_RAW required to view evidence."
          }
        >
          {!model.selectedSignal ? (
            <p className="text-sm text-[var(--jag-muted)]">
              Select a signal to inspect supporting evidence.
            </p>
          ) : !model.canViewEvidence ? (
            <JagEmptyState
              title="Evidence restricted"
              description="Your role can see signal summaries but not evidence links."
            />
          ) : (
            <div className="space-y-4" data-testid="listening-evidence-panel">
              <div>
                <p className="text-sm font-medium text-[var(--jag-text)]">
                  {model.selectedSignal.title}
                </p>
                <p className="mt-1 text-xs text-[var(--jag-muted)]">
                  {model.selectedSignal.description}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Type</dt>
                    <dd>{model.selectedSignal.signalClass}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Confidence</dt>
                    <dd>
                      {formatConfidence(model.selectedSignal.confidence)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Support</dt>
                    <dd>{model.selectedSignal.supportCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Evidence</dt>
                    <dd>{model.evidence.length}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Organization</dt>
                    <dd className="truncate">{model.organizationName}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--jag-muted-2)]">Segment</dt>
                    <dd>—</dd>
                  </div>
                </dl>
              </div>
              <ul className="space-y-2">
                {model.evidence.map((ev) => (
                  <li
                    key={ev.id}
                    className="rounded-md border border-[var(--jag-border)] px-3 py-2 text-sm"
                    data-testid="listening-evidence-item"
                  >
                    <p className="text-xs uppercase tracking-[0.08em] text-[var(--jag-muted)]">
                      {ev.evidenceKind}
                      {ev.questionId ? " · question" : ""}
                    </p>
                    <p className="mt-1 text-[var(--jag-text)]">{ev.label}</p>
                    {typeof ev.payload.question_prompt === "string" ? (
                      <p className="mt-1 text-xs text-[var(--jag-muted)]">
                        Q: {String(ev.payload.question_prompt)}
                      </p>
                    ) : null}
                    {typeof ev.payload.excerpt === "string" ? (
                      <p className="mt-2 text-sm text-[var(--jag-muted)]">
                        “{String(ev.payload.excerpt)}”
                      </p>
                    ) : model.canRaw ? null : (
                      <p className="mt-2 text-xs italic text-[var(--jag-muted-2)]">
                        [Excerpt redacted — LISTENING_RAW required]
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </JagSection>
      </div>

      <JagSection
        title="Metrics"
        description="Participation and distribution summaries from the latest succeeded run for the selected campaign."
      >
        {!model.metrics ? (
          <p className="text-sm text-[var(--jag-muted)]">
            No metrics available yet. Run analysis on a campaign.
          </p>
        ) : (
          <div className="space-y-4" data-testid="listening-metrics">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <Metric
                label="Completion rate"
                value={formatCompletionPct(model.metrics.completionRate)}
              />
              <Metric
                label="Participation"
                value={String(model.metrics.completionCount)}
              />
              <Metric
                label="Avg response length"
                value={`${Math.round(model.metrics.averageResponseLength)} chars`}
              />
              <Metric label="Trend" value="—" hint="Placeholder" />
            </dl>
            <div className="space-y-3">
              {model.metrics.questionCompletion.map((q) => (
                <div
                  key={q.questionId}
                  className="rounded-md border border-[var(--jag-border)] px-3 py-2 text-sm"
                >
                  <p className="font-medium text-[var(--jag-text)]">{q.prompt}</p>
                  <p className="mt-1 text-xs text-[var(--jag-muted)]">
                    {q.questionType} · answered {q.answeredCount} ·{" "}
                    {formatCompletionPct(q.completionRate)}
                  </p>
                  {q.choiceDistribution ? (
                    <Distribution
                      label="Choice distribution"
                      dist={q.choiceDistribution}
                    />
                  ) : null}
                  {q.likertDistribution ? (
                    <Distribution
                      label="Likert distribution"
                      dist={q.likertDistribution}
                    />
                  ) : null}
                  {q.numericSummary ? (
                    <p className="mt-2 text-xs text-[var(--jag-muted)]">
                      Numeric: n={q.numericSummary.count}, min=
                      {q.numericSummary.min}, max={q.numericSummary.max}, mean=
                      {q.numericSummary.mean.toFixed(2)}
                    </p>
                  ) : null}
                  {q.averageTextLength != null ? (
                    <p className="mt-2 text-xs text-[var(--jag-muted)]">
                      Avg text length: {Math.round(q.averageTextLength)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </JagSection>

      <JagSection
        title="Campaign comparison"
        description="Shared and unique themes across two campaigns (title-normalized)."
      >
        <form
          className="mb-4 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            router.push(
              buildHref(queryBase, {
                compareA: String(fd.get("compareA") ?? "") || null,
                compareB: String(fd.get("compareB") ?? "") || null,
              })
            );
          }}
        >
          <FilterSelect
            name="compareA"
            label="Campaign A"
            value={model.compareCampaignA ?? ""}
            options={model.campaigns.map((c) => ({
              value: c.id,
              label: c.title,
            }))}
            allowEmpty={false}
          />
          <FilterSelect
            name="compareB"
            label="Campaign B"
            value={model.compareCampaignB ?? ""}
            options={model.campaigns.map((c) => ({
              value: c.id,
              label: c.title,
            }))}
            allowEmpty={false}
          />
          <button
            type="submit"
            data-testid="listening-compare-submit"
            className="rounded-md border border-[var(--jag-border)] px-3 py-1.5 text-sm"
          >
            Compare
          </button>
        </form>
        {!model.comparison ? (
          <p className="text-sm text-[var(--jag-muted)]">
            Choose two campaigns to compare themes.
          </p>
        ) : (
          <div
            className="grid gap-4 md:grid-cols-2"
            data-testid="listening-comparison"
          >
            <CompareList
              title="Shared themes"
              items={model.comparison.sharedThemes}
            />
            <CompareList
              title={`Unique — ${campaignTitle(model.comparison.campaignAId)}`}
              items={model.comparison.uniqueToA}
            />
            <CompareList
              title={`Unique — ${campaignTitle(model.comparison.campaignBId)}`}
              items={model.comparison.uniqueToB}
            />
            <CompareList
              title="Strengths A / B"
              items={[
                ...model.comparison.strengthsA.map((t) => `A: ${t}`),
                ...model.comparison.strengthsB.map((t) => `B: ${t}`),
              ]}
            />
            <CompareList
              title="Concerns A / B"
              items={[
                ...model.comparison.concernsA.map((t) => `A: ${t}`),
                ...model.comparison.concernsB.map((t) => `B: ${t}`),
              ]}
            />
            <CompareList
              title="Opportunities A / B"
              items={[
                ...model.comparison.opportunitiesA.map((t) => `A: ${t}`),
                ...model.comparison.opportunitiesB.map((t) => `B: ${t}`),
              ]}
            />
          </div>
        )}
      </JagSection>
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
  allowEmpty = true,
  emptyLabel = "All",
}: {
  name: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  allowEmpty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <label className="text-xs text-[var(--jag-muted)]">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="mt-1 w-full rounded-md border border-[var(--jag-border)] bg-transparent px-2 py-1.5 text-sm text-[var(--jag-text)]"
      >
        {allowEmpty ? <option value="">{emptyLabel}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-[var(--jag-border)] px-3 py-2">
      <dt className="text-xs text-[var(--jag-muted)]">{label}</dt>
      <dd className="mt-1 text-[var(--jag-text)]">{value}</dd>
      {hint ? (
        <p className="mt-1 text-[10px] text-[var(--jag-muted-2)]">{hint}</p>
      ) : null}
    </div>
  );
}

function Distribution({
  label,
  dist,
}: {
  label: string;
  dist: Record<string, number>;
}) {
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
        {label}
      </p>
      <ul className="mt-1 space-y-0.5 text-xs text-[var(--jag-muted)]">
        {entries.map(([k, v]) => (
          <li key={k}>
            {k}: {v}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompareList({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div className="rounded-md border border-[var(--jag-border)] px-3 py-2">
      <p className="text-xs uppercase tracking-[0.08em] text-[var(--jag-muted)]">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--jag-muted-2)]">None</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-[var(--jag-text)]">
          {items.map((t) => (
            <li key={`${title}-${t}`}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
