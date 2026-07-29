import Link from "next/link";
import type {
  JagBriefingSection,
  JagExecutiveBriefing,
} from "@/lib/jag-command-center/briefing-engine/types";
import { JagSection } from "../JagSection";

export function JagBriefingDetailView({
  briefing,
}: {
  readonly briefing: JagExecutiveBriefing;
}) {
  return (
    <div className="space-y-6">
      <JagSection
        title={briefing.title}
        description={`Generated ${briefing.generatedAt} by ${briefing.generatedBy} · ${briefing.window.label}`}
        actions={
          <Link
            href="/jag/briefings"
            className="text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)]"
          >
            All briefings
          </Link>
        }
      >
        <div className="flex flex-wrap gap-4 rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4 text-xs text-[var(--jag-muted)]">
          <Meta
            label="Organization"
            value={briefing.organizationName}
          />
          <Meta
            label="Confidence"
            value={
              briefing.overallConfidence === null
                ? "—"
                : briefing.overallConfidence.toFixed(2)
            }
            mono
          />
          <Meta
            label="Sources"
            value={String(briefing.sourceCount)}
            mono
          />
          <Meta
            label="Window"
            value={`${briefing.window.start.slice(0, 10)} → ${briefing.window.end.slice(0, 10)}`}
            mono
          />
        </div>
        {!briefing.hasSubstance ? (
          <p className="mt-3 text-sm text-[var(--jag-muted)]">
            This briefing has limited substance — bind School Health, Decision
            Center proposals, and contributor executions, then regenerate.
          </p>
        ) : null}
      </JagSection>

      {briefing.sections.map((section) => (
        <BriefingSectionBlock key={section.id} section={section} />
      ))}
    </div>
  );
}

function BriefingSectionBlock({
  section,
}: {
  readonly section: JagBriefingSection;
}) {
  return (
    <section className="rounded-md border border-[var(--jag-border)] bg-[var(--jag-panel)] p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-[var(--jag-text)]">
          {section.title}
        </h2>
        <span className="font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted)]">
          {section.confidence === null
            ? "conf —"
            : `conf ${section.confidence.toFixed(2)}`}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-[var(--jag-muted)]">
        {section.narrative}
      </p>

      {section.bullets.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--jag-text)]">
          {section.bullets.map((b) => (
            <li key={b}>– {b}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 grid gap-3 border-t border-[var(--jag-border)] pt-3 text-[11px] text-[var(--jag-muted)] sm:grid-cols-2 lg:grid-cols-4">
        <RefList
          label="Evidence references"
          items={section.evidenceReferences.map(
            (e) =>
              `${e.source}${e.code ? ` · ${e.code}` : ""}${
                e.summary ? ` — ${e.summary}` : ""
              }`
          )}
          empty="None attached"
        />
        <RefList
          label="Contributor sources"
          items={section.contributorSources}
          empty="None"
          mono
        />
        <RefList
          label="Policy references"
          items={section.policyReferences}
          empty="None applicable"
          mono
        />
        <div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
            Confidence
          </p>
          <p className="mt-1 font-[family-name:var(--font-jag-mono)] text-[var(--jag-text)]">
            {section.confidence === null
              ? "Unavailable — section empty or appendix"
              : section.confidence.toFixed(2)}
          </p>
        </div>
      </div>
    </section>
  );
}

function RefList({
  label,
  items,
  empty,
  mono,
}: {
  label: string;
  items: readonly string[];
  empty: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
        {label}
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-[var(--jag-muted)]">{empty}</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {items.slice(0, 6).map((item) => (
            <li
              key={item}
              className={`truncate ${
                mono ? "font-[family-name:var(--font-jag-mono)]" : ""
              }`}
              title={item}
            >
              {item}
            </li>
          ))}
          {items.length > 6 ? (
            <li className="text-[var(--jag-muted-2)]">
              +{items.length - 6} more
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted-2)]">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[var(--jag-text)] ${
          mono ? "font-[family-name:var(--font-jag-mono)]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
