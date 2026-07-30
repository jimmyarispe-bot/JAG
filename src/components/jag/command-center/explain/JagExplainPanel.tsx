import Link from "next/link";
import type { ReactNode } from "react";
import type { Explanation } from "@/lib/platform/intelligence/explain/index";

/**
 * Shared Explain panel — reasoning chain, evidence, confidence, timeline.
 */
export function JagExplainPanel({
  explanation,
  defaultOpen = false,
  graphHref,
}: {
  readonly explanation: Explanation;
  readonly defaultOpen?: boolean;
  readonly graphHref?: string;
}) {
  const conf = explanation.confidence;
  return (
    <details
      open={defaultOpen}
      className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] px-3 py-2 text-xs"
    >
      <summary className="cursor-pointer text-sm text-[var(--jag-text)]">
        Explain · {explanation.title}
      </summary>
      <div className="mt-3 space-y-3 text-[var(--jag-muted)]">
        <p className="text-sm leading-relaxed text-[var(--jag-text)]">
          {explanation.summary}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Confidence"
            value={`${(conf.score * 100).toFixed(0)}% · ${conf.band}`}
          />
          <Metric
            label="Evidence strength"
            value={conf.evidenceStrength.toFixed(2)}
          />
          <Metric label="Data freshness" value={conf.dataFreshness} />
          <Metric
            label="Assumptions"
            value={String(conf.assumptionCount)}
          />
        </div>
        <p className="text-[11px] text-[var(--jag-muted)]">{conf.explanation}</p>
        {conf.missingInformation.length > 0 ? (
          <p className="text-[11px] text-[var(--jag-muted)]">
            Missing · {conf.missingInformation.join("; ")}
          </p>
        ) : null}

        <Block title="Reasoning chain">
          <ol className="list-decimal space-y-1 pl-5">
            {explanation.reasoningChain.map((step) => (
              <li key={step.id}>
                <span className="text-[var(--jag-text)]">{step.title}</span>
                <span className="block text-[11px]">{step.detail}</span>
              </li>
            ))}
          </ol>
        </Block>

        <Block title="Evidence">
          {explanation.evidence.length === 0 ? (
            <p>No bound evidence.</p>
          ) : (
            <ul className="space-y-1">
              {explanation.evidence.map((e) => (
                <li key={e.id}>
                  {e.source}: {e.summary}
                  {e.freshness ? ` · ${e.freshness}` : ""}
                </li>
              ))}
            </ul>
          )}
        </Block>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <RefList label="Policies" items={explanation.policies} />
          <RefList label="Forecast inputs" items={explanation.forecasts} />
          <RefList label="Scenario assumptions" items={explanation.scenarios} />
          <RefList label="Memory" items={explanation.memory} />
          <RefList label="Goals" items={explanation.goals} />
          <RefList label="Decisions" items={explanation.decisions} />
          <RefList label="Outcomes" items={explanation.outcomes} />
          <RefList label="Contributors" items={explanation.contributors} />
          <RefList label="Assumptions" items={explanation.assumptions} />
        </div>

        <Block title="Timeline">
          {explanation.timeline.length === 0 ? (
            <p>No timeline events.</p>
          ) : (
            <ul className="space-y-1">
              {explanation.timeline.map((t, i) => (
                <li key={`${t.at}-${i}`}>
                  <span className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
                    {t.at}
                  </span>{" "}
                  {t.message}
                </li>
              ))}
            </ul>
          )}
        </Block>

        <div className="flex flex-wrap gap-3 pt-1">
          {graphHref ? (
            <Link
              href={graphHref}
              className="text-[var(--jag-text)] underline-offset-2 hover:underline"
            >
              Open in Graph Explorer
            </Link>
          ) : null}
          <span className="text-[11px] text-[var(--jag-muted-2)]">
            {explanation.advisoryNotice}
            {explanation.cached ? " · cached" : ""}
          </span>
        </div>
      </div>
    </details>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
        {label}
      </p>
      <p className="mt-0.5 font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
        {value}
      </p>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
        {title}
      </p>
      {children}
    </div>
  );
}

function RefList({
  label,
  items,
}: {
  label: string;
  items: readonly string[];
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
        {label}
      </p>
      {items.length === 0 ? (
        <p className="mt-0.5 text-[11px]">None</p>
      ) : (
        <ul className="mt-0.5 list-disc pl-4 text-[11px]">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
